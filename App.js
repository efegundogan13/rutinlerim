import React, { useEffect } from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { initializePurchases } from './src/utils/premium';
import { refreshAllNotifications, handleNotificationReceived } from './src/utils/notifications';
import { loadCycles } from './src/utils/storage';

const navigationRef = createNavigationContainerRef();

// Bildirime dokunulduğunda ilgili döngünün detay ekranına git
const navigateToCycleFromNotification = async (response) => {
  try {
    const cycleId = response?.notification?.request?.content?.data?.cycleId;
    if (!cycleId) return;

    const cycles = await loadCycles();
    const cycle = cycles.find(c => c.id === cycleId);
    if (!cycle) return;

    if (navigationRef.isReady()) {
      navigationRef.navigate('ItemDetail', { cycle });
    }
  } catch (error) {
    console.error('❌ Bildirim yönlendirme hatası:', error);
  }
};

// Ekranları import et
import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';
import PremiumScreen from './src/screens/PremiumScreen';

// Bildirim ayarları - BASİT
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,  // Uygulama açıkken gösterme
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    initializePurchases();
    requestNotificationPermissions();
    setupAndroidChannels();
    
    // Uygulama açıldığında tüm bildirimleri yenile
    refreshAllNotifications();
    
    // Bildirim geldiğinde sonraki bildirimi otomatik planla
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        handleNotificationReceived(notification);
      }
    );

    // Kullanıcı bildirime dokunduğunda (uygulama açıkken/arka plandayken) ilgili döngüye git
    const responseListener = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        navigateToCycleFromNotification(response);
      }
    );

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  // Uygulama tamamen kapalıyken bir bildirime dokunulup açıldıysa (soğuk başlangıç),
  // navigasyon hazır olduğunda ilgili döngüye git
  const handleNavigationReady = () => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        navigateToCycleFromNotification(response);
      }
    });
  };

  const requestNotificationPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === 'granted') {
      console.log('✅ Bildirim izni alındı');
    } else {
      console.log('❌ Bildirim izni reddedildi');
    }
  };

  const setupAndroidChannels = async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Hatırlatmalar',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
      console.log('✅ Android channel kuruldu');
    }
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
      <StatusBar style="auto" />
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#6B73FF',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            title: 'Ev Döngüleri',
          }}
        />
        <Stack.Screen 
          name="AddItem" 
          component={AddItemScreen} 
          options={{
            title: 'Yeni Döngü Ekle',
          }}
        />
        <Stack.Screen 
          name="ItemDetail" 
          component={ItemDetailScreen} 
          options={{
            title: 'Döngü Detayı',
          }}
        />
        <Stack.Screen 
          name="Premium" 
          component={PremiumScreen} 
          options={{
            title: 'Premium',
            headerStyle: {
              backgroundColor: '#6B73FF',
            },
            headerTintColor: '#fff',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
