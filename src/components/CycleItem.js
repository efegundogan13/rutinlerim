import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated 
} from 'react-native';
import { getCategoryById, COLORS } from '../constants/categories';
import { getDaysUntilDue, getCycleStatus } from '../utils/notifications';

// Format fonksiyonu
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString('tr-TR')} ${date.toLocaleTimeString('tr-TR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })}`;
};

// Tek bir döngü öğesi için kart bileşeni
const CycleItem = ({ cycle, onPress, onComplete }) => {
  const category = getCategoryById(cycle.categoryId);
  
  // Kalan süreyi hesapla (saat veya gün)
  const getTimeUntilDue = () => {
    const now = new Date();
    const due = new Date(cycle.nextDue);
    const diffTime = due - now;
    
    if (cycle.periodUnit === 'hours') {
      // Saatlik döngüler için saat cinsinden
      const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
      return { value: diffHours, unit: 'hours' };
    } else {
      // Günlük döngüler için gün cinsinden
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { value: diffDays, unit: 'days' };
    }
  };
  
  const timeUntilDue = getTimeUntilDue();
  const daysUntilDue = getDaysUntilDue(cycle.nextDue); // Status için hala kullanılıyor
  const status = getCycleStatus(cycle);

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
    const { value, unit } = timeUntilDue;
    
    if (value < 0) {
      if (unit === 'hours') {
        return `${Math.abs(value)} saat gecikmiş`;
      } else {
        return `${Math.abs(value)} gün gecikmiş`;
      }
    } else if (value === 0) {
      return unit === 'hours' ? 'Şimdi yapılacak' : 'Bugün yapılacak';
    } else if (value === 1) {
      return unit === 'hours' ? '1 saat sonra' : 'Yarın yapılacak';
    } else {
      if (unit === 'hours') {
        return `${value} saat sonra`;
      } else {
        return `${value} gün kaldı`;
      }
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { borderLeftColor: category.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{category.icon}</Text>
          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={1}>
              {cycle.name}
            </Text>
            <Text style={styles.category}>{category.name}</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.completeButton, { backgroundColor: getStatusColor() }]}
          onPress={(e) => {
            e.stopPropagation(); // Ana onPress'in çalışmasını engelle
            onComplete(cycle.id);
          }}
        >
          <Text style={styles.completeButtonText}>✓</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.statusText, { color: getStatusColor() }]}>
          {getStatusText()}
        </Text>
        <Text style={styles.periodText}>
          Her {cycle.period} {cycle.periodUnit === 'hours' ? 'saatte' : 'günde'} bir
        </Text>
      </View>

      {cycle.completedCount > 0 && (
        <View style={styles.completedBadge}>
          <Text style={styles.completedBadgeText}>
            {cycle.completedCount} kez tamamlandı
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 24,
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  completeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  completeButtonText: {
    color: COLORS.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  periodText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  completedBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
});

export default CycleItem;