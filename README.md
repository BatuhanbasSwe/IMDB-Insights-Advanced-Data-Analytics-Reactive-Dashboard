# IMDBScraperwSelenium — IMDB Data Science Pipeline + React Dashboard

Bu repo, IMDB’den film verisi toplayıp (Selenium + fallback), veriyi temizleyip (duration parse + median imputation) IQR istatistikleri ile analiz eden ve anomalileri işaretleyen **uçtan uca** bir veri bilimi projesidir. Sonuçlar `movies_final.json` olarak dışa aktarılır ve React dashboard tarafından görselleştirilir.

## Proje çıktıları (ödev hedefi)

**Python (ETL + analiz):**

- IMDB’den alanlar: `title`, `year`, `rating`, `metascore`, `duration_min`, `genres`, `votes`, `url`
- Veri temizleme:

  # IMDBScraperwSelenium — Hızlı Başlatma (copy-paste ready)

  Bu repo IMDB Top-250 Movies ve Top-250 TV Shows verilerini toplayan (Selenium + fallback), temizleyen ve anomali tespiti yaptıktan sonra bir React dashboard ile görselleştiren bir ETL + dashboard projesidir.

  Amaç: repoyu klonlayan birinin, terminale README'den kopyala-yapıştır ile aynı sonucu (250 film + 250 dizi → `frontend/public/movies_final.json`) alabilmesini sağlamaktır.

  ## Gereksinimler

  # Cinematic Data Insights & Anomaly Detection Dashboard

  ## 1) PROJE ÖZETİ

  **Proje Adı:** Cinematic Data Insights & Anomaly Detection Dashboard

  Bu proje; Selenium ile IMDb verilerini kazıma (scraping), Pandas ile veri temizleme ve ön işlem, ve React ile interaktif görselleştirme kullanarak 250 film ve 250 dizi içeren bir dashboard sunar. Amaç; temizlenmiş, anomali etiketli ve görselleştirmeye hazır tek bir JSON dosyası üretmek ve bunu React uygulamasıyla sunmaktır.

  Kullanılan ana teknolojiler:

  - Python (Selenium, requests, BeautifulSoup, pandas)
  - React (Create React App) + Recharts

  ***

  ## 2) KURULUM VE ÇALIŞTIRMA (Copy‑paste dostu, sıralı komutlar)

  Aşağıdaki adımlar `bash` için doğrudan kopyalanıp çalıştırılabilir.

  Adım 1 — Python bağımlılıklarını kurun:

  ```bash
  pip install -r requirements.txt
  ```

  Adım 2 — Veriyi çekme ve işleme (250 film + 250 dizi):

  ```bash
  python data_processor.py
  ```

  Not: `data_processor.py` çalıştırıldığında proje köküne göre hem

  - `frontend/public/movies_final.json` (frontend tarafından sunulan dosya)
  - `frontend/src/movies_final.json` (geliştirme/reference kopyası)

  olarak kaydedilir. React uygulaması tarayıcıda `/movies_final.json` yolundan (public) bu dosyayı yükler, dolayısıyla en kritik hedef `frontend/public/movies_final.json`'dur.

  Adım 3 — Dashboard'u başlatın:

  ```bash
  cd frontend
  npm install
  npm start
  ```

  Tarayıcı otomatik açılmıyorsa http://localhost:3000 adresini ziyaret edin.

  ***

  ## 3) TEKNİK ANALİZ NOTLARI (Hoca için kısa ve teknik)

  ### Veri Temizleme

  - Eksik Metascore'lar: Eksik `metascore` değerleri ilgili sütun medyanı ile doldurulur (median imputation). Medyan seçimi uç değerlerin etkisini azaltır.

    Örnek (pandas):

  ```python
  median_m = df['metascore'].median()
  df['metascore'].fillna(median_m, inplace=True)
  ```

  - Duration dönüşümü: IMDb'den gelen süreler string formatında olabilir (ör. "2h 22min", "45 min"). `parse_duration_to_minutes` fonksiyonu bu stringleri dakika cinsine çevirir ve `duration_min` sütununa yazar.

    Örnek (konsept):

  ```python
  def parse_duration_to_minutes(s):
      # "2h 22min" -> 142, "45 min" -> 45
      ...
  ```

  ### Anomali Tespiti — IQR yöntemi

  Projede uç değer/anomali tespiti için IQR (Interquartile Range) kullanılmıştır. Adımlar:

  1. Q1 = 25. yüzdelik, Q3 = 75. yüzdelik
  2. IQR = Q3 − Q1
  3. Alt/üst eşikler: lower = Q1 − 1.5×IQR, upper = Q3 + 1.5×IQR
  4. Bu eşiklerin dışındaki gözlemler anomali olarak işaretlenir.

  Matematiksel gösterim:

  $$\mathrm{IQR} = Q_3 - Q_1$$
  $$\text{lower} = Q_1 - 1.5 \times \mathrm{IQR}$$
  $$\text{upper} = Q_3 + 1.5 \times \mathrm{IQR}$$

  Uygulamada hem `IMDB` puanı, hem `metascore` hem de bunların farkı (delta) üzerinde IQR analizi yapılabilir. Örneğin `delta = IMDB - (Metascore/10)` hesaplanıp bu delta üzerinde IQR uygulanırsa, iki skor arasındaki tutarsızlıklar tespit edilir.

  ***

  ## 4) KLASÖR YAPISI (projede olması gereken temiz şema)

  ```
  / (repository root)
  ├─ data_processor.py         # Veriyi çeken ve işleyen ana Python scripti (yazma hedefleri aşağıda)
  ├─ requirements.txt          # Python bağımlılıkları
  ├─ README.md                 # (BU DOSYA)
  ├─ frontend/                 # React uygulaması (Create React App)
  │  ├─ package.json
  │  ├─ public/
  │  │  └─ movies_final.json   # ÖNEMLİ: frontend dev server tarafından /movies_final.json olarak sunulur
  │  └─ src/
  │     ├─ App.js
  │     ├─ index.js
  │     └─ movies_final.json   # opsiyonel/ek kopya (data_processor.py hem public hem src'ye yazar)
  └─ scripts/
     ├─ run_all.sh
     └─ stop_all.sh
  ```

  Not: Frontend kodu tarayıcıda `fetch('/movies_final.json')` ile dosyayı yükler; bu yüzden `frontend/public/movies_final.json` varlığı çalışması için kritik önemdedir.

  ***

  ## 5) GÖRSEL REHBER (Kullanıcı için kısa)

  - Sekmeler / filtreler:

    - Uygulama üstünde "Movies" ve "TV Shows" (veya benzeri) bir seçim bulunduğunda bu seçim `type` filtresini değiştirir ve grafikler/table verilerini yeniden çizer.

  - Box-plot:

    - IMDB puanının dağılımını gösterir (Q1, median, Q3, whiskers). Fare ile üzerine gelindiğinde tooltip içinde Q1, median, Q3, count gibi özet istatistikler gösterilir.

  - Scatter plot:
    - Örnek: x = IMDB, y = Metascore. Her noktanın üzerine gelindiğinde tooltip içinde başlık, yıl, IMDB, Metascore, duration gibi bilgiler görünür.

  Kullanım ipucu: Anomali olarak işaretlenen noktalara tıklanınca (veya hover) tooltip ya da yan panelde neden anomali olduğu açıklanır (ör. "High rating + low metascore") — frontend `App.js` içinde bu mantık uygulanmıştır.

  ***

  ## HIZLI DOĞRULAMA (kısa komutlar)

  - `frontend/public/movies_final.json` dosyasının varlığını kontrol edin:

  ```bash
  ls -l frontend/public/movies_final.json
  ```

  - Kayıt sayısını kontrol edin (JSON'in top-level yapısına göre uyarlayın):

  ```bash
  python - <<'PY'
  import json
  p='frontend/public/movies_final.json'
  data=json.load(open(p))
  if isinstance(data, list):
      print('records:', len(data))
  elif isinstance(data, dict) and 'records' in data:
      print('records:', len(data['records']))
  else:
      print('JSON loaded, top-level type:', type(data))
  PY
  ```

  ***

  ## EK NOTLAR

  - `data_processor.py` çalıştırması uzun sürebilir (Selenium ve ağ gecikmeleri). Terminal çıktısını veya log dosyalarını kontrol edin.
  - Önerilen sürümler: Python 3.10+, Node.js 16+.
  - Eğer frontend `fetch('/movies_final.json')` hatası veriyorsa, `frontend/public/movies_final.json` dosyasının bulunup bulunmadığını ve dosya izinlerini kontrol edin.

  Herhangi bir adımda hata alırsanız terminal çıktısını paylaşın; README'yi hemen düzelteyim veya gerekli küçük ek scriptleri (ör. `Makefile`) ekleyeyim.

  İyi çalışmalar!
