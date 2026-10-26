import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Card, Pill, PrimaryButton, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { enviarFeedbackProfessor, getProfessorAlunos } from '../../services/professorService';
import { getApiErrorMessage } from '../../services/api';
import { AlunoProfessor } from '../../types/professor';

export const ProfessorAlunosScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const turmaId = route.params?.turmaId as number | undefined;
  const { darkMode } = useAppSettings(); const colors = getTheme(darkMode);
  const [alunos,setAlunos]=useState<AlunoProfessor[]>([]); const [busca,setBusca]=useState(''); const [loading,setLoading]=useState(true); const [erro,setErro]=useState('');
  const [feedbackAluno,setFeedbackAluno]=useState<AlunoProfessor|null>(null); const [titulo,setTitulo]=useState('Feedback acadêmico'); const [mensagem,setMensagem]=useState(''); const [nota,setNota]=useState(''); const [melhorias,setMelhorias]=useState(''); const [enviando,setEnviando]=useState(false);

  const carregar=useCallback(async()=>{try{setLoading(true);setErro('');setAlunos(await getProfessorAlunos(turmaId));}catch(e){setErro(getApiErrorMessage(e));}finally{setLoading(false);}},[turmaId]);
  useFocusEffect(useCallback(()=>{void carregar();},[carregar]));
  const filtrados=useMemo(()=>{const q=busca.trim().toLowerCase();const lista=q?alunos.filter(a=>`${a.nome} ${a.email} ${a.matricula} ${a.turma}`.toLowerCase().includes(q)):alunos;return [...lista].sort((a,b)=>Number(a.frequencia??0)-Number(b.frequencia??0));},[alunos,busca]);

  function abrirFeedback(aluno:AlunoProfessor){setFeedbackAluno(aluno);setTitulo('Feedback acadêmico');setMensagem('');setNota('');setMelhorias('');}
  async function enviar(){if(!feedbackAluno)return;if(!titulo.trim()){Alert.alert('Título obrigatório','Informe um título.');return;}const n=nota.trim()?Number(nota.replace(',','.')):null;if(n!==null&&(!Number.isFinite(n)||n<0)){Alert.alert('Nota inválida','Informe uma nota válida ou deixe em branco.');return;}try{setEnviando(true);await enviarFeedbackProfessor({alunoId:feedbackAluno.alunoId,turmaId:feedbackAluno.turmaId,turmaNome:feedbackAluno.turma,titulo:titulo.trim(),mensagem:mensagem.trim(),frequencia:Number(feedbackAluno.frequencia??0),nota:n,melhorias:melhorias.trim()||null,categoria:'FEEDBACK',prioridade:Number(feedbackAluno.frequencia??0)<75?'IMPORTANTE':'NORMAL'});setFeedbackAluno(null);Alert.alert('Feedback enviado','O aluno receberá o feedback no mural de avisos.');}catch(e){Alert.alert('Não foi possível enviar',getApiErrorMessage(e));}finally{setEnviando(false);}}

  return <Screen colors={colors} title="ALUNOS" subtitle="Acompanhe os alunos das suas turmas." refreshing={loading} onRefresh={carregar}>
    <TextInput value={busca} onChangeText={setBusca} placeholder="Buscar nome, RA ou turma" placeholderTextColor={colors.textSoft} style={[styles.search,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]}/>
    {loading&&alunos.length===0?<ActivityIndicator color={colors.primary}/>:null}{erro?<Text style={{color:colors.danger,marginBottom:12}}>{erro}</Text>:null}
    {filtrados.map(aluno=>{const freq=Number(aluno.frequencia??0);const tone=freq>=75?'success':freq>=60?'warning':'danger';const situacao=freq>=75?'Regular':freq>=60?'Atenção':'Risco crítico';return <Card colors={colors} key={aluno.alunoId}>
      <Pressable onPress={()=>navigation.getParent()?.navigate('AlunoDetalheProfessor',{alunoId:aluno.alunoId,aluno})}><View style={styles.top}><View style={{flex:1}}><Text style={[styles.nome,{color:colors.textPrimary}]}>{aluno.nome}</Text><Text style={[styles.info,{color:colors.textSecondary}]}>{aluno.turma} • RA {aluno.matricula}</Text><Text style={[styles.info,{color:colors.textSecondary}]}>{aluno.email}</Text><Text style={[styles.situacao,{color:tone==='success'?colors.success:tone==='warning'?colors.warning:colors.danger}]}>Situação: {situacao}</Text></View><Pill colors={colors} tone={tone}>{freq.toFixed(1)}%</Pill></View></Pressable>
      <View style={styles.actions}><Action label="Situação" color={colors.primary} onPress={()=>navigation.getParent()?.navigate('AlunoDetalheProfessor',{alunoId:aluno.alunoId,aluno})}/><Action label="Notas" color={colors.primaryStrong} onPress={()=>navigation.getParent()?.navigate('NotasProfessor',{alunoId:aluno.alunoId,turmaId:aluno.turmaId})}/><Action label="Ocorrência" color={colors.warning} onPress={()=>navigation.getParent()?.navigate('OcorrenciasProfessor',{alunoId:aluno.alunoId})}/><Action label="Feedback" color={colors.success} onPress={()=>abrirFeedback(aluno)}/></View>
    </Card>})}
    {!loading&&filtrados.length===0?<Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhum aluno encontrado.</Text></Card>:null}

    <Modal visible={!!feedbackAluno} transparent animationType="slide" onRequestClose={()=>setFeedbackAluno(null)}><View style={styles.overlay}><View style={[styles.sheet,{backgroundColor:colors.background,borderColor:colors.border}]}><Text style={[styles.modalTitle,{color:colors.textPrimary}]}>Feedback para {feedbackAluno?.nome}</Text><Text style={{color:colors.textSecondary,marginBottom:10}}>Frequência atual: {Number(feedbackAluno?.frequencia??0).toFixed(1)}%</Text><Field label="Título *" value={titulo} setValue={setTitulo} colors={colors}/><Field label="Nota / média (opcional)" value={nota} setValue={setNota} colors={colors} keyboardType="decimal-pad"/><Field label="Comentário" value={mensagem} setValue={setMensagem} colors={colors} multiline numberOfLines={4}/><Field label="Orientação de melhoria (opcional)" value={melhorias} setValue={setMelhorias} colors={colors} multiline numberOfLines={3}/><PrimaryButton colors={colors} title="Enviar ao aluno" onPress={()=>void enviar()} loading={enviando}/><View style={{height:8}}/><PrimaryButton colors={colors} title="Cancelar" variant="outline" onPress={()=>setFeedbackAluno(null)}/></View></View></Modal>
  </Screen>;
};
function Action({label,color,onPress}:any){return <Pressable onPress={onPress} style={[styles.button,{borderColor:color}]}><Text style={{color,fontWeight:'900',fontSize:12}}>{label}</Text></Pressable>}
function Field({label,value,setValue,colors,...rest}:any){return <View style={{marginBottom:10}}><Text style={{color:colors.textSecondary,fontWeight:'800',marginBottom:5}}>{label}</Text><TextInput value={value} onChangeText={setValue} placeholderTextColor={colors.textSoft} textAlignVertical={rest.multiline?'top':'center'} style={[styles.input,rest.multiline&&styles.textarea,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]} {...rest}/></View>}
const styles=StyleSheet.create({search:{minHeight:48,borderWidth:1,borderRadius:14,paddingHorizontal:14,marginBottom:14},top:{flexDirection:'row',alignItems:'flex-start',gap:10},nome:{fontSize:16,fontWeight:'900'},info:{fontSize:12,marginTop:4},situacao:{fontSize:12,marginTop:7,fontWeight:'900'},actions:{flexDirection:'row',flexWrap:'wrap',gap:7,marginTop:13},button:{minWidth:'47%',flexGrow:1,minHeight:39,borderWidth:1,borderRadius:11,alignItems:'center',justifyContent:'center'},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.48)',justifyContent:'flex-end'},sheet:{borderTopWidth:1,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:28},modalTitle:{fontSize:20,fontWeight:'900',marginBottom:8},input:{minHeight:46,borderWidth:1,borderRadius:12,paddingHorizontal:12},textarea:{minHeight:88,paddingTop:12}});
