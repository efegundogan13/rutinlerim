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
  Switch
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
  const { cycle } = route.params;
  
  const [name, setName] = useState(cycle.name);
  const [categoryId, setCategoryId] = useState(cycle.categoryId);
  const [period, setPeriod] = useState(cycle.period.toString());
  const [lastCompleted, setLastCompleted] = useState(new Date(cycle.lastCompleted));
  const [nextDue, setNextDue] = useState(new Date(cycle.nextDue));
  const [notificationsEnabled, setNotificationsEnabled] = useState(cycle.notificationsEnabled !== false);
  const [showLastDateTimePicker, setShowLastDateTimePicker] = useState(false);
  const [showNextDateTimePicker, setShowNextDateTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const slideAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(1);

  useEffect(() => {
    // Ekran girişi animasyonu
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const category = getCategoryById(categoryId);
  const daysUntilDue = getDaysUntilDue(nextDue);
  const status = getCycleStatus({ nextDue: nextDue.toISOString() });

  // Kategori seçildiğinde
  const handleCategorySelect = (selectedCategory) => {
    setCategoryId(selectedCategory.id);
  };

  // Tarih değişikliklerini handle et
  const handleLastDateTimeChange = (event, selectedDateTime) => {
    setShowLastDateTimePicker(false);
    if (selectedDateTime) {
      setLastCompleted(selectedDateTime);
      
      // Son tarih değiştiğinde, sonraki tarihi otomatik güncelle
      const newNextDate = new Date(selectedDateTime);
      newNextDate.setDate(selectedDateTime.getDate() + parseInt(period));
      setNextDue(newNextDate);
    }
  };

  const handleNextDateTimeChange = (event, selectedDateTime) => {
    setShowNextDateTimePicker(false);
    if (selectedDateTime) {
      setNextDue(selectedDateTime);
    }
  };

  // Periyod değiştiğinde sonraki tarihi güncelle
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    if (newPeriod && !isNaN(newPeriod)) {
      const newNextDate = new Date(lastCompleted);
      newNextDate.setDate(lastCompleted.getDate() + parseInt(newPeriod));
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
        lastCompleted: lastCompleted.toISOString(),
        nextDue: nextDue.toISOString(),
        notificationsEnabled
      };

      const success = await updateCycle(cycle.id, updatedData);
      
      if (success) {
        // Bildirimi güncelle
        await cancelNotificationForCycle(cycle.id);
        if (notificationsEnabled) {
          await scheduleNotificationForCycle({ ...cycle, ...updatedData });
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
      // Bildirimi iptal et
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
          'Döngü başarıyla tamamlandı ve sonraki tarih güncellendi.',
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
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} gün gecikmiş`;
    } else if (daysUntilDue === 0) {
      return 'Bugün yapılacak';
    } else if (daysUntilDue === 1) {
      return 'Yarın yapılacak';
    } else {
      return `${daysUntilDue} gün kaldı`;
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
          <Text style={styles.statusEmoji}>{category.icon}</Text>
          <Text style={styles.statusTitle}>{cycle.name}</Text>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          <Text style={styles.statusSubtext}>
            Sonraki: {formatDateTime(nextDue)}
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
            onPress={() => setIsEditing(!isEditing)}
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
            <Text style={styles.statNumber}>{cycle.completedCount || 0}</Text>
            <Text style={styles.statLabel}>Tamamlandı</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{cycle.period}</Text>
            <Text style={styles.statLabel}>Gün Periyod</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.floor((new Date() - new Date(cycle.createdAt || cycle.lastCompleted)) / (1000 * 60 * 60 * 24))}
            </Text>
            <Text style={styles.statLabel}>Gün Önce</Text>
          </View>
        </View>

        {/* Düzenleme formu */}
        {isEditing && (
          <View style={styles.editForm}>
            <Text style={styles.sectionTitle}>Döngü Bilgilerini Düzenle</Text>
            
            {/* Döngü Adı */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Döngü Adı</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Döngü adı"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>

            {/* Kategori */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Kategori</Text>
              <CategoryPicker
                selectedCategory={categoryId}
                onSelectCategory={handleCategorySelect}
              />
            </View>

            {/* Periyod */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hatırlatma Periyodu (Gün)</Text>
              <TextInput
                style={styles.textInput}
                value={period}
                onChangeText={handlePeriodChange}
                placeholder="Gün sayısı"
                placeholderTextColor={COLORS.textSecondary}
                keyboardType="numeric"
              />
            </View>

            {/* Son Tamamlanma Tarihi ve Saati */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Son Tamamlanma Tarihi ve Saati</Text>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowLastDateTimePicker(true)}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeIcon}>📅🕐</Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.dateText}>{formatDate(lastCompleted)}</Text>
                    <Text style={styles.timeText}>{formatTime(lastCompleted)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Sonraki Tarih ve Saat */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Sonraki Hatırlatma Tarihi ve Saati</Text>
              
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowNextDateTimePicker(true)}
              >
                <View style={styles.dateTimeContent}>
                  <Text style={styles.dateTimeIcon}>🔔🕐</Text>
                  <View style={styles.dateTimeText}>
                    <Text style={styles.dateText}>{formatDate(nextDue)}</Text>
                    <Text style={styles.timeText}>{formatTime(nextDue)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Bildirimler */}
            <View style={styles.inputGroup}>
              <View style={styles.switchRow}>
                <Text style={styles.label}>Bildirimler</Text>
                <Switch
                  value={notificationsEnabled}
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

      {/* Tarih ve Saat Seçici Modaller */}
      {showLastDateTimePicker && (
        <DateTimePicker
          value={lastCompleted}
          mode="datetime"
          display="default"
          onChange={handleLastDateTimeChange}
          maximumDate={new Date()}
          is24Hour={true}
        />
      )}

      {showNextDateTimePicker && (
        <DateTimePicker
          value={nextDue}
          mode="datetime"
          display="default"
          onChange={handleNextDateTimeChange}
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