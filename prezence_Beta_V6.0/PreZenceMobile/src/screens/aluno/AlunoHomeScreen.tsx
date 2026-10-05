import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAuth } from '../../contexts/AuthContext';

import { Screen } from '../../components/layout/Screen';
import { Header } from '../../components/layout/Header';

import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Section } from '../../components/ui/Section';
import { AccordionSection } from '../../components/ui/AccordionSection';

import {
  getDashboard,
  getDesempenhoDisciplinas,
  getAgenda,
  getAvisos,
} from '../../services/alunoService';

import {
  AlunoDashboard,
  AlunoDesempenhoDisciplina,
  HorarioAula,
  Aviso,
} from '../../types/aluno';

import { colors } from '../../theme/colors';

export function AlunoHomeScreen() {
  const { user } = useAuth();

  const [dashboard, setDashboard] =
    useState<AlunoDashboard | null>(null);

  const [disciplinas, setDisciplinas] =
    useState<AlunoDesempenhoDisciplina[]>([]);

  const [agenda, setAgenda] =
    useState<HorarioAula[]>([]);

  const [avisos, setAvisos] =
    useState<Aviso[]>([]);

  const [loading, setLoading] = useState(true);

  const carregarDados = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const [
        dashboardData,
        disciplinasData,
        agendaData,
        avisosData,
      ] = await Promise.all([
        getDashboard(user.id),
        getDesempenhoDisciplinas(user.id),
        getAgenda(),
        getAvisos(user.id),
      ]);

      setDashboard(dashboardData);
      setDisciplinas(disciplinasData);
      setAgenda(agendaData);
      setAvisos(avisosData);

    } catch (error) {
      console.error(
        'Erro ao carregar dashboard do aluno:',
        error
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (loading && !dashboard) {
    return (
      <Screen colors={colors}>
        <View style={styles.loading}>
          <ActivityIndicator
            size="large"
            color={colors.primary}
          />

          <Text style={styles.loadingText}>
            Carregando seus dados...
          </Text>
        </View>
      </Screen>
    );
  }

  if (!dashboard) {
    return (
      <Screen colors={colors}>
        <Header
          title="Início"
          subtitle="Área do aluno"
        />

        <Card>
          <Text style={styles.errorTitle}>
            Não foi possível carregar seus dados.
          </Text>

          <Text style={styles.errorText}>
            Verifique sua conexão e tente novamente.
          </Text>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen
      colors={colors}
      refreshing={loading}
      onRefresh={carregarDados}
    >
      <Header
        title={`Olá, ${dashboard.nome}`}
        subtitle={`${dashboard.turma} • ${dashboard.matricula}`}
      />

      {/* RESUMO */}
      <Section title="Resumo" />

      <View style={styles.statsGrid}>
        <StatCard
          label="Frequência"
          value={`${dashboard.frequencia.toFixed(1)}%`}
        />

        <StatCard
          label="Faltas"
          value={String(dashboard.faltas)}
        />

        <StatCard
          label="Presenças"
          value={String(dashboard.presencas)}
        />

        <StatCard
          label="Atrasos"
          value={String(dashboard.atrasos)}
        />
      </View>

      {/* FREQUÊNCIA */}
      <Section title="Frequência" />

      <Card>
        <View style={styles.frequencyHeader}>
          <Text style={styles.frequencyTitle}>
            Aproveitamento geral
          </Text>

          <Text style={styles.frequencyValue}>
            {dashboard.frequencia.toFixed(1)}%
          </Text>
        </View>

        <View style={styles.progressBackground}>
          <View
            style={[
              styles.progress,
              {
                width: `${Math.min(
                  Math.max(dashboard.frequencia, 0),
                  100
                )}%`,
              },
            ]}
          />
        </View>

        <View style={styles.frequencyDetails}>
          <Text style={styles.detailText}>
            {dashboard.aulasAssistidas} aulas assistidas
          </Text>

          <Text style={styles.detailText}>
            {dashboard.totalAulas} aulas no total
          </Text>
        </View>
      </Card>

      {/* AGENDA */}
      <AccordionSection
        title="Próximas aulas"
        initiallyOpen
      >
        {agenda.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma aula encontrada.
          </Text>
        ) : (
          agenda.slice(0, 5).map((aula) => (
            <Card key={aula.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                {aula.disciplina}
              </Text>

              <Text style={styles.itemText}>
                {aula.diaSemana} • {aula.horaInicio}
                {' - '}
                {aula.horaFim}
              </Text>

              <Text style={styles.itemText}>
                Professor: {aula.professor}
              </Text>

              {aula.sala ? (
                <Text style={styles.itemText}>
                  Sala: {aula.sala}
                </Text>
              ) : null}
            </Card>
          ))
        )}
      </AccordionSection>

      {/* DISCIPLINAS */}
      <AccordionSection title="Disciplinas">
        {disciplinas.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhuma disciplina encontrada.
          </Text>
        ) : (
          disciplinas.map((disciplina) => (
            <Card
              key={disciplina.disciplina}
              style={styles.itemCard}
            >
              <View style={styles.disciplineHeader}>
                <Text style={styles.itemTitle}>
                  {disciplina.disciplina}
                </Text>

                <Text style={styles.disciplineFrequency}>
                  {disciplina.frequencia.toFixed(1)}%
                </Text>
              </View>

              <Text style={styles.itemText}>
                Presenças: {disciplina.presencas}
              </Text>

              <Text style={styles.itemText}>
                Faltas: {disciplina.faltas}
              </Text>

              <Text style={styles.itemText}>
                Atrasos: {disciplina.atrasos}
              </Text>
            </Card>
          ))
        )}
      </AccordionSection>

      {/* AVISOS */}
      <AccordionSection title="Avisos">
        {avisos.length === 0 ? (
          <Text style={styles.emptyText}>
            Você não possui avisos.
          </Text>
        ) : (
          avisos.slice(0, 5).map((aviso) => (
            <Card
              key={aviso.id}
              style={styles.itemCard}
            >
              <Text style={styles.itemTitle}>
                {aviso.titulo}
              </Text>

              <Text style={styles.itemText}>
                {aviso.mensagem}
              </Text>

              <Text style={styles.noticeAuthor}>
                {aviso.autorNome}
              </Text>
            </Card>
          ))
        )}
      </AccordionSection>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },

  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },

  errorText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },

  frequencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  frequencyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  frequencyValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  progressBackground: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },

  progress: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
  },

  frequencyDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },

  detailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  itemCard: {
    marginBottom: 10,
  },

  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 6,
  },

  itemText: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  noticeAuthor: {
    fontSize: 12,
    color: colors.textSoft,
    marginTop: 10,
  },

  disciplineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  disciplineFrequency: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },

  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingVertical: 8,
  },
});