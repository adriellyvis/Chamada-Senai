import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors, colors as defaultColors } from '../../theme/colors';
import { AppIcon } from '../ui/AppIcon';

interface HeaderProps {
  colors?: AppColors;
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export function Header({
  colors = defaultColors,
  title,
  subtitle,
  onBackPress,
  onMenuPress,
  onNotificationPress,
}: HeaderProps) {
  const hasLeadingAction = Boolean(onBackPress || onMenuPress);

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onBackPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={10}
            onPress={onBackPress}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <AppIcon name="arrow-back" size={22} color={colors.textPrimary} />
          </Pressable>
        ) : onMenuPress ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir menu"
            hitSlop={10}
            onPress={onMenuPress}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                opacity: pressed ? 0.65 : 1,
              },
            ]}
          >
            <AppIcon name="menu-outline" size={23} color={colors.textPrimary} />
          </Pressable>
        ) : null}

        <View style={[styles.titleArea, !hasLeadingAction && styles.titleAreaNoAction]}>
          <Text
            numberOfLines={1}
            style={[
              styles.title,
              { color: colors.textPrimary },
            ]}
          >
            {title}
          </Text>

          {subtitle && (
            <Text
              numberOfLines={2}
              style={[
                styles.subtitle,
                { color: colors.textSecondary },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {onNotificationPress && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notificações"
          hitSlop={10}
          onPress={onNotificationPress}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              opacity: pressed ? 0.65 : 1,
            },
          ]}
        >
          <AppIcon name="notifications-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleArea: {
    flex: 1,
    marginLeft: 12,
  },
  titleAreaNoAction: {
    marginLeft: 0,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
