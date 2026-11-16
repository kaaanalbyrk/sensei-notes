# Sensei Notes

Kişisel, çevrimdışı çalışan not ve yaşam organizasyonu PWA'sı. Saf HTML/CSS/JS, veriler yalnızca cihazdaki IndexedDB'de.

## Dosyalar
`index.html` iskelet · `style.css` tasarım · `app.js` arayüz+mantık · `db.js` IndexedDB · `sw.js` çevrimdışı önbellek · `manifest.webmanifest` PWA ayarları · `icons/` ikonlar

## Veri modeli
Tek depo (`items`). Her kayıt `type` taşır: `daily | book | movie | place`.
Günlük kayıtlar ek olarak `date` (YYYY-MM-DD) ve `cat` (work/sport/date/notes) taşır; koleksiyon kayıtlarında tarih alanı yoktur. Bu yüzden ikisi birbirine karışmaz.

## 1) Windows'ta bilgisayarda deneme
Service Worker yalnızca `localhost` veya HTTPS'te çalışır; dosyayı çift tıklayıp açma.
1. Python'u python.org'dan kur (kurulumda "Add to PATH" kutusunu işaretle).
2. Klasörde Shift + sağ tık → "Terminalde aç" ve çalıştır: `python -m http.server 8080`
3. Chrome'da `http://localhost:8080` aç. Test için F12 → Application → Service Workers → "Offline" işaretleyip yenile.

## 2) Ücretsiz HTTPS'te yayınlama (GitHub Pages)
1. github.com'da hesap aç → New repository → adı `sensei-notes`, Public.
2. "uploading an existing file" bağlantısıyla klasördeki **tüm dosyaları ve icons klasörünü** sürükle → Commit.
3. Settings → Pages → Branch: `main`, klasör `/ (root)` → Save.
4. 1–2 dk sonra adres: `https://KULLANICIADIN.github.io/sensei-notes/`
(Alternatif: Cloudflare Pages veya Netlify Drop'a klasörü sürükleyip bırak.)
Not: Public repo'da yalnızca uygulama kodu olur; notların asla yüklenmez, telefonunda kalır.

## 3) iPhone 11'e kurulum
1. **Safari** ile adresi aç (Chrome değil).
2. Paylaş (□↑) → "Ana Ekrana Ekle" → Ekle.
3. Uygulamayı ana ekran ikonundan aç, **bir kez internetle** açıp birkaç saniye bekle (önbellek dolsun). Sonrası çevrimdışı çalışır.

## Önemli uyarılar
- iOS, ana ekrana eklenmiş uygulamanın verisinden ayrı bir depo kullanır: notları Safari sekmesinde değil, ana ekran uygulamasında tut. Safari'de girdiklerin uygulamaya taşınmaz (yedekle → içe aktar).
- iOS uzun süre hiç açılmayan web uygulamalarının verisini silebilir. **Ayarlar → JSON dışa aktar** ile düzenli yedek al ve Dosyalar/iCloud'a kaydet.
- Kodu güncellersen `sw.js` içindeki `VERSION` değerini artır (örn. `sensei-v2`).
