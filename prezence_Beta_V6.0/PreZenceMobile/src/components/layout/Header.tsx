import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '../../theme/colors';

interface HeaderProps {
  colors: AppColors;
  title: string;
  subtitle?: string;
  onMenuPress?: () => void;
  onNotificationPress?: () => void;
}

export function Header({
  colors,
  title,
  subtitle,
  onMenuPress,
  onNotificationPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        {onMenuPress && (
          <Pressable
            onPress={onMenuPress}
            style={[
              styles.iconButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.icon,
                { color: colors.textPrimary },
              ]}
            >
              ☰
            </Text>
          </Pressable>
        )}

        <View style={styles.titleArea}>
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
              numberOfLines={1}
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
          onPress={onNotificationPress}
          style={[
            styles.iconButton,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.icon,
              { color: colors.textPrimary },
            ]}
          >
            ♧
          </Text>
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

  title: {
    fontSize: 21,
    fontWeight: '800',
  },

  subtitle: {
    marginTop: 3,
    fontSize: 12,
  },

  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    fontSize: 19,
    fontWeight: '700',
  },
});