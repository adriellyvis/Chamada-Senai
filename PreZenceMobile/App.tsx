import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { AppSettingsProvider, useAppSettings } from './src/context/AppSettingsContext';
import { Routes } from './src/navigation/Routes';

function AppInner() {
  const { darkMode } = useAppSettings();
  return <><StatusBar style={darkMode ? 'light' : 'dark'} /><Routes /></>;
}

export default function App() {
  return <SafeAreaProvider><AppSettingsProvider><AuthProvider><AppInner /></AuthProvider></AppSettingsProvider></SafeAreaProvider>;
}
