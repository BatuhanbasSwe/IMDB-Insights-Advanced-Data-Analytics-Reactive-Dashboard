# IMDB Data Pipeline & React Dashboard — Quickstart

Bu repo IMDB Top-250 Movies ve Top-250 TV Shows verilerini kazıyıp (Selenium + fallback), veriyi temizleyip anomali tespiti yaptıktan sonra bir React dashboard ile görselleştiren bir ETL + dashboard projesidir. React uygulaması `frontend/public/movies_final.json` dosyasını okuyarak görselleştirme yapar.

Bu README, projeyi klonlayan birinin sadece README'yi okuyarak ve scriptleri çalıştırarak uygulamayı ayağa kaldırabilmesi için adım adım, copy‑paste dostu komutlar içerir.

## Hızlı önkoşullar

- Linux / macOS (Windows için WSL önerilir)
- Python 3.10+ (sanal ortam / venv kullanılması önerilir)
- Node.js + npm (Node 16+ önerilir)
- Opsiyonel: Chrome çalışır/kuruluysa Selenium tam işlevseldir; requests-tabanlı fallback da vardır.

## Tek komutla başlatma (önerilen)

Projede bir yardımcı betik var; bu betik Python virtualenv oluşturur, Python bağımlılıklarını kurar, veri pipeline'ını arka planda başlatır ve React dev-server'ı başlatır.

Çalıştırmak için repoyu klonlayın, dizine girin ve betiği çalıştırın:

```bash
git clone <repo-url>
cd <repo>
bash scripts/run_all.sh
```

run_all.sh şunları yapar:
- `venv` oluşturur (varsa mevcut venv'i kullanır)
- `pip install -r requirements.txt`
- `data_processor.py`'yi arka planda başlatır (log -> `logs/data_processor.log`, pid -> `logs/data_processor.pid`)
- frontend bağımlılıklarını kurar ve React dev-server'ı başlatır (log -> `logs/react.log`, pid -> `logs/react.pid`)

NOT: Eğer makinenizde zaten 3000/3001 gibi portlar doluysa betik frontend'i farklı bir portta başlatabilir veya hata verebilir — log dosyalarına bakın.

## Manuel (adım adım) kurulum ve çalışma

1) Python ortamı (venv) oluşturun ve bağımlılıkları kurun:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2) Veri pipeline'ını çalıştırın (örnek; tamamlanana kadar sürebilir):

```bash
python data_processor.py --limit 250 --threads 16
```

Varsayılan davranış: pipeline çalışırken ara kaydetmeler (autosave) yapar. Bu ara kaydetmeler artık ana `movies_final.json` dosyasını bozmamak için `frontend/public/movies_final_autosave.json` ve `frontend/src/movies_final_autosave.json` olarak yazılır. Final, tamamlandığında `frontend/public/movies_final.json` ve `frontend/src/movies_final.json` üzerine yazılır.

Eğer ara kaydetme istemiyorsanız (tek, kararlı yazma istiyorsanız):

```bash
python data_processor.py --limit 250 --threads 16 --autosave-every 0
```

3) Frontend'i başlatın (ayrı terminalde):

```bash
cd frontend
npm install
# İsterseniz PORT değişkeni ile farklı portta çalıştırın:
PORT=3000 npm start
```

Tarayıcınızdan `http://localhost:3000` (veya kullandığınız PORT) adresine gidin.

## Nerede ne kaydediliyor

- `frontend/public/movies_final.json` — React dev-server tarafından sunulan ve frontend'in `fetch('/movies_final.json')` ile okuduğu ana dosya. Final pipeline bitince bu dosya güncellenir.
- `frontend/public/movies_final_autosave.json` — pipeline'in ara kaydetmeleri için ayrılmış dosya (dev-server tarafından kullanılmaz).
- `frontend/src/movies_final.json` ve `frontend/src/movies_final_autosave.json` — geliştirici/reference kopyaları.
- `logs/data_processor.log`, `logs/react.log` — ilgili servislerin logları.

## Durdurma ve temizleme

Projeyi durdurmak için sağlanan script:

```bash
bash scripts/stop_all.sh
```

Manuel olarak PID'leri sonlandırmak isterseniz (uygulama açık ve kaydedilmiş PID dosyaları varsa):

```bash
kill $(cat logs/data_processor.pid)      # pipeline
kill $(cat logs/react.pid)               # react dev server
```

## Hızlı doğrulama / hata ayıklama

- `tail -f logs/data_processor.log` — pipeline ilerlemesini izleyin (autosave mesajları burada görünür).
- `tail -f logs/react.log` — frontend başlatma ve hata mesajları.
- `ls -l frontend/public/movies_final.json` — final dosyanın varlığını ve son değiştirilme zamanını kontrol edin.
- Eğer frontend boş/404 hatası veriyorsa, `frontend/public/movies_final.json` bulunup bulunmadığını kontrol edin; eğer sadece `movies_final_autosave.json` varsa pipeline henüz tamamlanmamış demektir.

## Neden frontend sürekli güncelleniyordu (kısa açıklama)

Önceki pipeline sürümünde ara kaydetmeler doğrudan `frontend/public/movies_final.json`'i üzerine yazıyordu; React dev-server bu dosya değiştiğinde hot-reload tetikleyip UI'yi yeniden yüklüyordu. Bu durumda frontend kısmi/eksik veriler üzerine defalarca yeni hesaplama yapıyordu ve anomali sayıları değişiyordu.

Güncelleme: autosave artık `movies_final_autosave.json` dosyasına yazıyor; böylece frontend yalnızca pipeline tamamlandığında (final yazıldığında) bir kere güncellenecek.

## Push / paylaşım (kısa not)

README'yi güncelledikten sonra değişiklikleri commit ve pushlamak için:

```bash
git add README.md
git commit -m "docs: improve README with quickstart and autosave notes"
git push origin main
```

Not: `git push` sırasında kimlik doğrulama istenebilir; SSH anahtarınız veya Git credentials ayarlarınızın hazır olduğundan emin olun.

## Eğer isterseniz ben de yardımcı olurum

- README'yi başka dile (İngilizce) çevirip aynı şekilde ekleyebilirim.
- `run_all.sh`'i daha idempotent veya daha kontrollü hale getirecek küçük geliştirmeler (örn. port kontrol, daha iyi PID handling) ekleyebilirim.

İsterseniz şimdi README'yi commit edip pushlamanız için gerekli komutları çalıştırabilirim (veya size komutları veririm). Hemen ardından başka bir bilgisayarda README'yi takip ederek tam bir test yapabilirsiniz.

