import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../context/AppSettingsContext';
import { getTheme } from '../theme';
import { AuthStack } from './AuthStack';
import { ProfileNavigator } from './ProfileNavigator';

export const Routes: React.FC = () => {
  const { user, loading } = useAuth();
  const { darkMode, ready } = useAppSettings();
  const colors = getTheme(darkMode);
  if (loading || !ready) return <View style={[styles.loading, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  return <NavigationContainer key={darkMode ? 'dark' : 'light'}>{user ? <ProfileNavigator profile={user.perfil} /> : <AuthStack />}</NavigationContainer>;
};
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center' } });
