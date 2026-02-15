import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Alert,
  Animated,
  Switch,
  Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { COLORS, getCategoryById } from '../constants/categories';
import { updateCycle, deleteCycle, completeCycle } from '../utils/storage';
import { 
  scheduleNotificationForCycle, 
  cancelNotificationForCycle,
  getDaysUntilDue,
  getCycleStatus,
  formatDate
} from '../utils/notifications';

// Format fonksiyonları
const formatTime = (date) => {
  return date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

const formatDateTime = (date) => {
  return `${formatDate(date)} ${formatTime(date)}`;
};
import CategoryPicker from '../components/CategoryPicker';

const ItemDetailScreen = ({ route, navigation }) => {
  // Guard: route veya cycle eksikse crash önlemek için güvenli varsayılanlar kullan
  const cycle = route?.params?.cycle || null;


  const [name, setName] = useState(cycle?.name || '');
  const [categoryId, setCategoryId] = useState(cycle?.categoryId || 'bitki');
  const [period, setPeriod] = useState((cycle?.period != null) ? cycle.period.toString() : '7');
  const [periodUnit, setPeriodUnit] = useState(cycle?.periodUnit || 'days'); // YENİ
  const [lastCompleted, setLastCompleted] = useState(cycle?.lastCompleted ? new Date(cycle.lastCompleted) : new Date());
  const [nextDue, setNextDue] = useState(cycle?.nextDue ? new Date(cycle.nextDue) : new Date());
  const [notificationsEnabled, setNotificationsEnabled] = useState(cycle?.notificationsEnabled !== false);
  // Android için iki aşamalı picker
  const [showLastDatePicker, setShowLastDatePicker] = useState(false);
  const [showLastTimePicker, setShowLastTimePicker] = useState(false);
  const [showNextDatePicker, setShowNextDatePicker] = useState(false);
  const [showNextTimePicker, setShowNextTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Düzenleme formu açılırken picker state'lerini sıfırla
  useEffect(() => {
    if (isEditing) {
      setShowLastDatePicker(false);
      setShowLastTimePicker(false);
      setShowNextDatePicker(false);
      setShowNextTimePicker(false);
    }
  }, [isEditing]);
  
  // Animated.Value'ları useRef ile oluşturmak, yeniden renderlarda yeni instance oluşmasını engeller
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Ekran girişi animasyonu
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    // Debug: route paramlarını logla (Android'te bazen eksik gelebiliyor)
    try {
      console.log('ItemDetail mounted, route.params=', route?.params);
    } catch (e) {
      console.log('ItemDetail mount: route params log error', e);
    }
  }, []);

  const category = getCategoryById(categoryId);
  const daysUntilDue = nextDue ? getDaysUntilDue(nextDue) : 0;
  const status = nextDue ? getCycleStatus({ nextDue: nextDue.toISOString(), periodUnit }) : 'normal';

  // Kategori seçildiğinde
  const handleCategorySelect = (selectedCategory) => {
    setCategoryId(selectedCategory.id);
    setPeriodUnit(selectedCategory.periodUnit || 'days'); // Kategori birimine göre güncelle
  };

  // Son tamamlanma tarihi için iki aşamalı picker (Android)
  const handleLastDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowLastDatePicker(false);
      return;
    }
    setShowLastDatePicker(false);
    if (selectedDate) {
      setShowLastTimePicker(true);
      setLastCompleted(prev => {
        const newDate = new Date(selectedDate);
        newDate.setHours(prev.getHours());
        newDate.setMinutes(prev.getMinutes());
        return newDate;
      });
    }
  };
  const handleLastTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowLastTimePicker(false);
      return;
    }
    setShowLastTimePicker(false);
    if (selectedTime) {
      setLastCompleted(prev => {
        const newDate = new Date(prev);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        // Sonraki tarihi de güncelle
        const newNextDate = new Date(newDate);
        newNextDate.setDate(newDate.getDate() + parseInt(period));
        setNextDue(newNextDate);
        return newDate;
      });
    }
  };
  // Sonraki hatırlatma tarihi için iki aşamalı picker (Android)
  const handleNextDateChange = (event, selectedDate) => {
    if (event.type === 'dismissed') {
      setShowNextDatePicker(false);
      return;
    }
    setShowNextDatePicker(false);
    if (selectedDate) {
      setShowNextTimePicker(true);
      setNextDue(prev => {
        const newDate = new Date(selectedDate);
        newDate.setHours(prev.getHours());
        newDate.setMinutes(prev.getMinutes());
        return newDate;
      });
    }
  };
  const handleNextTimeChange = (event, selectedTime) => {
    if (event.type === 'dismissed') {
      setShowNextTimePicker(false);
      return;
    }
    setShowNextTimePicker(false);
    if (selectedTime) {
      setNextDue(prev => {
        const newDate = new Date(prev);
        newDate.setHours(selectedTime.getHours());
        newDate.setMinutes(selectedTime.getMinutes());
        return newDate;
      });
    }
  };
  // iOS için tek picker
  const handleLastDateTimeChangeIOS = (event, selectedDateTime) => {
    if (selectedDateTime) {
      setLastCompleted(selectedDateTime);
      const newNextDate = new Date(selectedDateTime);
      newNextDate.setDate(selectedDateTime.getDate() + parseInt(period));
      setNextDue(newNextDate);
    }
  };
  const handleNextDateTimeChangeIOS = (event, selectedDateTime) => {
    if (selectedDateTime) {
      setNextDue(selectedDateTime);
    }
  };

  // Periyod değiştiğinde sonraki tarihi güncelle
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod && !isNaN(newPeriod)) {
      const now = new Date();
      const newNextDate = new Date(now);
      const periodNum = parseInt(newPeriod);
      
      if (periodUnit === 'hours') {
        // Saatlik: şimdiden X saat sonra, kullanıcının seçtiği dakikada
        newNextDate.setHours(now.getHours() + periodNum);
        newNextDate.setMinutes(lastCompleted.getMinutes());
        newNextDate.setSeconds(0);
        newNextDate.setMilliseconds(0);
      } else {
        // Günlük: X gün sonra, kullanıcının seçtiği saatte
        newNextDate.setDate(now.getDate() + periodNum);
        newNextDate.setHours(lastCompleted.getHours());
        newNextDate.setMinutes(lastCompleted.getMinutes());
        newNextDate.setSeconds(0);
        newNextDate.setMilliseconds(0);
      }
      
      setNextDue(newNextDate);
    }
  };

  // Döngüyü kaydet
  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen döngü adını girin.');
      return;
    }

    if (!period.trim() || isNaN(period) || parseInt(period) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir hatırlatma periyodu girin.');
      return;
    }

    setSaving(true);
    
    try {
      const updatedData = {
        name: name.trim(),
        categoryId,
        period: parseInt(period),
        periodUnit: periodUnit,
        lastCompleted: lastCompleted.toISOString(),
        nextDue: nextDue.toISOString(),
        notificationsEnabled,
        // Günlük döngüler için reminderTime'ı koru
        reminderTime: cycle.reminderTime || lastCompleted.toISOString()
      };

      const success = await updateCycle(cycle.id, updatedData);
      
      if (success) {
        // Bildirimi güncelle
        if (notificationsEnabled) {
          const updatedCycle = { ...cycle, ...updatedData, id: cycle.id };
          await scheduleNotificationForCycle(updatedCycle);
        }
        
        Alert.alert(
          'Başarılı! ✅',
          'Döngü başarıyla güncellendi.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Hata', 'Döngü güncellenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Döngü güncellenemedi:', error);
      Alert.alert('Hata', 'Döngü güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  // Döngüyü sil
  const handleDelete = () => {
    Alert.alert(
      'Döngüyü Sil',
      'Bu döngüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: confirmDelete
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      await cancelNotificationForCycle(cycle.id);
      
      const success = await deleteCycle(cycle.id);
      if (success) {
        Alert.alert(
          'Silindi',
          'Döngü başarıyla silindi.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Hata', 'Döngü silinirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Döngü silinemedi:', error);
      Alert.alert('Hata', 'Döngü silinirken bir hata oluştu.');
    }
  };

  // Döngüyü tamamla
  const handleComplete = async () => {
    // Tamamlama animasyonu
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start();

    try {
      const success = await completeCycle(cycle.id);
      if (success) {
        Alert.alert(
          'Tebrikler! 🎉',
          'Döngü başarıyla tamamlandı.',
          [{ text: 'Tamam', onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert('Hata', 'Döngü tamamlanırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Döngü tamamlanamadı:', error);
      Alert.alert('Hata', 'Döngü tamamlanırken bir hata oluştu.');
    }
  };

  // Durum rengini belirle
  const getStatusColor = () => {
    switch (status) {
      case 'overdue':
        return COLORS.error;
      case 'due_soon':
        return COLORS.warning;
      default:
        return COLORS.success;
    }
  };

  // Durum metnini belirle
  const getStatusText = () => {
    if (periodUnit === 'hours') {
      // Saatlik döngüler için saat bazlı göster
      const now = new Date();
      const due = nextDue ? new Date(nextDue) : new Date();
      const diffMs = due - now;
      const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 0) {
        return `${Math.abs(diffHours)} saat gecikmiş`;
      } else if (diffHours === 0) {
        return 'Şimdi yapılacak';
      } else if (diffHours === 1) {
        return '1 saat sonra';
      } else {
        return `${diffHours} saat sonra`;
      }
    } else {
      // Günlük döngüler için gün bazlı göster
      if (daysUntilDue < 0) {
        return `${Math.abs(daysUntilDue)} gün gecikmiş`;
      } else if (daysUntilDue === 0) {
        return 'Bugün yapılacak';
      } else if (daysUntilDue === 1) {
        return 'Yarın yapılacak';
      } else {
        return `${daysUntilDue} gün kaldı`;
      }
    }
  };

  return (
    <Animated.View style={[
      styles.container, 
      { 
        opacity: slideAnim,
        transform: [{ scale: scaleAnim }]
      }
    ]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Durum kartı */}
        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <Text style={styles.statusEmoji}>{category?.icon || '❓'}</Text>
          <Text style={styles.statusTitle}>{name || '—'}</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}> 
            {getStatusText()}
          </Text>
          <Text style={styles.statusSubtext}>
            Sonraki: {nextDue ? formatDateTime(nextDue) : '—'}
          </Text>
        </View>

        {/* Hızlı aksiyon butonları */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.completeButton]}
            onPress={handleComplete}
          >
            <Text style={styles.actionButtonIcon}>✓</Text>
            <Text style={styles.actionButtonText}>Tamamla</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => {
              // Düzenle butonuna basınca formu doldur
              if (!isEditing && cycle) {
                // Düzenleme moduna geçerken state'leri güncelle
                setName(cycle.name || '');
                setCategoryId(cycle.categoryId || 'bitki');
                setPeriod((cycle.period != null) ? cycle.period.toString() : '7');
                setLastCompleted(cycle.lastCompleted ? new Date(cycle.lastCompleted) : new Date());
                setNextDue(cycle.nextDue ? new Date(cycle.nextDue) : new Date());
                setNotificationsEnabled(cycle.notificationsEnabled !== false);
              }
              setIsEditing(prev => !prev);
            }}
          >
            <Text style={styles.actionButtonIcon}>✏️</Text>
            <Text style={styles.actionButtonText}>
              {isEditing ? 'İptal' : 'Düzenle'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* İstatistikler */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{(cycle && cycle.completedCount) ? cycle.completedCount : 0}</Text>
            <Text style={styles.statLabel}>Tamamlandı</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{period}</Text>
            <Text style={styles.statLabel}>{periodUnit === 'hours' ? 'Saat' : 'Gün'} Periyod</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.floor((new Date() - new Date(cycle?.createdAt || cycle?.lastCompleted || lastCompleted)) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles.statLabel}>Gün Önce</Text>
          </View>
        </View>

        {/* Düzenleme formu */}
        {isEditing && (
          <View style={[styles.editForm, {backgroundColor: '#fff', borderWidth: 2, borderColor: '#6B73FF', zIndex: 100}]}> 
            <Text style={styles.sectionTitle}>Döngü Bilgilerini Düzenle</Text>
            {/* Döngü Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Döngü Adı</Text>
              <TextInput
                style={styles.textInput}
                value={name || ''}
                onChangeText={setName}
                placeholder="Döngü adı"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            {/* Kategori */}
            {/* Kategori (geçici olarak kaldırıldı, sadece text gösteriliyor) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategori</Text>
              <Text style={{color: '#333', fontSize: 16}}>{categoryId}</Text>
            </View>
            {/* Periyod */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hatırlatma Periyodu</Text>
              
              {/* Saat/Gün Seçici */}
              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    periodUnit === 'hours' && styles.unitButtonActive
                  ]}
                  onPress={() => setPeriodUnit('hours')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    periodUnit === 'hours' && styles.unitButtonTextActive
                  ]}>
                    ⏰ Saat
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.unitButton,
                    periodUnit === 'days' && styles.unitButtonActive
                  ]}
                  onPress={() => setPeriodUnit('days')}
                >
                  <Text style={[
                    styles.unitButtonText,
                    periodUnit === 'days' && styles.unitButtonTextActive
                  ]}>
                    📅 Gün
                  </Text>
                </TouchableOpacity>
              </View>
              
              <TextInput
                style={styles.textInput}
                value={period || ''}
                onChangeText={handlePeriodChange}
                placeholder={periodUnit === 'hours' ? 'Kaç saatte bir' : 'Kaç günde bir'}
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>
            {/* Son Tamamlanma Tarihi ve Saati */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Son Tamamlanma Tarihi ve Saati</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowLastDatePicker(true);
                  } else {
                    setShowLastDatePicker(true);
                  }
                }}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeIcon}>📅🕐</Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.dateText}>{lastCompleted ? formatDate(lastCompleted) : ''}</Text>
                    <Text style={styles.timeText}>{lastCompleted ? formatTime(lastCompleted) : ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {/* Sonraki Tarih ve Saat */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sonraki Hatırlatma Tarihi ve Saati</Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => {
                  if (Platform.OS === 'android') {
                    setShowNextDatePicker(true);
                  } else {
                    setShowNextDatePicker(true);
                  }
                }}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeIcon}>🔔🕐</Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.dateText}>{nextDue ? formatDate(nextDue) : ''}</Text>
                    <Text style={styles.timeText}>{nextDue ? formatTime(nextDue) : ''}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
            {/* Bildirimler */}
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Bildirimler</Text>
                <Switch
                  value={!!notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: COLORS.border, true: COLORS.primary + '50' }}
                  thumbColor={notificationsEnabled ? COLORS.primary : COLORS.textSecondary}
                />
              </View>
            </View>
            {/* Kaydet ve Sil Butonları */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Döngüyü Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Android için iki aşamalı picker */}
      {Platform.OS === 'android' && showLastDatePicker && (
        <DateTimePicker
          value={lastCompleted}
          mode="date"
          display="default"
          onChange={handleLastDateChange}
          maximumDate={new Date()}
          is24Hour={true}
        />
      )}
      {Platform.OS === 'android' && showLastTimePicker && (
        <DateTimePicker
          value={lastCompleted}
          mode="time"
          display="default"
          onChange={handleLastTimeChange}
          is24Hour={true}
        />
      )}
      {Platform.OS === 'android' && showNextDatePicker && (
        <DateTimePicker
          value={nextDue}
          mode="date"
          display="default"
          onChange={handleNextDateChange}
          minimumDate={new Date()}
          is24Hour={true}
        />
      )}
      {Platform.OS === 'android' && showNextTimePicker && (
        <DateTimePicker
          value={nextDue}
          mode="time"
          display="default"
          onChange={handleNextTimeChange}
          is24Hour={true}
        />
      )}
      {/* iOS için tek picker */}
      {Platform.OS === 'ios' && showLastDatePicker && (
        <DateTimePicker
          value={lastCompleted}
          mode="datetime"
          display="compact"
          onChange={handleLastDateTimeChangeIOS}
          maximumDate={new Date()}
          is24Hour={true}
        />
      )}
      {Platform.OS === 'ios' && showNextDatePicker && (
        <DateTimePicker
          value={nextDue}
          mode="datetime"
          display="compact"
          onChange={handleNextDateTimeChangeIOS}
          minimumDate={new Date()}
          is24Hour={true}
        />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  completeButton: {
    backgroundColor: COLORS.success,
  },
  editButton: {
    backgroundColor: COLORS.info,
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  actionButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  editForm: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  unitButton: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  unitButtonActive: {
    backgroundColor: COLORS.primary + '15',
    borderColor: COLORS.primary,
  },
  unitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  unitButtonTextActive: {
    color: COLORS.primary,
  },
  textInput: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
  },
  dateButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  dateTimeButton: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
  },
  dateTimeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  dateTimeText: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: COLORS.error,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ItemDetailScreen;