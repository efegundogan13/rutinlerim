import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';

// Ekranları import et
import HomeScreen from './src/screens/HomeScreen';
import AddItemScreen from './src/screens/AddItemScreen';
import ItemDetailScreen from './src/screens/ItemDetailScreen';

// Notification ayarlarını yapılandır
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    // Notification izinlerini iste
    requestNotificationPermissions();
  }, []);

  const requestNotificationPermissions = async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Bildirim izni verilmedi!');
      return;
    }
    
    console.log('Bildirim izni alındı!');
  };

  return (
    <NavigationContainer>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
