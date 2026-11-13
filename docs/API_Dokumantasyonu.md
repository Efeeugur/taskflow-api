# TASKFLOW API Dokümantasyonu

Temel adres: `http://localhost:3000`  
Canlı doküman ve deneme ekranı (Swagger UI): `http://localhost:3000/api-docs`  
İstek ve yanıt gövdeleri JSON'dur. POST ve PUT isteklerinde `Content-Type: application/json` başlığı gönderilmelidir.

## Yanıt formatı

Tüm uç noktalar aynı biçimde yanıt verir.

Başarılı:
```json
{ "success": true, "data": { }, "meta": { } }
```
`meta` yalnızca listelerde döner (toplam sayı, sayfa bilgisi).

Hatalı:
```json
{ "success": false, "error": "Açıklama", "details": [ { "field": "title", "message": "..." } ] }
```
`details` yalnızca doğrulama hatalarında döner.

## Durum kodları

| Kod | Anlamı |
|---|---|
| 200 | İşlem başarılı |
| 201 | Görev oluşturuldu |
| 400 | Geçersiz veri, geçersiz parametre veya bozuk JSON |
| 404 | Görev veya uç nokta bulunamadı |
| 409 | Durum geçiş kuralına aykırı istek |
| 500 | Sunucu hatası |

## Görev (Task) modeli

| Alan | Tür | Kural |
|---|---|---|
| `id` | number | Sistem verir, silinen id tekrar kullanılmaz |
| `title` | string | Zorunlu, boş olamaz, en fazla 100 karakter |
| `description` | string | İsteğe bağlı, en fazla 500 karakter |
| `status` | string | `todo`, `in-progress`, `completed`. Yeni görev her zaman `todo` |
| `priority` | string | `low`, `medium`, `high`. Gönderilmezse `medium` |
| `assignee` | string \| null | İsteğe bağlı, en fazla 50 karakter |
| `createdAt` | string | ISO 8601 zaman damgası |
| `updatedAt` | string | ISO 8601 zaman damgası, her güncellemede yenilenir |

## Durum geçiş kuralları

| Mevcut durum | Geçebileceği durumlar |
|---|---|
| `todo` | `in-progress` |
| `in-progress` | `completed`, `todo` |
| `completed` | yok (görev kilitlenir, hiçbir alanı değiştirilemez) |

Kurala aykırı istekler `409 Conflict` döner.

---

## Görev uç noktaları

### POST /tasks

Yeni görev oluşturur. `status` gönderilemez.

İstek:
```json
{
  "title": "Kullanıcı girişi endpoint'i",
  "description": "JWT ile backend girişi",
  "priority": "high",
  "assignee": "Efe"
}
```

Yanıt `201 Created`:
```json
{
  "success": true,
  "data": {
    "id": 7,
    "title": "Kullanıcı girişi endpoint'i",
    "description": "JWT ile backend girişi",
    "status": "todo",
    "priority": "high",
    "assignee": "Efe",
    "createdAt": "2026-11-01T14:40:04.448Z",
    "updatedAt": "2026-11-01T14:40:04.448Z"
  }
}
```

Hatalı istek örneği `{ "title": "", "priority": "acil" }`, yanıt `400 Bad Request`:
```json
{
  "success": false,
  "error": "Doğrulama hatası",
  "details": [
    { "field": "title", "message": "title boş olamaz" },
    { "field": "priority", "message": "priority şu değerlerden biri olmalıdır: low, medium, high" }
  ]
}
```

### GET /tasks

Görevleri listeler. Tüm parametreler isteğe bağlıdır ve birlikte kullanılabilir.

| Parametre | Örnek | Açıklama |
|---|---|---|
| `status` | `?status=completed` | Duruma göre filtre |
| `priority` | `?priority=high` | Önceliğe göre filtre |
| `assignee` | `?assignee=Efe` | Kişiye göre filtre (büyük/küçük harf duyarsız) |
| `sort` | `?sort=-createdAt` | Sıralama alanı: `createdAt`, `updatedAt`, `priority`, `title`, `id`. Azalan için başına `-` |
| `page`, `limit` | `?page=1&limit=10` | Sayfalama. `limit` en fazla 100 |

Yanıt `200 OK` (sayfalamalı):
```json
{
  "success": true,
  "data": [ { "id": 1, "...": "..." }, { "id": 2, "...": "..." } ],
  "meta": { "total": 6, "page": 1, "limit": 2, "totalPages": 3 }
}
```
Sayfalama parametresi yoksa `meta` yalnızca `total` içerir. Geçersiz parametre değerleri `400` döner.

### GET /tasks/:id

Bir görevin detayını döner. `200 OK`; görev yoksa `404`; id sayı değilse `400`.

### PUT /tasks/:id

Görevi günceller. Yalnızca gönderilen alanlar değişir (`title`, `description`, `status`, `priority`, `assignee`). En az bir alan gönderilmelidir.

İstek:
```json
{ "status": "in-progress", "priority": "medium" }
```

Yanıtlar: `200 OK` güncel görev; `400` geçersiz veri; `404` görev yok; `409` durum kuralı ihlali.

`409` örneği:
```json
{ "success": false, "error": "\"todo\" durumundaki görev \"completed\" durumuna geçemez. İzin verilen: in-progress" }
```

### DELETE /tasks/:id

Görevi siler ve silinen görevi döner. `200 OK`; görev yoksa `404`.

### GET /tasks/search?keyword=

Başlık ve açıklamada büyük/küçük harf duyarsız arama yapar. `keyword` zorunludur, yoksa `400`. `sort`, `page`, `limit` burada da kullanılabilir.

### GET /tasks/assignee/:name

Bir kişiye atanmış görevleri listeler. Örnek: `/tasks/assignee/Efe`

---

## Rapor uç noktaları

### GET /reports/completed

```json
{ "success": true, "data": { "count": 2, "tasks": [ ] } }
```

### GET /reports/pending

`todo` ve `in-progress` durumundaki görevler, aynı biçimde.

### GET /reports/summary

```json
{
  "success": true,
  "data": {
    "total": 6,
    "completionRate": "%33",
    "highPriorityOpen": 1,
    "byStatus": { "todo": 3, "in-progress": 1, "completed": 2 },
    "byPriority": { "low": 1, "medium": 2, "high": 3 },
    "byAssignee": {
      "Efe": { "total": 2, "completed": 2 },
      "Ayşe": { "total": 2, "completed": 0 },
      "Mehmet": { "total": 1, "completed": 0 },
      "Atanmamış": { "total": 1, "completed": 0 }
    }
  }
}
```

## Logger

Her istek konsola ve `logs/requests.log` dosyasına şu biçimde yazılır:
```
[2026-11-01T14:38:44.608Z] POST /tasks 201 7.5ms
```
Zaman damgası, method, endpoint, durum kodu, yanıt süresi.
