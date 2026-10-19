import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import {
  useRoute,
} from '@react-navigation/native';

import {
  Card,
  Pill,
  PrimaryButton,
  Screen,
} from '../../components/UI';

import {
  getTheme,
} from '../../theme';

import {
  useAppSettings,
} from '../../context/AppSettingsContext';

import {
  getApiErrorMessage,
} from '../../services/api';

import {
  abrirChamada,
  confirmarBiometria,
  encerrarChamada,
  getAlunosDaChamada,
  getBiometriasPendentes,
  getChamadaAberta,
  getPresencasDaAula,
  getProfessorTurmas,
  recusarBiometria,
  registrarPresencaManual,
} from '../../services/professorService';

import {
  ChamadaAbertaProfessor,
  SolicitacaoBiometricaProfessor,
  TurmaProfessor,
} from '../../types/professor';

import {
  Platform
} from 'react-native';

interface AlunoChamadaView {
  alunoId: number;
  nome: string;

  status: string;

  metodo?: string | null;

  validacaoBiometrica: boolean;

  solicitacaoBiometrica?:
    SolicitacaoBiometricaProfessor | null;
}

function normalizarStatus(
  status?: string | null
) {
  const valor =
    String(status ?? '')
      .trim()
      .toUpperCase()
      .replaceAll('-', '_');

  if (
    valor === 'PRESENTE'
  ) {
    return 'PRESENTE';
  }

  if (
    valor === 'AUSENTE' ||
    valor === 'FALTA'
  ) {
    return 'AUSENTE';
  }

  if (
    valor === 'ATRASADO'
  ) {
    return 'ATRASADO';
  }

  if (
    valor === 'SAIDA_TEMPORARIA'
  ) {
    return 'SAIDA_TEMPORARIA';
  }

  return 'NAO_REGISTRADO';
}

function formatarStatus(
  status?: string | null
) {
  switch (
    normalizarStatus(status)
  ) {
    case 'PRESENTE':
      return 'Presente';

    case 'AUSENTE':
      return 'Ausente';

    case 'ATRASADO':
      return 'Atrasado';

    case 'SAIDA_TEMPORARIA':
      return 'Saída temporária';

    default:
      return 'Não registrado';
  }
}

function normalizarStatusBiometria(
  valor?: string | null
) {
  const status =
    String(valor ?? 'PENDENTE')
      .trim()
      .toUpperCase()
      .replaceAll('-', '_');

  if (
    [
      'PENDENTE',
      'AGUARDANDO',
      'AGUARDANDO_CONFIRMACAO',
    ].includes(status)
  ) {
    return 'PENDENTE';
  }

  if (
    [
      'CONFIRMADA',
      'CONFIRMADO',
      'APROVADA',
      'APROVADO',
    ].includes(status)
  ) {
    return 'CONFIRMADA';
  }

  if (
    [
      'RECUSADA',
      'RECUSADO',
      'REJEITADA',
      'REJEITADO',
    ].includes(status)
  ) {
    return 'RECUSADA';
  }

  return status;
}

export const ProfessorCallScreen:
React.FC = () => {

  const route =
    useRoute<any>();

  const { darkMode } =
    useAppSettings();

  const colors =
    getTheme(darkMode);

  const turmaDisciplinaInicial =
    Number(
      route.params
        ?.turmaDisciplinaId
    ) || null;

  const [
    turmas,
    setTurmas,
  ] =
    useState<TurmaProfessor[]>([]);

  const [
    turmaSelecionada,
    setTurmaSelecionada,
  ] =
    useState<number | null>(
      turmaDisciplinaInicial
    );

  const [
    chamada,
    setChamada,
  ] =
    useState<
      ChamadaAbertaProfessor | null
    >(null);

  const [
    alunos,
    setAlunos,
  ] =
    useState<
      AlunoChamadaView[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    processando,
    setProcessando,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState('');

  /*
   * Carrega alunos + presença +
   * solicitações biométricas.
   */
  const carregarAlunos =
    useCallback(
      async (
        chamadaAtual:
          ChamadaAbertaProfessor,
        silencioso = false
      ) => {

        const aulaId =
          Number(
            chamadaAtual.aulaId ??
            (chamadaAtual as any).id
          );

        if (!aulaId) {
          return;
        }

        try {
          const [
            alunosData,
            presencasData,
            biometriaData,
          ] =
            await Promise.all([
              getAlunosDaChamada(
                aulaId
              ),

              getPresencasDaAula(
                aulaId
              ).catch(
                () => []
              ),

              getBiometriasPendentes()
                .catch(
                  () => []
                ),
            ]);

          const presencas =
            new Map<
              number,
              any
            >();

          for (
            const presenca
            of presencasData
          ) {
            presencas.set(
              Number(
                presenca.alunoId
              ),
              presenca
            );
          }

          const pendencias =
            new Map<
              number,
              SolicitacaoBiometricaProfessor
            >();

          for (
            const solicitacao
            of biometriaData
          ) {
            const solicitacaoAulaId =
              Number(
                solicitacao.aulaId ??
                (solicitacao as any)
                  ?.aula?.id
              );

            /*
             * Mantemos apenas
             * solicitações desta aula.
             */
            if (
              solicitacaoAulaId &&
              solicitacaoAulaId !==
                aulaId
            ) {
              continue;
            }

            const status =
              normalizarStatusBiometria(
                solicitacao.status
              );

            if (
              status !==
              'PENDENTE'
            ) {
              continue;
            }

            const alunoId =
              Number(
                solicitacao
                  .alunoId ??
                (solicitacao as any)
                  ?.aluno?.id
              );

            if (alunoId) {
              pendencias.set(
                alunoId,
                solicitacao
              );
            }
          }

          const resultado:
            AlunoChamadaView[] =
            alunosData.map(
              (aluno: any) => {

                const alunoId =
                  Number(
                    aluno.alunoId ??
                    aluno.id
                  );

                const presenca =
                  presencas.get(
                    alunoId
                  );

                const status =
                  presenca?.status ??
                  aluno.status ??
                  aluno.statusPresenca ??
                  aluno.presencaStatus ??
                  aluno.situacao ??
                  aluno.presenca
                    ?.status ??
                  'NAO_REGISTRADO';

                const metodo =
                  presenca?.metodo ??
                  aluno.metodo ??
                  aluno.presenca
                    ?.metodo ??
                  null;

                const validacao =
                  Boolean(
                    presenca
                      ?.validacaoBiometrica ??
                    aluno
                      .validacaoBiometrica
                  );

                return {
                  alunoId,

                  nome:
                    aluno.nome ??
                    aluno.nomeAluno ??
                    'Aluno',

                  status:
                    normalizarStatus(
                      status
                    ),

                  metodo,

                  validacaoBiometrica:
                    validacao,

                  solicitacaoBiometrica:
                    pendencias.get(
                      alunoId
                    ) ?? null,
                };
              }
            );

          setAlunos(
            resultado
          );

        } catch (error) {

          if (!silencioso) {
            setErro(
              getApiErrorMessage(
                error
              )
            );
          }
        }

      },
      []
    );

  /*
   * Carregamento inicial.
   */
  const carregarTela =
    useCallback(
      async () => {

        try {
          setLoading(true);
          setErro('');

          const [
            turmasData,
            chamadaAberta,
          ] =
            await Promise.all([
              getProfessorTurmas(),

              getChamadaAberta(),
            ]);

          setTurmas(
            turmasData
          );

          if (
            chamadaAberta
          ) {
            setChamada(
              chamadaAberta
            );

            const vinculoId =
              Number(
                chamadaAberta
                  .turmaDisciplinaId ??
                (chamadaAberta as any)
                  ?.turmaDisciplina
                  ?.id
              );

            if (vinculoId) {
              setTurmaSelecionada(
                vinculoId
              );
            }

            await carregarAlunos(
              chamadaAberta
            );

          } else {
            setChamada(null);
            setAlunos([]);
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
      [carregarAlunos]
    );

  useEffect(() => {
    carregarTela();
  }, [carregarTela]);

  /*
   * Atualização automática enquanto
   * a chamada estiver aberta.
   */
  useEffect(() => {

    if (!chamada) {
      return;
    }

    const intervalo =
      setInterval(() => {
        carregarAlunos(
          chamada,
          true
        );
      }, 5000);

    return () => {
      clearInterval(
        intervalo
      );
    };

  }, [
    chamada,
    carregarAlunos,
  ]);

  async function handleAbrir() {

    if (!turmaSelecionada) {
      Alert.alert(
        'Atenção',
        'Selecione uma turma e disciplina.'
      );

      return;
    }

    try {
      setProcessando(true);
      setErro('');

      const novaChamada =
        await abrirChamada(
          turmaSelecionada
        );

      setChamada(
        novaChamada
      );

      await carregarAlunos(
        novaChamada
      );

      Alert.alert(
        'Chamada',
        'Chamada aberta com sucesso.'
      );

    } catch (error) {

      Alert.alert(
        'Não foi possível abrir a chamada',
        getApiErrorMessage(
          error
        )
      );

      /*
       * Caso o backend informe
       * que já existe chamada,
       * tenta recuperá-la.
       */
      try {
        const existente =
          await getChamadaAberta();

        if (existente) {
          setChamada(
            existente
          );

          await carregarAlunos(
            existente
          );
        }
      } catch {
        // Nada a fazer.
      }

    } finally {
      setProcessando(false);
    }
  }

  async function executarEncerramento() {
  if (!chamada || processando) {
    return;
  }

  try {
    setProcessando(true);
    setErro('');

    const aulaId = Number(
      chamada.aulaId ??
      (chamada as any).id
    );

    if (!aulaId) {
      throw new Error(
        'Não foi possível identificar a aula.'
      );
    }

    console.log(
      'Encerrando aula:',
      aulaId
    );

    await encerrarChamada(aulaId);

    /*
     * Confirma com o backend que não existe
     * mais chamada aberta.
     */
    const chamadaRestante =
      await getChamadaAberta();

    if (chamadaRestante) {
      setChamada(chamadaRestante);

      await carregarAlunos(
        chamadaRestante
      );

      throw new Error(
        'A chamada ainda consta como aberta no servidor.'
      );
    }

    setChamada(null);
    setAlunos([]);
    setTurmaSelecionada(null);

    if (Platform.OS === 'web') {
      window.alert(
        'Chamada encerrada com sucesso.'
      );
    } else {
      Alert.alert(
        'Chamada',
        'Chamada encerrada com sucesso.'
      );
    }

  } catch (error) {
    console.error(
      'Erro ao encerrar chamada:',
      error
    );

    const mensagem =
      getApiErrorMessage(error);

    setErro(mensagem);

    if (Platform.OS === 'web') {
      window.alert(mensagem);
    } else {
      Alert.alert(
        'Erro ao encerrar chamada',
        mensagem
      );
    }

  } finally {
    setProcessando(false);
  }
}

function handleEncerrar() {
  if (!chamada || processando) {
    return;
  }

  /*
   * React Native Web não trata o Alert
   * com callbacks exatamente como Android/iOS.
   */
  if (Platform.OS === 'web') {
    const confirmou =
      window.confirm(
        'Deseja realmente encerrar esta chamada?'
      );

    if (confirmou) {
      void executarEncerramento();
    }

    return;
  }

  Alert.alert(
    'Encerrar chamada',
    'Deseja realmente encerrar esta chamada?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Encerrar',
        style: 'destructive',
        onPress: () => {
          void executarEncerramento();
        },
      },
    ]
  );
}

  async function alterarPresenca(
  alunoId: number,
  status: 'PRESENTE' | 'AUSENTE'
) {
  if (!chamada || processando) {
    return;
  }

  const aulaId = Number(
    chamada.aulaId ??
    (chamada as any).id
  );

  if (!aulaId) {
    Alert.alert(
      'Presença',
      'Não foi possível identificar a aula.'
    );

    return;
  }

  /*
   * Guarda o estado anterior caso o backend
   * rejeite a alteração.
   */
  const estadoAnterior = alunos;

  /*
   * Atualiza a interface IMEDIATAMENTE.
   */
  setAlunos((atuais) =>
    atuais.map((aluno) =>
      aluno.alunoId === alunoId
        ? {
            ...aluno,
            status,
            metodo: 'MANUAL',
            validacaoBiometrica: false,
          }
        : aluno
    )
  );

  try {
    setProcessando(true);
    setErro('');

    console.log(
      'Registrando presença:',
      {
        aulaId,
        alunoId,
        status,
      }
    );

    await registrarPresencaManual(
      aulaId,
      alunoId,
      status
    );

    /*
     * Depois da atualização visual,
     * confirma os dados reais do banco.
     */
    await carregarAlunos(
      chamada,
      true
    );

  } catch (error) {
    /*
     * Se falhou no backend, desfaz
     * a alteração visual.
     */
    setAlunos(estadoAnterior);

    console.error(
      'Erro ao registrar presença:',
      error
    );

    Alert.alert(
      'Não foi possível atualizar a presença',
      getApiErrorMessage(error)
    );

  } finally {
    setProcessando(false);
  }
}

  async function confirmar(
    solicitacao:
      SolicitacaoBiometricaProfessor
  ) {

    try {
      setProcessando(true);

      await confirmarBiometria(
        solicitacao.id
      );

      if (chamada) {
        await carregarAlunos(
          chamada
        );
      }

      Alert.alert(
        'Biometria',
        'Presença biométrica confirmada.'
      );

    } catch (error) {

      Alert.alert(
        'Biometria',
        getApiErrorMessage(
          error
        )
      );

    } finally {
      setProcessando(false);
    }
  }

  function recusar(
    solicitacao:
      SolicitacaoBiometricaProfessor
  ) {

    Alert.alert(
      'Recusar biometria',
      'O aluno poderá realizar uma nova tentativa.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Recusar',
          style: 'destructive',

          onPress: async () => {
            try {
              setProcessando(true);

              await recusarBiometria(
                solicitacao.id
              );

              if (chamada) {
                await carregarAlunos(
                  chamada
                );
              }

              Alert.alert(
                'Biometria',
                'Validação biométrica recusada.'
              );

            } catch (error) {

              Alert.alert(
                'Biometria',
                getApiErrorMessage(
                  error
                )
              );

            } finally {
              setProcessando(
                false
              );
            }
          },
        },
      ]
    );
  }

  /*
   * CONTADORES
   */
  const resumo =
    useMemo(() => {

      const total =
        alunos.length;

      const presentes =
        alunos.filter(
          (aluno) =>
            normalizarStatus(
              aluno.status
            ) ===
            'PRESENTE'
        ).length;

      const atrasados =
        alunos.filter(
          (aluno) =>
            normalizarStatus(
              aluno.status
            ) ===
            'ATRASADO'
        ).length;

      /*
       * Aluno sem registro conta
       * como ausente durante
       * chamada aberta.
       */
      const ausentes =
        Math.max(
          0,
          total -
          presentes -
          atrasados
        );

      const biometria =
        alunos.filter(
          (aluno) =>
            String(
              aluno.metodo ?? ''
            )
              .toUpperCase() ===
              'BIOMETRIA'
            &&
            aluno
              .validacaoBiometrica
        ).length;

      const pendentes =
        alunos.filter(
          (aluno) =>
            Boolean(
              aluno
                .solicitacaoBiometrica
            )
        ).length;

      const manual =
        alunos.filter(
          (aluno) =>
            String(
              aluno.metodo ?? ''
            )
              .toUpperCase() ===
              'MANUAL'
        ).length;

      return {
        total,
        presentes,
        ausentes,
        atrasados,
        biometria,
        pendentes,
        manual,
      };

    }, [alunos]);

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
            Carregando chamada...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      colors={colors}
      title="CHAMADA"
      subtitle={
        'Abra uma aula e registre a presença dos alunos.'
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

      {/* CONFIGURAÇÃO */}

      <Card
        colors={colors}
      >
        <View
          style={
            styles.headerRow
          }
        >
          <View
            style={{ flex: 1 }}
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
              {chamada
                ? 'Chamada em andamento'
                : 'Nova chamada'}
            </Text>

            <Text
              style={[
                styles.cardSub,
                {
                  color:
                    colors
                      .textSecondary,
                },
              ]}
            >
              {chamada
                ? `${
                    chamada.turma ??
                    'Turma'
                  } • ${
                    chamada.disciplina ??
                    'Disciplina'
                  }`
                : 'Selecione a turma e disciplina para iniciar.'}
            </Text>
          </View>

          <Pill
            colors={colors}
            tone={
              chamada
                ? 'success'
                : 'default'
            }
          >
            {chamada
              ? 'Em andamento'
              : 'Aguardando'}
          </Pill>
        </View>

        {!chamada ? (
          <>
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
              Turma / Disciplina
            </Text>

            {turmas.length ===
            0 ? (
              <Text
                style={{
                  color:
                    colors
                      .textSecondary,
                }}
              >
                Nenhuma turma vinculada.
              </Text>
            ) : (
              <View
                style={
                  styles.turmas
                }
              >
                {turmas.map(
                  (turma) => {

                    const ativo =
                      turmaSelecionada ===
                      turma
                        .turmaDisciplinaId;

                    return (
                      <Pressable
                        key={
                          turma
                            .turmaDisciplinaId
                        }
                        onPress={() =>
                          setTurmaSelecionada(
                            turma
                              .turmaDisciplinaId
                          )
                        }
                        style={[
                          styles.turmaOption,
                          {
                            borderColor:
                              ativo
                                ? colors.primary
                                : colors.border,

                            backgroundColor:
                              ativo
                                ? colors.primaryLight
                                : colors.surface,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color:
                              ativo
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

            <PrimaryButton
              colors={colors}
              title="Abrir chamada"
              onPress={
                handleAbrir
              }
              loading={
                processando
              }
              disabled={
                !turmaSelecionada
              }
            />
          </>
        ) : (
          <PrimaryButton
            colors={colors}
            title="Encerrar chamada"
            variant="danger"
            onPress={
              handleEncerrar
            }
            loading={
              processando
            }
          />
        )}
      </Card>

      {/* RESUMO */}

      {chamada ? (
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
            Resumo da aula
          </Text>

          <View
            style={
              styles.resumoGrid
            }
          >
            <Resumo
              colors={colors}
              label="Alunos"
              value={
                resumo.total
              }
            />

            <Resumo
              colors={colors}
              label="Presentes"
              value={
                resumo.presentes
              }
            />

            <Resumo
              colors={colors}
              label="Ausentes"
              value={
                resumo.ausentes
              }
            />

            <Resumo
              colors={colors}
              label="Biometria"
              value={
                resumo.biometria
              }
            />

            <Resumo
              colors={colors}
              label="Aguardando"
              value={
                resumo.pendentes
              }
            />

            <Resumo
              colors={colors}
              label="Manual"
              value={
                resumo.manual
              }
            />
          </View>

          <View
            style={
              styles.alunoHeader
            }
          >
            <View>
              <Text
                style={[
                  styles.sectionTitle,
                  {
                    color:
                      colors
                        .textPrimary,
                    marginBottom: 3,
                  },
                ]}
              >
                Alunos
              </Text>

              <Text
                style={{
                  color:
                    colors
                      .textSecondary,
                  fontSize: 12,
                }}
              >
                Atualização automática
                a cada 5 segundos.
              </Text>
            </View>

            <Pressable
              onPress={() =>
                carregarAlunos(
                  chamada
                )
              }
            >
              <Text
                style={{
                  color:
                    colors.primary,
                  fontWeight: '900',
                }}
              >
                Atualizar
              </Text>
            </Pressable>
          </View>

          {alunos.length ===
          0 ? (
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
                Nenhum aluno encontrado.
              </Text>
            </Card>
          ) : (
            alunos.map(
              (aluno) => (
                <AlunoCard
                  key={
                    aluno.alunoId
                  }
                  aluno={aluno}
                  colors={colors}
                  processando={
                    processando
                  }
                  marcarPresente={() =>
                    alterarPresenca(
                      aluno.alunoId,
                      'PRESENTE'
                    )
                  }
                  marcarAusente={() =>
                        alterarPresenca(
                            aluno.alunoId,
                            'AUSENTE'
                        )
                        }
                  confirmar={() => {
                    if (
                      aluno
                        .solicitacaoBiometrica
                    ) {
                      confirmar(
                        aluno
                          .solicitacaoBiometrica
                      );
                    }
                  }}
                  recusar={() => {
                    if (
                      aluno
                        .solicitacaoBiometrica
                    ) {
                      recusar(
                        aluno
                          .solicitacaoBiometrica
                      );
                    }
                  }}
                />
              )
            )
          )}
        </>
      ) : (
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
            Abra uma chamada para
            listar os alunos.
          </Text>
        </Card>
      )}
    </Screen>
  );
};

/*
 * CARD DO ALUNO
 */
function AlunoCard({
  aluno,
  colors,
  processando,
  marcarPresente,
  marcarAusente,
  confirmar,
  recusar,
}: any) {

  const status =
    normalizarStatus(
      aluno.status
    );

  const biometriaConfirmada =
    String(
      aluno.metodo ?? ''
    )
      .toUpperCase() ===
      'BIOMETRIA'
    &&
    aluno.validacaoBiometrica;

  const pendente =
    Boolean(
      aluno
        .solicitacaoBiometrica
    );

  const bloqueado =
    biometriaConfirmada ||
    pendente ||
    processando;

  let tone:
    'default' |
    'success' |
    'danger' |
    'warning' =
      'default';

  if (
    status === 'PRESENTE'
  ) {
    tone = 'success';
  }

  if (
    status === 'AUSENTE'
  ) {
    tone = 'danger';
  }

  if (
    status === 'ATRASADO'
  ) {
    tone = 'warning';
  }

  return (
    <Card
      colors={colors}
    >
      <View
        style={
          styles.headerRow
        }
      >
        <View
          style={
            styles.avatar
          }
        >
          <Text
            style={[
              styles.avatarText,
              {
                color:
                  colors.primary,
              },
            ]}
          >
            {String(
              aluno.nome
            )
              .charAt(0)
              .toUpperCase()}
          </Text>
        </View>

        <View
          style={{ flex: 1 }}
        >
          <Text
            style={[
              styles.nomeAluno,
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
            style={{
              color:
                colors
                  .textSecondary,
              fontSize: 12,
              marginTop: 3,
            }}
          >
            Status atual
          </Text>
        </View>

        <Pill
          colors={colors}
          tone={tone}
        >
          {formatarStatus(
            aluno.status
          )}
        </Pill>
      </View>

      {biometriaConfirmada ? (
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor:
                colors.primaryLight,
            },
          ]}
        >
          <Text
            style={{
              color:
                colors.primary,
              fontWeight: '800',
            }}
          >
            Presença confirmada por
            biometria facial
          </Text>
        </View>
      ) : null}

      {pendente ? (
        <View
          style={[
            styles.infoBox,
            {
              borderColor:
                colors.warning,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={{
              color:
                colors
                  .textPrimary,
              fontWeight: '900',
            }}
          >
            Biometria aguardando
            confirmação
          </Text>

          <Text
            style={{
              color:
                colors
                  .textSecondary,
              fontSize: 12,
              marginTop: 4,
            }}
          >
            O aluno realizou a
            validação facial.
          </Text>

          <View
            style={
              styles.biometriaActions
            }
          >
            <Pressable
              disabled={
                processando
              }
              onPress={
                confirmar
              }
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    colors.success,
                },
              ]}
            >
              <Text
                style={
                  styles.whiteButton
                }
              >
                Confirmar
              </Text>
            </Pressable>

            <Pressable
              disabled={
                processando
              }
              onPress={
                recusar
              }
              style={[
                styles.smallButton,
                {
                  backgroundColor:
                    colors.danger,
                },
              ]}
            >
              <Text
                style={
                  styles.whiteButton
                }
              >
                Recusar
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      <View
        style={
          styles.presencaActions
        }
      >
        <Pressable
          disabled={bloqueado}
          onPress={
            marcarPresente
          }
          style={[
            styles.statusButton,
            {
              borderColor:
                colors.success,

              backgroundColor:
                status ===
                'PRESENTE'
                  ? colors.success
                  : 'transparent',

              opacity:
                bloqueado
                  ? 0.45
                  : 1,
            },
          ]}
        >
          <Text
            style={{
              color:
                status ===
                'PRESENTE'
                  ? colors.white
                  : colors.success,

              fontWeight: '900',
            }}
          >
            Presente
          </Text>
        </Pressable>

        <Pressable
          disabled={bloqueado}
          onPress={
            marcarAusente
          }
          style={[
            styles.statusButton,
            {
              borderColor:
                colors.danger,

              backgroundColor:
                status ===
                'AUSENTE'
                  ? colors.danger
                  : 'transparent',

              opacity:
                bloqueado
                  ? 0.45
                  : 1,
            },
          ]}
        >
          <Text
            style={{
              color:
                status ===
                'AUSENTE'
                  ? colors.white
                  : colors.danger,

              fontWeight: '900',
            }}
          >
            Ausente
          </Text>
        </Pressable>
      </View>
    </Card>
  );
}

function Resumo({
  colors,
  label,
  value,
}: any) {
  return (
    <View
      style={[
        styles.resumoCard,
        {
          backgroundColor:
            colors.surface,

          borderColor:
            colors.border,
        },
      ]}
    >
      <Text
        style={{
          color:
            colors.textSecondary,
          fontSize: 11,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color:
            colors.textPrimary,
          fontSize: 22,
          fontWeight: '900',
          marginTop: 5,
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles =
  StyleSheet.create({
    loading: {
      minHeight: 450,
      justifyContent:
        'center',
      alignItems: 'center',
    },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    cardTitle: {
      fontSize: 17,
      fontWeight: '900',
    },

    cardSub: {
      fontSize: 12,
      marginTop: 4,
      lineHeight: 18,
    },

    label: {
      fontSize: 13,
      fontWeight: '800',
      marginTop: 20,
      marginBottom: 10,
    },

    turmas: {
      gap: 8,
      marginBottom: 15,
    },

    turmaOption: {
      borderWidth: 1,
      borderRadius: 13,
      paddingHorizontal: 14,
      paddingVertical: 11,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '900',
      marginTop: 12,
      marginBottom: 12,
    },

    resumoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 8,
    },

    resumoCard: {
      width: '31%',
      minHeight: 82,
      borderWidth: 1,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent:
        'center',
      padding: 8,
    },

    alunoHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'flex-end',
      marginTop: 5,
      marginBottom: 5,
    },

    avatar: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent:
        'center',
      backgroundColor:
        '#E8F0FE',
    },

    avatarText: {
      fontWeight: '900',
      fontSize: 17,
    },

    nomeAluno: {
      fontSize: 15,
      fontWeight: '900',
    },

    infoBox: {
      padding: 12,
      borderRadius: 12,
      marginTop: 14,
    },

    biometriaActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
    },

    smallButton: {
      flex: 1,
      minHeight: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    whiteButton: {
      color: '#FFFFFF',
      fontWeight: '900',
      fontSize: 12,
    },

    presencaActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 14,
    },

    statusButton: {
      flex: 1,
      minHeight: 42,
      borderWidth: 1,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent:
        'center',
    },
  });