# LA'VIEN Cafe & Restaurant — Adisyon Otomasyon Paneli

Masa bazlı sipariş (adisyon) girme, ürün/kategori/masa yönetimi, fiş yazdırma ve ciro raporlama için localhost'ta çalışan web paneli.

## Mimari

- **Backend**: Node.js + Express + `better-sqlite3` (dosya tabanlı, WAL modu). JWT + bcrypt ile kimlik doğrulama.
- **Frontend**: React + Vite, `/api` istekleri dev sunucusunda backend'e proxy'lenir.
- **Klasör yapısı**: `backend/` ve `frontend/` bağımsız npm paketleri, kökte `concurrently` ile birlikte çalıştırma.
- **Veri kararı**: `order_items` tablosunda ürün adı ve fiyatı **snapshot** olarak saklanır. Admin bir ürünün adını/fiyatını değiştirse veya ürünü silse bile geçmiş adisyonlar ve raporlar etkilenmez.
- **Silme**: Kategori/ürün/masa silme işlemleri `is_active = 0` ile **soft-delete**'tir (geçmiş kayıtların bütünlüğü bozulmasın diye); kullanıcı arayüzünde normal "Sil" olarak görünür. Adisyon kalemi (order item) silme ise gerçek `DELETE`'tir ve yalnızca adisyon **açıkken** yapılabilir.
- **Yazdırma**: `backend/src/services/printing/receiptBuilder.js` mutfak/kasa için birebir aynı `receiptPayload` JSON'ını üretir. `PrinterService` soyut sınıfı + `BrowserPrintAdapter` bu fazda gerçek donanıma bağlanmaz; frontend `window.print()` + `@media print` CSS ile yazdırır. İleride gerçek termal yazıcı desteği `PRINTER_ADAPTER` env değişkeniyle seçilecek yeni bir adapter eklenerek genişletilebilir.

## Gereksinimler

- Node.js 18+ (test edilen sürüm: v24.18.0) ve npm

## Kurulum ve Çalıştırma

```bash
npm run setup        # backend + frontend bağımlılıklarını kurar
npm run db:migrate   # SQLite tablolarını oluşturur (backend/data/lavien.sqlite)
npm run db:seed      # varsayılan kullanıcılar + örnek kategori/ürün/masa verisi ekler
npm run dev          # backend (:3001) ve frontend (:5173) birlikte başlar
```

Frontend'e tarayıcıdan `http://localhost:5173` üzerinden erişilir; `/api` istekleri otomatik olarak backend'e (`:3001`) yönlendirilir.

`npm run db:seed` idempotenttir — birden fazla çalıştırılsa da mevcut kayıtları tekrar eklemez.

### Varsayılan hesaplar

| Kullanıcı adı | Şifre  | Rol      |
|----------------|--------|----------|
| `admin`        | `480969` | Yönetici |
| `personel`     | `000000` | Personel |

## Ortam değişkenleri (backend/.env)

```
PORT=3001
JWT_SECRET=degistirin-bu-anahtari
JWT_EXPIRES_IN=12h
```

`backend/.env.example` dosyası şablon olarak eklidir. Production'a alınacaksa `JWT_SECRET` mutlaka değiştirilmelidir.

## Kullanım

- **Admin**: Kategori Yönetimi, Ürün Yönetimi, Masa Yönetimi (ekle / yeniden adlandır / sil+onay), Raporlar (Günlük / Aylık / Tarih Aralığı ciro ve ürün bazlı kırılım).
- **Personel**: Masa seçimi → adisyon otomatik açılır (aynı masada açık adisyon varsa mevcuduna yönlendirilir) → kategori sekmelerinden ürün ekleme → adet/not düzenleme → yanlış eklenen kalemi onaylı silme → "Fiş Yazdır" veya "Hesabı Kapat" (Nakit/Kart seçimiyle).
- Tüm silme aksiyonları (kategori, ürün, masa, adisyon kalemi) ortak `ConfirmDialog` üzerinden onay ister.

## Doğrulanan akışlar

Bu depoyu oluştururken aşağıdaki uçtan uca senaryolar curl ve tarayıcı otomasyonuyla test edilmiştir:

- `admin/480969` ve `personel/000000` ile giriş, hatalı şifrede Türkçe hata mesajı.
- Admin: kategori/ürün ekleme, yeniden adlandırma, silme + onay dialogu (iptal edilince silinmiyor, onaylanınca listeden kalkıyor).
- Personel: masa seç → adisyon aç → ürün ekle/adet değiştir → toplam doğru hesaplanıyor → kalem sil + onay → "Fiş Yazdır" (mutfak/kasa ile birebir aynı payload) → "Hesabı Kapat" (Nakit/Kart) → masa tekrar boş görünüyor.
- Aynı masada ikinci adisyon açma denemesi → `409` + mevcut açık adisyona yönlendirme.
- Kapalı adisyona ürün ekleme/kalem silme denemesi → `409`.
- Raporlar: günlük/tarih aralığı/ürün bazlı kırılım, kapatılan adisyon toplamlarıyla eşleşiyor.
- Yetki: personel token'ıyla admin-only endpoint'e istek → `403`; admin route'ları personel oturumunda görüntülenemiyor.
- Kalıcılık: backend yeniden başlatıldığında SQLite dosyasındaki veriler (kapalı adisyonlar, ciro) korunuyor.
- `npm run build` (frontend) hatasız derleniyor.

## Bilinen sınırlamalar

- Gerçek ESC/POS termal yazıcı entegrasyonu bu fazın kapsamı dışında; `PrinterService` soyutlaması ileride `EscPosNetworkAdapter` gibi bir adapter eklenerek genişletilebilir.
- Android mobil uygulama ayrı, sonraki bir faz — backend API zaten stateless JSON REST olarak tasarlandığından mobil istemci tarafından da tüketilebilir.
- Silinen kategori/ürün/masalar için "geri getirme" arayüzü bu fazda yok (veritabanında soft-delete olarak duruyor, gerekirse doğrudan `is_active = 1` ile geri açılabilir).
- Otomatik test paketi (Jest/Vitest) bu fazın kapsamında değil; doğrulama manuel curl + tarayıcı otomasyonuyla yapılmıştır.
