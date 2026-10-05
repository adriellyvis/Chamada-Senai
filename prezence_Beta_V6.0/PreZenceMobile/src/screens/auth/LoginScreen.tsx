import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';
import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';
import { colors } from '../../theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();

  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!login.trim() || !senha) {
      Alert.alert(
        'Atenção',
        'Preencha o e-mail e a senha.'
      );
      return;
    }

    try {
      setLoading(true);

      await signIn({
        login: login.trim(),
        senha,
      });

    } catch (error: any) {
      console.error('Erro no login:', error);

      const message =
        error?.response?.data?.message ||
        error?.response?.data?.erro ||
        error?.message ||
        'Não foi possível realizar o login.';

      Alert.alert('Erro ao entrar', message);

    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen colors={colors}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>PreZence</Text>

          <Text style={styles.title}>
            Bem-vindo!
          </Text>

          <Text style={styles.subtitle}>
            Entre com seus dados para acessar o sistema.
          </Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="E-mail"
            value={login}
            onChangeText={setLogin}
            placeholder="Digite seu e-mail"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />

          <TextField
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Entrar"
            onPress={handleLogin}
            loading={loading}
          />
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 40,
  },

  header: {
    marginBottom: 36,
  },

  logo: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 28,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  form: {
    gap: 18,
  },
});