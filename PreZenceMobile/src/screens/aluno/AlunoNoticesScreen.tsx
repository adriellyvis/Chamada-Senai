import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Pill, PrimaryButton, Screen } from '../../components/UI';
import { getAvisos, getOcorrenciasAluno, marcarAvisoComoLido, marcarTodosAvisosComoLidos } from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import { Aviso, OcorrenciaAluno } from '../../types/aluno';

function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
}
function prioridadeTone(valor: string): 'default'|'success'|'warning'|'danger' {
  const v = String(valor).toUpperCase();
  if (v === 'ALTA' || v === 'URGENTE') return 'danger';
  if (v === 'MEDIA') return 'warning';
  return 'default';
}
function gravidadeTone(valor: string): 'default'|'success'|'warning'|'danger' {
  const v = String(valor).toUpperCase();
  if (v === 'ALTA') return 'danger';
  if (v === 'MEDIA') return 'warning';
  if (v === 'BAIXA') return 'success';
  return 'default';
}

export const AlunoNoticesScreen: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [avisos,setAvisos] = useState<Aviso[]>([]);
  const [ocorrencias,setOcorrencias] = useState<OcorrenciaAluno[]>([]);
  const [aba,setAba] = useState<'AVISOS'|'OCORRENCIAS'>('AVISOS');
  const [loading,setLoading] = useState(true);
  const [erro,setErro] = useState('');
  const [processando,setProcessando] = useState(false);
  const [ocorrenciaSelecionada,setOcorrenciaSelecionada] = useState<OcorrenciaAluno | null>(null);

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');
      const [a,o] = await Promise.all([getAvisos(user.id),getOcorrenciasAluno(user.id)]);
      setAvisos([...a].sort((x,y) => String(y.dataCriacao || '').localeCompare(String(x.dataCriacao || ''))));
      setOcorrencias([...o].sort((x,y) => String(y.dataOcorrencia || '').localeCompare(String(x.dataOcorrencia || ''))));
    }
    catch (error) { setErro(getApiErrorMessage(error)); }
    finally { setLoading(false); }
  }, [user?.id]);
  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const naoLidos = useMemo(() => avisos.filter((a) => !a.lido).length,[avisos]);

  async function ler(aviso: Aviso) {
    if (aviso.lido) return;
    setAvisos((atuais) => atuais.map((a) => a.id === aviso.id ? {...a,lido:true} : a));
    try { await marcarAvisoComoLido(aviso.id); }
    catch (error) { setErro(getApiErrorMessage(error)); await carregar(); }
  }

  async function lerTodos() {
    if (!user?.id || !naoLidos) return;
    try { setProcessando(true); setErro(''); await marcarTodosAvisosComoLidos(user.id); setAvisos((atuais) => atuais.map((a) => ({...a,lido:true}))); }
    catch (error) { setErro(getApiErrorMessage(error)); }
    finally { setProcessando(false); }
  }

  return (
    <Screen colors={colors} title="AVISOS E OCORRÊNCIAS" subtitle="Comunicados e registros acadêmicos." refreshing={loading} onRefresh={carregar}>
      <View style={styles.tabs}>
        <Pressable onPress={() => setAba('AVISOS')} style={[styles.tab,{borderColor:aba==='AVISOS'?colors.primary:colors.border,backgroundColor:aba==='AVISOS'?colors.primaryLight:colors.surface}]}><Text style={{color:aba==='AVISOS'?colors.primaryStrong:colors.textSecondary,fontWeight:'900'}}>Avisos ({avisos.length})</Text></Pressable>
        <Pressable onPress={() => setAba('OCORRENCIAS')} style={[styles.tab,{borderColor:aba==='OCORRENCIAS'?colors.primary:colors.border,backgroundColor:aba==='OCORRENCIAS'?colors.primaryLight:colors.surface}]}><Text style={{color:aba==='OCORRENCIAS'?colors.primaryStrong:colors.textSecondary,fontWeight:'900'}}>Ocorrências ({ocorrencias.length})</Text></Pressable>
      </View>

      {erro ? <Text style={{color:colors.danger,fontWeight:'700',marginBottom:12}}>{erro}</Text> : null}
      {loading && !avisos.length && !ocorrencias.length ? <ActivityIndicator color={colors.primary} /> : null}

      {aba === 'AVISOS' ? (
        <>
          {naoLidos > 0 ? <View style={{marginBottom:12}}><PrimaryButton colors={colors} title={`Marcar todos como lidos (${naoLidos})`} variant="outline" loading={processando} onPress={() => void lerTodos()} /></View> : null}
          {!loading && !avisos.length ? <Card colors={colors}><Text style={{color:colors.textSecondary}}>Você não possui avisos.</Text></Card> : null}
          {avisos.map((aviso) => (
            <Pressable key={aviso.id} onPress={() => void ler(aviso)}>
              <Card colors={colors} style={!aviso.lido ? {borderColor:colors.primary,borderWidth:1.5} : undefined}>
                <View style={styles.row}><View style={{flex:1}}><Text style={[styles.title,{color:colors.textPrimary}]}>{aviso.titulo}</Text><Text style={[styles.meta,{color:colors.textSecondary}]}>{aviso.autorNome} • {aviso.categoria}</Text></View><Pill colors={colors} tone={prioridadeTone(aviso.prioridade)}>{aviso.prioridade}</Pill></View>
                <Text style={[styles.body,{color:colors.textSecondary}]}>{aviso.mensagem}</Text>
                {aviso.melhorias ? <Text style={[styles.extra,{color:colors.textSecondary}]}><Text style={{fontWeight:'900'}}>Orientação: </Text>{aviso.melhorias}</Text> : null}
                <View style={styles.footer}><Text style={[styles.meta,{color:colors.textSoft}]}>{formatarData(aviso.dataCriacao)}</Text><Text style={{color:aviso.lido?colors.textSoft:colors.primary,fontWeight:'800',fontSize:11}}>{aviso.lido?'Lido':'Novo'}</Text></View>
              </Card>
            </Pressable>
          ))}
        </>
      ) : (
        <>
          {!loading && !ocorrencias.length ? <Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhuma ocorrência registrada.</Text></Card> : null}
          {ocorrencias.map((o) => (
            <Pressable key={o.id} onPress={() => setOcorrenciaSelecionada(o)}>
              <Card colors={colors}>
                <View style={styles.row}><View style={{flex:1}}><Text style={[styles.title,{color:colors.textPrimary}]}>{o.titulo}</Text><Text style={[styles.meta,{color:colors.textSecondary}]}>{o.professorNome || 'Instituição'} • {o.tipo}</Text></View><Pill colors={colors} tone={gravidadeTone(o.gravidade)}>{o.gravidade}</Pill></View>
                <Text numberOfLines={3} style={[styles.body,{color:colors.textSecondary}]}>{o.descricao}</Text>
                <View style={styles.footer}><Text style={[styles.meta,{color:colors.textSoft}]}>{formatarData(o.dataOcorrencia)}</Text><Pill colors={colors}>{String(o.status).replace(/_/g,' ')}</Pill></View>
                <Text style={{color:colors.primary,fontWeight:'900',fontSize:12,marginTop:10}}>Toque para ver detalhes</Text>
              </Card>
            </Pressable>
          ))}
        </>
      )}

      <Modal visible={!!ocorrenciaSelecionada} transparent animationType="slide" onRequestClose={() => setOcorrenciaSelecionada(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet,{backgroundColor:colors.background,borderColor:colors.border}]}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalTitle,{color:colors.textPrimary}]}>{ocorrenciaSelecionada?.titulo || 'Detalhes da ocorrência'}</Text>
              {ocorrenciaSelecionada ? <>
                <View style={styles.detailRow}><Text style={[styles.detailLabel,{color:colors.textSoft}]}>Professor</Text><Text style={[styles.detailValue,{color:colors.textPrimary}]}>{ocorrenciaSelecionada.professorNome || 'Instituição'}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.detailLabel,{color:colors.textSoft}]}>Tipo</Text><Text style={[styles.detailValue,{color:colors.textPrimary}]}>{ocorrenciaSelecionada.tipo}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.detailLabel,{color:colors.textSoft}]}>Gravidade</Text><Text style={[styles.detailValue,{color:colors.textPrimary}]}>{ocorrenciaSelecionada.gravidade}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.detailLabel,{color:colors.textSoft}]}>Status</Text><Text style={[styles.detailValue,{color:colors.textPrimary}]}>{String(ocorrenciaSelecionada.status).replace(/_/g,' ')}</Text></View>
                <View style={styles.detailRow}><Text style={[styles.detailLabel,{color:colors.textSoft}]}>Data</Text><Text style={[styles.detailValue,{color:colors.textPrimary}]}>{formatarData(ocorrenciaSelecionada.dataOcorrencia)}</Text></View>
                <Text style={[styles.detailLabel,{color:colors.textSoft,marginTop:14}]}>Descrição</Text>
                <Text style={[styles.modalBody,{color:colors.textSecondary}]}>{ocorrenciaSelecionada.descricao}</Text>
                {ocorrenciaSelecionada.respostaGestor ? <View style={[styles.response,{borderColor:colors.border,backgroundColor:colors.surface}]}><Text style={{color:colors.success,fontWeight:'900',marginBottom:4}}>Resposta do gestor</Text><Text style={{color:colors.textSecondary,lineHeight:20}}>{ocorrenciaSelecionada.respostaGestor}</Text></View> : null}
              </> : null}
              <PrimaryButton colors={colors} title="Fechar" variant="outline" onPress={() => setOcorrenciaSelecionada(null)} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({tabs:{flexDirection:'row',gap:8,marginBottom:14},tab:{flex:1,minHeight:42,borderWidth:1,borderRadius:14,alignItems:'center',justifyContent:'center',paddingHorizontal:8},row:{flexDirection:'row',alignItems:'flex-start',gap:10},title:{fontSize:16,fontWeight:'900'},meta:{fontSize:11,marginTop:4},body:{fontSize:13,lineHeight:20,marginTop:12},extra:{fontSize:13,lineHeight:19,marginTop:10},footer:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:12},response:{borderWidth:1,borderRadius:14,padding:12,marginTop:12},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.48)',justifyContent:'flex-end'},sheet:{maxHeight:'82%',borderTopWidth:1,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:28},modalTitle:{fontSize:20,fontWeight:'900',marginBottom:16},detailRow:{flexDirection:'row',justifyContent:'space-between',gap:18,paddingVertical:8,borderBottomWidth:StyleSheet.hairlineWidth,borderBottomColor:'#9ca3af55'},detailLabel:{fontSize:12,fontWeight:'800'},detailValue:{fontSize:13,fontWeight:'800',textAlign:'right',flex:1},modalBody:{fontSize:14,lineHeight:21,marginTop:7,marginBottom:14}});
