# TASKFLOW Test Senaryoları

Testler iki katmanda yapıldı:

1. **Postman koleksiyonu** (`postman/Taskflow.postman_collection.json`): 25 istek, 70 otomatik kontrol. Sonuç: tamamı başarılı.
2. **Kod testleri** (`tests/api.test.js`, `npm test`): 13 test. Sonuç: tamamı başarılı.

Koleksiyondaki istekler birbirine bağlıdır: eklenen görevin id'si `taskId` değişkenine kaydedilir ve sonraki isteklerde kullanılır. Bu yüzden koleksiyon sırayla (Run collection) çalıştırılmalıdır.

## 01 - CRUD (zorunlu)

| # | Senaryo | İstek | Beklenen |
|---|---|---|---|
| 1 | Görev ekleme | `POST /tasks` geçerli veri | 201, `status` = `todo`, id ve zaman damgaları atanır |
| 2 | Listeleme | `GET /tasks` | 200, dizi döner, eklenen görev listede |
| 3 | Detay | `GET /tasks/{{taskId}}` | 200, doğru görev |
| 4 | Güncelleme | `PUT /tasks/{{taskId}}` | 200, alanlar değişir, `updatedAt` yenilenir |
| 5 | Silme | `DELETE /tasks/{{taskId}}` | 200, silinen görev döner |
| 6 | Silinen görevi getirme | `GET /tasks/{{taskId}}` | 404 |

## 02 - Hata durumları

| # | Senaryo | Beklenen |
|---|---|---|
| 7 | Başlıksız ve geçersiz öncelikli görev | 400, alan bazlı hata listesi |
| 8 | Bozuk JSON gövdesi | 400 |
| 9 | Sayı olmayan id | 400 |
| 10 | Tanımsız rota | 404 |

## 03 - Durum geçiş kuralları

| # | Senaryo | Beklenen |
|---|---|---|
| 11 | Hazırlık: yeni görev | 201 |
| 12 | `todo` → `completed` (adım atlama) | 409 |
| 13 | `todo` → `in-progress` | 200 |
| 14 | `in-progress` → `completed` | 200 |
| 15 | Tamamlanan görevi değiştirme | 409 |

## 04 - Filtreleme, arama, sayfalama, sıralama

| # | Senaryo | Beklenen |
|---|---|---|
| 16 | `?status=completed` | 200, yalnızca tamamlananlar |
| 17 | `?priority=high` | 200, yalnızca yüksek öncelikliler |
| 18 | `/tasks/search?keyword=kural` | 200, sonuçlar kelimeyi içerir |
| 19 | `/tasks/assignee/Efe` | 200, yalnızca Efe'nin görevleri |
| 20 | `?page=1&limit=2` | 200, en fazla 2 kayıt, sayfa bilgisi |
| 21 | `?sort=-createdAt` | 200, yeniden eskiye sıralı |

## 05 - Raporlar

| # | Senaryo | Beklenen |
|---|---|---|
| 22 | `/reports/completed` | 200, sayı ile liste uzunluğu eşit |
| 23 | `/reports/pending` | 200, tamamlanan görev içermez |
| 24 | `/reports/summary` | 200, özet alanları var, durum sayıları toplamı = toplam |
| 25 | Temizlik: deneme görevini sil | 200 |

## Kod testleri (npm test)

| # | Test |
|---|---|
| 1 | Görev ekleme 201 döner, varsayılanlar atanır |
| 2 | Listeleme 200 ve toplam sayı döner |
| 3 | Detay 200, olmayan görev 404, geçersiz id 400 |
| 4 | Güncelleme 200 döner ve `updatedAt` değişir |
| 5 | Başlıksız, hatalı öncelikli, çok uzun başlıklı veya bozuk JSON istek 400 döner |
| 6 | `todo` → `completed` yasak (409), sıralı geçiş serbest, tamamlanan görev kilitli |
| 7 | Filtreleme, arama ve raporlama doğru sonuç verir |
| 8 | Silme 200 ve silinen görevi döner, tekrar silme 404 |
| 9 | Silinen görevin id değeri tekrar kullanılmaz |
| 10 | Logger istekleri log dosyasına yazar |
| 11 | Swagger dokümanı (`/api-docs`) yayınlanır |
| 12 | Ana adres tarayıcıyı `/api-docs`'a yönlendirir, istemciye JSON döner |
| 13 | Tanımsız rota 404 döner |
