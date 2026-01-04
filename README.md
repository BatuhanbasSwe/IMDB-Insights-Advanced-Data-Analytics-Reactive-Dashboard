# IMDBScraperwSelenium — IMDB Data Science Pipeline + React Dashboard

Bu repo, IMDB’den film verisi toplayıp (Selenium + fallback), veriyi temizleyip (duration parse + median imputation) IQR istatistikleri ile analiz eden ve anomalileri işaretleyen **uçtan uca** bir veri bilimi projesidir. Sonuçlar `movies_final.json` olarak dışa aktarılır ve React dashboard tarafından görselleştirilir.

## Proje çıktıları (ödev hedefi)

**Python (ETL + analiz):**

- IMDB’den alanlar: `title`, `year`, `rating`, `metascore`, `duration_min`, `genres`, `votes`, `url`
- Veri temizleme:
  - Runtime/duration string → dakika (`duration_min`) dönüşümü
  - Sayısal alanlarda tip dönüşümü
  - Eksik sayısal değerlerin **medyan** ile doldurulması (median imputation)
- İstatistik:
  - $Q1$, $Q3$, $IQR = Q3 - Q1$
  - Alt/üst sınır (fence):
    $$lower = Q1 - 1.5\cdot IQR, \quad upper = Q3 + 1.5\cdot IQR$$
- Anomali tespiti:
  - IQR outlier’ları (örn. duration)
  - Ek kurallar + (varsa) residual/regression tabanlı tutarsızlık kontrolü
  - Her kayıtta boolean: `is_anomaly`

**React (görselleştirme):**

- `/movies_final.json` dosyasını yükler.
- Rating dağılımını **Recharts tabanlı Box-and-Whisker** (custom shape) ile gösterir.
- Rating vs Metascore scatter grafiğinde anomalileri farklı renkle vurgular.

---

## Repo yapısı (kısa)

- `advanced_pipeline.py`: scraping → cleaning → IQR stats → anomaly detection → JSON export
- `movies_processor.py`: ödev/CLI için tek komutla pipeline çalıştıran wrapper + JSON kopyalama
- `movies_final.json`: en son üretilen final JSON (repo root)
- `imdb-dashboard/`: Create React App dashboard
  - `public/movies_final.json`: runtime’da servis edilen JSON
  - `src/movies_final.json`: ödev şartı için ayrıca kopya (gerekli görüldüğünde)

---

## JSON sözleşmesi (React ile uyum)

`movies_final.json` şu biçimdedir:

- Top-level:
  - `summary`: istatistikler + anomaly sayıları
  - `records`: film listesi

Her `record` örnek alanları:

- `title` (string)
- `year` (number)
- `rating` (number)
- `metascore` (number)
- `duration_min` (number)
- `genres` (string[])
- `votes` (number | null)
- `is_anomaly` (boolean)

---

## Kurulum

### Python

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### React dashboard

```bash
cd imdb-dashboard
npm install
```

---

## Çalıştırma (uçtan uca)

### 1) Pipeline’ı çalıştır (JSON üret)

Hızlı mod (browser yok, requests/threads):

```bash
python movies_processor.py --limit 25 --fast --threads 8
```

Selenium mod (daha “gerçek” scraping):

```bash
python movies_processor.py --limit 25
```

Bu komutlar sonunda JSON otomatik kopyalanır:

- `imdb-dashboard/public/movies_final.json` (React runtime için)
- `imdb-dashboard/src/movies_final.json` (ödev şartı için)

### 2) Dashboard’u çalıştır

**Önemli:** `npm start` komutunu repo root’ta değil, `imdb-dashboard/` içinde çalıştırmalısın.

```bash
cd imdb-dashboard
npm start
```

Ardından tarayıcı: http://localhost:3000

---

## Metodoloji (kısa akademik özet)

Bu bölüm, hocanın “scraped messy web data (+10) için temizlik adımlarını README’de adım adım anlatın” şartını karşılamak için özellikle detaylandırılmıştır.

### 1) Veri toplama (Scraping)

- Kaynak: IMDB Top/arama sayfaları.
- Yöntem: Selenium ile link toplama + film detay sayfası scraping.
- Fallback: Headless Selenium bazı durumlarda linkleri göremeyebilir. Bu durumda `requests` ile IMDB’nin server-side HTML veren arama endpoint’inden sayfalama yapılarak linkler toplanır.

Toplanan ham alanlar:

- `title`, `year`, `rating`, `metascore`, `duration` (string), `genres`, `votes`, `url`

### 2) Temizleme (Cleaning) — adım adım

1. **Runtime normalizasyonu:**

- `duration` alanı string formatında gelebilir (örn. `"2h 30m"`, `"150 min"`).
- `advanced_pipeline.parse_duration_to_minutes()` ile dakika cinsinden tam sayıya çevrilir ve `duration_min` üretilir.

2. **Sayısal tiplere dönüştürme (type coercion):**

- `rating`, `metascore`, `votes`, `year`, `duration_min` gibi alanlar sayısal tipe zorlanır.
- Parse edilemeyen/eksik değerler NaN/null kabul edilir.

3. **Eksik değer iyileştirme (median imputation):**

- Sayısal alanlardaki eksik değerler sütun **medyanı** ile doldurulur.
- Medyan seçimi: uç değerlerden (outlier) daha az etkilenir.

4. **JSON’a uygunlaştırma:**

- `genres` her zaman dizi (`string[]`) olacak şekilde normalize edilir.
- JSON çıktılarında sayı/None tipleri standart hale getirilir.

### 3) İstatistiksel analiz (IQR)

Her değişken için:

- $Q1$, $Q3$ hesaplanır.
- $IQR = Q3 - Q1$
- Alt/üst sınır (fence):
  $$lower = Q1 - 1.5\cdot IQR, \quad upper = Q3 + 1.5\cdot IQR$$

Bu özetler `movies_final.json` içindeki `summary` alanına yazılır.

### 4) Anomali tespiti (Data science)

Anomaliler birden fazla kural ile flag’lenir:

- **IQR outlier:** özellikle `duration_min` için fence dışına çıkan kayıtlar.
- **Kural bazlı kombinasyon:** örn. “yüksek rating ama anormal düşük metascore” kombinasyonu (IQR sınırlarına göre).
- **Regresyon/residual kontrolü:** `rating ~ a + b * log(votes)` lineer regresyonu uygulanır ve büyük residual gösteren kayıtlar “uyumsuz” olarak işaretlenir.

Her kayıt için şu boolean flag’ler yazılır:

- `anomaly_rating_high_meta_low`
- `anomaly_duration_outlier`
- `anomaly_rating_votes_inconsistent`
- `is_anomaly`: yukarıdakilerin birleşimi

---

## Matplotlib + Seaborn çıktıları (kanıt)

Bu proje Python tarafında hocanın istediği baseline ve bonus görselleştirmeyi **dosya çıktısı** olarak üretir:

- Matplotlib (baseline) + Seaborn (+5):
  - `boxplot_rating.png`
  - `boxplot_metascore.png`

Üretim kodu:

- `advanced_pipeline.save_boxplot()` fonksiyonu
  - çizim: `sns.boxplot(...)`
  - kaydetme: `plt.savefig(...)`

---

## Rubrik kontrol listesi (puan kırılmasın diye)

### Visualization

- [x] Matplotlib (baseline): `advanced_pipeline.py` + `boxplot_*.png`
- [x] Seaborn (+5): `sns.boxplot` kullanımı + `boxplot_*.png`
- [x] Modern web + React (+15): `imdb-dashboard/` (Recharts ile box-and-whisker + scatter)

### Dataset

- [x] Scraped messy web data (+10): Selenium + fallback scraping (`advanced_pipeline.py`) + bu README’de adım adım cleaning açıklaması

### Analysis

- [x] Simple summary (baseline): `movies_final.json -> summary`
- [x] Quartiles / box&whisker (+5): IQR stats + boxplot çıktıları + dashboard
- [x] Anomaly detection (+15): anomaly flag’ler + `is_anomaly` + `movies_final.json`

---

## Troubleshooting

- `npm start` “package.json bulunamadı” vb. hata veriyorsa: yanlış klasörde olabilirsin. `imdb-dashboard/` içine gir.
- `/movies_final.json` 404 ise: `imdb-dashboard/public/movies_final.json` kopyasını kontrol et.

---

## (Ek) Slayt/Presentation notları

Bu repo ilk oluşturulurken `README.md` içine slayt taslağı içerikleri eklenmişti. Eğer hocanın istediği format “README birincil, slayt içeriği ek” ise, bu başlığın altına kısa maddeler ekleyebilirsin.
