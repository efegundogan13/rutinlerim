import { Platform } from 'react-native';

let Purchases = null;
try {
  Purchases = require('react-native-purchases').default;
} catch (e) {
  console.log('⚠️ react-native-purchases yüklenemedi (Expo Go modunda olabilir)');
}

const FREE_CYCLE_LIMIT = 5;

// RevenueCat API anahtarları
const REVENUECAT_API_KEY_IOS = 'appl_GZIDJrEpIjKonwPAnAEibPGUkPt';
const REVENUECAT_API_KEY_ANDROID = 'appl_GZIDJrEpIjKonwPAnAEibPGUkPt';

// RevenueCat premium entitlement ID'si
const ENTITLEMENT_ID = 'premium';

// RevenueCat'i başlat
export const initializePurchases = async () => {
  if (!Purchases) return false;
  try {
    const apiKey = Platform.OS === 'ios' 
      ? REVENUECAT_API_KEY_IOS 
      : REVENUECAT_API_KEY_ANDROID;
    
    await Purchases.configure({ apiKey });
    console.log('✅ RevenueCat başlatıldı');
    return true;
  } catch (error) {
    console.log('⚠️ RevenueCat başlatılamadı (Expo Go?):', error.message);
    return false;
  }
};

// Premium durumunu kontrol et
export const isPremiumUser = async () => {
  if (!Purchases) return false;
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    return isPremium;
  } catch (error) {
    // Expo Go'da sessizce false dön
    return false;
  }
};

// Mevcut teklifleri getir
export const getOfferings = async () => {
  if (!Purchases) return null;
  try {
    const offerings = await Purchases.getOfferings();
    if (offerings.current) {
      return offerings.current;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// Premium satın al
export const purchasePremium = async (packageToPurchase) => {
  if (!Purchases) return { success: false, isPremium: false, message: 'Satın alma Expo Go\'da çalışmaz.' };
  try {
    const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    if (isPremium) {
      console.log('✅ Premium satın alındı!');
      return { success: true, isPremium: true };
    }
    
    return { success: false, isPremium: false, message: 'Satın alma tamamlanamadı.' };
  } catch (error) {
    if (error.userCancelled) {
      return { success: false, isPremium: false, message: 'cancelled' };
    }
    console.error('Satın alma hatası:', error);
    return { success: false, isPremium: false, message: error.message || 'Satın alma başarısız oldu.' };
  }
};

// Satın almaları geri yükle
export const restorePurchases = async () => {
  if (!Purchases) return { success: false, isPremium: false, message: 'Expo Go\'da çalışmaz.' };
  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPremium = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    
    if (isPremium) {
      console.log('✅ Premium geri yüklendi!');
      return { success: true, isPremium: true };
    }
    
    return { success: true, isPremium: false, message: 'Aktif abonelik bulunamadı.' };
  } catch (error) {
    console.error('Geri yükleme hatası:', error);
    return { success: false, isPremium: false, message: 'Geri yükleme başarısız oldu.' };
  }
};

// Free kullanıcının döngü ekleyip ekleyemeyeceğini kontrol et
export const canAddCycle = async (currentCycleCount) => {
  const isPremium = await isPremiumUser();
  
  if (isPremium) {
    return { canAdd: true, isPremium: true };
  }
  
  if (currentCycleCount >= FREE_CYCLE_LIMIT) {
    return { 
      canAdd: false, 
      isPremium: false,
      message: `Ücretsiz sürümde maksimum ${FREE_CYCLE_LIMIT} döngü ekleyebilirsiniz. Premium'a geçerek sınırsız döngü ekleyin! 🚀`
    };
  }
  
  return { canAdd: true, isPremium: false };
};

export const FREE_LIMIT = FREE_CYCLE_LIMIT;
