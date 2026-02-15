import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { COLORS } from '../constants/categories';
import { 
  isPremiumUser, 
  getOfferings, 
  purchasePremium, 
  restorePurchases 
} from '../utils/premium';

const FEATURES = [
  {
    icon: '♾️',
    title: 'Sınırsız Döngü',
    description: 'İstediğiniz kadar ev döngüsü ekleyin',
  },
  {
    icon: '🔓',
    title: 'Özel Kategoriler',
    description: 'Evcil Hayvan, Araç Bakımı ve daha fazlası',
  },
  {
    icon: '🎨',
    title: 'Gelecek Özellikler',
    description: 'Yeni özellikler öncelikli olarak sizde',
  },
];

const PremiumScreen = ({ navigation }) => {
  const [purchasing, setPurchasing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentOffering, setCurrentOffering] = useState(null);
  const [monthlyPackage, setMonthlyPackage] = useState(null);
  const [alreadyPremium, setAlreadyPremium] = useState(false);

  useEffect(() => {
    loadOfferingsAndStatus();
  }, []);

  const loadOfferingsAndStatus = async () => {
    try {
      setLoading(true);
      
      // Premium durumunu kontrol et
      const premium = await isPremiumUser();
      setAlreadyPremium(premium);
      
      if (!premium) {
        // Teklifleri yükle
        const offering = await getOfferings();
        if (offering) {
          setCurrentOffering(offering);
          // Aylık paketi bul
          const monthly = offering.availablePackages.find(
            pkg => pkg.packageType === 'MONTHLY'
          ) || offering.availablePackages[0];
          setMonthlyPackage(monthly);
        }
      }
    } catch (error) {
      console.error('Teklifler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!monthlyPackage) {
      Alert.alert('Hata', 'Satın alma bilgileri yüklenemedi. Lütfen tekrar deneyin.');
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchasePremium(monthlyPackage);
      
      if (result.success && result.isPremium) {
        setAlreadyPremium(true);
        Alert.alert(
          '✅ Premium Aktif!',
          'Premium başarıyla aktifleştirildi. Artık sınırsız döngü ekleyebilirsiniz!',
          [{ text: 'Harika!', onPress: () => navigation.goBack() }]
        );
      } else if (result.message === 'cancelled') {
        // Kullanıcı iptal etti, sessizce geç
      } else if (result.message) {
        Alert.alert('Hata', result.message);
      }
    } catch (error) {
      Alert.alert('Hata', 'Satın alma işlemi başarısız oldu.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const result = await restorePurchases();
      
      if (result.success && result.isPremium) {
        setAlreadyPremium(true);
        Alert.alert(
          '✅ Premium Geri Yüklendi!',
          'Premium aboneliğiniz başarıyla geri yüklendi.',
          [{ text: 'Harika!', onPress: () => navigation.goBack() }]
        );
      } else if (result.success && !result.isPremium) {
        Alert.alert('Bilgi', 'Aktif bir premium abonelik bulunamadı.');
      } else {
        Alert.alert('Hata', result.message || 'Geri yükleme başarısız oldu.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Satın alma geri yüklenemedi.');
    } finally {
      setPurchasing(false);
    }
  };

  // Fiyat bilgisini al
  const getPriceText = () => {
    if (monthlyPackage?.product?.priceString) {
      return monthlyPackage.product.priceString;
    }
    return '₺49.99';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textSecondary }}>Yükleniyor...</Text>
      </View>
    );
  }

  // Zaten premium ise
  if (alreadyPremium) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.crown}>👑</Text>
          <Text style={styles.title}>Premium Aktif!</Text>
          <Text style={styles.subtitle}>
            Tüm premium özelliklerden yararlanıyorsunuz
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Text style={styles.featureIcon}>✅</Text>
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.manageButton}
          onPress={() => {
            if (Platform.OS === 'ios') {
              Linking.openURL('https://apps.apple.com/account/subscriptions');
            } else {
              Linking.openURL('https://play.google.com/store/account/subscriptions');
            }
          }}
        >
          <Text style={styles.manageButtonText}>Aboneliği Yönet / İptal Et</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.crown}>👑</Text>
        <Text style={styles.title}>Premium'a Geçin</Text>
        <Text style={styles.subtitle}>
          Ev döngülerinizi sınırsız takip edin
        </Text>
      </View>

      {/* Özellikler */}
      <View style={styles.featuresContainer}>
        {FEATURES.map((feature, index) => (
          <View key={index} style={styles.featureRow}>
            <View style={styles.featureIconContainer}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Fiyat kartı */}
      <View style={styles.priceCard}>
        <View style={styles.priceBadge}>
          <Text style={styles.priceBadgeText}>PREMIUM</Text>
        </View>
        <Text style={styles.priceLabel}>Aylık Abonelik</Text>
        <View style={styles.priceRow}>
          <Text style={styles.priceAmount}>{getPriceText()}</Text>
          <Text style={styles.priceNote}>/ay</Text>
        </View>
        <Text style={styles.priceSubtext}>İstediğiniz zaman iptal edebilirsiniz</Text>
      </View>

      {/* Satın Al Butonu */}
      <TouchableOpacity
        style={[styles.purchaseButton, !monthlyPackage && styles.purchaseButtonDisabled]}
        onPress={handlePurchase}
        disabled={purchasing || !monthlyPackage}
        activeOpacity={0.8}
      >
        {purchasing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.purchaseButtonText}>Premium'a Geç 🚀</Text>
        )}
      </TouchableOpacity>

      {!monthlyPackage && (
        <Text style={styles.errorText}>
          Satın alma bilgileri yüklenemedi. İnternet bağlantınızı kontrol edin.
        </Text>
      )}

      {/* Geri Yükle */}
      <TouchableOpacity
        style={styles.restoreButton}
        onPress={handleRestore}
        disabled={purchasing}
      >
        <Text style={styles.restoreButtonText}>Satın Almayı Geri Yükle</Text>
      </TouchableOpacity>

      {/* Aboneliği Yönet */}
      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Linking.openURL('https://apps.apple.com/account/subscriptions');
          } else {
            Linking.openURL('https://play.google.com/store/account/subscriptions');
          }
        }}
      >
        <Text style={styles.manageButtonText}>Aboneliği Yönet / İptal Et</Text>
      </TouchableOpacity>

      {/* Alt bilgi */}
      <Text style={styles.disclaimer}>
        Ödeme {Platform.OS === 'ios' ? 'Apple' : 'Google'} hesabınız üzerinden alınır. Abonelik her ay otomatik yenilenir. {Platform.OS === 'ios' ? 'Ayarlar → Abonelikler' : 'Google Play → Abonelikler'} bölümünden istediğiniz zaman iptal edebilirsiniz.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  crown: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  priceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  priceBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 12,
  },
  priceBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  priceLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 6,
  },
  priceAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 8,
  },
  priceNote: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  priceSubtext: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  purchaseButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  purchaseButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  purchaseButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 12,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
  },
  restoreButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  manageButton: {
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 16,
  },
  manageButtonText: {
    fontSize: 13,
    color: COLORS.error || '#F44336',
    textDecorationLine: 'underline',
  },
  disclaimer: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});

export default PremiumScreen;
