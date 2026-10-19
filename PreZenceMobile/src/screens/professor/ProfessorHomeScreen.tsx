import React, {
  useCallback,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native';

import { useAuth }
  from '../../contexts/AuthContext';

import { useAppSettings }
  from '../../context/AppSettingsContext';

import { getTheme }
  from '../../theme';

import {
  Card,
  Screen,
} from '../../components/UI';

import { StatCard }
  from '../../components/ui/StatCard';

import { Section }
  from '../../components/ui/Section';

import {
  getApiErrorMessage,
} from '../../services/api';

import {
  getDesempenhoTurmas,
  getProfessorDashboard,
} from '../../services/professorService';

import {
  DesempenhoTurma,
  ProfessorDashboard,
} from '../../types/professor';

export const ProfessorHomeScreen:
React.FC = () => {

  const navigation =
    useNavigation<any>();

  const { user } = useAuth();

  const { darkMode } =
    useAppSettings();

  const colors =
    getTheme(darkMode);

  const [
    dashboard,
    setDashboard,
  ] =
    useState<
      ProfessorDashboard | null
    >(null);

  const [
    desempenho,
    setDesempenho,
  ] =
    useState<DesempenhoTurma[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] =
    useState('');

  const carregar =
  useCallback(async () => {
    try {
      setLoading(true);
      setErro('');

      const [
        dashboardData,
        desempenhoData,
      ] =
        await Promise.all([
          getProfessorDashboard(),

          getDesempenhoTurmas(
            undefined,
            'mes'
          ),
        ]);

      setDashboard(
        dashboardData
      );

      setDesempenho(
        desempenhoData
      );

    } catch (error) {

      setErro(
        getApiErrorMessage(error)
      );

    } finally {
      setLoading(false);
    }

  }, []);

useFocusEffect(
  useCallback(() => {
    carregar();
  }, [carregar])
);

  if (
    loading &&
    !dashboard
  ) {
    return (
      <Screen colors={colors}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text
            style={{
              color:
                colors.textSecondary,
            }}
          >
            Carregando painel...
          </Text>
        </View>
      </Screen>
    );
  }

  const nome =
    user?.nome
      ?.trim()
      .split(/\s+/)[0]
      ?? 'Professor';

  return (
    <Screen
      colors={colors}
      refreshing={loading}
      onRefresh={carregar}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color:
                colors.textPrimary,
            },
          ]}
        >
          Olá, {nome}
        </Text>

        <Text
          style={[
            styles.subtitle,
            {
              color:
                colors.textSecondary,
            },
          ]}
        >
          Resumo das suas turmas
          e aulas
        </Text>
      </View>

      {erro ? (
        <Card colors={colors}>
          <Text
            style={{
              color:
                colors.danger,
              fontWeight: '800',
            }}
          >
            Dados temporariamente
            indisponíveis.
          </Text>

          <Text
            style={{
              color:
                colors.textSecondary,
              marginTop: 5,
            }}
          >
            {erro}
          </Text>
        </Card>
      ) : null}

      <Section
        colors={colors}
        title="Resumo"
      />

      <View
        style={styles.stats}
      >
        <StatCard
          colors={colors}
          label="Frequência média"
          value={
            `${Number(
              dashboard
                ?.frequenciaMedia
                ?? 0
            ).toFixed(1)}%`
          }
        />

        <StatCard
          colors={colors}
          label="Alunos"
          value={
            dashboard
              ?.totalAlunos
              ?? 0
          }
        />

        <StatCard
          colors={colors}
          label="Turmas"
          value={
            dashboard
              ?.totalTurmas
              ?? 0
          }
        />

        <StatCard
          colors={colors}
          label="Aulas dadas"
          value={
            dashboard
              ?.aulasRealizadas
              ?? 0
          }
        />
      </View>

      <Section
        colors={colors}
        title="Acesso rápido"
      />

      <View
        style={styles.actions}
      >
        <Pressable
          onPress={() =>
            navigation.navigate(
              'Chamada'
            )
          }
          style={[
            styles.action,
            {
              backgroundColor:
                colors.primary,
            },
          ]}
        >
          <Text
            style={styles.actionWhite}
          >
            Abrir chamada
          </Text>
        </Pressable>

        <Pressable
          onPress={() =>
            navigation
              .getParent()
              ?.navigate(
                'NotasProfessor'
              )
          }
          style={[
            styles.action,
            {
              backgroundColor:
                colors.surface,
              borderColor:
                colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              styles.actionDark,
              {
                color:
                  colors.textPrimary,
              },
            ]}
          >
            Lançar notas
          </Text>
        </Pressable>
      </View>

      <Section
        colors={colors}
        title="Desempenho das turmas"
      />

      {desempenho.length === 0 ? (
        <Card colors={colors}>
          <Text
            style={{
              color:
                colors.textSecondary,
            }}
          >
            Nenhum dado encontrado.
          </Text>
        </Card>
      ) : (
        desempenho
          .slice(0, 5)
          .map((item) => {

            const total =
              Number(
                item.presencas ?? 0
              )
              +
              Number(
                item.atrasos ?? 0
              )
              +
              Number(
                item.faltas ?? 0
              );

            const frequencia =
              total > 0
                ? (
                    (
                      Number(
                        item.presencas
                          ?? 0
                      )
                      +
                      Number(
                        item.atrasos
                          ?? 0
                      )
                    )
                    /
                    total
                  ) * 100
                : 0;

            return (
              <Card
                colors={colors}
                key={
                  `${item.turmaId}-${item.turma}`
                }
              >
                <View
                  style={
                    styles.spaceBetween
                  }
                >
                  <Text
                    style={[
                      styles.cardTitle,
                      {
                        color:
                          colors
                            .textPrimary,
                      },
                    ]}
                  >
                    {item.turma}
                  </Text>

                  <Text
                    style={{
                      color:
                        colors.primary,
                      fontWeight: '900',
                    }}
                  >
                    {frequencia
                      .toFixed(1)}
                    %
                  </Text>
                </View>

                <View
                  style={[
                    styles.progressBase,
                    {
                      backgroundColor:
                        colors.border,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.progress,
                      {
                        backgroundColor:
                          colors.primary,

                        width:
                          `${Math.min(
                            100,
                            Math.max(
                              0,
                              frequencia
                            )
                          )}%`,
                      },
                    ]}
                  />
                </View>

                <View
                  style={
                    styles.spaceBetween
                  }
                >
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
                    Presenças:{' '}
                    {item.presencas}
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
                    Faltas:{' '}
                    {item.faltas}
                  </Text>
                </View>
              </Card>
            );
          })
      )}

      <Section
        colors={colors}
        title="Aulas recentes"
      />

      {(
        dashboard
          ?.aulasRecentes
        ?? []
      ).length === 0 ? (
        <Card colors={colors}>
          <Text
            style={{
              color:
                colors.textSecondary,
            }}
          >
            Nenhuma aula recente.
          </Text>
        </Card>
      ) : (
        (
          dashboard
            ?.aulasRecentes
          ?? []
        )
          .slice(0, 5)
          .map((aula) => (
            <Card
              colors={colors}
              key={aula.id}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color:
                      colors
                        .textPrimary,
                  },
                ]}
              >
                {aula.turma}
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
                {aula.data}
                {' • '}
                {aula.horaInicio
                  ?? '—'}
              </Text>

              <Text
                style={{
                  marginTop: 7,
                  color:
                    colors.primary,
                  fontWeight: '800',
                }}
              >
                {aula.status}
              </Text>
            </Card>
          ))
      )}

      {(
        dashboard
          ?.alunosRisco
        ?? []
      ).length > 0 && (
        <>
          <Section
            colors={colors}
            title={
              'Alunos que precisam de atenção'
            }
          />

          {(
            dashboard
              ?.alunosRisco
            ?? []
          )
            .slice(0, 5)
            .map((aluno) => (
              <Card
                colors={colors}
                key={aluno.alunoId}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color:
                        colors
                          .textPrimary,
                    },
                  ]}
                >
                  {aluno.nomeAluno}
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
                  RA {aluno.matricula}
                </Text>

                <Text
                  style={{
                    color:
                      colors.warning,
                    marginTop: 8,
                    fontWeight: '900',
                  }}
                >
                  Frequência:{' '}
                  {Number(
                    aluno.frequencia
                      ?? 0
                  ).toFixed(1)}
                  %
                </Text>
              </Card>
            ))}
        </>
      )}
    </Screen>
  );
};

const styles =
  StyleSheet.create({
    loading: {
      minHeight: 450,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },

    header: {
      marginBottom: 18,
    },

    title: {
      fontSize: 25,
      fontWeight: '900',
    },

    subtitle: {
      fontSize: 13,
      marginTop: 5,
    },

    stats: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 10,
    },

    actions: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },

    action: {
      flex: 1,
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 8,
    },

    actionWhite: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
    },

    actionDark: {
      fontSize: 13,
      fontWeight: '900',
    },

    spaceBetween: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      gap: 10,
    },

    cardTitle: {
      fontSize: 15,
      fontWeight: '900',
    },

    info: {
      fontSize: 12,
      marginTop: 6,
    },

    progressBase: {
      height: 9,
      borderRadius: 999,
      overflow: 'hidden',
      marginVertical: 12,
    },

    progress: {
      height: '100%',
      borderRadius: 999,
    },
  });