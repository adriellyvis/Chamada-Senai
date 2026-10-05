import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '../../theme/colors';

interface StatCardProps {
  colors: AppColors;
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
}

export function StatCard({
  colors,
  label,
  value,
  hint,
  icon,
}: StatCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: colors.primaryLight,
            },
          ]}
        >
          <Text
            style={[
              styles.icon,
              { color: colors.primaryStrong },
            ]}
          >
            {icon}
          </Text>
        </View>
      )}

      <Text
        style={[
          styles.value,
          { color: colors.textPrimary },
        ]}
      >
        {value}
      </Text>

      <Text
        style={[
          styles.label,
          { color: colors.textSecondary },
        ]}
      >
        {label}
      </Text>

      {hint && (
        <Text
          style={[
            styles.hint,
            { color: colors.textSoft },
          ]}
        >
          {hint}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 0,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
  },

  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  icon: {
    fontSize: 17,
    fontWeight: '800',
  },

  value: {
    fontSize: 23,
    fontWeight: '800',
  },

  label: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },

  hint: {
    marginTop: 4,
    fontSize: 11,
  },
});