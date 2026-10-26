import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { Card, Pill, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { getApiErrorMessage } from '../../services/api';
import {
  getNotasAlunoProfessor,
  getOcorrenciasProfessor,
  getPresencasRecentesAlunoProfessor,
  getProfessorAlunos,
} from '../../services/professorService';
import {
  AlunoProfessor,
  HistoricoPresencaAlunoProfessor,
  NotaProfessor,
  OcorrenciaProfessor,
} from '../../types/professor';

function normalizarStatus(valor?: string | null) {
  return String(valor ?? '').trim().toUpperCase().replace(/-/g, '_');
}

function statusTone(valor?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  const status = normalizarStatus(valor);
  if (status === 'PRESENTE') return 'success';
  if (status === 'ATRASADO' || status === 'SAIDA_TEMPORARIA') return 'warning';
  if (status === 'AUSENTE' || status === 'FALTA') return 'danger';
  return 'default';
}

function statusLabel(valor?: string | null) {
  const status = normalizarStatus(valor);
  if (status === 'PRESENTE') return 'Presente';
  if (status === 'ATRASADO') return 'Atrasado';
  if (status === 'AUSENTE' || status === 'FALTA') return 'Ausente';
  if (status === 'SAIDA_TEMPORARIA') return 'Saída temporária';
  return valor || 'Sem registro';
}

function gravidadeTone(valor?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  const gravidade = normalizarStatus(valor);
  if (gravidade === 'ALTA' || gravidade === 'CRITICA') return 'danger';
  if (gravidade === 'MEDIA') return 'warning';
  if (gravidade === 'BAIXA') return 'success';
  return 'default';
}

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const data = new Date(valor);
  if (!Number.isNaN(data.getTime())) {
    return data.toLocaleDateString('pt-BR');
  }
  const trecho = String(valor).slice(0, 10);
  const [ano, mes, dia] = trecho.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : trecho;
}

function formatarHora(valor?: string | null) {
  if (!valor) return '';
  const texto = String(valor);
  const parte = texto.includes('T') ? texto.split('T')[1] : texto;
  return parte?.slice(0, 5) || '';
}

function percentualNota(nota: NotaProfessor) {
  const maxima = Number(nota.notaMaxima ?? 0);
  if (maxima <= 0) return 0;
  return Math.max(0, Math.min(100, (Number(nota.nota ?? 0) / maxima) * 100));
}

export const ProfessorStudentDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  const alunoId = Number(route.params?.alunoId ?? 0);
  const alunoInicial = route.params?.aluno as AlunoProfessor | undefined;

  const [aluno, setAluno] = useState<AlunoProfessor | null>(alunoInicial ?? null);
  const [notas, setNotas] = useState<NotaProfessor[]>([]);
  const [presencas, setPresencas] = useState<HistoricoPresencaAlunoProfessor[]>([]);
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaProfessor[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [avisosParciais, setAvisosParciais] = useState<string[]>([]);

  const carregar = useCallback(async () => {
    if (!alunoId) {
      setErro('Aluno não identificado.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErro('');
      setAvisosParciais([]);

      let alvo = alunoInicial ?? null;
      if (!alvo || !alvo.turmaId) {
        const lista = await getProfessorAlunos();
        alvo = lista.find((item) => Number(item.alunoId) === alunoId) ?? null;
      }

      if (!alvo) {
        throw new Error('O aluno não foi encontrado entre as suas turmas.');
      }

      setAluno(alvo);

      const [notasResult, presencasResult, ocorrenciasResult] = await Promise.allSettled([
        getNotasAlunoProfessor(alunoId, Number(alvo.turmaId)),
        getPresencasRecentesAlunoProfessor(alunoId, alvo.turma, 10),
        getOcorrenciasProfessor(),
      ]);

      const avisos: string[] = [];

      if (notasResult.status === 'fulfilled') {
        setNotas(notasResult.value);
      } else {
        setNotas([]);
        avisos.push(`Notas: ${getApiErrorMessage(notasResult.reason)}`);
      }

      if (presencasResult.status === 'fulfilled') {
        setPresencas(presencasResult.value);
      } else {
        setPresencas([]);
        avisos.push(`Presenças: ${getApiErrorMessage(presencasResult.reason)}`);
      }

      if (ocorrenciasResult.status === 'fulfilled') {
        setOcorrencias(
          ocorrenciasResult.value
            .filter((item) => Number(item.alunoId) === alunoId)
            .sort((a, b) => String(b.dataOcorrencia ?? '').localeCompare(String(a.dataOcorrencia ?? '')))
        );
      } else {
        setOcorrencias([]);
        avisos.push(`Ocorrências: ${getApiErrorMessage(ocorrenciasResult.reason)}`);
      }

      setAvisosParciais(avisos);
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [alunoId, alunoInicial]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const frequencia = Number(aluno?.frequencia ?? 0);
  const riscoTone: 'success' | 'warning' | 'danger' = frequencia >= 75 ? 'success' : frequencia >= 60 ? 'warning' : 'danger';
  const riscoLabel = frequencia >= 75 ? 'Regular' : frequencia >= 60 ? 'Atenção' : 'Risco crítico';

  const mediaNotas = useMemo(() => {
    if (!notas.length) return null;
    return notas.reduce((soma, nota) => soma + percentualNota(nota), 0) / notas.length;
  }, [notas]);

  const resumoPresencas = useMemo(() => {
    return presencas.reduce(
      (acc, item) => {
        const status = normalizarStatus(item.status);
        if (status === 'PRESENTE') acc.presentes += 1;
        else if (status === 'ATRASADO') acc.atrasos += 1;
        else if (status === 'AUSENTE' || status === 'FALTA') acc.ausentes += 1;
        return acc;
      },
      { presentes: 0, atrasos: 0, ausentes: 0 }
    );
  }, [presencas]);

  if (loading && !aluno) {
    return (
      <Screen colors={colors} title="SITUAÇÃO DO ALUNO">
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary }}>Carregando acompanhamento...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      colors={colors}
      title="SITUAÇÃO DO ALUNO"
      subtitle="Notas, frequência, presenças e ocorrências em um só lugar."
      refreshing={loading}
      onRefresh={carregar}
    >
      {erro ? (
        <Card colors={colors}>
          <Text style={{ color: colors.danger, fontWeight: '900' }}>{erro}</Text>
        </Card>
      ) : null}

      {aluno ? (
        <>
          <Card colors={colors}>
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nome, { color: colors.textPrimary }]}>{aluno.nome}</Text>
                <Text style={[styles.info, { color: colors.textSecondary }]}>
                  {aluno.turma} • RA {aluno.matricula}
                </Text>
                <Text style={[styles.info, { color: colors.textSecondary }]}>{aluno.email}</Text>
              </View>
              <Pill colors={colors} tone={riscoTone}>{riscoLabel}</Pill>
            </View>

            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: riscoTone === 'success' ? colors.success : riscoTone === 'warning' ? colors.warning : colors.danger,
                    width: `${Math.min(100, Math.max(0, frequencia))}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.info, { color: colors.textSecondary }]}>Frequência geral: {frequencia.toFixed(1)}%</Text>
          </Card>

          {avisosParciais.length ? (
            <Card colors={colors}>
              <Text style={{ color: colors.warning, fontWeight: '900' }}>Alguns dados não puderam ser carregados.</Text>
              {avisosParciais.map((aviso) => (
                <Text key={aviso} style={[styles.info, { color: colors.textSecondary }]}>{aviso}</Text>
              ))}
            </Card>
          ) : null}

          <View style={styles.stats}>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Média relativa</Text>
              <Text style={[styles.statValue, { color: mediaNotas === null ? colors.textSoft : mediaNotas >= 70 ? colors.success : mediaNotas >= 50 ? colors.warning : colors.danger }]}>
                {mediaNotas === null ? '—' : `${mediaNotas.toFixed(0)}%`}
              </Text>
            </Card>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Ocorrências</Text>
              <Text style={[styles.statValue, { color: ocorrencias.length ? colors.warning : colors.success }]}>{ocorrencias.length}</Text>
            </Card>
          </View>

          <Text style={[styles.section, { color: colors.textPrimary }]}>Presenças recentes</Text>
          {presencas.length ? (
            <>
              <Card colors={colors}>
                <View style={styles.summaryRow}>
                  <Text style={{ color: colors.success, fontWeight: '800' }}>{resumoPresencas.presentes} presentes</Text>
                  <Text style={{ color: colors.warning, fontWeight: '800' }}>{resumoPresencas.atrasos} atrasos</Text>
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>{resumoPresencas.ausentes} ausentes</Text>
                </View>
              </Card>
              {presencas.slice(0, 8).map((item) => (
                <Card colors={colors} key={`${item.aulaId}-${item.data}-${item.alunoId}`}>
                  <View style={styles.topRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{formatarData(item.data)}</Text>
                      <Text style={[styles.info, { color: colors.textSecondary }]}>
                        {item.horaInicio ? `${formatarHora(item.horaInicio)}${item.horaFim ? ` - ${formatarHora(item.horaFim)}` : ''}` : 'Horário não informado'}
                      </Text>
                      <Text style={[styles.info, { color: colors.textSoft }]}>
                        Método: {item.metodo || 'Não informado'}{item.horarioRegistro ? ` • ${formatarHora(item.horarioRegistro)}` : ''}
                      </Text>
                    </View>
                    <Pill colors={colors} tone={statusTone(item.status)}>{statusLabel(item.status)}</Pill>
                  </View>
                </Card>
              ))}
            </>
          ) : (
            <Card colors={colors}><Text style={{ color: colors.textSecondary }}>Nenhum registro recente de presença encontrado.</Text></Card>
          )}

          <Text style={[styles.section, { color: colors.textPrimary }]}>Notas nas suas disciplinas</Text>
          {notas.length ? notas.slice(0, 8).map((nota, index) => {
            const p = percentualNota(nota);
            return (
              <Card colors={colors} key={nota.id ?? `${nota.turmaDisciplinaId}-${nota.titulo}-${index}`}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{nota.titulo}</Text>
                    <Text style={[styles.info, { color: colors.textSecondary }]}>
                      {nota.disciplinaNome || 'Disciplina'} • {nota.bimestre}º bimestre
                    </Text>
                  </View>
                  <Pill colors={colors} tone={p >= 70 ? 'success' : p >= 50 ? 'warning' : 'danger'}>{p.toFixed(0)}%</Pill>
                </View>
                <Text style={[styles.nota, { color: colors.primary }]}>
                  {Number(nota.nota ?? 0).toFixed(1)} / {Number(nota.notaMaxima ?? 0).toFixed(1)}
                </Text>
                {nota.observacao ? <Text style={[styles.info, { color: colors.textSecondary }]}>{nota.observacao}</Text> : null}
              </Card>
            );
          }) : (
            <Card colors={colors}><Text style={{ color: colors.textSecondary }}>Nenhuma nota lançada para este aluno nas suas disciplinas.</Text></Card>
          )}

          <Text style={[styles.section, { color: colors.textPrimary }]}>Ocorrências</Text>
          {ocorrencias.length ? ocorrencias.slice(0, 6).map((item, index) => (
            <Pressable key={item.id ?? `${item.alunoId}-${index}`} onPress={() => navigation.navigate('OcorrenciasProfessor', { alunoId: aluno.alunoId })}>
              <Card colors={colors}>
                <View style={styles.topRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.titulo}</Text>
                    <Text numberOfLines={3} style={[styles.info, { color: colors.textSecondary }]}>{item.descricao}</Text>
                  </View>
                  <Pill colors={colors} tone={gravidadeTone(item.gravidade)}>{String(item.gravidade || 'Registro')}</Pill>
                </View>
                <Text style={[styles.info, { color: colors.textSoft }]}>{formatarData(item.dataOcorrencia)}</Text>
                <Text style={[styles.info, { color: colors.primary, fontWeight: '900' }]}>Toque para abrir ocorrências</Text>
              </Card>
            </Pressable>
          )) : (
            <Card colors={colors}><Text style={{ color: colors.textSecondary }}>Nenhuma ocorrência registrada para este aluno.</Text></Card>
          )}

          <View style={styles.actions}>
            <Pressable
              onPress={() => navigation.navigate('NotasProfessor', { alunoId: aluno.alunoId, turmaId: aluno.turmaId })}
              style={[styles.button, { borderColor: colors.primary }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '900' }}>Gerenciar notas</Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('OcorrenciasProfessor', { alunoId: aluno.alunoId })}
              style={[styles.button, { borderColor: colors.warning }]}
            >
              <Text style={{ color: colors.warning, fontWeight: '900' }}>Ocorrências</Text>
            </Pressable>
          </View>
        </>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  loading: { minHeight: 360, alignItems: 'center', justifyContent: 'center', gap: 12 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  nome: { fontSize: 20, fontWeight: '900' },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  info: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  track: { height: 9, borderRadius: 999, overflow: 'hidden', marginTop: 15 },
  bar: { height: '100%', borderRadius: 999 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, minHeight: 92 },
  statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statValue: { fontSize: 27, fontWeight: '900', marginTop: 8 },
  section: { fontSize: 17, fontWeight: '900', marginTop: 10, marginBottom: 2 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  nota: { fontSize: 20, fontWeight: '900', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 10 },
  button: { flex: 1, minHeight: 46, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
});
