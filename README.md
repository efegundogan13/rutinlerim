# Rutinlerim - Ev Döngüsü Hatırlatıcısı 🏠♻️

Rutinlerim, evinizdeki ürünlerin, tekstil eşyalarının, bitkilerin bakım ve yenileme zamanını hatırlamanızı sağlayan kullanıcı dostu bir React Native uygulamasıdır.

## 🌟 Özellikler

### ✅ Temel Özellikler
- **Ana Ekran**: Ev döngüleri listesi - her öğe için isim, kategori, son bakım tarihi, hatırlatma periyodu
- **Yeni Öğe Ekleme**: İsim, kategori, son bakım tarihi, hatırlatma periyodu ile yeni döngü ekleme
- **Local Notifications**: Zamanında bildirim gönderme sistemi
- **Tamamlandı Butonu**: Bakım tamamlandıktan sonra tarih güncelleme
- **Detay Ekranı**: Döngü düzenleme, silme ve tamamlama

### 🎨 Gelişmiş Özellikler
- **Kategori Filtreleme**: Kategorilere göre döngüleri filtreleme
- **Arama Fonksiyonu**: Döngü ismi ve kategoriye göre arama
- **Animasyonlar**: Smooth geçişler ve kullanıcı dostu animasyonlar
- **Responsive Tasarım**: Temiz ve modern arayüz
- **Durum İndikasyonları**: Gecikmiş, yaklaşan ve normal döngü durumları

## 📱 Kategoriler

Uygulama aşağıdaki kategorilerle gelir:

- 🌱 **Bitki** (7 gün)
- 🏺 **Havlu** (3 gün)
- 🛏️ **Yastık** (30 gün)
- 🌪️ **Filtre** (90 gün)
- 🛌 **Çarşaf** (7 gün)
- 🧽 **Temizlik** (1 gün)
- 🏠 **Ev Bakımı** (30 gün)
- 🥛 **Gıda Kontrolü** (3 gün)
- 💧 **Su İçme** (1 gün)
- 💊 **İlaç** (1 gün)
- 📋 **Diğer** (7 gün)

## 🚀 Kurulum

### Gereksinimler
- Node.js (v16 veya üzeri)
- Expo CLI
- React Native geliştirme ortamı

### Adımlar
1. Depoyu klonlayın:
```bash
git clone <repo-url>
cd rutinlerim
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Uygulamayı başlatın:
```bash
npm start
```

4. Expo Go uygulaması ile QR kodu tarayın veya simülatör kullanın:
```bash
npm run ios    # iOS simülatör
npm run android # Android emülatör
npm run web    # Web tarayıcı
```

## 📁 Proje Yapısı

```
src/
├── components/          # Yeniden kullanılabilir bileşenler
│   ├── CycleItem.js    # Döngü listesi öğesi
│   ├── CategoryPicker.js # Kategori seçici
│   ├── AnimatedFAB.js  # Animasyonlu floating action button
│   └── LoadingSpinner.js # Loading componenti
├── screens/            # Ekran bileşenleri
│   ├── HomeScreen.js   # Ana ekran
│   ├── AddItemScreen.js # Yeni döngü ekleme
│   └── ItemDetailScreen.js # Döngü detay ve düzenleme
├── utils/              # Yardımcı fonksiyonlar
│   ├── storage.js      # AsyncStorage işlemleri
│   └── notifications.js # Bildirim yönetimi
└── constants/          # Sabitler
    └── categories.js   # Kategori tanımları ve renkler
```

## 🔔 Bildrimler

Uygulama Expo Notifications kullanarak:
- Döngü tarihi yaklaştığında bildirim gönderir
- Kullanıcı izni alır
- Arka plan bildirimleri destekler
- Her döngü için özelleştirilebilir bildirimler

## 💾 Veri Yönetimi

- **AsyncStorage**: Tüm veriler cihazda saklanır
- **Otomatik Yedekleme**: Veriler güvenli bir şekilde kaydedilir
- **Hızlı Erişim**: Çevrimdışı çalışır
- **Veri Güvenliği**: Cihaz seviyesinde şifreleme

## 🎯 Kullanım Senaryoları

### Ev Bakımı
- Bitki sulama zamanları
- Filtre değişim tarihleri
- Temizlik rutinleri

### Tekstil Bakımı
- Çarşaf değişimi
- Havlu yıkama
- Yastık temizliği

### Gıda Kontrolü
- Son kullanma tarihi takibi
- Buzdolabı temizliği
- Market alışverişi

### Sağlık & Wellness
- Günlük su içme hatırlatması
- İlaç kullanım takibi
- Vitamin rutini

## 🛠️ Teknoloji Stack

- **React Native**: Mobil uygulama framework'ü
- **Expo**: Geliştirme ve deployment platform'u
- **React Navigation**: Sayfa geçişleri
- **AsyncStorage**: Local veri depolama
- **Expo Notifications**: Push bildirimleri
- **Animated API**: Smooth animasyonlar

## 📈 Gelecek Özellikler

- [ ] İstatistik ekranı
- [ ] Tema seçenekleri (karanlık mod)
- [ ] Veri dışa aktarma
- [ ] Widget desteği
- [ ] Cloud senkronizasyon
- [ ] Çoklu kullanıcı desteği

## 🐛 Bilinen Sorunlar

- iOS'ta tarih seçici bazen görünmeyebilir (sistem ayarı)
- Android'de bildirim izni elle verilmeli
- Web versiyonunda bildirimler çalışmaz

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'i push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Sorularınız için issue açabilir veya email atabilirsiniz.

---

**Rutinlerim ile ev bakımınızı organize edin! 🏠✨**