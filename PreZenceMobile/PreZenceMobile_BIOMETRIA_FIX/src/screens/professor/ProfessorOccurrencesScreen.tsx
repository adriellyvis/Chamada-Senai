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
  useFocusEffect,
  useRoute,
} from '@react-navigation/native';

import {
  Card,
  Pill,
  PrimaryButton,
  Screen,
} from '../../components/UI';

import {
  useAppSettings,
} from '../../context/AppSettingsContext';

import {
  getTheme,
} from '../../theme';

import {
  getApiErrorMessage,
} from '../../services/api';

import {
  atualizarOcorrencia,
  criarOcorrencia,
  getOcorrenciasProfessor,
  getProfessorAlunos,
} from '../../services/professorService';

import {
  AlunoProfessor,
  OcorrenciaProfessor,
} from '../../types/professor';

type TipoOcorrencia =
  | 'DISCIPLINAR'
  | 'ATESTADO'
  | 'JUSTIFICATIVA'
  | 'INTERVENCAO'
  | 'DESTAQUE';

type GravidadeOcorrencia =
  | 'BAIXA'
  | 'MEDIA'
  | 'ALTA';

type StatusFiltro =
  | ''
  | 'PENDENTE'
  | 'EM_ANALISE'
  | 'RESOLVIDA'
  | 'CANCELADA';

const TIPOS: Array<{
  valor: TipoOcorrencia;
  label: string;
}> = [
  { valor: 'DISCIPLINAR', label: 'Disciplinar' },
  { valor: 'ATESTADO', label: 'Atestado' },
  { valor: 'JUSTIFICATIVA', label: 'Justificativa' },
  { valor: 'INTERVENCAO', label: 'Intervenção' },
  { valor: 'DESTAQUE', label: 'Destaque' },
];

const GRAVIDADES: Array<{
  valor: GravidadeOcorrencia;
  label: string;
}> = [
  { valor: 'BAIXA', label: 'Baixa' },
  { valor: 'MEDIA', label: 'Média' },
  { valor: 'ALTA', label: 'Alta' },
];

const STATUS: Array<{
  valor: StatusFiltro;
  label: string;
}> = [
  { valor: '', label: 'Todos' },
  { valor: 'PENDENTE', label: 'Pendente' },
  { valor: 'EM_ANALISE', label: 'Em análise' },
  { valor: 'RESOLVIDA', label: 'Resolvida' },
  { valor: 'CANCELADA', label: 'Cancelada' },
];

function formatarEnum(
  valor?: string | null
) {
  if (!valor) {
    return '—';
  }

  return valor
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letra) =>
      letra.toUpperCase()
    );
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return '—';
  }

  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) {
    return valor;
  }

  return data.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }
  );
}

function toneStatus(
  status?: string | null
):
  | 'default'
  | 'success'
  | 'danger'
  | 'warning' {

  const valor =
    String(status ?? '')
      .toUpperCase();

  if (valor === 'RESOLVIDA') {
    return 'success';
  }

  if (valor === 'CANCELADA') {
    return 'danger';
  }

  if (
    valor === 'PENDENTE' ||
    valor === 'EM_ANALISE'
  ) {
    return 'warning';
  }

  return 'default';
}

function toneGravidade(
  gravidade?: string | null
):
  | 'default'
  | 'success'
  | 'danger'
  | 'warning' {

  const valor =
    String(gravidade ?? '')
      .toUpperCase();

  if (valor === 'ALTA') {
    return 'danger';
  }

  if (valor === 'MEDIA') {
    return 'warning';
  }

  if (valor === 'BAIXA') {
    return 'success';
  }

  return 'default';
}

export const ProfessorOccurrencesScreen:
React.FC = () => {

  const route =
    useRoute<any>();

  const { darkMode } =
    useAppSettings();

  const colors =
    getTheme(darkMode);

  const alunoInicial =
    Number(
      route.params?.alunoId
    ) || null;

  const [
    ocorrencias,
    setOcorrencias,
  ] =
    useState<
      OcorrenciaProfessor[]
    >([]);

  const [
    alunos,
    setAlunos,
  ] =
    useState<
      AlunoProfessor[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    salvando,
    setSalvando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState('');

  const [
    busca,
    setBusca,
  ] =
    useState('');

  const [
    statusFiltro,
    setStatusFiltro,
  ] =
    useState<StatusFiltro>('');

  const [
    gravidadeFiltro,
    setGravidadeFiltro,
  ] =
    useState<
      '' | GravidadeOcorrencia
    >('');

  const [
    formAberto,
    setFormAberto,
  ] =
    useState(false);

  const [
    editandoId,
    setEditandoId,
  ] =
    useState<number | null>(
      null
    );

  const [
    alunoSelecionado,
    setAlunoSelecionado,
  ] =
    useState<number | null>(
      alunoInicial
    );

  const [
    mostrarAlunos,
    setMostrarAlunos,
  ] =
    useState(false);

  const [
    buscaAluno,
    setBuscaAluno,
  ] =
    useState('');

  const [
    titulo,
    setTitulo,
  ] =
    useState('');

  const [
    descricao,
    setDescricao,
  ] =
    useState('');

  const [
    tipo,
    setTipo,
  ] =
    useState<TipoOcorrencia>(
      'DISCIPLINAR'
    );

  const [
    gravidade,
    setGravidade,
  ] =
    useState<GravidadeOcorrencia>(
      'BAIXA'
    );

  const carregar =
    useCallback(
      async () => {

        try {
          setLoading(true);
          setErro('');

          const [
            listaOcorrencias,
            listaAlunos,
          ] =
            await Promise.all([
              getOcorrenciasProfessor(),
              getProfessorAlunos(),
            ]);

          setOcorrencias(
            listaOcorrencias
          );

          setAlunos(
            listaAlunos
          );

        } catch (error) {

          setErro(
            getApiErrorMessage(
              error
            )
          );

        } finally {
          setLoading(false);
        }
      },
      []
    );

  useFocusEffect(
    useCallback(() => {

      void carregar();

    }, [carregar])
  );

  useEffect(() => {

    if (alunoInicial) {

      setAlunoSelecionado(
        alunoInicial
      );

      setFormAberto(true);
    }

  }, [alunoInicial]);

  const alunoAtual =
    useMemo(
      () =>
        alunos.find(
          (item) =>
            item.alunoId ===
            alunoSelecionado
        ) ?? null,
      [
        alunos,
        alunoSelecionado,
      ]
    );

  const alunosFiltrados =
    useMemo(() => {

      const termo =
        buscaAluno
          .trim()
          .toLowerCase();

      if (!termo) {
        return alunos;
      }

      return alunos.filter(
        (aluno) =>
          `${aluno.nome} ${aluno.matricula} ${aluno.turma}`
            .toLowerCase()
            .includes(termo)
      );

    }, [
      alunos,
      buscaAluno,
    ]);

  const ocorrenciasFiltradas =
    useMemo(() => {

      const termo =
        busca
          .trim()
          .toLowerCase();

      return [
        ...ocorrencias,
      ]
        .filter(
          (item) => {

            const correspondeBusca =
              !termo ||
              `${item.alunoNome ?? ''} ${item.titulo} ${item.descricao}`
                .toLowerCase()
                .includes(
                  termo
                );

            const correspondeStatus =
              !statusFiltro ||
              item.status ===
                statusFiltro;

            const correspondeGravidade =
              !gravidadeFiltro ||
              item.gravidade ===
                gravidadeFiltro;

            return (
              correspondeBusca &&
              correspondeStatus &&
              correspondeGravidade
            );
          }
        )
        .sort(
          (a, b) => {

            const dataA =
              new Date(
                a.dataOcorrencia ??
                  0
              ).getTime();

            const dataB =
              new Date(
                b.dataOcorrencia ??
                  0
              ).getTime();

            return (
              dataB -
              dataA
            );
          }
        );

    }, [
      ocorrencias,
      busca,
      statusFiltro,
      gravidadeFiltro,
    ]);

  const total =
    ocorrencias.length;

  const pendentes =
    ocorrencias.filter(
      (item) =>
        item.status ===
          'PENDENTE' ||
        item.status ===
          'EM_ANALISE'
    ).length;

  const resolvidas =
    ocorrencias.filter(
      (item) =>
        item.status ===
        'RESOLVIDA'
    ).length;

  const destaques =
    ocorrencias.filter(
      (item) =>
        item.tipo ===
        'DESTAQUE'
    ).length;

  function limparFormulario() {

    setEditandoId(null);
    setAlunoSelecionado(null);
    setTitulo('');
    setDescricao('');

    setTipo(
      'DISCIPLINAR'
    );

    setGravidade(
      'BAIXA'
    );

    setMostrarAlunos(false);
    setBuscaAluno('');
  }

  function fecharFormulario() {

    limparFormulario();
    setFormAberto(false);
  }

  function novaOcorrencia() {

    limparFormulario();

    if (alunoInicial) {
      setAlunoSelecionado(
        alunoInicial
      );
    }

    setFormAberto(true);
  }

  function editarOcorrencia(
    item: OcorrenciaProfessor
  ) {

    if (
      item.status !==
        'PENDENTE' ||
      !item.id
    ) {
      return;
    }

    setEditandoId(
      item.id
    );

    setAlunoSelecionado(
      item.alunoId
    );

    setTitulo(
      item.titulo ?? ''
    );

    setDescricao(
      item.descricao ?? ''
    );

    setTipo(
      item.tipo as
        TipoOcorrencia
    );

    setGravidade(
      item.gravidade as
        GravidadeOcorrencia
    );

    setMostrarAlunos(false);
    setBuscaAluno('');
    setFormAberto(true);
  }

  async function salvar() {

    if (!alunoSelecionado) {

      setErro(
        'Selecione um aluno.'
      );

      return;
    }

    if (!titulo.trim()) {

      setErro(
        'Informe o título da ocorrência.'
      );

      return;
    }

    if (!descricao.trim()) {

      setErro(
        'Informe a descrição da ocorrência.'
      );

      return;
    }

    try {

      setSalvando(true);
      setErro('');

      const payload:
        OcorrenciaProfessor = {

        alunoId:
          alunoSelecionado,

        titulo:
          titulo.trim(),

        descricao:
          descricao.trim(),

        tipo,
        gravidade,
      };

      if (editandoId) {

        await atualizarOcorrencia(
          editandoId,
          payload
        );

      } else {

        await criarOcorrencia(
          payload
        );
      }

      fecharFormulario();

      await carregar();

    } catch (error) {

      setErro(
        getApiErrorMessage(
          error
        )
      );

    } finally {

      setSalvando(false);
    }
  }

  return (
    <Screen
      colors={colors}
      title="OCORRÊNCIAS"
      subtitle="Registre e acompanhe situações dos seus alunos."
      refreshing={loading}
      onRefresh={carregar}
    >

      <View
        style={
          styles.statsGrid
        }
      >

        <Card
          colors={colors}
          style={
            styles.statCard
          }
        >
          <Text
            style={[
              styles.statLabel,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Total registrado
          </Text>

          <Text
            style={[
              styles.statValue,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {total}
          </Text>
        </Card>

        <Card
          colors={colors}
          style={
            styles.statCard
          }
        >
          <Text
            style={[
              styles.statLabel,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Pendências
          </Text>

          <Text
            style={[
              styles.statValue,
              {
                color:
                  colors.warning,
              },
            ]}
          >
            {pendentes}
          </Text>
        </Card>

        <Card
          colors={colors}
          style={
            styles.statCard
          }
        >
          <Text
            style={[
              styles.statLabel,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Resolvidas
          </Text>

          <Text
            style={[
              styles.statValue,
              {
                color:
                  colors.success,
              },
            ]}
          >
            {resolvidas}
          </Text>
        </Card>

        <Card
          colors={colors}
          style={
            styles.statCard
          }
        >
          <Text
            style={[
              styles.statLabel,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Destaques
          </Text>

          <Text
            style={[
              styles.statValue,
              {
                color:
                  colors
                    .primaryStrong,
              },
            ]}
          >
            {destaques}
          </Text>
        </Card>

      </View>

      <PrimaryButton
        colors={colors}
        title={
          formAberto
            ? 'Fechar formulário'
            : 'Registrar ocorrência'
        }
        variant={
          formAberto
            ? 'outline'
            : 'primary'
        }
        onPress={() => {

          if (formAberto) {
            fecharFormulario();
          } else {
            novaOcorrencia();
          }

        }}
      />

      {formAberto ? (

        <Card
          colors={colors}
          style={
            styles.formCard
          }
        >

          <Text
            style={[
              styles.sectionTitle,
              {
                color:
                  colors
                    .textPrimary,
              },
            ]}
          >
            {editandoId
              ? 'Editar ocorrência'
              : 'Nova ocorrência'}
          </Text>

          <Text
            style={[
              styles.label,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Aluno
          </Text>

          <Pressable
            onPress={() =>
              setMostrarAlunos(
                (atual) =>
                  !atual
              )
            }
            style={[
              styles.selector,
              {
                backgroundColor:
                  colors
                    .background,

                borderColor:
                  colors.border,
              },
            ]}
          >

            <Text
              style={{
                color:
                  alunoAtual
                    ? colors
                        .textPrimary
                    : colors
                        .textSoft,

                fontWeight:
                  '700',
              }}
            >
              {alunoAtual
                ? `${alunoAtual.nome} • RA ${alunoAtual.matricula}`
                : 'Selecionar aluno'}
            </Text>

            <Text
              style={{
                color:
                  colors
                    .textSoft,

                fontSize: 18,
              }}
            >
              {mostrarAlunos
                ? '⌃'
                : '⌄'}
            </Text>

          </Pressable>

          {mostrarAlunos ? (

            <View
              style={[
                styles.studentBox,
                {
                  borderColor:
                    colors
                      .border,
                },
              ]}
            >

              <TextInput
                value={
                  buscaAluno
                }
                onChangeText={
                  setBuscaAluno
                }
                placeholder="Buscar aluno por nome, RA ou turma"
                placeholderTextColor={
                  colors.textSoft
                }
                style={[
                  styles.input,
                  {
                    color:
                      colors
                        .textPrimary,

                    borderColor:
                      colors.border,

                    backgroundColor:
                      colors.surface,
                  },
                ]}
              />

              {alunosFiltrados.map(
                (aluno) => (

                  <Pressable
                    key={
                      aluno.alunoId
                    }
                    onPress={() => {

                      setAlunoSelecionado(
                        aluno
                          .alunoId
                      );

                      setMostrarAlunos(
                        false
                      );
                    }}
                    style={[
                      styles.studentRow,
                      {
                        borderBottomColor:
                          colors
                            .border,
                      },
                    ]}
                  >

                    <View
                      style={{
                        flex: 1,
                      }}
                    >

                      <Text
                        style={{
                          color:
                            colors
                              .textPrimary,

                          fontWeight:
                            '800',
                        }}
                      >
                        {aluno.nome}
                      </Text>

                      <Text
                        style={{
                          color:
                            colors
                              .textSecondary,

                          marginTop:
                            2,

                          fontSize:
                            12,
                        }}
                      >
                        {aluno.turma}
                        {' • '}
                        RA{' '}
                        {aluno.matricula}
                      </Text>

                    </View>

                  </Pressable>
                )
              )}

            </View>

          ) : null}

          <Text
            style={[
              styles.label,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Título
          </Text>

          <TextInput
            value={titulo}
            onChangeText={
              setTitulo
            }
            maxLength={150}
            placeholder="Ex: Baixa frequência"
            placeholderTextColor={
              colors.textSoft
            }
            style={[
              styles.input,
              {
                color:
                  colors
                    .textPrimary,

                backgroundColor:
                  colors
                    .background,

                borderColor:
                  colors.border,
              },
            ]}
          />

          <Text
            style={[
              styles.label,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Tipo
          </Text>

          <View
            style={
              styles.chips
            }
          >

            {TIPOS.map(
              (item) => {

                const selecionado =
                  tipo ===
                  item.valor;

                return (
                  <Pressable
                    key={
                      item.valor
                    }
                    onPress={() =>
                      setTipo(
                        item.valor
                      )
                    }
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          selecionado
                            ? colors.primary
                            : colors.border,

                        backgroundColor:
                          selecionado
                            ? colors.primaryLight
                            : colors.surface,
                      },
                    ]}
                  >

                    <Text
                      style={{
                        color:
                          selecionado
                            ? colors.primaryStrong
                            : colors.textSecondary,

                        fontWeight:
                          '800',

                        fontSize:
                          12,
                      }}
                    >
                      {item.label}
                    </Text>

                  </Pressable>
                );
              }
            )}

          </View>

          <Text
            style={[
              styles.label,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Gravidade
          </Text>

          <View
            style={
              styles.chips
            }
          >

            {GRAVIDADES.map(
              (item) => {

                const selecionado =
                  gravidade ===
                  item.valor;

                return (
                  <Pressable
                    key={
                      item.valor
                    }
                    onPress={() =>
                      setGravidade(
                        item.valor
                      )
                    }
                    style={[
                      styles.chip,
                      {
                        borderColor:
                          selecionado
                            ? colors.primary
                            : colors.border,

                        backgroundColor:
                          selecionado
                            ? colors.primaryLight
                            : colors.surface,
                      },
                    ]}
                  >

                    <Text
                      style={{
                        color:
                          selecionado
                            ? colors.primaryStrong
                            : colors.textSecondary,

                        fontWeight:
                          '800',

                        fontSize:
                          12,
                      }}
                    >
                      {item.label}
                    </Text>

                  </Pressable>
                );
              }
            )}

          </View>

          <Text
            style={[
              styles.label,
              {
                color:
                  colors
                    .textSecondary,
              },
            ]}
          >
            Descrição
          </Text>

          <TextInput
            value={descricao}
            onChangeText={
              setDescricao
            }
            multiline
            numberOfLines={5}
            placeholder="Descreva a ocorrência..."
            placeholderTextColor={
              colors.textSoft
            }
            style={[
              styles.input,
              styles.textarea,
              {
                color:
                  colors
                    .textPrimary,

                backgroundColor:
                  colors
                    .background,

                borderColor:
                  colors.border,
              },
            ]}
          />

          <PrimaryButton
            colors={colors}
            title={
              editandoId
                ? 'Salvar alterações'
                : 'Registrar ocorrência'
            }
            onPress={() => {
              void salvar();
            }}
            loading={salvando}
            disabled={salvando}
          />

        </Card>

      ) : null}

      {erro ? (

        <Text
          style={[
            styles.error,
            {
              color:
                colors.danger,
            },
          ]}
        >
          {erro}
        </Text>

      ) : null}

      <TextInput
        value={busca}
        onChangeText={
          setBusca
        }
        placeholder="Buscar aluno, título ou descrição"
        placeholderTextColor={
          colors.textSoft
        }
        style={[
          styles.search,
          {
            color:
              colors
                .textPrimary,

            backgroundColor:
              colors.surface,

            borderColor:
              colors.border,
          },
        ]}
      />

      <Text
        style={[
          styles.filterTitle,
          {
            color:
              colors
                .textSecondary,
          },
        ]}
      >
        Status
      </Text>

      <View
        style={
          styles.chips
        }
      >

        {STATUS.map(
          (item) => {

            const selecionado =
              statusFiltro ===
              item.valor;

            return (
              <Pressable
                key={
                  item.valor ||
                  'TODOS'
                }
                onPress={() =>
                  setStatusFiltro(
                    item.valor
                  )
                }
                style={[
                  styles.chip,
                  {
                    borderColor:
                      selecionado
                        ? colors.primary
                        : colors.border,

                    backgroundColor:
                      selecionado
                        ? colors.primaryLight
                        : colors.surface,
                  },
                ]}
              >

                <Text
                  style={{
                    color:
                      selecionado
                        ? colors.primaryStrong
                        : colors.textSecondary,

                    fontWeight:
                      '800',

                    fontSize:
                      12,
                  }}
                >
                  {item.label}
                </Text>

              </Pressable>
            );
          }
        )}

      </View>

      <Text
        style={[
          styles.filterTitle,
          {
            color:
              colors
                .textSecondary,
          },
        ]}
      >
        Gravidade
      </Text>

      <View
        style={
          styles.chips
        }
      >

        <Pressable
          onPress={() =>
            setGravidadeFiltro(
              ''
            )
          }
          style={[
            styles.chip,
            {
              borderColor:
                !gravidadeFiltro
                  ? colors.primary
                  : colors.border,

              backgroundColor:
                !gravidadeFiltro
                  ? colors.primaryLight
                  : colors.surface,
            },
          ]}
        >

          <Text
            style={{
              color:
                !gravidadeFiltro
                  ? colors.primaryStrong
                  : colors.textSecondary,

              fontWeight:
                '800',

              fontSize:
                12,
            }}
          >
            Todas
          </Text>

        </Pressable>

        {GRAVIDADES.map(
          (item) => {

            const selecionado =
              gravidadeFiltro ===
              item.valor;

            return (
              <Pressable
                key={
                  item.valor
                }
                onPress={() =>
                  setGravidadeFiltro(
                    item.valor
                  )
                }
                style={[
                  styles.chip,
                  {
                    borderColor:
                      selecionado
                        ? colors.primary
                        : colors.border,

                    backgroundColor:
                      selecionado
                        ? colors.primaryLight
                        : colors.surface,
                  },
                ]}
              >

                <Text
                  style={{
                    color:
                      selecionado
                        ? colors.primaryStrong
                        : colors.textSecondary,

                    fontWeight:
                      '800',

                    fontSize:
                      12,
                  }}
                >
                  {item.label}
                </Text>

              </Pressable>
            );
          }
        )}

      </View>

      {loading &&
      ocorrencias.length === 0 ? (

        <ActivityIndicator
          color={colors.primary}
          style={{
            marginTop: 18,
          }}
        />

      ) : null}

      <Text
        style={[
          styles.listTitle,
          {
            color:
              colors
                .textPrimary,
          },
        ]}
      >
        Registros (
        {ocorrenciasFiltradas.length}
        )
      </Text>

      {ocorrenciasFiltradas.map(
        (item) => (

          <Card
            colors={colors}
            key={
              item.id ??
              `${item.alunoId}-${item.dataOcorrencia}-${item.titulo}`
            }
          >

            <View
              style={
                styles.cardTop
              }
            >

              <View
                style={{
                  flex: 1,
                }}
              >

                <Text
                  style={[
                    styles.studentName,
                    {
                      color:
                        colors
                          .textPrimary,
                    },
                  ]}
                >
                  {item.alunoNome ??
                    'Aluno'}
                </Text>

                <Text
                  style={[
                    styles.ocTitle,
                    {
                      color:
                        colors
                          .textPrimary,
                    },
                  ]}
                >
                  {item.titulo}
                </Text>

              </View>

              <Pill
                colors={colors}
                tone={
                  toneStatus(
                    item.status
                  )
                }
              >
                {formatarEnum(
                  item.status
                )}
              </Pill>

            </View>

            <View
              style={
                styles.metaRow
              }
            >

              <Pill
                colors={colors}
                tone={
                  toneGravidade(
                    item.gravidade
                  )
                }
              >
                {formatarEnum(
                  item.gravidade
                )}
              </Pill>

              <Text
                style={{
                  color:
                    colors
                      .textSecondary,

                  fontSize:
                    12,
                }}
              >
                {formatarEnum(
                  item.tipo
                )}
              </Text>

            </View>

            <Text
              style={[
                styles.description,
                {
                  color:
                    colors
                      .textSecondary,
                },
              ]}
            >
              {item.descricao}
            </Text>

            <Text
              style={{
                color:
                  colors.textSoft,

                fontSize:
                  11,

                marginTop:
                  10,
              }}
            >
              Registrada em{' '}
              {formatarData(
                item.dataOcorrencia
              )}
            </Text>

            {item.respostaGestor ? (

              <View
                style={[
                  styles.managerResponse,
                  {
                    backgroundColor:
                      colors
                        .background,

                    borderColor:
                      colors
                        .border,
                  },
                ]}
              >

                <Text
                  style={{
                    color:
                      colors
                        .success,

                    fontWeight:
                      '900',

                    marginBottom:
                      5,
                  }}
                >
                  Resposta do gestor
                </Text>

                <Text
                  style={{
                    color:
                      colors
                        .textSecondary,

                    lineHeight:
                      20,
                  }}
                >
                  {item.respostaGestor}
                </Text>

              </View>

            ) : null}

            {item.status ===
              'PENDENTE' &&
            item.id ? (

              <View
                style={
                  styles.cardActions
                }
              >

                <PrimaryButton
                  colors={colors}
                  title="Editar"
                  variant="outline"
                  onPress={() =>
                    editarOcorrencia(
                      item
                    )
                  }
                />

              </View>

            ) : null}

          </Card>

        )
      )}

      {!loading &&
      ocorrenciasFiltradas.length ===
        0 ? (

        <Card colors={colors}>

          <Text
            style={{
              color:
                colors
                  .textSecondary,
            }}
          >
            Nenhuma ocorrência encontrada com os filtros atuais.
          </Text>

        </Card>

      ) : null}

    </Screen>
  );
};

const styles =
  StyleSheet.create({

    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginBottom: 4,
    },

    statCard: {
      width: '48%',
      minHeight: 98,
      justifyContent:
        'space-between',
    },

    statLabel: {
      fontSize: 11,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    statValue: {
      fontSize: 30,
      fontWeight: '900',
      marginTop: 8,
    },

    formCard: {
      marginTop: 14,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      marginBottom: 14,
    },

    label: {
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 6,
      marginTop: 12,
    },

    selector: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent:
        'space-between',
      gap: 10,
    },

    studentBox: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 10,
      marginTop: 8,
      maxHeight: 330,
    },

    studentRow: {
      minHeight: 54,
      borderBottomWidth:
        StyleSheet
          .hairlineWidth,
      justifyContent:
        'center',
      paddingVertical: 8,
    },

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      fontSize: 14,
    },

    textarea: {
      minHeight: 120,
      paddingTop: 12,
      textAlignVertical:
        'top',
      marginBottom: 14,
    },

    chips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    chip: {
      minHeight: 36,
      borderWidth: 1,
      borderRadius: 999,
      paddingHorizontal: 12,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    error: {
      marginTop: 12,
      marginBottom: 4,
      fontWeight: '700',
    },

    search: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      marginTop: 16,
      marginBottom: 12,
    },

    filterTitle: {
      fontSize: 12,
      fontWeight: '900',
      marginTop: 4,
      marginBottom: 7,
    },

    listTitle: {
      fontSize: 17,
      fontWeight: '900',
      marginTop: 20,
      marginBottom: 10,
    },

    cardTop: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },

    studentName: {
      fontSize: 16,
      fontWeight: '900',
    },

    ocTitle: {
      fontSize: 14,
      fontWeight: '800',
      marginTop: 3,
    },

    metaRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 10,
      marginTop: 12,
    },

    description: {
      lineHeight: 21,
      marginTop: 12,
    },

    managerResponse: {
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginTop: 12,
    },

    cardActions: {
      marginTop: 14,
    },
  });