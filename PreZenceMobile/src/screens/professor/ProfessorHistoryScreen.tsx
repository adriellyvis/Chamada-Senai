import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import { Card, Pill, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { getApiErrorMessage } from '../../services/api';
import {
  getDetalhesAula,
  getHistoricoProfessor,
} from '../../services/professorService';
import { DetalheAula, HistoricoAula } from '../../types/professor';

function timestampAula(aula: HistoricoAula) {
  const data = String(aula.data ?? '').slice(0, 10);
  const hora = String(aula.horaInicio ?? '00:00').slice(0, 5);
  const valor = new Date(`${data}T${hora}:00`).getTime();
  return Number.isNaN(valor) ? 0 : valor;
}

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const base = String(valor).slice(0, 10);
  const [ano, mes, dia] = base.split('-');
  if (!ano || !mes || !dia) return valor;
  return `${dia}/${mes}/${ano}`;
}

function formatarHora(valor?: string | null) {
  if (!valor) return '—';
  return String(valor).slice(0, 5);
}

function statusNormalizado(valor?: string | null) {
  return String(valor ?? '')
    .trim()
    .toUpperCase()
    .replaceAll('-', '_');
}

function statusLabel(valor?: string | null) {
  const status = statusNormalizado(valor);
  if (status === 'ABERTA') return 'Aberta';
  if (status === 'ENCERRADA' || status === 'FINALIZADA') return 'Encerrada';
  if (status === 'CANCELADA') return 'Cancelada';
  return valor || 'Sem status';
}

function statusTone(valor?: string | null): 'default' | 'success' | 'danger' | 'warning' {
  const status = statusNormalizado(valor);
  if (status === 'ENCERRADA' || status === 'FINALIZADA') return 'success';
  if (status === 'CANCELADA') return 'danger';
  if (status === 'ABERTA') return 'warning';
  return 'default';
}

function presencaLabel(valor?: string | null) {
  const status = statusNormalizado(valor);
  if (status === 'PRESENTE') return 'Presente';
  if (status === 'AUSENTE' || status === 'FALTA') return 'Ausente';
  if (status === 'ATRASADO') return 'Atrasado';
  if (status === 'SAIDA_TEMPORARIA') return 'Saída temporária';
  return valor || 'Não registrado';
}

function presencaTone(valor?: string | null): 'default' | 'success' | 'danger' | 'warning' {
  const status = statusNormalizado(valor);
  if (status === 'PRESENTE') return 'success';
  if (status === 'AUSENTE' || status === 'FALTA') return 'danger';
  if (status === 'ATRASADO' || status === 'SAIDA_TEMPORARIA') return 'warning';
  return 'default';
}

export const ProfessorHistoryScreen: React.FC = () => {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  const [aulas, setAulas] = useState<HistoricoAula[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [aulaAbertaId, setAulaAbertaId] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<Record<number, DetalheAula[]>>({});
  const [carregandoDetalhe, setCarregandoDetalhe] = useState<number | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState<Record<number, string>>({});

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      const data = await getHistoricoProfessor();
      setAulas([...data].sort((a, b) => timestampAula(b) - timestampAula(a)));
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void carregar();
    }, [carregar])
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return aulas;

    return aulas.filter((aula) =>
      `${aula.turma} ${aula.data} ${aula.status}`
        .toLowerCase()
        .includes(termo)
    );
  }, [aulas, busca]);

  const abrirDetalhes = useCallback(
    async (aula: HistoricoAula) => {
      if (aulaAbertaId === aula.id) {
        setAulaAbertaId(null);
        return;
      }

      setAulaAbertaId(aula.id);

      if (detalhes[aula.id]) return;

      try {
        setCarregandoDetalhe(aula.id);
        setErroDetalhe((atual) => ({ ...atual, [aula.id]: '' }));
        const data = await getDetalhesAula(aula.id);
        setDetalhes((atual) => ({ ...atual, [aula.id]: data }));
      } catch (error) {
        setErroDetalhe((atual) => ({
          ...atual,
          [aula.id]: getApiErrorMessage(error),
        }));
      } finally {
        setCarregandoDetalhe(null);
      }
    },
    [aulaAbertaId, detalhes]
  );

  return (
    <Screen
      colors={colors}
      title="HISTÓRICO"
      subtitle="Consulte suas aulas realizadas e os registros de presença."
      refreshing={loading}
      onRefresh={carregar}
    >
      <TextInput
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar turma, data ou status"
        placeholderTextColor={colors.textSoft}
        style={[
          styles.search,
          {
            color: colors.textPrimary,
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      />

      {loading && aulas.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={{ color: colors.textSecondary }}>Carregando histórico...</Text>
        </View>
      ) : null}

      {erro ? (
        <Card colors={colors}>
          <Text style={{ color: colors.danger, fontWeight: '900' }}>
            Não foi possível carregar o histórico.
          </Text>
          <Text style={{ color: colors.textSecondary, marginTop: 5 }}>{erro}</Text>
        </Card>
      ) : null}

      {filtradas.map((aula) => {
        const aberta = aulaAbertaId === aula.id;
        const lista = detalhes[aula.id] ?? [];
        const detalheErro = erroDetalhe[aula.id];

        const presentes = lista.filter(
          (item) => statusNormalizado(item.status) === 'PRESENTE'
        ).length;
        const atrasos = lista.filter(
          (item) => statusNormalizado(item.status) === 'ATRASADO'
        ).length;
        const ausentes = lista.filter((item) =>
          ['AUSENTE', 'FALTA'].includes(statusNormalizado(item.status))
        ).length;

        return (
          <Card colors={colors} key={aula.id}>
            <View style={styles.rowTop}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  {aula.turma}
                </Text>
                <Text style={[styles.info, { color: colors.textSecondary }]}>
                  {formatarData(aula.data)} • {formatarHora(aula.horaInicio)}
                  {aula.horaFim ? ` - ${formatarHora(aula.horaFim)}` : ''}
                </Text>
              </View>
              <Pill colors={colors} tone={statusTone(aula.status)}>
                {statusLabel(aula.status)}
              </Pill>
            </View>

            <Pressable
              onPress={() => void abrirDetalhes(aula)}
              style={({ pressed }) => [
                styles.detailButton,
                {
                  borderColor: colors.primary,
                  opacity: pressed ? 0.65 : 1,
                },
              ]}
            >
              <Text style={{ color: colors.primary, fontWeight: '900' }}>
                {aberta ? 'Ocultar registros' : 'Ver registros da aula'}
              </Text>
            </Pressable>

            {aberta ? (
              <View style={[styles.details, { borderTopColor: colors.border }]}>
                {carregandoDetalhe === aula.id ? (
                  <ActivityIndicator color={colors.primary} />
                ) : null}

                {detalheErro ? (
                  <Text style={{ color: colors.danger }}>{detalheErro}</Text>
                ) : null}

                {!carregandoDetalhe && !detalheErro && lista.length > 0 ? (
                  <>
                    <View style={styles.summary}>
                      <Text style={[styles.summaryText, { color: colors.success }]}>
                        {presentes} presentes
                      </Text>
                      <Text style={[styles.summaryText, { color: colors.warning }]}>
                        {atrasos} atrasos
                      </Text>
                      <Text style={[styles.summaryText, { color: colors.danger }]}>
                        {ausentes} ausentes
                      </Text>
                    </View>

                    {lista.map((item, index) => (
                      <View
                        key={`${aula.id}-${item.alunoId}-${index}`}
                        style={[styles.studentRow, { borderTopColor: colors.border }]}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.studentName, { color: colors.textPrimary }]}>
                            {item.nomeAluno}
                          </Text>
                          <Text style={[styles.info, { color: colors.textSecondary }]}>
                            {item.metodo ? `Método: ${item.metodo}` : 'Método não informado'}
                            {item.horarioRegistro
                              ? ` • ${formatarHora(item.horarioRegistro)}`
                              : ''}
                          </Text>
                        </View>
                        <Pill colors={colors} tone={presencaTone(item.status)}>
                          {presencaLabel(item.status)}
                        </Pill>
                      </View>
                    ))}
                  </>
                ) : null}

                {!carregandoDetalhe && !detalheErro && lista.length === 0 ? (
                  <Text style={{ color: colors.textSecondary }}>
                    Nenhum registro de presença encontrado para esta aula.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card>
        );
      })}

      {!loading && !erro && filtradas.length === 0 ? (
        <Card colors={colors}>
          <Text style={{ color: colors.textSecondary }}>
            Nenhuma aula encontrada no histórico.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
};

const styles = StyleSheet.create({
  search: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  center: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
  },
  info: {
    fontSize: 12,
    marginTop: 4,
  },
  detailButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    paddingTop: 14,
    gap: 10,
  },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryText: {
    fontSize: 12,
    fontWeight: '900',
  },
  studentRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
  },
});
