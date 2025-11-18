// Kategori sabitleri - ev döngüsü öğeleri için kullanılacak kategoriler
export const CATEGORIES = [
  {
    id: 'bitki',
    name: 'Bitki',
    icon: '🌱',
    color: '#4CAF50',
    defaultPeriod: 7 // varsayılan hatırlatma periyodu (gün)
  },
  {
    id: 'havlu',
    name: 'Havlu',
    icon: '🧺',
    color: '#2196F3',
    defaultPeriod: 3
  },
  {
    id: 'yastik',
    name: 'Yastık',
    icon: '🛏️',
    color: '#FF9800',
    defaultPeriod: 30
  },
  {
    id: 'filtre',
    name: 'Filtre',
    icon: '🌪️',
    color: '#9C27B0',
    defaultPeriod: 90
  },
  {
    id: 'carsaf',
    name: 'Çarşaf',
    icon: '🛌',
    color: '#E91E63',
    defaultPeriod: 7
  },
  {
    id: 'temizlik',
    name: 'Temizlik',
    icon: '🧽',
    color: '#00BCD4',
    defaultPeriod: 1
  },
  {
    id: 'ev',
    name: 'Ev Bakımı',
    icon: '🏠',
    color: '#795548',
    defaultPeriod: 30
  },
  {
    id: 'gida',
    name: 'Gıda Kontrolü',
    icon: '🥛',
    color: '#8BC34A',
    defaultPeriod: 3
  },
  {
    id: 'diger',
    name: 'Diğer',
    icon: '📋',
    color: '#607D8B',
    defaultPeriod: 7
  }
];

// Kategori ID'sine göre kategori bilgisi getir
export const getCategoryById = (categoryId) => {
  return CATEGORIES.find(cat => cat.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
};

// Renk paleti
export const COLORS = {
  primary: '#6B73FF',
  secondary: '#9C88FF',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
};

// Döngü durumları
export const CYCLE_STATUS = {
  ACTIVE: 'active',
  OVERDUE: 'overdue',
  UPCOMING: 'upcoming'
};