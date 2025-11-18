import * as Notifications from 'expo-notifications';
import { CATEGORIES, getCategoryById } from '../constants/categories';

// Bildirim izinlerini kontrol et
export const checkNotificationPermissions = async () => {
  const settings = await Notifications.getPermissionsAsync();
  return settings.granted;
};

// Bildirim izni iste
export const requestNotificationPermissions = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  return finalStatus === 'granted';
};

// Tek bir döngü için bildirim planla
export const scheduleNotificationForCycle = async (cycle) => {
  try {
    // Mevcut bildirimleri iptal et
    await cancelNotificationForCycle(cycle.id);
    
    const category = getCategoryById(cycle.categoryId);
    const nextDueDate = new Date(cycle.nextDue);
    const now = new Date();
    
    // Eğer tarih geçmişse, bildirim planlamayı atla
    if (nextDueDate <= now) {
      console.log('Tarih geçmiş, bildirim planlanmadı:', cycle.name);
      return null;
    }
    
    const notificationIds = [];
    
    // 1. Uyarı bildirimi: 1 saat öncesinde
    const warningDate = new Date(nextDueDate);
    warningDate.setHours(nextDueDate.getHours() - 1);
    
    // Eğer uyarı zamanı geçmişse, 30 saniye sonra gönder
    if (warningDate <= now) {
      warningDate.setTime(now.getTime() + (30 * 1000));
    }
    
    const warningNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `⚠️ ${category.icon} ${cycle.name}`,
        body: `${category.name} bakımı 1 saat sonra! Saat: ${formatTime(nextDueDate)}`,
        data: { 
          cycleId: cycle.id,
          type: 'warning'
        },
        sound: true,
      },
      trigger: {
        type: 'date',
        date: warningDate,
      },
    });
    
    notificationIds.push(warningNotificationId);
    console.log(`Uyarı bildirimi planlandı: ${cycle.name} - ${formatDateTime(warningDate)}`);
    
    // 2. Ana bildirim: Tam zamanında
    const mainNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔔 ${category.icon} ${cycle.name}`,
        body: `${category.name} bakım zamanı geldi! Şimdi yapmanın tam zamanı.`,
        data: { 
          cycleId: cycle.id,
          type: 'reminder'
        },
        sound: true,
      },
      trigger: {
        type: 'date',
        date: nextDueDate,
      },
    });
    
    notificationIds.push(mainNotificationId);
    console.log(`Ana bildirim planlandı: ${cycle.name} - ${formatDateTime(nextDueDate)}`);
    
    return notificationIds;
    
  } catch (error) {
    console.error('Bildirim planlanamadı:', error);
    return null;
  }
};

// Döngü için bildirimi iptal et
export const cancelNotificationForCycle = async (cycleId) => {
  try {
    // Tüm planlanmış bildirimleri al
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    
    // Bu döngü ile ilgili bildirimleri bul ve iptal et
    for (const notification of scheduledNotifications) {
      if (notification.content.data?.cycleId === cycleId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log('Bildirim iptal edildi:', notification.identifier);
      }
    }
  } catch (error) {
    console.error('Bildirim iptal edilemedi:', error);
  }
};

// Tüm döngüler için bildirimleri yeniden planla
export const rescheduleAllNotifications = async (cycles) => {
  try {
    // Tüm mevcut bildirimleri iptal et
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('Tüm mevcut bildirimler iptal edildi');
    
    // Her döngü için yeni bildirim planla
    for (const cycle of cycles) {
      if (cycle.notificationsEnabled !== false) { // Varsayılan olarak etkin
        await scheduleNotificationForCycle(cycle);
      }
    }
    
    console.log(`${cycles.length} döngü için bildirimler yeniden planlandı`);
  } catch (error) {
    console.error('Bildirimler yeniden planlanamadı:', error);
  }
};

// Acil bildirim gönder (test amaçlı)
export const sendImmediateNotification = async (title, body, data = {}) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Hemen gönder
    });
    console.log('Anında bildirim gönderildi:', title);
  } catch (error) {
    console.error('Anında bildirim gönderilemedi:', error);
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
  const daysUntilDue = getDaysUntilDue(cycle.nextDue);
  
  if (daysUntilDue < 0) {
    return 'overdue'; // Gecikmiş
  } else if (daysUntilDue <= 1) {
    return 'due_soon'; // Yakında
  } else {
    return 'upcoming'; // Normal
  }
};