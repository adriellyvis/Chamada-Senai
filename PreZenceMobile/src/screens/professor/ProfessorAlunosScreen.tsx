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
  useRoute,
} from '@react-navigation/native';

import { useAppSettings }
  from '../../context/AppSettingsContext';

import { getTheme }
  from '../../theme';

import {
  Card,
  Pill,
  Screen,
} from '../../components/UI';

import {
  getApiErrorMessage,
} from '../../services/api';

import {
  getProfessorAlunos,
} from '../../services/professorService';

import {
  AlunoProfessor,
} from '../../types/professor';

export const ProfessorAlunosScreen:
React.FC = () => {

  const navigation =
    useNavigation<any>();

  const route =
    useRoute<any>();

  const { darkMode } =
    useAppSettings();

  const colors =
    getTheme(darkMode);

  const turmaId =
    route.params
      ?.turmaId as
      number | undefined;

  const [
    alunos,
    setAlunos,
  ] =
    useState<AlunoProfessor[]>([]);

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

        setAlunos(
          await getProfessorAlunos(
            turmaId
          )
        );

      } catch (error) {

        setErro(
          getApiErrorMessage(error)
        );

      } finally {
        setLoading(false);
      }

    }, [turmaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados =
    useMemo(() => {

      const termo =
        busca
          .trim()
          .toLowerCase();

      if (!termo) {
        return alunos;
      }

      return alunos.filter(
        (aluno) =>
          `${aluno.nome} ${aluno.email} ${aluno.matricula} ${aluno.turma}`
            .toLowerCase()
            .includes(termo)
      );

    }, [alunos, busca]);

  return (
    <Screen
      colors={colors}
      title="ALUNOS"
      subtitle={
        'Acompanhe os alunos das suas turmas.'
      }
      refreshing={loading}
      onRefresh={carregar}
    >
      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder={
          'Buscar nome, RA ou turma'
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
      alunos.length === 0 ? (
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

      {filtrados.map(
        (aluno) => {

          const frequencia =
            Number(
              aluno.frequencia ?? 0
            );

          const tone =
            frequencia >= 75
              ? 'success'
              : frequencia >= 60
                ? 'warning'
                : 'danger';

          return (
            <Card
              colors={colors}
              key={aluno.alunoId}
            >
              <View
                style={
                  styles.top
                }
              >
                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={[
                      styles.nome,
                      {
                        color:
                          colors
                            .textPrimary,
                      },
                    ]}
                  >
                    {aluno.nome}
                  </Text>

                  <Text
                    style={[
                      styles.info,
                      {
                        color:
                          colors
                            .textSecondary,
                      },
                    ]}
                  >
                    {aluno.turma}
                    {' • '}
                    RA{' '}
                    {aluno.matricula}
                  </Text>

                  <Text
                    style={[
                      styles.info,
                      {
                        color:
                          colors
                            .textSecondary,
                      },
                    ]}
                  >
                    {aluno.email}
                  </Text>
                </View>

                <Pill
                  colors={colors}
                  tone={tone}
                >
                  {frequencia
                    .toFixed(1)}
                  %
                </Pill>
              </View>

              <View
                style={
                  styles.actions
                }
              >
                <Pressable
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate(
                        'NotasProfessor',
                        {
                          alunoId:
                            aluno
                              .alunoId,

                          turmaId:
                            aluno
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
                    Notas
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    navigation
                      .getParent()
                      ?.navigate(
                        'OcorrenciasProfessor',
                        {
                          alunoId:
                            aluno
                              .alunoId,
                        }
                      )
                  }
                  style={[
                    styles.button,
                    {
                      borderColor:
                        colors.warning,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        colors.warning,
                      fontWeight: '900',
                    }}
                  >
                    Ocorrência
                  </Text>
                </Pressable>
              </View>
            </Card>
          );
        }
      )}

      {!loading &&
      filtrados.length === 0 ? (
        <Card colors={colors}>
          <Text
            style={{
              color:
                colors.textSecondary,
            }}
          >
            Nenhum aluno encontrado.
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
    },

    top: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },

    nome: {
      fontSize: 16,
      fontWeight: '900',
    },

    info: {
      fontSize: 12,
      marginTop: 4,
    },

    actions: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 14,
    },

    button: {
      flex: 1,
      minHeight: 42,
      borderWidth: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });