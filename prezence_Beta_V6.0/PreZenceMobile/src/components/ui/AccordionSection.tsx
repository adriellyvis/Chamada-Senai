import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { AppColors } from '../../theme/colors';

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
        onPress={() => setOpen(value => !value)}
        style={styles.header}
      >
        <Text
          style={[
            styles.title,
            { color: colors.textPrimary },
          ]}
        >
          {title}
        </Text>

        <Text
          style={[
            styles.arrow,
            { color: colors.textSecondary },
          ]}
        >
          {open ? '⌃' : '⌄'}
        </Text>
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

  title: {
    fontSize: 14,
    fontWeight: '800',
  },

  arrow: {
    fontSize: 20,
    fontWeight: '700',
  },

  content: {
    borderTopWidth: 1,
    padding: 16,
  },
});