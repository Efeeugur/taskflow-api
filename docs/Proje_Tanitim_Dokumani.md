# TASKFLOW: Görev ve Proje Yönetim Sistemi API

**Proje Tanıtım Dokümanı**  
Hazırlayan: Efe Uğur · 19. Dönem Yazılım Mesleki Gelişim Programı · Backend Geliştirme  
Teknolojiler: Node.js, Express.js, REST API, Postman, Docker

## Amaç

Eğitim boyunca öğrenilen Node.js, Express.js, routing, middleware, CRUD ve JSON işlemlerini gerçek hayatta kullanılabilecek bir REST API üzerinde uygulamak.

## Senaryo

Bir yazılım şirketi, ekip içindeki görevleri ve çalışanların sorumluluklarını tek bir sistemden takip etmek istiyor. Görevler oluşturulur, bir çalışana atanır, önceliği belirlenir ve "yapılacak" durumundan "tamamlandı" durumuna kadar belirli kurallarla ilerler. Yöneticiler görevleri filtreleyebilir, arayabilir ve ekibin durumunu raporlardan izleyebilir.

## Sistem özeti

| Bölüm | Kapsam |
|---|---|
| Görev yönetimi (zorunlu) | Ekleme, listeleme, detay, güncelleme, silme |
| Routing (zorunlu) | Express Router; routes, controllers, services katmanları |
| Logger (zorunlu) | Her istek için zaman damgası, method, endpoint; ek olarak durum kodu, süre ve dosyaya kayıt |
| Test (zorunlu) | Postman koleksiyonu: 25 istek, 70 otomatik kontrol |
| Gelişmiş özellikler (isteğe bağlı) | Durum, öncelik ve kişiye göre filtre; arama; sayfalama; sıralama |
| Validation (isteğe bağlı) | title, description, priority, assignee doğrulaması; 400 ve alan bazlı hata listesi |
| Raporlama (isteğe bağlı) | Tamamlanan, bekleyen görevler ve genel özet (tamamlanma oranı, kişi bazlı dağılım) |
| Dokümantasyon (isteğe bağlı) | API dokümanı, test senaryoları, kullanım kılavuzu |
| Ek | Durum geçiş kuralları, JSON dosyada kalıcılık, merkezi hata yönetimi, 13 kod testi, Docker, Swagger UI (`/api-docs`) |

## Veri modeli

| Alan | Tür | Kural |
|---|---|---|
| id | number | Otomatik, tekrar kullanılmaz |
| title | string | Zorunlu, en fazla 100 karakter |
| description | string | İsteğe bağlı, en fazla 500 karakter |
| status | string | todo, in-progress, completed (yeni görev: todo) |
| priority | string | low, medium, high (varsayılan: medium) |
| assignee | string | İsteğe bağlı, görevin atandığı çalışan |
| createdAt, updatedAt | string | ISO 8601 zaman damgası |

**Durum akışı:** todo → in-progress → completed. Görev in-progress'ten todo'ya geri alınabilir; tamamlanan görev kilitlenir. Kurala aykırı istekler 409 döner. Bu kural, bir görevin hiç başlanmadan "tamamlandı" işaretlenmesini ve kapanmış kayıtların sonradan değiştirilmesini engeller.

## API tasarımı

| Method | Endpoint | Açıklama | Başarılı | Hata |
|---|---|---|---|---|
| GET | /tasks | Liste (filtre, sıralama, sayfalama) | 200 | 400 |
| GET | /tasks/:id | Detay | 200 | 400, 404 |
| POST | /tasks | Ekleme | 201 | 400 |
| PUT | /tasks/:id | Güncelleme | 200 | 400, 404, 409 |
| DELETE | /tasks/:id | Silme | 200 | 400, 404 |
| GET | /tasks/search?keyword= | Arama | 200 | 400 |
| GET | /tasks/assignee/:name | Kişiye göre | 200 | - |
| GET | /reports/completed, /pending, /summary | Raporlar | 200 | - |

Tüm yanıtlar aynı biçimdedir: başarılıda `{ success: true, data }`, hatada `{ success: false, error }`.

## Mimari

İstek sırasıyla şu katmanlardan geçer:

**Logger → JSON gövde okuma → Validation (POST/PUT) → Router → Controller → Store (tasks.json) → 404 → Merkezi hata yönetimi**

- **Routes:** hangi adresin hangi fonksiyona gideceğini tanımlar.
- **Controllers:** iş kurallarını uygular (durum geçişi, filtre, rapor).
- **Services:** veriyi JSON dosyasına asenkron okur ve yazar.
- **Middleware:** loglama, doğrulama, 404 ve hata yönetimi tek yerde toplanır.

## Teslim içeriği

GitHub reposunda: kaynak kod ve package.json, README (kurulum ve çalıştırma), bu doküman, Postman koleksiyonu ve test ekran görüntüleri, API dokümanı, test senaryoları, kullanım kılavuzu, Dockerfile.
