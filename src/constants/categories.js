// Kategori sabitleri - ev döngüsü öğeleri için kullanılacak kategoriler
export const CATEGORIES = [
  {
    id: 'su',
    name: 'Su İçme',
    icon: '💧',
    color: '#03A9F4',
    defaultPeriod: 2,
    periodUnit: 'hours' // Saatlik hatırlatma
  },
  {
    id: 'ilac',
    name: 'İlaç',
    icon: '💊',
    color: '#E53935',
    defaultPeriod: 8,
    periodUnit: 'hours' // Saatlik hatırlatma
  },
  {
    id: 'bitki',
    name: 'Bitki',
    icon: '🌱',
    color: '#4CAF50',
    defaultPeriod: 7,
    periodUnit: 'days' // Birim: days (gün) veya hours (saat)
  },
  {
    id: 'havlu',
    name: 'Havlu',
    icon: '🧺',
    color: '#2196F3',
    defaultPeriod: 3,
    periodUnit: 'days'
  },
  {
    id: 'yastik',
    name: 'Yastık',
    icon: '🛏️',
    color: '#FF9800',
    defaultPeriod: 30,
    periodUnit: 'days'
  },
  {
    id: 'filtre',
    name: 'Filtre',
    icon: '🌪️',
    color: '#9C27B0',
    defaultPeriod: 90,
    periodUnit: 'days'
  },
  {
    id: 'carsaf',
    name: 'Çarşaf',
    icon: '🛌',
    color: '#E91E63',
    defaultPeriod: 7,
    periodUnit: 'days'
  },
  {
    id: 'temizlik',
    name: 'Temizlik',
    icon: '🧹',
    color: '#00BCD4',
    defaultPeriod: 1,
    periodUnit: 'days'
  },
  {
    id: 'ev',
    name: 'Ev Bakımı',
    icon: '🏠',
    color: '#795548',
    defaultPeriod: 30,
    periodUnit: 'days'
  },
  {
    id: 'gida',
    name: 'Gıda Kontrolü',
    icon: '🥛',
    color: '#8BC34A',
    defaultPeriod: 3,
    periodUnit: 'days'
  },
  {
    id: 'diger',
    name: 'Diğer',
    icon: '📋',
    color: '#607D8B',
    defaultPeriod: 7,
    periodUnit: 'days'
  },
  // Premium kategoriler
  {
    id: 'evcil',
    name: 'Evcil Hayvan',
    icon: '🐾',
    color: '#FF7043',
    defaultPeriod: 1,
    periodUnit: 'days',
    premium: true
  },
  {
    id: 'arac',
    name: 'Araç Bakımı',
    icon: '🚗',
    color: '#5C6BC0',
    defaultPeriod: 180,
    periodUnit: 'days',
    premium: true
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