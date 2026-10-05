import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { theme } from '../theme';
import { ProfileTabParamList } from '../types/navigation';

const Tab = createBottomTabNavigator<ProfileTabParamList>();

/** Cria o navegador de abas de um perfil; cada perfil informa apenas a sua tela inicial. */
export function createProfileTabs(HomeScreen: React.ComponentType): React.FC {
  const ProfileTabs: React.FC = () => (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
      }}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
    </Tab.Navigator>
  );
  return ProfileTabs;
}
