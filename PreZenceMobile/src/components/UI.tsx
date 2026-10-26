import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { AppColors } from '../theme/colors';
import { AppIcon, AppIconName } from './ui/AppIcon';
import { Card } from './ui/Card';
import { Screen } from './layout/Screen';

export { Card, Screen };

export function Icon({
  name,
  glyph,
  color,
  size = 18,
}: {
  name?: AppIconName;
  glyph?: string;
  color?: string;
  size?: number;
}) {
  return <AppIcon name={name} glyph={glyph} color={color} size={size} />;
}

export function initials(name?: string | null): string {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'PZ';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Row({
  colors,
  children,
  style,
}: {
  colors: AppColors;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.row, { borderBottomColor: colors.border }, style]}>
      {children}
    </View>
  );
}

export function Pill({
  colors,
  children,
  tone = 'default',
}: {
  colors: AppColors;
  children: React.ReactNode;
  tone?: 'default' | 'success' | 'danger' | 'warning';
}) {
  const toneColor =
    tone === 'success' ? colors.success :
    tone === 'danger' ? colors.danger :
    tone === 'warning' ? colors.warning :
    colors.primary;

  return (
    <View style={[styles.pill, { borderColor: toneColor }]}>
      <Text style={[styles.pillText, { color: toneColor }]}>{children}</Text>
    </View>
  );
}

export function PrimaryButton({
  colors,
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
}: {
  colors: AppColors;
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}) {
  const isOutline = variant === 'outline';
  const mainColor = variant === 'danger' ? colors.danger : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isOutline ? 'transparent' : mainColor,
          borderColor: mainColor,
          opacity: disabled || loading ? 0.55 : pressed ? 0.75 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isOutline ? mainColor : colors.white} />
      ) : (
        <Text style={[styles.buttonText, { color: isOutline ? mainColor : colors.white }]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 54,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  pill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  button: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
