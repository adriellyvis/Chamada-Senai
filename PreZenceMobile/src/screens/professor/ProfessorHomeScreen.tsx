import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Pill, Screen } from '../../components/UI';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { getApiErrorMessage } from '../../services/api';
import {
  getDesempenhoTurmas,
  getOcorrenciasProfessor,
  getProfessorDashboard,
} from '../../services/professorService';
import {
  DesempenhoTurma,
  OcorrenciaProfessor,
  ProfessorDashboard,
} from '../../types/professor';

function dataTimestamp(valor?: string | null) {
  if (!valor) return 0;
  const data = new Date(valor).getTime();
  return Number.isNaN(data) ? 0 : data;
}

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return String(valor);
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatarEnum(valor?: string | null) {
  if (!valor) return 'Registro';
  return String(valor)
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) => letra.toUpperCase());
}

function gravidadeTone(valor?: string | null): 'default' | 'success' | 'danger' | 'warning' {
  const gravidade = String(valor ?? '').toUpperCase();
  if (gravidade === 'ALTA') return 'danger';
  if (gravidade === 'MEDIA') return 'warning';
  if (gravidade === 'BAIXA') return 'success';
  return 'default';
}

export const ProfessorHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  const [dashboard, setDashboard] = useState<ProfessorDashboard | null>(null);
  const [desempenho, setDesempenho] = useState<DesempenhoTurma[]>([]);
  const [atividades, setAtividades] = useState<OcorrenciaProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    setErro('');

    const [dashboardResult, desempenhoResult, atividadesResult] = await Promise.allSettled([
      getProfessorDashboard(),
      getDesempenhoTurmas(undefined, 'mes'),
      getOcorrenciasProfessor(),
    ]);

    const erros: string[] = [];

    if (dashboardResult.status === 'fulfilled') {
      setDashboard(dashboardResult.value);
    } else {
      erros.push(getApiErrorMessage(dashboardResult.reason));
    }

    if (desempenhoResult.status === 'fulfilled') {
      setDesempenho(desempenhoResult.value);
    } else {
      erros.push(getApiErrorMessage(desempenhoResult.reason));
    }

    if (atividadesResult.status === 'fulfilled') {
      setAtividades(
        [...atividadesResult.value].sort(
          (a, b) => dataTimestamp(b.dataOcorrencia) - dataTimestamp(a.dataOcorrencia)
        )
      );
    }

    if (erros.length > 0) {
      setErro(erros[0]);
    }

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const nome = user?.nome?.trim().split(/\s+/)[0] ?? 'Professor';

  const turmasOrdenadas = useMemo(
    () =>
      [...desempenho].sort((a, b) => {
        const totalA = Number(a.presencas ?? 0) + Number(a.atrasos ?? 0) + Number(a.faltas ?? 0);
        const totalB = Number(b.presencas ?? 0) + Number(b.atrasos ?? 0) + Number(b.faltas ?? 0);
        const freqA = totalA > 0 ? (Number(a.presencas ?? 0) + Number(a.atrasos ?? 0)) / totalA : 0;
        const freqB = totalB > 0 ? (Number(b.presencas ?? 0) + Number(b.atrasos ?? 0)) / totalB : 0;
        return freqA - freqB;
      }),
    [desempenho]
  );

  if (loading && !dashboard) {
    return (
      <Screen colors={colors}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }}>Carregando painel...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen colors={colors} refreshing={loading} onRefresh={carregar}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Olá, {nome}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Acompanhe suas turmas, chamadas e alunos.
        </Text>
      </View>

      {erro ? (
        <Card colors={colors}>
          <Text style={{ color: colors.warning, fontWeight: '900' }}>
            Parte dos dados não pôde ser atualizada.
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 5 }}>{erro}</Text>
        </Card>
      ) : null}

      <Section colors={colors} title="Resumo" />
      <View style={styles.stats}>
        <StatCard
          colors={colors}
          label="Frequência média"
          value={`${Number(dashboard?.frequenciaMedia ?? 0).toFixed(1)}%`}
          icon="stats-chart-outline"
        />
        <StatCard colors={colors} label="Alunos" value={dashboard?.totalAlunos ?? 0} icon="people-outline" />
        <StatCard colors={colors} label="Turmas" value={dashboard?.totalTurmas ?? 0} icon="business-outline" />
        <StatCard colors={colors} label="Aulas dadas" value={dashboard?.aulasRealizadas ?? 0} icon="calendar-outline" />
      </View>

      <Section colors={colors} title="Acesso rápido" />
      <View style={styles.actions}>
        <Pressable
          onPress={() => navigation.navigate('Chamada')}
          style={[styles.action, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.actionWhite}>Abrir chamada</Text>
        </Pressable>

        <Pressable
          onPress={() => navigation.getParent()?.navigate('NotasProfessor')}
          style={[
            styles.action,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
        >
          <Text style={[styles.actionDark, { color: colors.textPrimary }]}>Lançar notas</Text>
        </Pressable>
      </View>

      <Section colors={colors} title="Desempenho das turmas" />

      {turmasOrdenadas.length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.textSecondary }}>Nenhum dado de desempenho encontrado.</Text>
        </Card>
      ) : (
        turmasOrdenadas.slice(0, 5).map((item) => {
          const presencas = Number(item.presencas ?? 0);
          const atrasos = Number(item.atrasos ?? 0);
          const faltas = Number(item.faltas ?? 0);
          const total = presencas + atrasos + faltas;
          const frequencia = total > 0 ? ((presencas + atrasos) / total) * 100 : 0;

          return (
            <Card colors={colors} key={`${item.turmaId}-${item.turma}`}>
              <View style={styles.spaceBetween}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.turma}</Text>
                <Pill
                  colors={colors}
                  tone={frequencia >= 75 ? 'success' : frequencia >= 60 ? 'warning' : 'danger'}
                >
                  {frequencia.toFixed(1)}%
                </Pill>
              </View>

              <View style={[styles.progressBase, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.progress,
                    {
                      backgroundColor: colors.primary,
                      width: `${Math.min(100, Math.max(0, frequencia))}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.metrics}>
                <Text style={[styles.info, { color: colors.success }]}>Presenças: {presencas}</Text>
                <Text style={[styles.info, { color: colors.warning }]}>Atrasos: {atrasos}</Text>
                <Text style={[styles.info, { color: colors.danger }]}>Faltas: {faltas}</Text>
              </View>
            </Card>
          );
        })
      )}

      <Section colors={colors} title="Atividades recentes" />

      {atividades.length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.textSecondary }}>
            Nenhuma ocorrência ou justificativa recente registrada.
          </Text>
        </Card>
      ) : (
        atividades.slice(0, 5).map((item, index) => (
          <Card colors={colors} key={item.id ?? `${item.alunoId}-${index}`}>
            <View style={styles.spaceBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {item.alunoNome || 'Aluno'}
                </Text>
                <Text style={[styles.info, { color: colors.textSecondary }]}>
                  {item.titulo || formatarEnum(item.tipo)}
                </Text>
              </View>
              <Pill colors={colors} tone={gravidadeTone(item.gravidade)}>
                {formatarEnum(item.tipo)}
              </Pill>
            </View>
            <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
              {item.descricao}
            </Text>
            <Text style={[styles.activityDate, { color: colors.textSoft }]}>
              {formatarData(item.dataOcorrencia)}
            </Text>
          </Card>
        ))
      )}

      <Pressable
        onPress={() => navigation.getParent()?.navigate('OcorrenciasProfessor')}
        style={[
          styles.reportButton,
          { borderColor: colors.primary, backgroundColor: colors.surface },
        ]}
      >
        <Text style={{ color: colors.primary, fontWeight: '900' }}>Ver ocorrências completas</Text>
      </Pressable>

      <Section colors={colors} title="Aulas recentes" />

      {(dashboard?.aulasRecentes ?? []).length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.textSecondary }}>Nenhuma aula recente.</Text>
        </Card>
      ) : (
        (dashboard?.aulasRecentes ?? []).slice(0, 5).map((aula) => (
          <Card colors={colors} key={aula.id}>
            <View style={styles.spaceBetween}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{aula.turma}</Text>
                <Text style={[styles.info, { color: colors.textSecondary }]}>
                  {aula.data} • {aula.horaInicio ?? '—'}
                </Text>
              </View>
              <Pill colors={colors}>{aula.status}</Pill>
            </View>
          </Card>
        ))
      )}

      <Pressable
        onPress={() => navigation.getParent()?.navigate('HistoricoProfessor')}
        style={[
          styles.reportButton,
          { borderColor: colors.primary, backgroundColor: colors.surface },
        ]}
      >
        <Text style={{ color: colors.primary, fontWeight: '900' }}>Ver histórico completo</Text>
      </Pressable>

      {(dashboard?.alunosRisco ?? []).length > 0 ? (
        <>
          <Section colors={colors} title="Alunos que precisam de atenção" />
          {(dashboard?.alunosRisco ?? []).slice(0, 5).map((aluno) => (
            <Pressable
              key={aluno.alunoId}
              onPress={() => navigation.getParent()?.navigate('AlunoDetalheProfessor', { alunoId: aluno.alunoId })}
              style={({ pressed }) => ({ opacity: pressed ? 0.72 : 1 })}
            >
              <Card colors={colors}>
                <View style={styles.spaceBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                      {aluno.nomeAluno}
                    </Text>
                    <Text style={[styles.info, { color: colors.textSecondary }]}>
                      {aluno.turma} • RA {aluno.matricula}
                    </Text>
                  </View>
                  <Pill
                    colors={colors}
                    tone={Number(aluno.frequencia ?? 0) < 60 ? 'danger' : 'warning'}
                  >
                    {Number(aluno.frequencia ?? 0).toFixed(1)}%
                  </Pill>
                </View>
                <Text style={[styles.riskText, { color: colors.warning }]}>
                  {aluno.nivelRisco ? `Risco: ${formatarEnum(aluno.nivelRisco)}` : 'Frequência exige atenção'}
                </Text>
              </Card>
            </Pressable>
          ))}
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  info: {
    fontSize: 12,
    marginTop: 4,
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
  metrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  activityDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 9,
  },
  activityDate: {
    fontSize: 11,
    marginTop: 8,
  },
  reportButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    marginBottom: 4,
  },
  riskText: {
    marginTop: 9,
    fontSize: 12,
    fontWeight: '800',
  },
});
