import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Platform,
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
  atualizarNota,
  cadastrarNota,
  excluirNota,
  getNotasPorVinculo,
  getProfessorAlunos,
  getProfessorTurmas,
} from '../../services/professorService';

import {
  AlunoProfessor,
  NotaProfessor,
  TurmaProfessor,
} from '../../types/professor';

function dataLocalISO() {
  const agora = new Date();

  const ano =
    agora.getFullYear();

  const mes =
    String(
      agora.getMonth() + 1
    ).padStart(2, '0');

  const dia =
    String(
      agora.getDate()
    ).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarData(
  valor?: string | null
) {
  if (!valor) {
    return '—';
  }

  const partes =
    valor
      .slice(0, 10)
      .split('-');

  if (partes.length !== 3) {
    return valor;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function numeroInput(
  valor: string
) {
  return valor
    .replace(',', '.')
    .replace(
      /[^0-9.]/g,
      ''
    );
}

export const ProfessorNotesScreen:
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

  const turmaInicial =
    Number(
      route.params?.turmaId
    ) || null;

  const [
    turmas,
    setTurmas,
  ] =
    useState<TurmaProfessor[]>([]);

  const [
    alunos,
    setAlunos,
  ] =
    useState<AlunoProfessor[]>([]);

  const [
    notas,
    setNotas,
  ] =
    useState<NotaProfessor[]>([]);

  const [
    vinculoSelecionado,
    setVinculoSelecionado,
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
    editandoId,
    setEditandoId,
  ] =
    useState<number | null>(
      null
    );

  const [
    titulo,
    setTitulo,
  ] =
    useState('');

  const [
    nota,
    setNota,
  ] =
    useState('');

  const [
    notaMaxima,
    setNotaMaxima,
  ] =
    useState('10');

  const [
    bimestre,
    setBimestre,
  ] =
    useState(1);

  const [
    observacao,
    setObservacao,
  ] =
    useState('');

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

  const turmaSelecionada =
    useMemo(
      () =>
        turmas.find(
          (item) =>
            item
              .turmaDisciplinaId ===
            vinculoSelecionado
        ) ?? null,
      [
        turmas,
        vinculoSelecionado,
      ]
    );

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

  const notasFiltradas =
    useMemo(() => {
      if (!alunoSelecionado) {
        return notas;
      }

      return notas.filter(
        (item) =>
          item.alunoId ===
          alunoSelecionado
      );
    }, [
      notas,
      alunoSelecionado,
    ]);

  function limparFormulario() {
    setEditandoId(null);
    setTitulo('');
    setNota('');
    setNotaMaxima('10');
    setBimestre(1);
    setObservacao('');
  }

  const carregarVinculo =
    useCallback(
      async (
        vinculo: TurmaProfessor,
        alunoPreferido?:
          number | null
      ) => {

        try {
          setLoading(true);
          setErro('');

          setVinculoSelecionado(
            vinculo
              .turmaDisciplinaId
          );

          const [
            alunosData,
            notasData,
          ] =
            await Promise.all([
              getProfessorAlunos(
                vinculo.turmaId
              ),

              getNotasPorVinculo(
                vinculo
                  .turmaDisciplinaId
              ),
            ]);

          setAlunos(
            alunosData
          );

          setNotas(
            notasData
          );

          const preferido =
            alunoPreferido ??
            alunoSelecionado;

          if (
            preferido &&
            alunosData.some(
              (item) =>
                item.alunoId ===
                preferido
            )
          ) {
            setAlunoSelecionado(
              preferido
            );
          } else {
            setAlunoSelecionado(
              null
            );
          }

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
      [alunoSelecionado]
    );

  const carregarTela =
    useCallback(
      async () => {

        try {
          setLoading(true);
          setErro('');

          const turmasData =
            await getProfessorTurmas();

          setTurmas(
            turmasData
          );

          if (
            turmasData.length === 0
          ) {
            setVinculoSelecionado(
              null
            );

            setAlunos([]);
            setNotas([]);

            return;
          }

          let inicial:
            TurmaProfessor |
            undefined;

          if (turmaInicial) {
            inicial =
              turmasData.find(
                (item) =>
                  item.turmaId ===
                  turmaInicial
              );
          }

          if (!inicial) {
            inicial =
              turmasData[0];
          }

          await carregarVinculo(
            inicial,
            alunoInicial
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
      [
        turmaInicial,
        alunoInicial,
        carregarVinculo,
      ]
    );

  useFocusEffect(
    useCallback(() => {
      void carregarTela();
    }, [carregarTela])
  );

  async function selecionarTurma(
    turma: TurmaProfessor
  ) {
    limparFormulario();

    await carregarVinculo(
      turma,
      null
    );
  }

  function selecionarAluno(
    alunoId: number
  ) {
    limparFormulario();

    setAlunoSelecionado(
      alunoId
    );
  }

  function editar(
    item: NotaProfessor
  ) {
    setEditandoId(
      item.id ?? null
    );

    setAlunoSelecionado(
      item.alunoId
    );

    setTitulo(
      item.titulo ?? ''
    );

    setNota(
      String(
        item.nota ?? ''
      )
    );

    setNotaMaxima(
      String(
        item.notaMaxima ?? 10
      )
    );

    setBimestre(
      item.bimestre ?? 1
    );

    setObservacao(
      item.observacao ?? ''
    );
  }

  async function salvar() {
    if (
      !vinculoSelecionado
    ) {
      Alert.alert(
        'Atenção',
        'Selecione uma turma.'
      );

      return;
    }

    if (!alunoSelecionado) {
      Alert.alert(
        'Atenção',
        'Selecione um aluno.'
      );

      return;
    }

    if (!titulo.trim()) {
      Alert.alert(
        'Atenção',
        'Informe o título da avaliação.'
      );

      return;
    }

    if (
      titulo.trim().length >
      100
    ) {
      Alert.alert(
        'Atenção',
        'O título deve possuir no máximo 100 caracteres.'
      );

      return;
    }

    if (!nota.trim()) {
      Alert.alert(
        'Atenção',
        'Informe a nota.'
      );

      return;
    }

    const valorNota =
      Number(
        nota.replace(',', '.')
      );

    const valorMaximo =
      Number(
        notaMaxima
          .replace(',', '.')
      );

    if (
      Number.isNaN(
        valorNota
      ) ||
      Number.isNaN(
        valorMaximo
      )
    ) {
      Alert.alert(
        'Atenção',
        'Informe valores numéricos válidos.'
      );

      return;
    }

    if (
      valorMaximo <= 0
    ) {
      Alert.alert(
        'Atenção',
        'A nota máxima deve ser maior que zero.'
      );

      return;
    }

    if (
      valorNota < 0 ||
      valorNota >
        valorMaximo
    ) {
      Alert.alert(
        'Atenção',
        `A nota deve estar entre 0 e ${valorMaximo}.`
      );

      return;
    }

    if (
      observacao.length >
      500
    ) {
      Alert.alert(
        'Atenção',
        'A observação deve possuir no máximo 500 caracteres.'
      );

      return;
    }

    const payload:
      NotaProfessor = {
        alunoId:
          alunoSelecionado,

        turmaDisciplinaId:
          vinculoSelecionado,

        titulo:
          titulo.trim(),

        nota:
          valorNota,

        notaMaxima:
          valorMaximo,

        bimestre,

        observacao:
          observacao.trim() ||
          null,

        dataAvaliacao:
          dataLocalISO(),
      };

    try {
      setSalvando(true);
      setErro('');

      if (editandoId) {
        await atualizarNota(
          editandoId,
          payload
        );
      } else {
        await cadastrarNota(
          payload
        );
      }

      const atualizadas =
        await getNotasPorVinculo(
          vinculoSelecionado
        );

      setNotas(
        atualizadas
      );

      limparFormulario();

      Alert.alert(
        'Notas',
        editandoId
          ? 'Nota atualizada com sucesso.'
          : 'Nota cadastrada com sucesso.'
      );

    } catch (error) {

      Alert.alert(
        'Erro ao salvar nota',
        getApiErrorMessage(
          error
        )
      );

    } finally {
      setSalvando(false);
    }
  }

  async function executarExclusao(
    notaId: number
  ) {
    try {
      setSalvando(true);

      await excluirNota(
        notaId
      );

      setNotas(
        (atuais) =>
          atuais.filter(
            (item) =>
              item.id !==
              notaId
          )
      );

      if (
        editandoId === notaId
      ) {
        limparFormulario();
      }

      if (
        Platform.OS ===
        'web'
      ) {
        window.alert(
          'Nota excluída com sucesso.'
        );
      } else {
        Alert.alert(
          'Notas',
          'Nota excluída com sucesso.'
        );
      }

    } catch (error) {

      Alert.alert(
        'Erro ao excluir nota',
        getApiErrorMessage(
          error
        )
      );

    } finally {
      setSalvando(false);
    }
  }

  function confirmarExclusao(
    item: NotaProfessor
  ) {
    if (!item.id) {
      return;
    }

    if (
      Platform.OS ===
      'web'
    ) {
      const confirmou =
        window.confirm(
          `Excluir a avaliação "${item.titulo}"?`
        );

      if (confirmou) {
        void executarExclusao(
          item.id
        );
      }

      return;
    }

    Alert.alert(
      'Excluir nota',
      `Deseja excluir "${item.titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            void executarExclusao(
              item.id!
            );
          },
        },
      ]
    );
  }

  if (
    loading &&
    turmas.length === 0
  ) {
    return (
      <Screen
        colors={colors}
      >
        <View
          style={
            styles.loading
          }
        >
          <ActivityIndicator
            size="large"
            color={
              colors.primary
            }
          />

          <Text
            style={{
              color:
                colors
                  .textSecondary,
              marginTop: 12,
            }}
          >
            Carregando notas...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      colors={colors}
      title="NOTAS"
      subtitle={
        'Lance e acompanhe as avaliações dos seus alunos.'
      }
      refreshing={loading}
      onRefresh={
        carregarTela
      }
    >

      {erro ? (
        <Card
          colors={colors}
        >
          <Text
            style={{
              color:
                colors.danger,
              fontWeight: '800',
            }}
          >
            {erro}
          </Text>
        </Card>
      ) : null}

      {/* TURMAS */}

      <Text
        style={[
          styles.sectionTitle,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        Turma e disciplina
      </Text>

      {turmas.length === 0 ? (
        <Card
          colors={colors}
        >
          <Text
            style={{
              color:
                colors
                  .textSecondary,
            }}
          >
            Nenhuma turma vinculada ao professor.
          </Text>
        </Card>
      ) : (
        <View
          style={
            styles.options
          }
        >
          {turmas.map(
            (turma) => {

              const selecionada =
                turma
                  .turmaDisciplinaId ===
                vinculoSelecionado;

              return (
                <Pressable
                  key={
                    turma
                      .turmaDisciplinaId
                  }
                  onPress={() =>
                    void selecionarTurma(
                      turma
                    )
                  }
                  style={[
                    styles.optionCard,
                    {
                      borderColor:
                        selecionada
                          ? colors.primary
                          : colors.border,

                      backgroundColor:
                        selecionada
                          ? colors.primaryLight
                          : colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        selecionada
                          ? colors.primary
                          : colors
                              .textPrimary,

                      fontWeight:
                        '900',
                    }}
                  >
                    {
                      turma.nomeTurma
                    }
                  </Text>

                  <Text
                    style={{
                      color:
                        colors
                          .textSecondary,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {
                      turma.disciplina
                    }
                  </Text>
                </Pressable>
              );
            }
          )}
        </View>
      )}

      {/* ALUNOS */}

      {vinculoSelecionado ? (
        <>
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
            Aluno
          </Text>

          {alunos.length === 0 ? (
            <Card
              colors={colors}
            >
              <Text
                style={{
                  color:
                    colors
                      .textSecondary,
                }}
              >
                Nenhum aluno encontrado nesta turma.
              </Text>
            </Card>
          ) : (
            <View
              style={
                styles.options
              }
            >
              {alunos.map(
                (aluno) => {

                  const selecionado =
                    aluno.alunoId ===
                    alunoSelecionado;

                  return (
                    <Pressable
                      key={
                        aluno.alunoId
                      }
                      onPress={() =>
                        selecionarAluno(
                          aluno.alunoId
                        )
                      }
                      style={[
                        styles.studentOption,
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
                      <View
                        style={{ flex: 1 }}
                      >
                        <Text
                          style={{
                            color:
                              selecionado
                                ? colors.primary
                                : colors
                                    .textPrimary,

                            fontWeight:
                              '800',
                          }}
                        >
                          {
                            aluno.nome
                          }
                        </Text>

                        <Text
                          style={{
                            color:
                              colors
                                .textSecondary,
                            fontSize: 11,
                            marginTop: 3,
                          }}
                        >
                          RA{' '}
                          {
                            aluno.matricula
                          }
                        </Text>
                      </View>

                      {selecionado ? (
                        <Pill
                          colors={colors}
                          tone="success"
                        >
                          Selecionado
                        </Pill>
                      ) : null}
                    </Pressable>
                  );
                }
              )}
            </View>
          )}
        </>
      ) : null}

      {/* FORMULÁRIO */}

      {alunoSelecionado ? (
        <>
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
              ? 'Editar nota'
              : 'Nova avaliação'}
          </Text>

          <Card
            colors={colors}
          >
            <Text
              style={[
                styles.formInfo,
                {
                  color:
                    colors
                      .textSecondary,
                },
              ]}
            >
              {alunoAtual?.nome}
              {' • '}
              {
                turmaSelecionada
                  ?.disciplina
              }
            </Text>

            <Campo
              colors={colors}
              label="Título da avaliação"
              value={titulo}
              onChangeText={
                setTitulo
              }
              placeholder="Ex.: Prova 1"
              maxLength={100}
            />

            <View
              style={
                styles.row
              }
            >
              <View
                style={{ flex: 1 }}
              >
                <Campo
                  colors={colors}
                  label="Nota"
                  value={nota}
                  onChangeText={(
                    valor: string
                    ) =>
                    setNota(
                        numeroInput(valor)
                    )
                    }
                  placeholder="0"
                  keyboardType="decimal-pad"
                />
              </View>

              <View
                style={{ flex: 1 }}
              >
                <Campo
                  colors={colors}
                  label="Nota máxima"
                  value={
                    notaMaxima
                  }
                  onChangeText={(
                    valor: string
                    ) =>
                    setNotaMaxima(
                        numeroInput(valor)
                    )
                    }
                  placeholder="10"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text
              style={[
                styles.label,
                {
                  color:
                    colors
                      .textPrimary,
                },
              ]}
            >
              Bimestre
            </Text>

            <View
              style={
                styles.bimestres
              }
            >
              {[1, 2, 3, 4].map(
                (numero) => {

                  const ativo =
                    bimestre ===
                    numero;

                  return (
                    <Pressable
                      key={numero}
                      onPress={() =>
                        setBimestre(
                          numero
                        )
                      }
                      style={[
                        styles.bimestre,
                        {
                          borderColor:
                            ativo
                              ? colors.primary
                              : colors.border,

                          backgroundColor:
                            ativo
                              ? colors.primary
                              : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color:
                            ativo
                              ? colors.white
                              : colors
                                  .textPrimary,

                          fontWeight:
                            '900',
                        }}
                      >
                        {numero}º
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Campo
              colors={colors}
              label="Observação"
              value={
                observacao
              }
              onChangeText={
                setObservacao
              }
              placeholder="Observação opcional"
              multiline
              maxLength={500}
            />

            <PrimaryButton
              colors={colors}
              title={
                editandoId
                  ? 'Salvar alterações'
                  : 'Cadastrar nota'
              }
              onPress={salvar}
              loading={
                salvando
              }
            />

            {editandoId ? (
              <View
                style={{
                  marginTop: 10,
                }}
              >
                <PrimaryButton
                  colors={colors}
                  title="Cancelar edição"
                  variant="outline"
                  onPress={
                    limparFormulario
                  }
                  disabled={
                    salvando
                  }
                />
              </View>
            ) : null}
          </Card>
        </>
      ) : null}

      {/* NOTAS */}

      <Text
        style={[
          styles.sectionTitle,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        Avaliações
      </Text>

      {notasFiltradas.length ===
      0 ? (
        <Card
          colors={colors}
        >
          <Text
            style={{
              color:
                colors
                  .textSecondary,
              textAlign: 'center',
            }}
          >
            {alunoSelecionado
              ? 'Nenhuma nota cadastrada para este aluno.'
              : 'Selecione um aluno para visualizar suas notas.'}
          </Text>
        </Card>
      ) : (
        notasFiltradas.map(
          (item) => (
            <Card
              colors={colors}
              key={item.id}
            >
              <View
                style={
                  styles.noteHeader
                }
              >
                <View
                  style={{ flex: 1 }}
                >
                  <Text
                    style={[
                      styles.noteTitle,
                      {
                        color:
                          colors
                            .textPrimary,
                      },
                    ]}
                  >
                    {item.titulo}
                  </Text>

                  <Text
                    style={{
                      color:
                        colors
                          .textSecondary,
                      fontSize: 12,
                      marginTop: 3,
                    }}
                  >
                    {
                      item.alunoNome
                    }
                  </Text>
                </View>

                <View
                  style={
                    styles.grade
                  }
                >
                  <Text
                    style={{
                      color:
                        colors.primary,
                      fontWeight: '900',
                      fontSize: 20,
                    }}
                  >
                    {item.nota}
                  </Text>

                  <Text
                    style={{
                      color:
                        colors
                          .textSecondary,
                      fontSize: 11,
                    }}
                  >
                    /{' '}
                    {
                      item
                        .notaMaxima
                    }
                  </Text>
                </View>
              </View>

              <View
                style={
                  styles.meta
                }
              >
                <Pill
                  colors={colors}
                >
                  {item.bimestre}º bimestre
                </Pill>

                <Text
                  style={{
                    color:
                      colors
                        .textSecondary,
                    fontSize: 12,
                  }}
                >
                  {formatarData(
                    item
                      .dataAvaliacao
                  )}
                </Text>
              </View>

              {item.observacao ? (
                <Text
                  style={[
                    styles.observation,
                    {
                      color:
                        colors
                          .textSecondary,
                    },
                  ]}
                >
                  {item.observacao}
                </Text>
              ) : null}

              <View
                style={
                  styles.actions
                }
              >
                <Pressable
                  onPress={() =>
                    editar(item)
                  }
                  style={[
                    styles.actionButton,
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
                    Editar
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() =>
                    confirmarExclusao(
                      item
                    )
                  }
                  style={[
                    styles.actionButton,
                    {
                      borderColor:
                        colors.danger,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color:
                        colors.danger,
                      fontWeight: '900',
                    }}
                  >
                    Excluir
                  </Text>
                </Pressable>
              </View>
            </Card>
          )
        )
      )}
    </Screen>
  );
};

function Campo({
  colors,
  label,
  multiline = false,
  ...props
}: any) {
  return (
    <View
      style={{
        marginBottom: 14,
      }}
    >
      <Text
        style={[
          styles.label,
          {
            color:
              colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>

      <TextInput
        {...props}
        multiline={
          multiline
        }
        placeholderTextColor={
          colors.textSoft
        }
        style={[
          styles.input,
          multiline &&
            styles.multiline,
          {
            color:
              colors.textPrimary,

            borderColor:
              colors.border,

            backgroundColor:
              colors.background,
          },
        ]}
      />
    </View>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      minHeight: 450,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    sectionTitle: {
      fontSize: 17,
      fontWeight: '900',
      marginTop: 12,
      marginBottom: 10,
    },

    options: {
      gap: 8,
      marginBottom: 8,
    },

    optionCard: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },

    studentOption: {
      borderWidth: 1,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    formInfo: {
      fontSize: 12,
      marginBottom: 15,
      fontWeight: '700',
    },

    label: {
      fontSize: 12,
      fontWeight: '800',
      marginBottom: 7,
    },

    input: {
      minHeight: 48,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 10,
      fontSize: 14,
    },

    multiline: {
      minHeight: 90,
      textAlignVertical:
        'top',
    },

    row: {
      flexDirection: 'row',
      gap: 10,
    },

    bimestres: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 16,
    },

    bimestre: {
      flex: 1,
      minHeight: 42,
      borderRadius: 11,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    noteHeader: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },

    noteTitle: {
      fontSize: 16,
      fontWeight: '900',
    },

    grade: {
      flexDirection: 'row',
      alignItems: 'baseline',
    },

    meta: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop: 12,
    },

    observation: {
      fontSize: 13,
      lineHeight: 19,
      marginTop: 12,
    },

    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 15,
    },

    actionButton: {
      flex: 1,
      minHeight: 42,
      borderWidth: 1,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent:
        'center',
    },
  });