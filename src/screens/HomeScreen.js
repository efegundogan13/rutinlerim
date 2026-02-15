import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  RefreshControl,
  TextInput,
  Alert,
  Animated,
  ScrollView,
  Linking
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, CATEGORIES } from '../constants/categories';
import { 
  loadCycles, 
  completeCycle, 
  deleteCycle 
} from '../utils/storage';
import { 
  scheduleNotificationForCycle 
} from '../utils/notifications';
import { isPremiumUser, FREE_LIMIT } from '../utils/premium';
import CycleItem from '../components/CycleItem';
import AnimatedFAB from '../components/AnimatedFAB';

const HomeScreen = ({ navigation }) => {
  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isPremium, setIsPremium] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(1)).current;

  // Ekran odaklandığında döngüleri yükle
  useFocusEffect(
    useCallback(() => {
      loadCyclesData();
    }, [])
  );

  // Fade-in animasyonu
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Döngüleri yükle
  const loadCyclesData = async () => {
    try {
      setLoading(true);
      const loadedCycles = await loadCycles();
      setCycles(loadedCycles);
      
      // Premium durumunu kontrol et
      const premium = await isPremiumUser();
      setIsPremium(premium);
    } catch (error) {
      console.error('Döngüler yüklenemedi:', error);
      Alert.alert('Hata', 'Döngüler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  // Yenileme
  const onRefresh = async () => {
    setRefreshing(true);
    // Minimum 500ms göster (çok hızlı yenilenirse kullanıcı görmez)
    await Promise.all([
      loadCyclesData(),
      new Promise(resolve => setTimeout(resolve, 500))
    ]);
    setRefreshing(false);
  };

  // Arama ve filtreleme
  useEffect(() => {
    let filtered = cycles;

    // Arama filtresi
    if (searchText.trim()) {
      filtered = filtered.filter(cycle =>
        cycle.name.toLowerCase().includes(searchText.toLowerCase()) ||
        CATEGORIES.find(cat => cat.id === cycle.categoryId)?.name.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Kategori filtresi
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(cycle => cycle.categoryId === selectedFilter);
    }

    // Oluşturulma tarihine göre sırala (en yeni en üstte)
    filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    setFilteredCycles(filtered);
  }, [cycles, searchText, selectedFilter]);

  // Döngüyü tamamla
  const handleCompleteCycle = async (cycleId) => {
    try {
      const success = await completeCycle(cycleId);
      if (success) {
        Alert.alert(
          'Tebrikler! 🎉',
          'Döngü başarıyla tamamlandı ve sonraki tarih güncellendi.',
          [{ text: 'Tamam', style: 'default' }]
        );
        
        // Döngüleri yeniden yükle
        await loadCyclesData();
      } else {
        Alert.alert('Hata', 'Döngü tamamlanırken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Döngü tamamlanamadı:', error);
      Alert.alert('Hata', 'Döngü tamamlanırken bir hata oluştu.');
    }
  };

  // Döngü detayına git
  const handleCyclePress = (cycle) => {
    navigation.navigate('ItemDetail', { cycle });
  };

  // Boş liste komponenti
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📋</Text>
      <Text style={styles.emptyTitle}>Henüz döngü yok</Text>
      <Text style={styles.emptyText}>
        Ev döngülerinizi takip etmek için yeni bir döngü ekleyin.
      </Text>
      <TouchableOpacity
        style={styles.addFirstButton}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Text style={styles.addFirstButtonText}>İlk Döngünü Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  // Kategori filtre butonları
  const renderFilterButtons = () => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.filterScrollView}
      contentContainerStyle={styles.filterContainer}
    >
      <TouchableOpacity
        style={[
          styles.filterButton,
          selectedFilter === 'all' && styles.activeFilterButton
        ]}
        onPress={() => setSelectedFilter('all')}
      >
        <Text style={[
          styles.filterButtonText,
          selectedFilter === 'all' && styles.activeFilterButtonText
        ]}>
          Tümü
        </Text>
      </TouchableOpacity>
      
      {CATEGORIES.map(category => (
        <TouchableOpacity
          key={category.id}
          style={[
            styles.filterButton,
            selectedFilter === category.id && styles.activeFilterButton,
            selectedFilter === category.id && { backgroundColor: category.color + '20' }
          ]}
          onPress={() => setSelectedFilter(category.id)}
        >
          <Text style={styles.filterEmoji}>{category.icon}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {loading ? (
        // Loading durumu
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Döngüler yükleniyor...</Text>
        </View>
      ) : (
        <>
          {/* Arama çubuğu */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Döngü ara..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {!isPremium && (
              <TouchableOpacity 
                style={styles.premiumBanner}
                onPress={() => navigation.navigate('Premium')}
                activeOpacity={0.85}
              >
                <View style={styles.premiumBannerLeft}>
                  <Text style={styles.premiumBannerEmoji}>👑</Text>
                  <View>
                    <Text style={styles.premiumBannerTitle}>Premium'a Geç</Text>
                    <Text style={styles.premiumBannerSub}>
                      {cycles.length}/{FREE_LIMIT} döngü kullanıldı
                    </Text>
                  </View>
                </View>
                <View style={styles.premiumBannerArrow}>
                  <Text style={styles.premiumBannerArrowText}>→</Text>
                </View>
              </TouchableOpacity>
            )}
            {isPremium && (
              <TouchableOpacity 
                style={styles.premiumActiveBanner}
                onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
                activeOpacity={0.85}
              >
                <Text style={styles.premiumActiveText}>👑 Premium Aktif</Text>
                <Text style={styles.premiumManageText}>Aboneliği Yönet</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Kategori filtreleri */}
          {renderFilterButtons()}

          {/* Döngüler listesi */}
          <FlatList
            data={filteredCycles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CycleItem
                cycle={item}
                onPress={() => handleCyclePress(item)}
                onComplete={handleCompleteCycle}
              />
            )}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            style={{ flex: 1 }}
          />
        </>
      )}

      {/* Yeni döngü ekleme butonu */}
      <AnimatedFAB
        onPress={() => navigation.navigate('AddItem')}
        icon="+"
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E1',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    borderWidth: 1.5,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  premiumBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  premiumBannerEmoji: {
    fontSize: 28,
    marginRight: 10,
  },
  premiumBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  premiumBannerSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 1,
  },
  premiumBannerArrow: {
    backgroundColor: '#FFD700',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  premiumBannerArrowText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  premiumActiveBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F0FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  premiumActiveText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  premiumManageText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  filterScrollView: {
    paddingHorizontal: 16,
    marginBottom: 8,
    maxHeight: 64,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 52,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  activeFilterButton: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  activeFilterButtonText: {
    color: COLORS.primary,
  },
  filterEmoji: {
    fontSize: 28,
    lineHeight: 36,
    textAlign: 'center',
    includeFontPadding: false,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  addFirstButtonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HomeScreen;