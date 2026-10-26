import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '../../theme/colors';
import { AppIcon } from './AppIcon';

interface AccordionSectionProps {
  colors: AppColors;
  title: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
}

export function AccordionSection({
  colors,
  title,
  children,
  initiallyOpen = false,
}: AccordionSectionProps) {
  const [open, setOpen] = useState(initiallyOpen);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(value => !value)}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
          ]}
        >
          {title}
        </Text>

        <AppIcon
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </Pressable>

      {open && (
        <View
          style={[
            styles.content,
            { borderTopColor: colors.border },
          ]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    minHeight: 54,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  content: {
    borderTopWidth: 1,
    padding: 16,
  },
});
