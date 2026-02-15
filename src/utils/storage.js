import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleNotificationForCycle } from './notifications';

// Veri anahtarları
const STORAGE_KEYS = {
  CYCLES: '@cycles',
  SETTINGS: '@settings'
};

// Döngü verilerini kaydet
export const saveCycles = async (cycles) => {
  try {
    const jsonValue = JSON.stringify(cycles);
    await AsyncStorage.setItem(STORAGE_KEYS.CYCLES, jsonValue);
    console.log('Döngüler başarıyla kaydedildi');
    return true;
  } catch (error) {
    console.error('Döngüler kaydedilemedi:', error);
    return false;
  }
};

// Döngü verilerini yükle
export const loadCycles = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.CYCLES);
    if (jsonValue != null) {
      const cycles = JSON.parse(jsonValue);
      console.log('Döngüler başarıyla yüklendi:', cycles.length, 'adet');
      return cycles;
    }
    return [];
  } catch (error) {
    console.error('Döngüler yüklenemedi:', error);
    return [];
  }
};

// Yeni döngü ekle
export const addCycle = async (newCycle) => {
  try {
    const existingCycles = await loadCycles();
    const cycleWithId = {
      ...newCycle,
      id: Date.now().toString(), // Basit ID oluşturma
      createdAt: new Date().toISOString()
    };
    
    const updatedCycles = [...existingCycles, cycleWithId];
    const success = await saveCycles(updatedCycles);
    
    if (success) {
      console.log('Yeni döngü eklendi:', cycleWithId.name);
      return cycleWithId;
    }
    return null;
  } catch (error) {
    console.error('Döngü eklenemedi:', error);
    return null;
  }
};

// Döngü güncelle
export const updateCycle = async (cycleId, updatedData) => {
  try {
    const existingCycles = await loadCycles();
    const updatedCycles = existingCycles.map(cycle => 
      cycle.id === cycleId 
        ? { ...cycle, ...updatedData, updatedAt: new Date().toISOString() }
        : cycle
    );
    
    const success = await saveCycles(updatedCycles);
    if (success) {
      console.log('Döngü güncellendi:', cycleId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Döngü güncellenemedi:', error);
    return false;
  }
};

// Döngü sil
export const deleteCycle = async (cycleId) => {
  try {
    const existingCycles = await loadCycles();
    const filteredCycles = existingCycles.filter(cycle => cycle.id !== cycleId);
    
    const success = await saveCycles(filteredCycles);
    if (success) {
      console.log('Döngü silindi:', cycleId);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Döngü silinemedi:', error);
    return false;
  }
};

// Döngüyü tamamlandı olarak işaretle ve sonraki tarihi ayarla
export const completeCycle = async (cycleId) => {
  try {
    const existingCycles = await loadCycles();
    const cycle = existingCycles.find(c => c.id === cycleId);
    
    if (!cycle) {
      console.error('Döngü bulunamadı:', cycleId);
      return false;
    }
    
    const now = new Date();
    const nextDueDate = new Date(now);
    const periodNum = cycle.period;
    
    if (cycle.periodUnit === 'hours') {
      // SAATLİK: Şimdiden X saat sonra
      nextDueDate.setHours(now.getHours() + periodNum);
    } else {
      // GÜNLÜK: X gün sonra, kaydedilmiş saatte
      const reminderTime = cycle.reminderTime ? new Date(cycle.reminderTime) : now;
      nextDueDate.setDate(now.getDate() + periodNum);
      nextDueDate.setHours(reminderTime.getHours());
      nextDueDate.setMinutes(reminderTime.getMinutes());
      nextDueDate.setSeconds(0);
      nextDueDate.setMilliseconds(0);
    }
    
    const updatedData = {
      lastCompleted: now.toISOString(),
      nextDue: nextDueDate.toISOString(),
      completedCount: (cycle.completedCount || 0) + 1
    };
    
    const success = await updateCycle(cycleId, updatedData);
    
    // Döngü başarıyla güncellendiyse bildirim planla
    if (success && cycle.notificationsEnabled !== false) {
      const updatedCycle = { ...cycle, ...updatedData };
      await scheduleNotificationForCycle(updatedCycle);
    }
    
    return success;
  } catch (error) {
    console.error('Döngü tamamlanamadı:', error);
    return false;
  }
};

// Ayarları kaydet
export const saveSettings = async (settings) => {
  try {
    const jsonValue = JSON.stringify(settings);
    await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
    return true;
  } catch (error) {
    console.error('Ayarlar kaydedilemedi:', error);
    return false;
  }
};

// Ayarları yükle
export const loadSettings = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (jsonValue != null) {
      return JSON.parse(jsonValue);
    }
    // Varsayılan ayarlar
    return {
      notificationsEnabled: true,
      reminderTime: '09:00', // 09:00 AM
      language: 'tr'
    };
  } catch (error) {
    console.error('Ayarlar yüklenemedi:', error);
    return {
      notificationsEnabled: true,
      reminderTime: '09:00',
      language: 'tr'
    };
  }
};