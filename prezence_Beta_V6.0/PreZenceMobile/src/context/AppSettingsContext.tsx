import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Settings = {
  darkMode: boolean;
  paginaInicial: string;
  notificacoesFrequencia: boolean;
  notificacoesChamada: boolean;
  confirmarSaida: boolean;
};

const STORAGE_KEY = '@prezence:settings';
const DEFAULTS: Settings = {
  darkMode: false,
  paginaInicial: 'dashboard',
  notificacoesFrequencia: true,
  notificacoesChamada: true,
  confirmarSaida: true,
};

interface AppSettingsContextValue extends Settings {
  ready: boolean;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

const Context = createContext<AppSettingsContextValue | undefined>(undefined);

export const AppSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
      } catch {
        setSettings(DEFAULTS);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const updateSettings = useCallback(async (patch: Partial<Settings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetSettings = useCallback(async () => {
    setSettings(DEFAULTS);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULTS));
  }, []);

  const value = useMemo(() => ({ ...settings, ready, updateSettings, resetSettings }), [settings, ready, updateSettings, resetSettings]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export function useAppSettings(): AppSettingsContextValue {
  const value = useContext(Context);
  if (!value) throw new Error('useAppSettings deve ser usado dentro de AppSettingsProvider.');
  return value;
}
