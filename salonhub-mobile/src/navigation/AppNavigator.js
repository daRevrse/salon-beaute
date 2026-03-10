import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';

import { useAuth } from '../contexts/AuthContext';

// Screens
import LoginScreen from '../screens/LoginScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import PasswordResetSuccessScreen from '../screens/PasswordResetSuccessScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import AppointmentFormScreen from '../screens/AppointmentFormScreen';
import AppointmentDetailScreen from '../screens/AppointmentDetailScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientFormScreen from '../screens/ClientFormScreen';
import ClientHistoryScreen from '../screens/ClientHistoryScreen';
import ServicesScreen from '../screens/ServicesScreen';
import ServiceFormScreen from '../screens/ServiceFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import BusinessHoursScreen from '../screens/BusinessHoursScreen';
import BusinessSettingsScreen from '../screens/BusinessSettingsScreen';
import StaffScreen from '../screens/StaffScreen';
import StaffFormScreen from '../screens/StaffFormScreen';
import BillingScreen from '../screens/BillingScreen';
import PromotionsScreen from '../screens/PromotionsScreen';
import PromotionFormScreen from '../screens/PromotionFormScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import NotificationListScreen from '../screens/NotificationListScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Navigation pour les utilisateurs connectés (Bottom Tabs)
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Appointments') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Services') {
            iconName = focused ? 'cut' : 'cut-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Tableau de bord' }}
      />
      <Tab.Screen
        name="Appointments"
        component={AppointmentsScreen}
        options={{ title: 'Rendez-vous' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <Tab.Screen
        name="Services"
        component={ServicesScreen}
        options={{ title: 'Services' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
};

// Navigation principale
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const [onboardingSeen, setOnboardingSeen] = useState(null);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const seen = await SecureStore.getItemAsync('onboardingSeen');
      setOnboardingSeen(seen === 'true');
    } catch {
      setOnboardingSeen(false);
    }
  };

  if (loading || onboardingSeen === null) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="AppointmentForm" component={AppointmentFormScreen} />
            <Stack.Screen name="AppointmentDetail" component={AppointmentDetailScreen} />
            <Stack.Screen name="ClientForm" component={ClientFormScreen} />
            <Stack.Screen name="ClientHistory" component={ClientHistoryScreen} />
            <Stack.Screen name="ServiceForm" component={ServiceFormScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="BusinessHours" component={BusinessHoursScreen} />
            <Stack.Screen name="BusinessSettings" component={BusinessSettingsScreen} />
            <Stack.Screen name="Staff" component={StaffScreen} />
            <Stack.Screen name="Billing" component={BillingScreen} />
            <Stack.Screen name="StaffForm" component={StaffFormScreen} />
            <Stack.Screen name="Promotions" component={PromotionsScreen} />
            <Stack.Screen name="PromotionForm" component={PromotionFormScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="NotificationList" component={NotificationListScreen} />
          </>
        ) : (
          <>
            {!onboardingSeen ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : null}
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={OnboardingScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="PasswordResetSuccess" component={PasswordResetSuccessScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
