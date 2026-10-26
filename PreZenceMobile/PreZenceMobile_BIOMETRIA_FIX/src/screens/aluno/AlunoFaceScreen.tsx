import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';

import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Pill, PrimaryButton, Screen } from '../../components/UI';
import {
  getChamadaAbertaAluno,
  getStatusBiometriaAluno,
  getStatusSolicitacaoBiometrica,
  solicitarPresencaBiometrica,
} from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import {
  biometriaReconhecimentoConfigurado,
  getStatusTemplateBiometrico,
  reconhecerRosto,
  testarServicoBiometrico,
} from '../../services/biometriaService';
import {
  ChamadaAbertaAluno,
  SolicitacaoPresencaBiometricaAluno,
} from '../../types/aluno';

function statusTone(status?: string | null): 'default' | 'success' | 'warning' | 'danger' {
  const s = String(status ?? '').toUpperCase();
  if (s === 'CONFIRMADA' || s === 'PRESENTE') return 'success';
  if (s === 'PENDENTE' || s === 'EM_ANDAMENTO') return 'warning';
  if (s === 'RECUSADA' || s === 'AUSENTE') return 'danger';
  return 'default';
}

function hora(valor?: string | null) {
  return valor ? String(valor).slice(0, 5) : '--:--';
}

function formatarConfianca(valor: number | null): string | null {
  if (valor === null || !Number.isFinite(valor)) return null;
  const percentual = valor <= 1 ? valor * 100 : valor;
  return `${Math.max(0, Math.min(100, percentual)).toFixed(1)}%`;
}

export const AlunoFaceScreen: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const isFocused = useIsFocused();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [chamada, setChamada] = useState<ChamadaAbertaAluno | null>(null);
  const [biometriaCadastrada, setBiometriaCadastrada] = useState<boolean | null>(null);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoPresencaBiometricaAluno | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const [cameraAberta, setCameraAberta] = useState(false);
  const [cameraPronta, setCameraPronta] = useState(false);
  const [fotoUri, setFotoUri] = useState<string | null>(null);
  const [capturando, setCapturando] = useState(false);
  const [validando, setValidando] = useState(false);
  const [resultadoReconhecimento, setResultadoReconhecimento] = useState<string | null>(null);
  const [servicoBiometricoOk, setServicoBiometricoOk] = useState<boolean | null>(null);
  const [avisoBiometria, setAvisoBiometria] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');
      const [c, b] = await Promise.all([
        getChamadaAbertaAluno(user.id),
        getStatusBiometriaAluno(user.id),
      ]);
      setChamada(c);

      let cadastrada = Boolean(b?.cadastrada);
      setAvisoBiometria(null);

      if (biometriaReconhecimentoConfigurado()) {
        try {
          const health = await testarServicoBiometrico();
          if (!health.modelosCarregados) {
            setServicoBiometricoOk(false);
            setAvisoBiometria('O serviço biométrico está ativo, mas os modelos YuNet/SFace ainda não foram carregados.');
          } else {
            const statusLocal = await getStatusTemplateBiometrico(user.id);
            setServicoBiometricoOk(true);
            cadastrada = statusLocal.cadastrada;
            if (!statusLocal.cadastrada) {
              setAvisoBiometria('Seu usuário ainda não possui template facial no serviço de reconhecimento.');
            }
          }
        } catch (bioError) {
          setServicoBiometricoOk(false);
          setAvisoBiometria(bioError instanceof Error ? bioError.message : 'Serviço biométrico indisponível.');
        }
      } else {
        setServicoBiometricoOk(null);
      }

      setBiometriaCadastrada(cadastrada);
      if (c?.aulaId) {
        setSolicitacao(await getStatusSolicitacaoBiometrica(c.aulaId));
      } else {
        setSolicitacao(null);
      }
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void carregar();
      return () => {
        setCameraAberta(false);
        setCameraPronta(false);
        setFotoUri(null);
        setResultadoReconhecimento(null);
      };
    }, [carregar])
  );

  useEffect(() => {
    if (!chamada?.aulaId || solicitacao?.status === 'CONFIRMADA' || solicitacao?.status === 'RECUSADA') {
      return;
    }
    const timer = setInterval(() => {
      void getStatusSolicitacaoBiometrica(chamada.aulaId)
        .then(setSolicitacao)
        .catch(() => undefined);
    }, 5000);
    return () => clearInterval(timer);
  }, [chamada?.aulaId, solicitacao?.status]);

  const abrirCamera = useCallback(async () => {
    setErro('');
    setResultadoReconhecimento(null);

    if (!biometriaCadastrada) {
      Alert.alert(
        'Biometria não cadastrada',
        'Seu rosto precisa estar cadastrado antes de validar presença.'
      );
      return;
    }

    if (!chamada) {
      Alert.alert('Sem chamada aberta', 'Aguarde o professor abrir a chamada da sua turma.');
      return;
    }

    if (solicitacao?.status === 'PENDENTE') {
      Alert.alert('Validação pendente', 'Sua solicitação já foi enviada e aguarda o professor.');
      return;
    }

    if (solicitacao?.status === 'CONFIRMADA') {
      Alert.alert('Presença confirmada', 'Sua presença já foi confirmada nesta aula.');
      return;
    }

    if (!permission?.granted) {
      if (permission && !permission.canAskAgain) {
        Alert.alert(
          'Permissão de câmera bloqueada',
          'Ative a câmera nas configurações do celular para usar a biometria.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => void Linking.openSettings() },
          ]
        );
        return;
      }

      const novaPermissao = await requestPermission();
      if (!novaPermissao.granted) return;
    }

    setFotoUri(null);
    setCameraPronta(false);
    setCameraAberta(true);
  }, [biometriaCadastrada, chamada, permission, requestPermission, solicitacao?.status]);

  const capturar = useCallback(async () => {
    if (!cameraRef.current || !cameraPronta || capturando) return;
    try {
      setCapturando(true);
      setErro('');
      const foto = await cameraRef.current.takePictureAsync({
        quality: 0.72,
        skipProcessing: false,
      });
      if (!foto?.uri) throw new Error('A câmera não retornou uma imagem válida.');
      setFotoUri(foto.uri);
      setCameraAberta(false);
      setCameraPronta(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível capturar a foto.');
    } finally {
      setCapturando(false);
    }
  }, [cameraPronta, capturando]);

  const validarFoto = useCallback(async () => {
    if (!user?.id || !chamada || !fotoUri || validando) return;

    if (!biometriaReconhecimentoConfigurado()) {
      Alert.alert(
        'Reconhecimento ainda não configurado',
        'A câmera já está integrada. Agora falta configurar no .env o endereço do serviço que compara a foto com o cadastro facial.'
      );
      return;
    }

    try {
      setValidando(true);
      setErro('');
      setResultadoReconhecimento(null);

      const reconhecimento = await reconhecerRosto({
        imageUri: fotoUri,
        usuarioId: user.id,
        alunoId: chamada.alunoId,
        aulaId: chamada.aulaId,
      });

      const confianca = formatarConfianca(reconhecimento.confianca);

      if (!reconhecimento.reconhecido) {
        setResultadoReconhecimento(
          reconhecimento.mensagem || 'Rosto não reconhecido. Posicione o rosto novamente e tente outra foto.'
        );
        return;
      }

      if (
        reconhecimento.usuarioIdReconhecido !== null &&
        reconhecimento.usuarioIdReconhecido !== user.id
      ) {
        setResultadoReconhecimento('O rosto reconhecido não corresponde ao usuário autenticado.');
        return;
      }

      setResultadoReconhecimento(
        confianca ? `Rosto reconhecido. Similaridade: ${confianca}.` : 'Rosto reconhecido com sucesso.'
      );

      const novaSolicitacao = await solicitarPresencaBiometrica(
        chamada.alunoId,
        chamada.aulaId
      );
      setSolicitacao(novaSolicitacao);
      setFotoUri(null);

      Alert.alert(
        'Biometria validada',
        'Seu rosto foi reconhecido e a solicitação de presença foi enviada.'
      );
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : getApiErrorMessage(error);
      setErro(mensagem);
    } finally {
      setValidando(false);
    }
  }, [chamada, fotoUri, user?.id, validando]);

  const podeIniciarBiometria = Boolean(
    biometriaCadastrada &&
    chamada &&
    (servicoBiometricoOk !== false) &&
    solicitacao?.status !== 'PENDENTE' &&
    solicitacao?.status !== 'CONFIRMADA'
  );

  return (
    <Screen
      colors={colors}
      title="CHAMADA FACIAL"
      subtitle="Valide sua presença usando a câmera frontal."
      refreshing={loading}
      onRefresh={carregar}
    >
      {erro ? (
        <Text style={{ color: colors.danger, fontWeight: '700', marginBottom: 12 }}>{erro}</Text>
      ) : null}

      {loading && biometriaCadastrada === null ? <ActivityIndicator color={colors.primary} /> : null}

      <Card colors={colors}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Cadastro facial</Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>Biometria vinculada ao seu usuário</Text>
          </View>
          <Pill colors={colors} tone={biometriaCadastrada ? 'success' : 'warning'}>
            {biometriaCadastrada ? 'Cadastrada' : 'Não cadastrada'}
          </Pill>
        </View>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {biometriaCadastrada
            ? 'Seu cadastro facial está disponível para reconhecimento.'
            : 'Você precisa cadastrar seu rosto antes de validar presença por biometria.'}
        </Text>
        {biometriaReconhecimentoConfigurado() ? (
          <View style={{ marginTop: 10 }}>
            <Pill colors={colors} tone={servicoBiometricoOk === true ? 'success' : servicoBiometricoOk === false ? 'danger' : 'default'}>
              {servicoBiometricoOk === true ? 'Reconhecedor online' : servicoBiometricoOk === false ? 'Reconhecedor indisponível' : 'Verificando reconhecedor'}
            </Pill>
          </View>
        ) : null}
        {avisoBiometria ? (
          <Text style={[styles.configWarning, { color: servicoBiometricoOk === false ? colors.danger : colors.warning }]}>
            {avisoBiometria}
          </Text>
        ) : null}
      </Card>

      <Text style={[styles.section, { color: colors.textPrimary }]}>Chamada atual</Text>
      {!loading && !chamada ? (
        <Card colors={colors}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Nenhuma chamada aberta</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            Quando um professor abrir a chamada da sua turma, ela aparecerá aqui.
          </Text>
        </Card>
      ) : null}

      {chamada ? (
        <Card colors={colors}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{chamada.disciplina}</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>
                {chamada.professor} • {chamada.turma}
              </Text>
            </View>
            <Pill colors={colors} tone="warning">Aberta</Pill>
          </View>
          <View style={[styles.aulaBox, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.time, { color: colors.primaryStrong }]}>{hora(chamada.horaInicio)}</Text>
            <Text style={[styles.sub, { color: colors.primaryStrong }]}>Início da chamada</Text>
          </View>
        </Card>
      ) : null}

      {chamada && solicitacao ? (
        <Card colors={colors}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Validação enviada</Text>
              <Text style={[styles.sub, { color: colors.textSecondary }]}>Acompanhe a decisão do professor.</Text>
            </View>
            <Pill colors={colors} tone={statusTone(solicitacao.status)}>
              {String(solicitacao.status).replace(/_/g, ' ')}
            </Pill>
          </View>
          {solicitacao.status === 'PENDENTE' ? (
            <Text style={[styles.body, { color: colors.textSecondary }]}>
              Seu reconhecimento foi enviado e ainda aguarda confirmação do professor.
            </Text>
          ) : null}
          {solicitacao.status === 'CONFIRMADA' ? (
            <Text style={[styles.body, { color: colors.success, fontWeight: '800' }]}>Presença confirmada.</Text>
          ) : null}
          {solicitacao.status === 'RECUSADA' ? (
            <Text style={[styles.body, { color: colors.danger }]}>
              {solicitacao.motivoRecusa || 'A solicitação foi recusada pelo professor.'}
            </Text>
          ) : null}
        </Card>
      ) : null}

      <Text style={[styles.section, { color: colors.textPrimary }]}>Reconhecimento facial</Text>

      {cameraAberta && isFocused ? (
        <Card colors={colors} style={{ padding: 0, overflow: 'hidden' }}>
          <View style={styles.cameraWrap}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing="front"
              mode="picture"
              mirror={false}
              onCameraReady={() => setCameraPronta(true)}
            />
            <View pointerEvents="none" style={styles.cameraOverlay}>
              <View style={styles.faceGuide} />
              <Text style={styles.cameraHelp}>Centralize o rosto e mantenha boa iluminação</Text>
            </View>
          </View>
          <View style={styles.cameraActions}>
            <PrimaryButton
              colors={colors}
              title="Cancelar"
              variant="outline"
              onPress={() => {
                setCameraAberta(false);
                setCameraPronta(false);
              }}
            />
            <PrimaryButton
              colors={colors}
              title={cameraPronta ? 'Capturar rosto' : 'Preparando câmera...'}
              loading={capturando}
              disabled={!cameraPronta}
              onPress={() => void capturar()}
            />
          </View>
        </Card>
      ) : null}

      {fotoUri ? (
        <Card colors={colors}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Confira a captura</Text>
          <Text style={[styles.body, { color: colors.textSecondary, marginBottom: 12 }]}>
            Use uma foto frontal, sem óculos escuros e com o rosto totalmente visível.
          </Text>
          <Image source={{ uri: fotoUri }} style={styles.preview} resizeMode="cover" />
          {resultadoReconhecimento ? (
            <Text
              style={[
                styles.resultado,
                {
                  color: resultadoReconhecimento.toLowerCase().includes('reconhecido com')
                    ? colors.success
                    : colors.danger,
                },
              ]}
            >
              {resultadoReconhecimento}
            </Text>
          ) : null}
          <View style={styles.previewActions}>
            <PrimaryButton
              colors={colors}
              title="Tirar outra"
              variant="outline"
              disabled={validando}
              onPress={() => {
                setFotoUri(null);
                setResultadoReconhecimento(null);
                setCameraPronta(false);
                setCameraAberta(true);
              }}
            />
            <PrimaryButton
              colors={colors}
              title="Validar biometria"
              loading={validando}
              onPress={() => void validarFoto()}
            />
          </View>
        </Card>
      ) : null}

      {!cameraAberta && !fotoUri ? (
        <Card colors={colors}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Câmera frontal</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            O PreZence usa o expo-camera somente para capturar seu rosto. A presença só é solicitada depois que o serviço de reconhecimento confirmar que a face corresponde ao seu cadastro.
          </Text>
          {!biometriaReconhecimentoConfigurado() ? (
            <Text style={[styles.configWarning, { color: colors.warning }]}>
              Captura pronta. Configure EXPO_PUBLIC_BIOMETRIA_URL para habilitar a comparação facial.
            </Text>
          ) : null}
          <View style={{ marginTop: 14 }}>
            <PrimaryButton
              colors={colors}
              title="Abrir câmera facial"
              disabled={!podeIniciarBiometria}
              onPress={() => void abrirCamera()}
            />
          </View>
        </Card>
      ) : null}

      <PrimaryButton
        colors={colors}
        title="Atualizar status"
        variant="outline"
        loading={loading}
        onPress={() => void carregar()}
      />
    </Screen>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  title: { fontSize: 16, fontWeight: '900' },
  sub: { fontSize: 12, lineHeight: 18, marginTop: 4 },
  body: { fontSize: 13, lineHeight: 20, marginTop: 12 },
  section: { fontSize: 17, fontWeight: '900', marginTop: 8, marginBottom: 10 },
  aulaBox: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
  },
  time: { fontSize: 24, fontWeight: '900' },
  cameraWrap: {
    height: 410,
    backgroundColor: '#000',
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  faceGuide: {
    width: 220,
    height: 290,
    borderRadius: 120,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  cameraHelp: {
    marginTop: 20,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '800',
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cameraActions: {
    gap: 10,
    padding: 14,
  },
  preview: {
    width: '100%',
    height: 360,
    borderRadius: 18,
    backgroundColor: '#000',
  },
  previewActions: {
    gap: 10,
    marginTop: 14,
  },
  resultado: {
    marginTop: 12,
    fontWeight: '800',
    fontSize: 13,
    lineHeight: 19,
  },
  configWarning: {
    marginTop: 10,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '800',
  },
});
