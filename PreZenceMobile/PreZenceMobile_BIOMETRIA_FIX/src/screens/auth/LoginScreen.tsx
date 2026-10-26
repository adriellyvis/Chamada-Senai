import React, { useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';

import { Screen } from '../../components/layout/Screen';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/TextField';

import { getApiErrorMessage } from '../../services/api';

import { colors } from '../../theme/colors';

type LoginMode = 'RA' | 'EMAIL';

export function LoginScreen() {
  const { signIn } = useAuth();

  const [modo, setModo] =
    useState<LoginMode>('RA');

  const [ra, setRa] = useState('');
  const [digitoRa, setDigitoRa] =
    useState('');
  const [uf, setUf] = useState('');

  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  function somenteNumeros(valor: string) {
    return valor.replace(/\D/g, '');
  }

  async function handleLogin() {
    if (!senha) {
      Alert.alert(
        'Atenção',
        'Informe sua senha.'
      );

      return;
    }

    if (modo === 'RA') {
      if (
        !ra.trim() ||
        !digitoRa.trim() ||
        !uf.trim()
      ) {
        Alert.alert(
          'Atenção',
          'Informe RA, dígito RA, UF e senha.'
        );

        return;
      }

      if (!/^\d{2}$/.test(digitoRa)) {
        Alert.alert(
          'Atenção',
          'O dígito RA deve possuir 2 números. Exemplo: 01.'
        );

        return;
      }
    }

    if (modo === 'EMAIL' && !email.trim()) {
      Alert.alert(
        'Atenção',
        'Informe seu e-mail.'
      );

      return;
    }

    try {
      setLoading(true);

      if (modo === 'RA') {
        await signIn({
          tipo: 'RA',
          ra: ra.trim(),
          digitoRa: digitoRa.trim(),
          uf: uf.trim().toUpperCase(),
          senha,
        });
      } else {
        await signIn({
          tipo: 'EMAIL',
          email: email.trim(),
          senha,
        });
      }
    } catch (error) {
      Alert.alert(
        'Erro ao entrar',
        getApiErrorMessage(error)
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen colors={colors}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <View style={styles.header}>
          <Text style={styles.logo}>
            PreZence
          </Text>

          <Text style={styles.title}>
            Portal de acesso
          </Text>

          <Text style={styles.subtitle}>
            Entre com seus dados para acessar
            o sistema.
          </Text>
        </View>

        <View style={styles.modeContainer}>
          <Pressable
            style={[
              styles.modeButton,
              modo === 'RA' &&
                styles.modeButtonActive,
            ]}
            onPress={() => setModo('RA')}
          >
            <Text
              style={[
                styles.modeText,
                modo === 'RA' &&
                  styles.modeTextActive,
              ]}
            >
              RA
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.modeButton,
              modo === 'EMAIL' &&
                styles.modeButtonActive,
            ]}
            onPress={() =>
              setModo('EMAIL')
            }
          >
            <Text
              style={[
                styles.modeText,
                modo === 'EMAIL' &&
                  styles.modeTextActive,
              ]}
            >
              E-mail
            </Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          {modo === 'RA' ? (
            <>
              <TextField
                label="RA"
                value={ra}
                onChangeText={(value) =>
                  setRa(
                    somenteNumeros(value)
                  )
                }
                placeholder="Digite seu RA"
                keyboardType="numeric"
              />

              <View style={styles.row}>
                <View style={styles.digito}>
                  <TextField
                    label="Dígito"
                    value={digitoRa}
                    onChangeText={(value) =>
                      setDigitoRa(
                        somenteNumeros(
                          value
                        ).slice(0, 2)
                      )
                    }
                    placeholder="01"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.uf}>
                  <TextField
                    label="UF"
                    value={uf}
                    onChangeText={(value) =>
                      setUf(
                        value
                          .replace(
                            /[^a-zA-Z]/g,
                            ''
                          )
                          .toUpperCase()
                          .slice(0, 2)
                      )
                    }
                    placeholder="SP"
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </>
          ) : (
            <TextField
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="Digite seu e-mail"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          )}

          <TextField
            label="Senha"
            value={senha}
            onChangeText={setSenha}
            placeholder="Digite sua senha"
            secureTextEntry
            autoCapitalize="none"
          />

          <Button
            title="Entrar no portal"
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
    paddingVertical: 32,
  },

  header: {
    marginBottom: 30,
  },

  logo: {
    fontSize: 34,
    fontWeight: '900',
    color: colors.primary,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  modeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight,
    borderRadius: 14,
    padding: 4,
    marginBottom: 22,
  },

  modeButton: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },

  modeButtonActive: {
    backgroundColor: colors.primary,
  },

  modeText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },

  modeTextActive: {
    color: colors.white,
  },

  form: {
    gap: 16,
  },

  row: {
    flexDirection: 'row',
    gap: 12,
  },

  digito: {
    flex: 1,
  },

  uf: {
    flex: 1,
  },
});

export default LoginScreen;