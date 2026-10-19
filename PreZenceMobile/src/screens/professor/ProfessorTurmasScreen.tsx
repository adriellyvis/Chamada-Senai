import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  useNavigation,
} from '@react-navigation/native';

import { useAppSettings }
  from '../../context/AppSettingsContext';

import { getTheme }
  from '../../theme';

import {
  Card,
  Screen,
} from '../../components/UI';

import {
  getApiErrorMessage,
} from '../../services/api';

import {
  getProfessorTurmas,
} from '../../services/professorService';

import {
  TurmaProfessor,
} from '../../types/professor';

export const ProfessorTurmasScreen:
React.FC = () => {

  const navigation =
    useNavigation<any>();

  const { darkMode } =
    useAppSettings();

  const colors =
    getTheme(darkMode);

  const [
    turmas,
    setTurmas,
  ] =
    useState<TurmaProfessor[]>([]);

  const [busca, setBusca] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const carregar =
    useCallback(async () => {

      try {
        setLoading(true);
        setErro('');

        setTurmas(
          await getProfessorTurmas()
        );

      } catch (error) {

        setErro(
          getApiErrorMessage(error)
        );

      } finally {
        setLoading(false);
      }

    }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas =
    useMemo(() => {

      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return turmas;
      }

      return turmas.filter(
        (item) =>
          `${item.nomeTurma} ${item.disciplina} ${item.sala ?? ''}`
            .toLowerCase()
            .includes(termo)
      );

    }, [busca, turmas]);

  return (
    <Screen
      colors={colors}
      title="TURMAS"
      subtitle={
        'Turmas e disciplinas vinculadas a você.'
      }
      refreshing={loading}
      onRefresh={carregar}
    >
      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder={
          'Buscar turma ou disciplina'
        }
        placeholderTextColor={
          colors.textSoft
        }
        style={[
          styles.search,
          {
            color:
              colors.textPrimary,

            backgroundColor:
              colors.surface,

            borderColor:
              colors.border,
          },
        ]}
      />

      {loading &&
      turmas.length === 0 ? (
        <ActivityIndicator
          color={colors.primary}
        />
      ) : null}

      {erro ? (
        <Text
          style={{
            color:
              colors.danger,
            marginBottom: 12,
          }}
        >
          {erro}
        </Text>
      ) : null}

      {filtradas.map(
        (turma) => (
          <Card
            colors={colors}
            key={
              turma.turmaDisciplinaId
            }
          >
            <Text
              style={[
                styles.title,
                {
                  color:
                    colors
                      .textPrimary,
                },
              ]}
            >
              {turma.nomeTurma}
            </Text>

            <Text
              style={{
                color:
                  colors.primary,
                fontWeight: '800',
                marginTop: 4,
              }}
            >
              {turma.disciplina}
            </Text>

            <View
              style={
                styles.infoRow
              }
            >
              <Text
                style={{
                  color:
                    colors
                      .textSecondary,
                }}
              >
                Alunos:{' '}
                {turma.totalAlunos
                  ?? 0}
              </Text>

              <Text
                style={{
                  color:
                    colors
                      .textSecondary,
                }}
              >
                Sala:{' '}
                {turma.sala
                  || '—'}
              </Text>
            </View>

            <View
              style={
                styles.actions
              }
            >
              <Pressable
                onPress={() =>
                  navigation.navigate(
                    'Alunos',
                    {
                      turmaId:
                        turma
                          .turmaId,
                    }
                  )
                }
                style={[
                  styles.button,
                  {
                    borderColor:
                      colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      colors.primary,
                    fontWeight: '900',
                  }}
                >
                  Ver alunos
                </Text>
              </Pressable>

              <Pressable
                onPress={() =>
                  navigation.navigate(
                    'Chamada',
                    {
                      turmaDisciplinaId:
                        turma
                          .turmaDisciplinaId,
                    }
                  )
                }
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      colors.primary,

                    borderColor:
                      colors.primary,
                  },
                ]}
              >
                <Text
                  style={{
                    color:
                      colors.white,
                    fontWeight: '900',
                  }}
                >
                  Abrir chamada
                </Text>
              </Pressable>
            </View>
          </Card>
        )
      )}

      {!loading &&
      filtradas.length === 0 ? (
        <Card colors={colors}>
          <Text
            style={{
              color:
                colors.textSecondary,
            }}
          >
            Nenhuma turma encontrada.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
};

const styles =
  StyleSheet.create({
    search: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      marginBottom: 14,
      fontSize: 14,
    },

    title: {
      fontSize: 17,
      fontWeight: '900',
    },

    infoRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      marginTop: 12,
    },

    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    button: {
      flex: 1,
      minHeight: 44,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });