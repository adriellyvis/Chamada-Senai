import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors } from '../../theme/colors';

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({
  label,
  ...props
}: TextFieldProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <TextInput
        {...props}
        style={styles.input}
        placeholderTextColor={colors.textSoft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },

  label: {
    marginBottom: 7,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: colors.textPrimary,
  },
});