import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Icon, Pill, PrimaryButton, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { alterarStatusOcorrenciaGestor, getGestorOcorrencias } from '../../services/gestorService';
import { getApiErrorMessage } from '../../services/api';
import { GestorOcorrencia } from '../../types/gestor';

const STATUS = ['', 'PENDENTE', 'EM_ANALISE', 'RESOLVIDA', 'CANCELADA'] as const;
const GRAVIDADES = ['', 'BAIXA', 'MEDIA', 'ALTA'] as const;
const TIPOS = ['', 'DISCIPLINAR', 'ATESTADO', 'JUSTIFICATIVA', 'INTERVENCAO', 'DESTAQUE'] as const;

type Status = Exclude<(typeof STATUS)[number], ''>;

function enumLabel(v?: string | null) {
  if (!v) return '—';
  const map: Record<string,string> = { EM_ANALISE:'Em análise', RESOLVIDA:'Resolvida', CANCELADA:'Cancelada', PENDENTE:'Pendente', BAIXA:'Baixa', MEDIA:'Média', ALTA:'Alta', DISCIPLINAR:'Disciplinar', ATESTADO:'Atestado', JUSTIFICATIVA:'Justificativa', INTERVENCAO:'Intervenção', DESTAQUE:'Destaque' };
  return map[v] ?? v.replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
}
function formatarData(v?: string|null){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});}
function toneStatus(v?: string|null):'default'|'success'|'danger'|'warning'{if(v==='RESOLVIDA')return'success';if(v==='CANCELADA')return'danger';if(v==='PENDENTE'||v==='EM_ANALISE')return'warning';return'default';}
function toneGrav(v?: string|null):'default'|'success'|'danger'|'warning'{if(v==='ALTA')return'danger';if(v==='MEDIA')return'warning';if(v==='BAIXA')return'success';return'default';}

export const GestorOccurrencesScreen: React.FC = () => {
  const { darkMode } = useAppSettings(); const colors = getTheme(darkMode);
  const [itens,setItens]=useState<GestorOcorrencia[]>([]); const [loading,setLoading]=useState(true); const [erro,setErro]=useState('');
  const [busca,setBusca]=useState(''); const [status,setStatus]=useState(''); const [gravidade,setGravidade]=useState(''); const [tipo,setTipo]=useState('');
  const [detalhe,setDetalhe]=useState<GestorOcorrencia|null>(null); const [finalizando,setFinalizando]=useState<{item:GestorOcorrencia;status:Status}|null>(null); const [resposta,setResposta]=useState(''); const [salvando,setSalvando]=useState(false);

  const carregar=useCallback(async()=>{try{setLoading(true);setErro('');const data=await getGestorOcorrencias();setItens([...data].sort((a,b)=>String(b.dataOcorrencia??'').localeCompare(String(a.dataOcorrencia??''))));}catch(e){setErro(getApiErrorMessage(e));}finally{setLoading(false);}},[]);
  useFocusEffect(useCallback(()=>{void carregar();},[carregar]));

  const filtrados=useMemo(()=>{const q=busca.trim().toLowerCase();return itens.filter(i=>{const texto=`${i.titulo??''} ${i.descricao} ${i.alunoNome??''} ${i.professorNome??''} ${i.tipo??''}`.toLowerCase();return(!q||texto.includes(q))&&(!status||i.status===status)&&(!gravidade||i.gravidade===gravidade)&&(!tipo||i.tipo===tipo);});},[itens,busca,status,gravidade,tipo]);

  async function trocarStatus(item:GestorOcorrencia, novo:Status){if(novo===item.status)return;if(novo==='RESOLVIDA'||novo==='CANCELADA'){setResposta('');setFinalizando({item,status:novo});return;}try{setSalvando(true);await alterarStatusOcorrenciaGestor(item.id,novo,'');await carregar();}catch(e){Alert.alert('Não foi possível alterar',getApiErrorMessage(e));}finally{setSalvando(false);}}
  async function confirmarFinalizacao(){if(!finalizando)return;if(!resposta.trim()){Alert.alert('Resposta obrigatória',finalizando.status==='RESOLVIDA'?'Informe a conclusão da ocorrência.':'Informe o motivo do cancelamento.');return;}try{setSalvando(true);await alterarStatusOcorrenciaGestor(finalizando.item.id,finalizando.status,resposta.trim());setFinalizando(null);setResposta('');await carregar();}catch(e){Alert.alert('Não foi possível finalizar',getApiErrorMessage(e));}finally{setSalvando(false);}}

  return <Screen colors={colors} title="OCORRÊNCIAS" subtitle="Acompanhe e atualize ocorrências registradas pelos professores." refreshing={loading} onRefresh={carregar}>
    <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar ocorrência, aluno ou professor" placeholderTextColor={colors.textSoft} style={[styles.search,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]}/>
    <Filtro label="Status" valores={STATUS} atual={status} setAtual={setStatus} colors={colors}/>
    <Filtro label="Gravidade" valores={GRAVIDADES} atual={gravidade} setAtual={setGravidade} colors={colors}/>
    <Filtro label="Tipo" valores={TIPOS} atual={tipo} setAtual={setTipo} colors={colors}/>
    {loading&&itens.length===0?<ActivityIndicator color={colors.primary}/>:null}{erro?<Text style={{color:colors.danger,marginBottom:12}}>{erro}</Text>:null}
    {filtrados.map(item=><Card colors={colors} key={item.id}><Pressable onPress={()=>setDetalhe(item)}>
      <View style={styles.row}><View style={{flex:1}}><Text style={[styles.title,{color:colors.textPrimary}]}>{item.titulo||'Ocorrência'}</Text><Text style={{color:colors.textSecondary,marginTop:4}}>{item.alunoNome||'Aluno'} • {item.professorNome||'Professor'}</Text></View><Pill colors={colors} tone={toneStatus(item.status)}>{enumLabel(item.status)}</Pill></View>
      <View style={styles.meta}><Pill colors={colors} tone={toneGrav(item.gravidade)}>{enumLabel(item.gravidade)}</Pill><Text style={{color:colors.textSecondary,fontSize:12}}>{enumLabel(item.tipo)}</Text></View>
      <Text style={{color:colors.textSecondary,marginTop:10,lineHeight:20}} numberOfLines={3}>{item.descricao}</Text><Text style={{color:colors.textSoft,marginTop:9,fontSize:11}}>{formatarData(item.dataOcorrencia)}</Text>
    </Pressable>
      <Text style={[styles.actionLabel,{color:colors.textSecondary}]}>Atualizar status</Text><View style={styles.statusRow}>{(['PENDENTE','EM_ANALISE','RESOLVIDA','CANCELADA'] as Status[]).map(s=><Pressable key={s} disabled={salvando} onPress={()=>void trocarStatus(item,s)} style={[styles.statusBtn,{borderColor:item.status===s?colors.primary:colors.border,backgroundColor:item.status===s?colors.primaryLight:colors.surface}]}><Text style={{color:item.status===s?colors.primaryStrong:colors.textSecondary,fontWeight:'800',fontSize:11}}>{enumLabel(s)}</Text></Pressable>)}</View>
      {item.respostaGestor?<View style={[styles.response,{borderColor:colors.border,backgroundColor:colors.background}]}><Text style={{color:colors.success,fontWeight:'900'}}>Resposta do gestor</Text><Text style={{color:colors.textSecondary,marginTop:5,lineHeight:19}}>{item.respostaGestor}</Text></View>:null}
    </Card>)}
    {!loading&&filtrados.length===0?<Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhuma ocorrência encontrada.</Text></Card>:null}

    <Modal visible={!!detalhe} transparent animationType="slide" onRequestClose={()=>setDetalhe(null)}><View style={styles.overlay}><View style={[styles.sheet,{backgroundColor:colors.background,borderColor:colors.border}]}><View style={styles.modalHeader}><Text style={[styles.modalTitle,{color:colors.textPrimary}]}>Detalhes da ocorrência</Text><Pressable onPress={()=>setDetalhe(null)}><Icon name="close" color={colors.textSecondary}/></Pressable></View>{detalhe?<ScrollView style={{maxHeight:520}}><Detail label="Título" value={detalhe.titulo} colors={colors}/><Detail label="Aluno" value={detalhe.alunoNome} colors={colors}/><Detail label="Professor" value={detalhe.professorNome} colors={colors}/><Detail label="Tipo" value={enumLabel(detalhe.tipo)} colors={colors}/><Detail label="Gravidade" value={enumLabel(detalhe.gravidade)} colors={colors}/><Detail label="Status" value={enumLabel(detalhe.status)} colors={colors}/><Detail label="Registrada em" value={formatarData(detalhe.dataOcorrencia)} colors={colors}/><Detail label="Descrição" value={detalhe.descricao} colors={colors}/>{detalhe.respostaGestor?<Detail label="Resposta do gestor" value={detalhe.respostaGestor} colors={colors}/>:null}</ScrollView>:null}<PrimaryButton colors={colors} title="Fechar" variant="outline" onPress={()=>setDetalhe(null)}/></View></View></Modal>

    <Modal visible={!!finalizando} transparent animationType="slide" onRequestClose={()=>setFinalizando(null)}><View style={styles.overlay}><View style={[styles.sheet,{backgroundColor:colors.background,borderColor:colors.border}]}><Text style={[styles.modalTitle,{color:colors.textPrimary}]}>{finalizando?.status==='RESOLVIDA'?'Concluir ocorrência':'Cancelar ocorrência'}</Text><Text style={{color:colors.textSecondary,marginBottom:10,lineHeight:20}}>{finalizando?.status==='RESOLVIDA'?'Informe a conclusão para que o professor acompanhe o encerramento.':'Informe o motivo do cancelamento para registrar a decisão.'}</Text><TextInput value={resposta} onChangeText={setResposta} multiline numberOfLines={5} placeholder="Descreva a decisão tomada..." placeholderTextColor={colors.textSoft} style={[styles.textarea,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]}/><PrimaryButton colors={colors} title={finalizando?.status==='RESOLVIDA'?'Concluir':'Cancelar ocorrência'} onPress={()=>void confirmarFinalizacao()} loading={salvando}/><View style={{height:8}}/><PrimaryButton colors={colors} title="Voltar" variant="outline" onPress={()=>setFinalizando(null)}/></View></View></Modal>
  </Screen>;
};

function Filtro({label,valores,atual,setAtual,colors}:any){return <View style={{marginBottom:10}}><Text style={{color:colors.textSecondary,fontWeight:'800',fontSize:12,marginBottom:6}}>{label}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:7}}>{valores.map((v:string)=><Pressable key={v||'todos'} onPress={()=>setAtual(v)} style={[styles.chip,{borderColor:atual===v?colors.primary:colors.border,backgroundColor:atual===v?colors.primaryLight:colors.surface}]}><Text style={{color:atual===v?colors.primaryStrong:colors.textSecondary,fontWeight:'800',fontSize:11}}>{v?enumLabel(v):'Todos'}</Text></Pressable>)}</ScrollView></View>}
function Detail({label,value,colors}:any){return <View style={[styles.detail,{borderColor:colors.border}]}><Text style={{color:colors.textSoft,fontSize:11,fontWeight:'800'}}>{label}</Text><Text style={{color:colors.textPrimary,marginTop:4,lineHeight:20,fontWeight:label==='Descrição'?'500':'800'}}>{value||'—'}</Text></View>}
const styles=StyleSheet.create({search:{minHeight:48,borderWidth:1,borderRadius:14,paddingHorizontal:14,marginBottom:12},row:{flexDirection:'row',gap:10,alignItems:'flex-start'},title:{fontSize:17,fontWeight:'900'},meta:{flexDirection:'row',alignItems:'center',gap:10,marginTop:10},actionLabel:{fontSize:12,fontWeight:'900',marginTop:14,marginBottom:7},statusRow:{flexDirection:'row',flexWrap:'wrap',gap:6},statusBtn:{paddingHorizontal:10,minHeight:34,borderWidth:1,borderRadius:10,alignItems:'center',justifyContent:'center'},response:{borderWidth:1,borderRadius:12,padding:11,marginTop:12},chip:{paddingHorizontal:11,minHeight:34,borderWidth:1,borderRadius:999,alignItems:'center',justifyContent:'center'},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.48)',justifyContent:'flex-end'},sheet:{borderTopWidth:1,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:28,maxHeight:'88%'},modalHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:14},modalTitle:{fontSize:20,fontWeight:'900'},textarea:{minHeight:120,borderWidth:1,borderRadius:14,padding:13,textAlignVertical:'top',marginBottom:14},detail:{borderBottomWidth:StyleSheet.hairlineWidth,paddingVertical:10}});
