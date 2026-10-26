import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Icon, PrimaryButton, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { atualizarDisciplina, criarDisciplina, getGestorDisciplinas } from '../../services/gestorService';
import { getApiErrorMessage } from '../../services/api';
import { GestorDisciplina } from '../../types/gestor';

export const GestorDisciplinesScreen:React.FC=()=>{
  const{darkMode}=useAppSettings();const colors=getTheme(darkMode);
  const[itens,setItens]=useState<GestorDisciplina[]>([]);const[busca,setBusca]=useState('');const[loading,setLoading]=useState(true);const[erro,setErro]=useState('');
  const[modal,setModal]=useState(false);const[editando,setEditando]=useState<GestorDisciplina|null>(null);const[nome,setNome]=useState('');const[sigla,setSigla]=useState('');const[salvando,setSalvando]=useState(false);
  const carregar=useCallback(async()=>{try{setLoading(true);setErro('');setItens(await getGestorDisciplinas());}catch(e){setErro(getApiErrorMessage(e));}finally{setLoading(false);}},[]);useFocusEffect(useCallback(()=>{void carregar();},[carregar]));
  const filtrados=useMemo(()=>{const q=busca.trim().toLowerCase();return q?itens.filter(i=>`${i.nome} ${i.sigla??''}`.toLowerCase().includes(q)):itens;},[itens,busca]);
  function abrir(i?:GestorDisciplina){setEditando(i??null);setNome(i?.nome??'');setSigla(i?.sigla??'');setModal(true);}
  async function salvar(){if(!nome.trim()){Alert.alert('Campo obrigatório','Informe o nome da disciplina.');return;}if(!sigla.trim()){Alert.alert('Campo obrigatório','Informe a sigla da disciplina.');return;}if(sigla.trim().length>10){Alert.alert('Sigla inválida','A sigla deve possuir no máximo 10 caracteres.');return;}try{setSalvando(true);const payload={nome:nome.trim(),sigla:sigla.trim().toUpperCase()};if(editando)await atualizarDisciplina(editando.id,payload);else await criarDisciplina(payload);setModal(false);await carregar();}catch(e){Alert.alert('Não foi possível salvar',getApiErrorMessage(e));}finally{setSalvando(false);}}
  return <Screen colors={colors} title="DISCIPLINAS" subtitle="Cadastre, liste e edite as disciplinas da instituição." refreshing={loading} onRefresh={carregar}>
    <View style={styles.top}><TextInput value={busca} onChangeText={setBusca} placeholder="Buscar por nome ou sigla" placeholderTextColor={colors.textSoft} style={[styles.search,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]}/><Pressable onPress={()=>abrir()} style={[styles.add,{backgroundColor:colors.primary}]}><Icon name="add" color="#fff" size={25}/></Pressable></View>
    {loading&&itens.length===0?<ActivityIndicator color={colors.primary}/>:null}{erro?<Text style={{color:colors.danger,marginBottom:12}}>{erro}</Text>:null}
    {filtrados.map(i=><Pressable key={i.id} onPress={()=>abrir(i)}><Card colors={colors}><View style={styles.row}><View style={{flex:1}}><Text style={[styles.title,{color:colors.textPrimary}]}>{i.nome}</Text><Text style={{color:colors.textSecondary,marginTop:4}}>{i.sigla||'Sem sigla'}</Text></View><Icon name="pencil-outline" color={colors.primary} size={20}/></View></Card></Pressable>)}
    {!loading&&filtrados.length===0?<Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhuma disciplina encontrada.</Text></Card>:null}
    <Modal visible={modal} transparent animationType="slide" onRequestClose={()=>setModal(false)}><View style={styles.overlay}><View style={[styles.sheet,{backgroundColor:colors.background,borderColor:colors.border}]}><Text style={[styles.modalTitle,{color:colors.textPrimary}]}>{editando?'Editar disciplina':'Nova disciplina'}</Text><Field label="Nome da disciplina *" value={nome} setValue={setNome} colors={colors}/><Field label="Sigla *" value={sigla} setValue={(v:string)=>setSigla(v.toUpperCase().slice(0,10))} colors={colors} autoCapitalize="characters"/><PrimaryButton colors={colors} title="Salvar" onPress={()=>void salvar()} loading={salvando}/><View style={{height:8}}/><PrimaryButton colors={colors} title="Cancelar" variant="outline" onPress={()=>setModal(false)}/></View></View></Modal>
  </Screen>;
};
function Field({label,value,setValue,colors,...rest}:any){return <View style={{marginBottom:12}}><Text style={{color:colors.textSecondary,fontWeight:'800',marginBottom:6}}>{label}</Text><TextInput value={value} onChangeText={setValue} placeholderTextColor={colors.textSoft} style={[styles.input,{color:colors.textPrimary,backgroundColor:colors.surface,borderColor:colors.border}]} {...rest}/></View>}
const styles=StyleSheet.create({top:{flexDirection:'row',gap:10,marginBottom:14},search:{flex:1,minHeight:48,borderWidth:1,borderRadius:14,paddingHorizontal:14},add:{width:48,borderRadius:14,alignItems:'center',justifyContent:'center'},row:{flexDirection:'row',alignItems:'center',gap:10},title:{fontSize:17,fontWeight:'900'},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.48)',justifyContent:'flex-end'},sheet:{borderTopWidth:1,borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,paddingBottom:28},modalTitle:{fontSize:20,fontWeight:'900',marginBottom:16},input:{minHeight:48,borderWidth:1,borderRadius:12,paddingHorizontal:13}});
