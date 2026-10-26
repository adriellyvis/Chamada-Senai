import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Screen } from '../../components/UI';

export function PlaceholderScreen({
  title,
  subtitle = 'Esta área já está conectada à navegação e será integrada aos endpoints do PreZence na próxima etapa.',
}: {
  title: string;
  subtitle?: string;
}) {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  return (
    <Screen colors={colors} title={title} subtitle="PreZence Mobile">
      <Card colors={colors}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Tela preparada</Text>
        <Text style={[styles.text, { color: colors.textSecondary }]}>{subtitle}</Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 17, fontWeight: '900', marginBottom: 8 },
  text: { fontSize: 14, lineHeight: 21 },
});
