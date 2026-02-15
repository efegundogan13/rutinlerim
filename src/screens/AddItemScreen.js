import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { COLORS, getCategoryById } from '../constants/categories';
import { addCycle, loadCycles } from '../utils/storage';
import { scheduleNotificationForCycle } from '../utils/notifications';
import { canAddCycle, FREE_LIMIT } from '../utils/premium';
import CategoryPicker from '../components/CategoryPicker';

const AddItemScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('bitki');
  const [period, setPeriod] = useState('7');
  const [periodUnit, setPeriodUnit] = useState('days'); // 'hours' veya 'days'
  const [reminderTime, setReminderTime] = useState(new Date()); // Sadece günlük için saat
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Form animasyonu
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Kategori değiştiğinde varsayılan periyodu ayarla
    const category = getCategoryById(categoryId);
    if (!period) {
      setPeriod(category.defaultPeriod.toString());
    }
    // Kategori birimi ayarla
    setPeriodUnit(category.periodUnit || 'days');
  }, [categoryId]);

  // Kategori seçildiğinde
  const handleCategorySelect = (category) => {
    setCategoryId(category.id);
    setPeriod(category.defaultPeriod.toString());
    setPeriodUnit(category.periodUnit || 'days');
  };

  // Sonraki hatırlatma zamanını hesapla
  const calculateNextDue = (periodValue, unit, reminderTimeForDays) => {
    const now = new Date();
    const nextDate = new Date(now);
    const periodNum = parseInt(periodValue);
    
    if (unit === 'hours') {
      // SAATLİK: Şimdiden X saat sonra
      nextDate.setHours(now.getHours() + periodNum);
    } else {
      // GÜNLÜK: X gün sonra, kullanıcının seçtiği saatte
      nextDate.setDate(now.getDate() + periodNum);
      nextDate.setHours(reminderTimeForDays.getHours());
      nextDate.setMinutes(reminderTimeForDays.getMinutes());
      nextDate.setSeconds(0);
      nextDate.setMilliseconds(0);
    }
    
    return nextDate;
  };

  // Form validasyonu
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Lütfen döngü adını girin.');
      return false;
    }

    if (!period.trim() || isNaN(period) || parseInt(period) <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir hatırlatma periyodu girin.');
      return false;
    }

    return true;
  };

  // Döngüyü kaydet
  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Premium kontrolü
      const existingCycles = await loadCycles();
      const premiumCheck = await canAddCycle(existingCycles.length);
      
      if (!premiumCheck.canAdd) {
        Alert.alert(
          '🔒 Premium Özellik',
          premiumCheck.message,
          [
            { text: 'Tamam', style: 'cancel' },
            { 
              text: 'Premium Al', 
              style: 'default',
              onPress: () => {
                navigation.navigate('Premium');
              }
            }
          ]
        );
        setSaving(false);
        return;
      }
      
      const now = new Date();
      const periodValue = parseInt(period);
      const nextDueDate = calculateNextDue(periodValue, periodUnit, reminderTime);

      const newCycle = {
        name: name.trim(),
        categoryId,
        period: periodValue,
        periodUnit: periodUnit,
        reminderTime: periodUnit === 'days' ? reminderTime.toISOString() : null,
        lastCompleted: now.toISOString(),
        nextDue: nextDueDate.toISOString(),
        notificationsEnabled: true,
        completedCount: 0
      };

      const savedCycle = await addCycle(newCycle);
      
      if (savedCycle) {
        // Bildirim planla
        await scheduleNotificationForCycle(savedCycle);
        
        // Geri dön
        navigation.goBack();
      } else {
        Alert.alert('Hata', 'Döngü eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Döngü kaydedilemedi:', error);
      Alert.alert('Hata', 'Döngü eklenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('tr-TR');
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (date) => {
    return `${formatDate(date)} ${formatTime(date)}`;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.formContainer}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* Başlık */}
          <Text style={styles.title}>Yeni Ev Döngüsü</Text>
          <Text style={styles.subtitle}>
            Evinizdeki bir öğenin bakım döngüsünü takip edin
          </Text>

          {/* Döngü Adı */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Döngü Adı *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Örn: Salon bitkisi, Banyo havlusu..."
              placeholderTextColor={COLORS.textSecondary}
              value={name}
              onChangeText={setName}
              maxLength={50}
            />
          </View>

          {/* Kategori Seçici */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Kategori *</Text>
            <CategoryPicker
              selectedCategory={categoryId}
              onSelectCategory={handleCategorySelect}
              onPremiumPress={() => navigation.navigate('Premium')}
            />
          </View>

          {/* Hatırlatma Periyodu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hatırlatma Periyodu *</Text>
            
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
            
            <View style={styles.periodInputContainer}>
              <TextInput
                style={styles.periodInput}
                placeholder="Periyot"
                placeholderTextColor={COLORS.textSecondary}
                value={period}
                onChangeText={setPeriod}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.periodUnitLabel}>
                {periodUnit === 'hours' ? 'saat' : 'gün'}
              </Text>
            </View>
            <Text style={styles.hint}>
              {periodUnit === 'hours' 
                ? 'Örn: 2 (her 2 saatte), 6 (günde 4 kez), 8 (günde 3 kez)' 
                : 'Örn: 7 (her hafta), 30 (her ay), 90 (her 3 ay)'}
            </Text>
          </View>

          {/* GÜNLÜK seçiliyse: Hatırlatma Saati */}
          {periodUnit === 'days' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>⏰ Hatırlatma Saati</Text>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowTimePicker(true)}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeIcon}></Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.timeText}>
                      {reminderTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}
                    </Text>
                  </View>
                  <Text style={styles.expandIcon}>⌃</Text>
                </View>
              </TouchableOpacity>

              {showTimePicker && (
                <DateTimePicker
                  value={reminderTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedTime) => {
                    setShowTimePicker(Platform.OS === 'ios');
                    if (selectedTime) {
                      setReminderTime(selectedTime);
                    }
                  }}
                  is24Hour={true}
                />
              )}
              
              <Text style={styles.hint}>
                Her {period} günde bir bu saatte hatırlatılacaksınız
              </Text>
            </View>
          )}

          {/* Bilgilendirme */}
          {period && periodUnit === 'hours' && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>
                ⏰ Her {period} saatte bir hatırlatılacaksınız
              </Text>
            </View>
          )}
          
          {period && periodUnit === 'days' && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewText}>
                📅 Her {period} günde bir {reminderTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})} saatinde hatırlatılacaksınız
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Kaydet Butonu */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Kaydediliyor...' : 'Döngüyü Kaydet'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  formContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    marginBottom: 24,
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    minHeight: 52,
  },
  periodInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  periodInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: 16,
  },
  periodUnitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 8,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  dateButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: COLORS.text,
  },
  dateTimeButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
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
  previewContainer: {
    backgroundColor: COLORS.primary + '10',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 8,
  },
  previewDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  previewText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  dateTimeButton: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginVertical: 8,
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
  expandIcon: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  dateTimePickerContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
    marginBottom: 8,
    padding: 8,
  },
  dateTimePickerStyle: {
    width: '100%',
    height: 120,
  },
  buttonContainer: {
    padding: 16,
    paddingTop: 8,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
  },
  saveButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: '600',
  },
});

export default AddItemScreen;