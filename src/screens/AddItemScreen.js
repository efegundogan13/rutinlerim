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
import { COLORS, getCategoryById } from '../constants/categories';
import { addCycle } from '../utils/storage';
import { scheduleNotificationForCycle } from '../utils/notifications';
import CategoryPicker from '../components/CategoryPicker';

const AddItemScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('bitki'); // varsayılan kategori
  const [period, setPeriod] = useState('7');
  const [lastCompleted, setLastCompleted] = useState(new Date());
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const scaleAnim = new Animated.Value(0.9);

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
  }, [categoryId]);

  // Kategori seçildiğinde
  const handleCategorySelect = (category) => {
    setCategoryId(category.id);
    setPeriod(category.defaultPeriod.toString());
  };

  // Tarih ve saat seçildiğinde
  const handleDateTimeChange = (event, selectedDateTime) => {
    if (selectedDateTime) {
      setLastCompleted(selectedDateTime);
    }
  };

  // Sonraki tarihi hesapla
  const calculateNextDue = (lastDate, periodDays) => {
    const nextDate = new Date(lastDate);
    nextDate.setDate(nextDate.getDate() + parseInt(periodDays));
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
      const periodDays = parseInt(period);
      const nextDueDate = calculateNextDue(lastCompleted, periodDays);

      const newCycle = {
        name: name.trim(),
        categoryId,
        period: periodDays,
        lastCompleted: lastCompleted.toISOString(),
        nextDue: nextDueDate.toISOString(),
        notificationsEnabled: true,
        completedCount: 0
      };

      const savedCycle = await addCycle(newCycle);
      
      if (savedCycle) {
        // Bildirim planla
        await scheduleNotificationForCycle(savedCycle);
        
        Alert.alert(
          'Başarılı! ✅',
          'Yeni döngü başarıyla eklendi.',
          [
            {
              text: 'Tamam',
              onPress: () => navigation.goBack()
            }
          ]
        );
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

  const nextDueDate = calculateNextDue(lastCompleted, parseInt(period) || 1);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Animated.View style={[styles.formContainer, { transform: [{ scale: scaleAnim }] }]}>
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
            />
          </View>

          {/* Hatırlatma Periyodu */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hatırlatma Periyodu (Gün) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Kaç günde bir"
              placeholderTextColor={COLORS.textSecondary}
              value={period}
              onChangeText={setPeriod}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.hint}>
              Örn: 7 (her hafta), 30 (her ay), 90 (her 3 ay)
            </Text>
          </View>

          {/* Son Bakım Tarihi ve Saati */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Son Bakım Tarihi ve Saati</Text>
            
            {/* Basit DateTime Button */}
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDateTimePicker(!showDateTimePicker)}
            >
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeIcon}>📅🕐</Text>
                <View style={styles.dateTimeText}>
                  <Text style={styles.dateText}>{lastCompleted.toLocaleDateString('tr-TR')}</Text>
                  <Text style={styles.timeText}>{lastCompleted.toLocaleTimeString('tr-TR', {hour: '2-digit', minute: '2-digit'})}</Text>
                </View>
                <Text style={styles.expandIcon}>{showDateTimePicker ? '⌄' : '⌃'}</Text>
              </View>
            </TouchableOpacity>

            {/* Inline DateTimePicker */}
            {showDateTimePicker && (
              <View style={styles.dateTimePickerContainer}>
                <DateTimePicker
                  value={lastCompleted}
                  mode="datetime"
                  display="compact"
                  onChange={handleDateTimeChange}
                  maximumDate={new Date()}
                  is24Hour={true}
                  style={styles.dateTimePickerStyle}
                />
              </View>
            )}
            
            <Text style={styles.hint}>
              Son bakımı yaptığınız tarih ve saati seçin
            </Text>
          </View>

          {/* Sonraki Tarih Önizlemesi */}
          {period && (
            <View style={styles.previewContainer}>
              <Text style={styles.previewTitle}>Sonraki Hatırlatma</Text>
              <Text style={styles.previewDate}>
                🔔 {formatDateTime(nextDueDate)}
              </Text>
              <Text style={styles.previewText}>
                {parseInt(period)} gün sonra hatırlatılacaksınız
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
      </Animated.View>
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