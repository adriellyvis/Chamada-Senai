import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '../../theme/colors';

interface SectionProps {
  colors: AppColors;
  title: string;
  action?: string;
  onAction?: () => void;
}

export function Section({
  colors,
  title,
  action,
  onAction,
}: SectionProps) {
  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.title,
          { color: colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      {action && onAction && (
        <Pressable onPress={onAction}>
          <Text
            style={[
              styles.action,
              { color: colors.primary },
            ]}
          >
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },

  title: {
    fontSize: 16,
    fontWeight: '800',
  },

  action: {
    fontSize: 12,
    fontWeight: '800',
  },
});