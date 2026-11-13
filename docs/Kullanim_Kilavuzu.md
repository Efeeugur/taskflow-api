# TASKFLOW Kullanım Kılavuzu

Bu kılavuz, TASKFLOW API'yi bir istemciden (web arayüzü, mobil uygulama, Postman) adım adım nasıl kullanacağınızı anlatır.

## 1. Sunucuyu çalıştırın

```bash
npm install
npm run seed   # isteğe bağlı: 6 örnek görev
npm start
```

Tarayıcıda `http://localhost:3000` adresini açtığınızda API adı ve sürümü görünüyorsa sunucu hazırdır.

## 2. Tipik bir görev akışı

### Adım 1: Görev oluşturun

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Ödeme sayfası", "priority": "high", "assignee": "Ayşe"}'
```

Yanıttaki `id` değerini not edin (örnek: 7).

### Adım 2: Göreve başlayın

```bash
curl -X PUT http://localhost:3000/tasks/7 \
  -H "Content-Type: application/json" \
  -d '{"status": "in-progress"}'
```

### Adım 3: Görevi tamamlayın

```bash
curl -X PUT http://localhost:3000/tasks/7 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
```

Tamamlanan görev artık değiştirilemez. Bu, kayıtların sonradan bozulmasını engeller.

### Adım 4: Durumu izleyin

```bash
curl http://localhost:3000/reports/summary
```

## 3. Sık kullanılan sorgular

| İhtiyaç | İstek |
|---|---|
| Ayşe'nin görevleri | `GET /tasks/assignee/Ayşe` |
| Açık yüksek öncelikli işler | `GET /tasks?priority=high&status=todo` |
| En yeni görevler önce | `GET /tasks?sort=-createdAt` |
| İkinci sayfa, 5'er kayıt | `GET /tasks?page=2&limit=5` |
| "ödeme" geçen görevler | `GET /tasks/search?keyword=ödeme` |
| Bekleyen iş yükü | `GET /reports/pending` |

## 4. Bir istemciden entegrasyon

Örnek: JavaScript (tarayıcı veya Node.js 18+):

```javascript
const BASE_URL = 'http://localhost:3000';

async function createTask(task) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  });
  const body = await res.json();
  if (!body.success) {
    // Doğrulama hatalarında body.details alan bazlı hataları içerir
    throw new Error(body.error);
  }
  return body.data;
}
```

Tüm yanıtlar `success` alanı içerdiği için istemci tarafında tek bir kontrolle başarı ve hata ayrılabilir.

## 5. Hata durumlarında ne yapmalı

| Kod | Ne oldu | Çözüm |
|---|---|---|
| 400 | Veri veya parametre geçersiz | `details` listesindeki alanları düzeltin |
| 404 | Görev veya adres yok | id'yi ve adresi kontrol edin |
| 409 | Durum kuralına aykırı | Görevi sırayla ilerletin (`todo` → `in-progress` → `completed`) |
| 500 | Sunucu hatası | Konsol ve `logs/requests.log` kayıtlarına bakın |

## 6. Kayıtları inceleme

Tüm istekler `logs/requests.log` dosyasına yazılır:

```bash
tail -f logs/requests.log
```
