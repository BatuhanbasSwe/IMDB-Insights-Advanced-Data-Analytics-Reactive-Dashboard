# IMDB Data Pipeline & React Dashboard — Kullanım Kılavuzu

**Bu proje, 250 Film + 250 TV Show olmak üzere toplam 500 kayıttan oluşan büyük bir veri seti oluşturur ve bu verilerin tek bir dashboard üzerinden yönetilmesine olanak sağlar.**

Bu doküman, hem Windows kullanıcıları (CMD / PowerShell) hem de Linux/macOS kullanıcıları (Terminal) için adım adım kurulum ve çalıştırma talimatları içerir. Ayrıca akademik değerlendirme için ayrılmış "İstatistiksel Metodoloji" bölümü, sık karşılaşılan sorunlar ve hızlı doğrulama adımları mevcuttur.

## Ön koşullar

- Python 3.10+ (sanal ortam kullanılması tavsiye edilir)
- Node.js + npm (Node 16+ önerilir)
- Chrome yüklü ise Selenium tam işlevseldir; aksi takdirde requests bazlı fallback devrede olacaktır

## 1) Hızlı özet: ne yapar?

- Veri kazıma (scraping) — IMDB Top-250 Movies ve Top-250 TV Shows
- Veri işleme (temizleme, eksik veri tamamlama, feature engineering, outlier analizi)
- React tabanlı interaktif dashboard (frontend) — `frontend/public/movies_final.json` dosyasını okuyarak render eder

## 2) İşletim Sistemi Ayrımı — Kurulum ve Çalıştırma

Not: repoda bulunan `scripts/run_all.sh` betiği yalnızca Unix-benzeri (Linux/macOS) ortamlarda doğrudan çalıştırılabilir. Windows kullanıcıları için manuel adımlar aşağıda verilmiştir.

### Linux / macOS (Terminal)

1. Repoyu klonlayın ve dizine girin:

```bash
git clone <repo-url>
cd IMDB-Insights-Advanced-Data-Analytics-Reactive-Dashboard
```

2. Python sanal ortamı oluşturun ve etkinleştirin:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Veri pipeline'ını başlatın (örn. film ve dizi toplam 500 kayıt için):

```bash
python data_processor.py --limit 250 --threads 16
```

4. Frontend'i ayrı bir terminalde başlatın:

```bash
cd frontend
npm install
# İstendiği takdirde farklı bir portta başlatmak için:
PORT=3000 npm start
```

5. Tarayıcıdan erişin: http://localhost:3000

Alternatif: Tek komutla (yardımcı betik) çalıştırmak için (Linux/macOS):

```bash
bash scripts/run_all.sh
```

### Windows (CMD / PowerShell)

Windows için `bash scripts/run_all.sh` çalışmayacaktır; lütfen aşağıdaki manuel adımları takip edin.

CMD (Komut İstemi) örneği:

1. Repoyu klonlayın ve dizine girin:

```cmd
git clone <repo-url>
cd IMDB-Insights-Advanced-Data-Analytics-Reactive-Dashboard
```

2. Python sanal ortamı oluşturun ve etkinleştirin (CMD):

```cmd
python -m venv venv
venv\\Scripts\\activate
pip install -r requirements.txt
```

PowerShell örneği (PowerShell kullanıyorsanız):

```powershell
python -m venv venv
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force  # Gerekirse
.\\venv\\Scripts\\Activate.ps1
pip install -r requirements.txt
```

3. Veri pipeline'ını çalıştırın (aynı şekilde):

```cmd
python data_processor.py --limit 250 --threads 16
```

4. Frontend'i başlatın (CMD / PowerShell farkı):

CMD:

```cmd
cd frontend
npm install
set PORT=3000 && npm start
```

PowerShell:

```powershell
cd frontend
npm install
$env:PORT = "3000"
npm start
```

Notlar:

- PowerShell'de sanal ortam aktivasyonu sırasında izin/ExecutionPolicy hatası alırsanız, PowerShell'i yönetici olarak açıp `Set-ExecutionPolicy` komutunu kullanmayı değerlendirin.
- Eğer Windows üzerinde UNIX benzeri betikleri çalıştırmayı tercih ederseniz WSL (Windows Subsystem for Linux) kullanabilirsiniz.

## 3) Önemli Dosyalar ve Yerleri

- `frontend/public/movies_final.json` — Dashboard tarafından okunan nihai veri dosyası
- `frontend/public/movies_final_autosave.json` — Pipeline tarafından ara kayıtlar için kullanılan dosya
- `logs/data_processor.log`, `logs/react.log` — İlgili süreçlerin logları

## 4) İstatistiksel Metodoloji (Hoca için özel, akademik dilde açıklama)

Bu bölüm modelleme ve sonuçların değerlendirilmesi sırasında izlenen temel istatistiksel adımları belgelendirir.

- Missing Value Imputation (Eksik Veri Tamamlama):

  - Eksik gözlemler, ilgili değişkenin medyan değeri ile ikame edilmiştir. Medyan seçimi; özellikle dağılımın çarpık olduğu veya uç değerlerin bulunduğu değişkenlerde merkezi eğilimi temsil etmede ortalamaya göre daha dayanıklı olduğu için tercih edilmiştir. Uygulamada, medyanlar yalnızca ilgili alt-küme (ör. aynı tür/altkategori) veri noktalarından hesaplanıp uygulanabilmektedir; bu, dağılım farklılıkları varsa daha hassas bir imputation sağlar.

- Feature Engineering (Özellik Mühendisliği):

  - Zamanla ilgili özellikler (ör. süre, runtime) standart birime dönüştürülmüştür; bütün süreler dakika bazına çevrilmiştir. Bu dönüşüm, modelleme ve görselleştirmede karşılaştırılabilirlik sağlar ve süre ile diğer nicel değişkenler arasındaki ilişkilerin daha net ortaya konmasına yardımcı olur.

- Outlier Detection (Aykırı Değer Tespiti):
  - Aykırı değer tespiti için klasik İstatistiksel Kutup Yöntemi (IQR yöntemi) uygulanmıştır. Öncelikle bir değişkenin birinci (Q1) ve üçüncü (Q3) çeyrekleri belirlenir; IQR = Q3 − Q1 hesaplanır. Alt ve üst sınırlar sırasıyla Q1 − 1.5×IQR ve Q3 + 1.5×IQR olarak alınır. Bu sınırların dışındaki gözlemler potansiyel aykırı değer olarak etiketlenir. Not: Analiz stratejisi olarak aykırı gözlemler ya değişken dönüşümleri, winsorization veya modelleme aşamasında ağırlıklandırma yoluyla ele alınabilir; hangi yaklaşımın tercih edileceği fenemonolojik ve amaçlanan analize göre belirlenir.

Bu metodolojik tercihlerin her biri, analiz sonuçlarının tekrarlanabilirliği ve yorumlanabilirliğini artırmayı amaçlamaktadır. İleri düzey analizlerde bu adımların alternatifleri (örn. multiple imputation, log-dönüşümleri, robust z-score) denenerek duyarlılık analizleri yapılması önerilir.

## 5) Dosya Oluşmadıysa Ne Yapmalı? (Troubleshooting)

Eğer frontend boş görünüyor veya `frontend/public/movies_final.json` oluşturulmamışsa takip edilecek adımlar:

1. Pipeline tamamlanmamış olabilir: `frontend/public/movies_final_autosave.json` dosyası mevcutsa pipeline hâlâ çalışıyor veya bir aşamada takılıyor demektir. Bu durumda `logs/data_processor.log` dosyasını inceleyin:

```bash
tail -n 200 logs/data_processor.log
```

2. Hata veya istisna varsa log'da göreceksiniz; örneğin network timeout, HTML parsing hatası veya Selenium/driver problemi olabilir.

3. Manuel olarak pipeline'ı tekrar deneyin (ör. hata ayıklama için verbose/log level artırarak):

```bash
python data_processor.py --limit 250 --threads 8 --verbose
```

4. Chrome/Selenium ile ilgili hata varsa:

- Chrome sürümünüz ile webdriver uyumluluğunu kontrol edin.
- Eğer webdriver yoksa veya erişilemiyorsa fallback yöntemi devreye girebilir; yine de bazı sayfalarda eksik veri kalabilir.

5. Disk izinleri / Yazma hataları: `frontend/public` dizinine yazma izniniz olduğundan emin olun.

6. Eğer PID/log dosyaları eskiyse, önceki başarısız süreçleri temizleyip yeniden başlatın:

```bash
# Unix benzeri
bash scripts/stop_all.sh || true
# veya PID'leri manuel silin ve yeniden başlatın
```

7. Son çare: veriyi yeniden çekmek zaman alabilir; bu nedenle pipeline tamamlanana kadar dashboard boş görünebilir. Sistem kaynaklarına (CPU, network) bağlı olarak işlem süresi değişir.

## 6) Hızlı doğrulama (sanity checks)

- Pipeline çalışıyorsa `tail -f logs/data_processor.log` ile ilerlemeyi gözleyin.
- Frontend boşsa `ls -l frontend/public/movies_final.json` komutuyla dosya yoksa autosave dosyasını kontrol edin.
- Frontend hata alıyorsa `tail -f logs/react.log` ile npm start çıktısını inceleyin.

## 7) Commit & Push (değişiklik yaptıysanız)

```bash
git add README.md
git commit -m "docs: güncellenmiş README (Windows/Linux ayrı, metodoloji, troubleshooting)"
git push origin main
```

## 8) Daha ileri adımlar (isteğe bağlı)

- `run_all.sh`'in Windows uyumlu versiyonunu eklemek (PowerShell script)
- Otomatik testler: pipeline için küçük entegrasyon testi ve frontend için smoke test eklemek

-- Sonuç: Bu README, hem Windows hem de Unix-benzeri kullanıcıların projeyi sorunsuz çalıştırabilmesi, akademik değerlendirme için gerekli metodolojik açıklamaları bulması ve veri oluşmadığında nasıl ilerleyeceklerini bilmeleri amaçlanarak güncellenmiştir.
