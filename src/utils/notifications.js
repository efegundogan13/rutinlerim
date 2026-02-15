import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CATEGORIES, getCategoryById } from '../constants/categories';

// BİLDİRİM PLANLAMA - BASİT VE NET
export const scheduleNotificationForCycle = async (cycle) => {
  try {
    // Önce eski bildirimleri temizle
    await cancelNotificationForCycle(cycle.id);
    
    const category = getCategoryById(cycle.categoryId);
    const nextDueDate = new Date(cycle.nextDue);
    const now = new Date();
    
    // Geçmiş tarihse planlaMA
    if (nextDueDate <= now) {
      console.log('❌ nextDue geçmişte, bildirim YOK');
      return null;
    }
    
    let notificationTime;
    let notificationMessage;
    
    // GÜNLÜK DÖNGÜ: Tam zamanında
    if (cycle.periodUnit === 'days') {
      notificationTime = new Date(nextDueDate);
      notificationMessage = `${category.name} zamanı geldi!`;
    } 
    // SAATLİK DÖNGÜ: Tam zamanında
    else if (cycle.periodUnit === 'hours') {
      notificationTime = new Date(nextDueDate);
      notificationMessage = `${category.name} zamanı geldi!`;
    }
    
    // Bildirim zamanı geçmişte mi?
    if (notificationTime <= now) {
      console.log('❌ Bildirim zamanı geçmiş, planlanmadı');
      return null;
    }
    
    // Kaç saniye sonra bildirim gönderilecek?
    const secondsUntil = Math.floor((notificationTime - now) / 1000);
    
    console.log(`🔔 BİLDİRİM PLANLANIYOR: ${cycle.name}`);
    console.log(`   Tip: ${cycle.periodUnit === 'days' ? 'GÜNLÜK' : 'SAATLİK'}`);
    console.log(`   Zaman: ${notificationTime.toLocaleString('tr-TR')}`);
    console.log(`   Kalan: ${secondsUntil} saniye (${Math.floor(secondsUntil / 60)} dakika)`);
    
    // Bildirimi planla
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${category.icon} ${cycle.name}`,
        body: notificationMessage,
        data: { cycleId: cycle.id },
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds: secondsUntil,
        repeats: false,
      },
    });
    
    console.log(`✅ Bildirim planlandı! ID: ${notificationId}`);
    return [notificationId];
    
  } catch (error) {
    console.error('❌ Bildirim hatası:', error);
    return null;
  }
};

// Döngünün bildirimini iptal et
export const cancelNotificationForCycle = async (cycleId) => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    
    for (const notif of scheduled) {
      if (notif.content.data?.cycleId === cycleId) {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        console.log(`🗑️ Bildirim iptal edildi: ${notif.identifier}`);
      }
    }
  } catch (error) {
    console.error('❌ İptal hatası:', error);
  }
};

// Tüm döngülerin bildirimlerini yenile (uygulama açılışında çağrılır)
export const refreshAllNotifications = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem('@cycles');
    if (!jsonValue) return;
    
    const cycles = JSON.parse(jsonValue);
    const now = new Date();
    let updated = false;
    
    console.log(`🔄 ${cycles.length} döngünün bildirimleri yenileniyor...`);
    
    const updatedCycles = cycles.map(cycle => {
      const nextDue = new Date(cycle.nextDue);
      
      // nextDue geçmişte kaldıysa, ileriye al
      if (nextDue <= now) {
        let newNextDue = new Date(nextDue);
        
        if (cycle.periodUnit === 'hours') {
          // Saatlik: Geçmişten itibaren periyot ekleyerek şimdiki zamandan sonrasını bul
          while (newNextDue <= now) {
            newNextDue.setHours(newNextDue.getHours() + cycle.period);
          }
        } else {
          // Günlük: Geçmişten itibaren gün ekleyerek şimdiki zamandan sonrasını bul
          while (newNextDue <= now) {
            newNextDue.setDate(newNextDue.getDate() + cycle.period);
          }
        }
        
        console.log(`⏩ ${cycle.name}: nextDue güncellendi → ${newNextDue.toLocaleString('tr-TR')}`);
        updated = true;
        return { ...cycle, nextDue: newNextDue.toISOString() };
      }
      
      return cycle;
    });
    
    // Güncellenen döngüleri kaydet
    if (updated) {
      await AsyncStorage.setItem('@cycles', JSON.stringify(updatedCycles));
    }
    
    // Bildirimleri planla
    for (const cycle of updatedCycles) {
      if (cycle.notificationsEnabled !== false) {
        await scheduleNotificationForCycle(cycle);
      }
    }
    
    console.log('✅ Tüm bildirimler yenilendi');
  } catch (error) {
    console.error('❌ Bildirim yenileme hatası:', error);
  }
};

// Bildirim geldiğinde sonraki bildirimi planla (saatlik döngüler için)
export const handleNotificationReceived = async (notification) => {
  try {
    const cycleId = notification.request.content.data?.cycleId;
    if (!cycleId) return;
    
    const jsonValue = await AsyncStorage.getItem('@cycles');
    if (!jsonValue) return;
    
    const cycles = JSON.parse(jsonValue);
    const cycle = cycles.find(c => c.id === cycleId);
    
    if (cycle && cycle.periodUnit === 'hours') {
      // Saatlik döngü: nextDue'yu güncelle ve yeni bildirim planla
      const now = new Date();
      const nextDue = new Date(cycle.nextDue);
      
      // nextDue geçmişte kaldıysa, şu andan itibaren hesapla
      if (nextDue <= now) {
        const newNextDue = new Date(now);
        newNextDue.setHours(newNextDue.getHours() + cycle.period);
        
        // Storage'ı güncelle
        const updatedCycles = cycles.map(c => 
          c.id === cycleId ? { ...c, nextDue: newNextDue.toISOString() } : c
        );
        await AsyncStorage.setItem('@cycles', JSON.stringify(updatedCycles));
        
        // Yeni bildirimi planla
        const updatedCycle = { ...cycle, nextDue: newNextDue.toISOString() };
        await scheduleNotificationForCycle(updatedCycle);
        console.log(`🔄 Saatlik döngü yenilendi: ${cycle.name}, sonraki: ${newNextDue.toLocaleString('tr-TR')}`);
      }
    }
  } catch (error) {
    console.error('❌ Bildirim handler hatası:', error);
  }
};

// Tarih formatla (gün/ay/yıl)
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR');
};

// Saat formatla (saat:dakika)
export const formatTime = (date) => {
  const d = new Date(date);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

// Tarih ve saat formatla
export const formatDateTime = (date) => {
  const d = new Date(date);
  return d.toLocaleString('tr-TR');
};

// Kalan gün sayısını hesapla
export const getDaysUntilDue = (dueDate) => {
  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Döngü durumunu belirle (zamanında, gecikmiş, yaklaşan)
export const getCycleStatus = (cycle) => {
  const now = new Date();
  const due = new Date(cycle.nextDue);
  const diffMs = due - now;
  
  if (cycle.periodUnit === 'hours') {
    // Saatlik döngüler için saat bazlı kontrol
    const diffHours = diffMs / (1000 * 60 * 60);
    if (diffHours < 0) {
      return 'overdue'; // Gecikmiş
    } else if (diffHours <= 1) {
      return 'due_soon'; // 1 saat içinde
    } else {
      return 'upcoming'; // Normal
    }
  } else {
    // Günlük döngüler için gün bazlı kontrol
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return 'overdue'; // Gecikmiş
    } else if (diffDays <= 1) {
      return 'due_soon'; // Yakında
    } else {
      return 'upcoming'; // Normal
    }
  }
};