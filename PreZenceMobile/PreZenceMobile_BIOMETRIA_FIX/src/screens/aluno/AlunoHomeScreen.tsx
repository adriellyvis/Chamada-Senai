import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Pill, Screen } from '../../components/UI';
import { AccordionSection } from '../../components/ui/AccordionSection';
import {
  getAgenda,
  getAvisos,
  getDashboard,
  getDesempenhoDisciplinas,
  getPresencas,
  getNotasAluno,
} from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import {
  AlunoDashboard,
  AlunoDesempenhoDisciplina,
  Aviso,
  HistoricoPresenca,
  HorarioAula,
  NotaAluno,
} from '../../types/aluno';

const DIAS_POR_NUMERO: Record<number, string[]> = {
  0: ['SUNDAY', 'DOMINGO'],
  1: ['MONDAY', 'SEGUNDA', 'SEGUNDA-FEIRA'],
  2: ['TUESDAY', 'TERCA', 'TERÇA', 'TERCA-FEIRA', 'TERÇA-FEIRA'],
  3: ['WEDNESDAY', 'QUARTA', 'QUARTA-FEIRA'],
  4: ['THURSDAY', 'QUINTA', 'QUINTA-FEIRA'],
  5: ['FRIDAY', 'SEXTA', 'SEXTA-FEIRA'],
  6: ['SATURDAY', 'SABADO', 'SÁBADO'],
};

function normalizarTexto(valor?: string | null) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

function minutos(valor?: string | null) {
  const [h, m] = String(valor ?? '').slice(0, 5).split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return -1;
  return h * 60 + m;
}

function horaCurta(valor?: string | null) {
  return String(valor ?? '').slice(0, 5) || '--:--';
}

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const trecho = String(valor).slice(0, 10);
  const [ano, mes, dia] = trecho.split('-');
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : trecho;
}

function formatarHorarioRegistro(valor?: string | null) {
  if (!valor) return '';
  const texto = String(valor);
  const hora = texto.includes('T') ? texto.split('T')[1]?.slice(0, 5) : texto.slice(0, 5);
  return hora ? ` • ${hora}` : '';
}

function ehBiometria(metodo?: string | null) {
  const valor = normalizarTexto(metodo);
  return valor.includes('BIOMETR') || valor.includes('FACIAL') || valor.includes('FACE');
}

function statusTone(status?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  const s = normalizarTexto(status);
  if (s === 'PRESENTE' || s === 'CONFIRMADA') return 'success';
  if (s === 'ATRASADO' || s === 'SAIDA_TEMPORARIA' || s === 'PENDENTE') return 'warning';
  if (s === 'AUSENTE' || s === 'RECUSADA') return 'danger';
  return 'default';
}

function labelStatus(status?: string | null) {
  const mapa: Record<string, string> = {
    PRESENTE: 'Presente',
    AUSENTE: 'Ausente',
    ATRASADO: 'Atrasado',
    SAIDA_TEMPORARIA: 'Saída temporária',
  };
  const chave = normalizarTexto(status);
  return mapa[chave] ?? String(status ?? 'Registro');
}

export function AlunoHomeScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [dashboard, setDashboard] = useState<AlunoDashboard | null>(null);
  const [disciplinas, setDisciplinas] = useState<AlunoDesempenhoDisciplina[]>([]);
  const [agenda, setAgenda] = useState<HorarioAula[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [historico, setHistorico] = useState<HistoricoPresenca[]>([]);
  const [notas, setNotas] = useState<NotaAluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');

      const [dashboardResult, disciplinasResult, agendaResult, avisosResult, historicoResult, notasResult] = await Promise.allSettled([
        getDashboard(user.id),
        getDesempenhoDisciplinas(user.id),
        getAgenda(),
        getAvisos(user.id),
        getPresencas(user.id),
        getNotasAluno(),
      ]);

      if (dashboardResult.status === 'rejected') {
        throw dashboardResult.reason;
      }

      setDashboard(dashboardResult.value);
      setDisciplinas(disciplinasResult.status === 'fulfilled' ? disciplinasResult.value : []);
      setAgenda(agendaResult.status === 'fulfilled' ? agendaResult.value : []);
      setAvisos(avisosResult.status === 'fulfilled' ? avisosResult.value : []);
      setHistorico(historicoResult.status === 'fulfilled' ? historicoResult.value : []);
      setNotas(notasResult.status === 'fulfilled' ? notasResult.value : []);

      const complementoComErro = [disciplinasResult, agendaResult, avisosResult, historicoResult, notasResult]
        .find((resultado) => resultado.status === 'rejected');
      if (complementoComErro?.status === 'rejected') {
        setErro(`Alguns dados complementares não puderam ser carregados. ${getApiErrorMessage(complementoComErro.reason)}`);
      }
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const horarioHoje = useMemo(() => {
    const agora = new Date();
    const aliasesHoje = (DIAS_POR_NUMERO[agora.getDay()] ?? []).map(normalizarTexto);
    const atualMinutos = agora.getHours() * 60 + agora.getMinutes();
    const aulasHoje = agenda
      .filter((aula) => aliasesHoje.includes(normalizarTexto(aula.diaSemana)))
      .sort((a, b) => minutos(a.horaInicio) - minutos(b.horaInicio));

    const atual = aulasHoje.find((aula) => {
      const inicio = minutos(aula.horaInicio);
      const fim = minutos(aula.horaFim);
      return inicio >= 0 && fim >= 0 && atualMinutos >= inicio && atualMinutos < fim;
    }) ?? null;

    const proxima = aulasHoje.find((aula) => minutos(aula.horaInicio) > atualMinutos) ?? null;
    return { aulasHoje, atual, proxima };
  }, [agenda]);

  const registrosBiometricos = useMemo(
    () => [...historico]
      .filter((item) => ehBiometria(item.metodo))
      .sort((a, b) => String(b.dataAula || b.horarioRegistro || '').localeCompare(String(a.dataAula || a.horarioRegistro || '')))
      .slice(0, 5),
    [historico]
  );

  const avisosRecentes = useMemo(
    () => [...avisos]
      .sort((a, b) => String(b.dataCriacao || '').localeCompare(String(a.dataCriacao || '')))
      .slice(0, 5),
    [avisos]
  );

  const mediaAcademica = useMemo(() => {
    const validas = notas.filter((nota) => Number(nota.notaMaxima) > 0);
    if (!validas.length) return null;
    const media = validas.reduce((soma, nota) => {
      const relativa = (Number(nota.nota || 0) / Number(nota.notaMaxima)) * 10;
      return soma + Math.max(0, Math.min(10, relativa));
    }, 0) / validas.length;
    return media;
  }, [notas]);

  const distribuicao = useMemo(() => {
    if (!dashboard) return { presencas: 0, atrasos: 0, faltas: 0, total: 0 };
    const presencas = Math.max(0, Number(dashboard.presencas || 0));
    const atrasos = Math.max(0, Number(dashboard.atrasos || 0));
    const faltas = Math.max(0, Number(dashboard.faltas || 0));
    return { presencas, atrasos, faltas, total: presencas + atrasos + faltas };
  }, [dashboard]);

  if (loading && !dashboard) {
    return (
      <Screen colors={colors}>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 12 }}>Carregando seus dados...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      colors={colors}
      title={dashboard ? `OLÁ, ${dashboard.nome.split(' ')[0].toUpperCase()}` : 'INÍCIO'}
      subtitle={dashboard ? `${dashboard.turma} • ${dashboard.matricula}` : 'Área do aluno'}
      refreshing={loading}
      onRefresh={carregar}
    >
      {erro ? <Text style={{ color: colors.danger, fontWeight: '700', marginBottom: 12 }}>{erro}</Text> : null}

      {!dashboard ? (
        <Card colors={colors}>
          <Text style={{ color: colors.textPrimary, fontWeight: '900' }}>Não foi possível carregar seus dados.</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 6 }}>Puxe a tela para atualizar.</Text>
        </Card>
      ) : null}

      {dashboard ? (
        <>
          <View style={styles.stats}>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Frequência</Text>
              <Text style={[styles.statValue, { color: colors.primary }]}>{Number(dashboard.frequencia || 0).toFixed(1)}%</Text>
            </Card>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Faltas no mês</Text>
              <Text style={[styles.statValue, { color: dashboard.faltasMes ? colors.danger : colors.success }]}>{dashboard.faltasMes ?? 0}</Text>
            </Card>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Aulas assistidas</Text>
              <Text style={[styles.statValue, { color: colors.success }]}>{dashboard.aulasAssistidas ?? 0}</Text>
            </Card>
            <Card colors={colors} style={styles.stat}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Média acadêmica</Text>
              <Text style={[styles.statValue, { color: mediaAcademica === null ? colors.textSoft : mediaAcademica >= 7 ? colors.success : mediaAcademica >= 5 ? colors.warning : colors.danger }]}>
                {mediaAcademica === null ? '—' : mediaAcademica.toFixed(1)}
              </Text>
            </Card>
          </View>

          <View style={styles.quickActions}>
            <Pressable
              onPress={() => navigation.navigate('Avisos')}
              style={[styles.quickButton, { borderColor: colors.primary, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.primary, fontWeight: '900' }}>
                Avisos{avisos.filter((a) => !a.lido).length ? ` (${avisos.filter((a) => !a.lido).length})` : ''}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => navigation.navigate('Notas')}
              style={[styles.quickButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <Text style={{ color: colors.textPrimary, fontWeight: '900' }}>Ver notas</Text>
            </Pressable>
          </View>

          <Card colors={colors}>
            <View style={styles.row}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary, flex: 1 }]}>Aproveitamento geral</Text>
              <Pill colors={colors} tone={Number(dashboard.frequencia || 0) >= 75 ? 'success' : 'warning'}>
                {Number(dashboard.frequencia || 0).toFixed(1)}%
              </Pill>
            </View>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.bar,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(100, Math.max(0, Number(dashboard.frequencia || 0)))}%`,
                  },
                ]}
              />
            </View>
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10 }}>
              {dashboard.aulasAssistidas ?? 0} aulas assistidas de {dashboard.totalAulas ?? 0} • {dashboard.presencasMes ?? 0} presenças neste mês
            </Text>
          </Card>

          <AccordionSection colors={colors} title="Horário de hoje" initiallyOpen>
            {!horarioHoje.aulasHoje.length ? (
              <Text style={{ color: colors.textSecondary }}>Nenhuma aula prevista para hoje.</Text>
            ) : (
              <>
                <Card colors={colors} style={styles.inner}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>AULA AGORA</Text>
                      <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 5 }]}>
                        {horarioHoje.atual?.disciplina ?? 'Nenhuma aula em andamento'}
                      </Text>
                      {horarioHoje.atual ? (
                        <>
                          <Text style={[styles.line, { color: colors.textSecondary }]}>
                            {horaCurta(horarioHoje.atual.horaInicio)} - {horaCurta(horarioHoje.atual.horaFim)}
                          </Text>
                          <Text style={[styles.line, { color: colors.textSecondary }]}>
                            {horarioHoje.atual.professor}{horarioHoje.atual.sala ? ` • Sala ${horarioHoje.atual.sala}` : ''}
                          </Text>
                        </>
                      ) : null}
                    </View>
                    <Pill colors={colors} tone={horarioHoje.atual ? 'success' : 'default'}>{horarioHoje.atual ? 'Em andamento' : 'Livre'}</Pill>
                  </View>
                </Card>

                <Card colors={colors} style={styles.inner}>
                  <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>PRÓXIMA AULA</Text>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, marginTop: 5 }]}>
                    {horarioHoje.proxima?.disciplina ?? 'Não há outra aula hoje'}
                  </Text>
                  {horarioHoje.proxima ? (
                    <>
                      <Text style={[styles.line, { color: colors.textSecondary }]}>
                        {horaCurta(horarioHoje.proxima.horaInicio)} - {horaCurta(horarioHoje.proxima.horaFim)}
                      </Text>
                      <Text style={[styles.line, { color: colors.textSecondary }]}>
                        {horarioHoje.proxima.professor}{horarioHoje.proxima.sala ? ` • Sala ${horarioHoje.proxima.sala}` : ''}
                      </Text>
                    </>
                  ) : null}
                </Card>
              </>
            )}
          </AccordionSection>

          <AccordionSection colors={colors} title="Distribuição de frequência">
            {distribuicao.total === 0 ? (
              <Text style={{ color: colors.textSecondary }}>Ainda não há dados suficientes para montar o resumo.</Text>
            ) : (
              <Card colors={colors} style={styles.inner}>
                <View style={[styles.distributionTrack, { backgroundColor: colors.border }]}>
                  {distribuicao.presencas > 0 ? <View style={{ flex: distribuicao.presencas, backgroundColor: colors.success }} /> : null}
                  {distribuicao.atrasos > 0 ? <View style={{ flex: distribuicao.atrasos, backgroundColor: colors.warning }} /> : null}
                  {distribuicao.faltas > 0 ? <View style={{ flex: distribuicao.faltas, backgroundColor: colors.danger }} /> : null}
                </View>
                <View style={styles.legend}>
                  <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.success }]} /><Text style={{ color: colors.textSecondary }}>Presenças {distribuicao.presencas}</Text></View>
                  <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.warning }]} /><Text style={{ color: colors.textSecondary }}>Atrasos {distribuicao.atrasos}</Text></View>
                  <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.danger }]} /><Text style={{ color: colors.textSecondary }}>Faltas {distribuicao.faltas}</Text></View>
                </View>
              </Card>
            )}
          </AccordionSection>

          <AccordionSection colors={colors} title="Desempenho por unidade curricular">
            {!disciplinas.length ? (
              <Text style={{ color: colors.textSecondary }}>Nenhuma disciplina encontrada.</Text>
            ) : disciplinas.map((d) => (
              <Card colors={colors} key={d.disciplina} style={styles.inner}>
                <View style={styles.row}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, flex: 1 }]}>{d.disciplina}</Text>
                  <Text style={{ color: colors.primary, fontWeight: '900' }}>{Number(d.frequencia || 0).toFixed(1)}%</Text>
                </View>
                <View style={[styles.track, { backgroundColor: colors.border, marginTop: 10 }]}>
                  <View
                    style={[
                      styles.bar,
                      {
                        backgroundColor: Number(d.frequencia || 0) >= 75 ? colors.success : colors.warning,
                        width: `${Math.min(100, Math.max(0, Number(d.frequencia || 0)))}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.line, { color: colors.textSecondary }]}>Presenças {d.presencas} • Faltas {d.faltas} • Atrasos {d.atrasos}</Text>
              </Card>
            ))}
          </AccordionSection>

          <AccordionSection colors={colors} title={`Registros biométricos${registrosBiometricos.length ? ` (${registrosBiometricos.length})` : ''}`}>
            {!registrosBiometricos.length ? (
              <Text style={{ color: colors.textSecondary }}>Nenhum registro de frequência por biometria encontrado.</Text>
            ) : registrosBiometricos.map((item, index) => (
              <Card colors={colors} key={`${item.aulaId}-${item.dataAula}-${index}`} style={styles.inner}>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{item.disciplina}</Text>
                    <Text style={[styles.line, { color: colors.textSecondary }]}>{formatarData(item.dataAula)}{formatarHorarioRegistro(item.horarioRegistro)}</Text>
                  </View>
                  <Pill colors={colors} tone={statusTone(item.status)}>{labelStatus(item.status)}</Pill>
                </View>
                <Text style={[styles.line, { color: colors.textSoft }]}>Método: {item.metodo || 'Biometria'}</Text>
              </Card>
            ))}
          </AccordionSection>

          <AccordionSection
            colors={colors}
            title={`Mural de avisos${avisos.filter((a) => !a.lido).length ? ` (${avisos.filter((a) => !a.lido).length} novos)` : ''}`}
          >
            {!avisos.length ? (
              <Text style={{ color: colors.textSecondary }}>Você não possui avisos.</Text>
            ) : avisosRecentes.map((a) => (
              <Card colors={colors} key={a.id} style={styles.inner}>
                <View style={styles.row}>
                  <Text style={[styles.cardTitle, { color: colors.textPrimary, flex: 1 }]}>{a.titulo}</Text>
                  {!a.lido ? <Pill colors={colors}>Novo</Pill> : null}
                </View>
                <Text style={[styles.line, { color: colors.textSecondary }]}>{a.mensagem}</Text>
                <Text style={{ color: colors.textSoft, fontSize: 11, marginTop: 8 }}>{a.autorNome}</Text>
              </Card>
            ))}
            {avisos.length ? (
              <Pressable
                onPress={() => navigation.navigate('Avisos')}
                style={[styles.fullButton, { borderColor: colors.primary }]}
              >
                <Text style={{ color: colors.primary, fontWeight: '900' }}>Abrir avisos e ocorrências</Text>
              </Pressable>
            ) : null}
          </AccordionSection>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, minHeight: 380, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickActions: { flexDirection: 'row', gap: 10, marginTop: 2 },
  quickButton: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  stat: { width: '48%', minHeight: 92 },
  statLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  statValue: { fontSize: 26, fontWeight: '900', marginTop: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '900' },
  miniLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  track: { height: 9, borderRadius: 999, overflow: 'hidden', marginTop: 14 },
  bar: { height: '100%', borderRadius: 999 },
  inner: { marginBottom: 10 },
  line: { fontSize: 12, lineHeight: 18, marginTop: 5 },
  distributionTrack: { height: 16, borderRadius: 999, overflow: 'hidden', flexDirection: 'row' },
  legend: { marginTop: 14, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 9, height: 9, borderRadius: 999 },
  fullButton: { minHeight: 44, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
});
