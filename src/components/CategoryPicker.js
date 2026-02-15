import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { CATEGORIES, COLORS } from '../constants/categories';
import { isPremiumUser } from '../utils/premium';

// Kategori seçici bileşeni
const CategoryPicker = ({ selectedCategory, onSelectCategory, onPremiumPress, style }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    checkPremium();
  }, [modalVisible]);

  const checkPremium = async () => {
    const premium = await isPremiumUser();
    setIsPremium(premium);
  };

  const handleSelectCategory = (category) => {
    if (category.premium && !isPremium) {
      Alert.alert(
        '🔒 Premium Kategori',
        `"${category.name}" kategorisi Premium kullanıcılara özeldir.`,
        [
          { text: 'Tamam', style: 'cancel' },
          { 
            text: 'Premium Al', 
            onPress: () => {
              setModalVisible(false);
              if (onPremiumPress) onPremiumPress();
            }
          }
        ]
      );
      return;
    }
    onSelectCategory(category);
    setModalVisible(false);
  };

  const selectedCat = CATEGORIES.find(cat => cat.id === selectedCategory) || CATEGORIES[0];

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[styles.selector, { borderColor: selectedCat.color }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.emoji}>{selectedCat.icon}</Text>
        <Text style={styles.categoryName}>{selectedCat.name}</Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Kategori Seçin</Text>
            
            <ScrollView style={styles.categoriesList}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.categoryOption,
                    { borderColor: category.color },
                    selectedCategory === category.id && { 
                      backgroundColor: category.color + '20' 
                    },
                    category.premium && !isPremium && styles.lockedCategory
                  ]}
                  onPress={() => handleSelectCategory(category)}
                >
                  <Text style={styles.categoryEmoji}>{category.icon}</Text>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryOptionName}>
                      {category.name}
                      {category.premium && !isPremium ? ' 🔒' : ''}
                    </Text>
                    <Text style={styles.categoryPeriod}>
                      {category.premium && !isPremium 
                        ? 'Premium özellik' 
                        : `Varsayılan: ${category.defaultPeriod} ${category.periodUnit === 'hours' ? 'saat' : 'gün'}`
                      }
                    </Text>
                  </View>
                  {selectedCategory === category.id && (
                    <Text style={[styles.checkmark, { color: category.color }]}>
                      ✓
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    minHeight: 56,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  arrow: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    width: '85%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  categoriesList: {
    maxHeight: 400,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  lockedCategory: {
    opacity: 0.5,
  },
  categoryEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryOptionName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  categoryPeriod: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  checkmark: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoryPicker;