# Stock Trading API

Bir borsa uygulamasının çekirdeğindeki alım-satım servisinin mini versiyonu. Kullanıcı nakit bakiyesiyle sabit fiyatlı hisse alıp satar, portföyünü ve işlem geçmişini görüntüler.

---

## Kurulum ve Çalıştırma

### Docker ile (Önerilen)

```bash
git clone https://github.com/yildizaydnn/stock-trading-api.git
cd stock-trading-api
docker-compose up
```

Tek komutla PostgreSQL ve API ayağa kalkar. Tablolar oluşturulur, başlangıç verisi yüklenir ve API isteklere hazır hale gelir.

### Manuel Kurulum

```bash
git clone https://github.com/yildizaydnn/stock-trading-api.git
cd stock-trading-api
npm install
cp .env.example .env       # DATABASE_URL'i kendi PostgreSQL bilginle düzenle
npm run seed                # Tabloları oluşturur ve başlangıç verisini yükler
npm start                   # Sunucuyu başlatır
```

### Testler

```bash
npm test
```

### Erişim

| Adres | Açıklama |
|-------|----------|
| http://localhost:3000 | API |
| http://localhost:3000/health | Servis + DB sağlık kontrolü |
| http://localhost:3000/docs | Swagger — interaktif API dokümantasyonu |

---

## API Uçları

| Metot | Endpoint | Açıklama | Başarı Kodu |
|-------|----------|----------|-------------|
| GET | /health | Servis ve DB sağlık kontrolü | 200 |
| GET | /stocks | Hisse listesi ve fiyatları | 200 |
| GET | /accounts/:id | Hesap ve bakiye sorgulama | 200 |
| POST | /orders/buy | Hisse alım işlemi | 201 |
| POST | /orders/sell | Hisse satım işlemi | 201 |
| GET | /accounts/:id/portfolio | Portföy görüntüleme | 200 |
| GET | /accounts/:id/transactions | İşlem geçmişi | 200 |

### Örnek İstekler

**Hisse alımı:**
```bash
curl -X POST http://localhost:3000/orders/buy \
  -H "Content-Type: application/json" \
  -d '{"accountId": 1, "symbol": "THYAO", "quantity": 10}'
```

**Başarılı yanıt (201):**
```json
{
  "type": "BUY",
  "symbol": "THYAO",
  "quantity": 10,
  "price": "300.00",
  "totalAmount": "3000.00",
  "remainingBalance": "97000.00"
}
```

**Hisse satımı:**
```bash
curl -X POST http://localhost:3000/orders/sell \
  -H "Content-Type: application/json" \
  -d '{"accountId": 1, "symbol": "THYAO", "quantity": 5}'
```

**Yetersiz bakiye (400):**
```json
{
  "error": "Yetersiz bakiye"
}
```

---

## Başlangıç Verileri

| Sembol | Ad | Fiyat |
|--------|----|-------|
| THYAO | Türk Hava Yolları | 300.00 TL |
| GARAN | Garanti Bankası | 130.00 TL |
| ASELS | Aselsan | 75.00 TL |

Kullanıcı hesabı: **100.000 TL** nakit bakiye.

---

## Tasarım Notları

### Para Modeli: Neden Kuruş Integer?

Tüm parasal değerler kuruş cinsinden `BIGINT` olarak tutulur. `300.00 TL = 30000 kuruş`.

JavaScript'te `Number` tipi IEEE-754 double'dır — `0.1 + 0.2 === 0.3` ifadesi `false` döner. Parayı float ile tutmak yuvarlama hatası biriktirir ve bir finans uygulamasında bu kabul edilemez. Tam sayı aritmetiğinde bu risk sıfırdır.

Bu projede ek bir avantaj var: kullanıcı hiçbir zaman para girmiyor, yalnızca adet (tam sayı) giriyor. Fiyat veritabanından geliyor. Dolayısıyla tüm hesaplamalar (`total = price × quantity`) tam sayı çarpımıdır.

PostgreSQL'in `BIGINT` değerleri `pg` kütüphanesi tarafından varsayılan olarak string olarak döndürülür (JavaScript'in güvenli tam sayı sınırını aşma ihtimaline karşı). Bu projede tutarlar `Number.MAX_SAFE_INTEGER`'ın çok altında olduğundan, `pg.types.setTypeParser` ile BIGINT'i güvenle Number'a çeviriyoruz.

Sunum katmanında (`utils/money.js`) kuruş → TL dönüşümü yapılır. **Depolama daima kuruş, gösterim daima TL.**

### Veritabanı Erişimi: Neden ORM Değil, Ham SQL?

4 tablolu ve atomiklik ağırlıklı bu projede, transaction ve satır kilidini bir soyutlama katmanı ardına gizlemek yerine `BEGIN`/`COMMIT`/`ROLLBACK` ve `SELECT ... FOR UPDATE`'i açıkça yönetmeyi tercih ettim.

Bu ölçekte ORM'in kazandıracağı zaman yok. Buna karşılık eşzamanlılık farkındalığını ve transaction yönetimini kodda açıkça göstermek mümkün oluyor.

### Atomik İşlem Akışı

Alım ve satım işlemlerinin üç adımı (bakiye güncelleme, portföy güncelleme, işlem kaydı oluşturma) tek bir DB transaction'ı içinde gerçekleşir. Herhangi bir adımda hata olursa `ROLLBACK` ile tüm değişiklikler geri alınır — nakit ve portföy asla tutarsız kalmaz.

```
BEGIN
  → Hesabı kilitle (SELECT ... FOR UPDATE)
  → Bakiye/hisse kontrolü
  → Bakiyeyi güncelle (RETURNING ile gerçek değeri al)
  → Portföyü güncelle (UPSERT)
  → İşlem kaydını yaz (audit log)
COMMIT
```

### Eşzamanlılık Kontrolü: FOR UPDATE

`SELECT ... FOR UPDATE` ile hesap satırı transaction boyunca kilitlenir (pessimistic locking). Aynı hesaptan eşzamanlı iki alım gelirse, ikincisi birincinin `COMMIT`'ini bekler — aynı bakiye iki kez harcanamaz.

Transaction boyunca `pool.query()` değil, havuzdan alınan tek bir `client` kullanılır. `pool.query()` her çağrıda farklı bağlantı alabilir ve `BEGIN` bir bağlantıda, `COMMIT` başka bağlantıda kalır. `finally` bloğunda `client.release()` ile bağlantı her durumda havuza geri bırakılır.

### Portföy: Ayrı Holdings Tablosu

Portföyü her sorguda transaction kayıtlarından toplayarak hesaplamak yerine, `holdings` tablosunu alım/satımla aynı transaction içinde güncelliyoruz. `transactions` tablosu ise dokunulmayan bir denetim kaydı (audit log) olarak kalır — yalnızca `INSERT` yapılır, asla `UPDATE` veya `DELETE` yoktur.

### Hata Yönetimi

- **`asyncHandler`:** Tüm async controller'lardaki hatalar merkezi `errorHandler`'a taşınır. Hiçbir hata sessizce kaybolmaz.
- **`errorHandler`:** Tüm yanıtlar tutarlı `{ "error": "mesaj" }` formatında döner.
- **`zod` doğrulama:** `quantity` pozitif tam sayı olmalıdır — sıfır, negatif ve ondalık değerler reddedilir.
- **`AppError` sınıfı:** Anlamlı HTTP durum kodları ve hata mesajları tek satırda fırlatılır.

| Durum | Kod | Mesaj |
|-------|-----|-------|
| Olmayan hesap | 404 | Hesap bulunamadı |
| Olmayan sembol | 404 | Hisse bulunamadı |
| Yetersiz bakiye | 400 | Yetersiz bakiye |
| Yetersiz hisse | 400 | Satılacak yeterli hisse yok |
| Geçersiz girdi | 400 | Adet pozitif tam sayı olmalıdır |

### Graceful Shutdown

`SIGTERM`/`SIGINT` sinyalinde önce HTTP sunucusu kapatılır (yeni istek almayı durdurur, devam eden istekleri bekler), ardından `pool.end()` ile DB bağlantıları temiz kapatılır. Docker ortamında yarım işlem veya asılı bağlantı kalmaz.

---

## Teknoloji Yığını

| Katman | Tercih | Gerekçe |
|--------|--------|---------|
| Dil | Node.js | Brief'in beklediği yığın |
| Framework | Express | 7 endpoint için doğru boyutta, hafif |
| Veritabanı | PostgreSQL | İlişkisel model, gerçek transaction, satır kilidi desteği |
| DB Erişimi | pg (node-postgres) | BEGIN/COMMIT/ROLLBACK ve FOR UPDATE'i açıkça yönetmek için |
| Doğrulama | zod | Runtime şema doğrulama |
| Dokümantasyon | swagger-ui-express | /docs altında denenebilir arayüz |
| Test | node:test + supertest | Dahili test koşucusu, ekstra bağımlılık yok |
| Ortam | Docker + docker-compose | Tek komutla çalıştırma |

---

## Proje Yapısı

```
stock-trading-api/
├── src/
│   ├── server.js              # Uygulamayı başlatır, graceful shutdown
│   ├── app.js                 # Express app, middleware, route bağlantıları
│   ├── db/
│   │   ├── pool.js            # PostgreSQL bağlantı havuzu
│   │   ├── schema.sql         # Tablo tanımları
│   │   └── seed.js            # Başlangıç verisi
│   ├── routes/
│   │   ├── stocks.routes.js
│   │   ├── accounts.routes.js
│   │   └── orders.routes.js
│   ├── controllers/
│   │   ├── stocks.controller.js
│   │   ├── accounts.controller.js
│   │   └── orders.controller.js
│   ├── services/
│   │   ├── stock.service.js
│   │   ├── account.service.js
│   │   └── order.service.js   # Atomik buy/sell — projenin kalbi
│   ├── validators/
│   │   └── order.validator.js # zod şemaları
│   ├── middleware/
│   │   ├── validate.js        # zod middleware
│   │   ├── asyncHandler.js    # async hata yakalayıcı
│   │   └── errorHandler.js    # merkezi hata formatı
│   ├── utils/
│   │   ├── money.js           # kuruş → TL dönüşümü
│   │   └── AppError.js        # özel hata sınıfı
│   └── docs/
│       └── openapi.json       # Swagger API tanımı
├── tests/
│   └── order.test.js
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── package.json
└── README.md
```

**İstek akışı:** `route` → `validate` (zod) → `controller` → `service` (iş kuralı + transaction) → `db` (SQL)
