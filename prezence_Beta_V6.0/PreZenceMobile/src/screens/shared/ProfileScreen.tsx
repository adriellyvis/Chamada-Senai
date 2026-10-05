import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { api } from '../../services/api';
import { Card, Icon, Pill, PrimaryButton, Row, Screen, initials } from '../../components/UI';

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [details, setDetails] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const endpoint = user.perfil === 'ALUNO' ? `/aluno/perfil/${user.id}` : user.perfil === 'PROFESSOR' ? '/professor/perfil' : '/gestor/perfil';
      const r = await api.get(endpoint);
      setDetails(r.data || {});
    } catch (e) {
      console.warn('Perfil completo indisponível:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => { load(); }, [load]);

  return <Screen colors={colors} title="MEU PERFIL" subtitle="Revise seus dados e acompanhe seu cadastro." refreshing={loading} onRefresh={load}>
    <Card colors={colors} style={styles.hero}>
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}><Text style={[styles.avatarText, { color: colors.primaryStrong }]}>{initials(user?.nome)}</Text></View>
      <View style={{ flex: 1 }}><Text style={[styles.name,{color:colors.textPrimary}]}>{user?.nome || 'Usuário'}</Text><Text style={{color:colors.textSecondary,marginTop:3}}>{user?.email}</Text><View style={{marginTop:8}}><Pill colors={colors}>{user?.perfil}</Pill></View></View>
    </Card>
    <Card colors={colors}>
      <Text style={[styles.section,{color:colors.textPrimary}]}>Dados pessoais</Text>
      <Row colors={colors}><Text style={styles.label}>Nome</Text><Text style={[styles.value,{color:colors.textPrimary}]}>{details.nome ?? user?.nome ?? '—'}</Text></Row>
      <Row colors={colors}><Text style={styles.label}>E-mail</Text><Text style={[styles.value,{color:colors.textPrimary}]}>{details.email ?? user?.email ?? '—'}</Text></Row>
      {user?.perfil==='ALUNO'&&<><Row colors={colors}><Text style={styles.label}>Matrícula / RA</Text><Text style={[styles.value,{color:colors.textPrimary}]}>{details.matricula ?? details.ra ?? 'Não informada'}</Text></Row><Row colors={colors}><Text style={styles.label}>Turma</Text><Text style={[styles.value,{color:colors.textPrimary}]}>{details.turma ?? details.nomeTurma ?? details.turmaNome ?? details.turma?.nome ?? 'Não informada'}</Text></Row></>}
      {user?.perfil==='PROFESSOR'&&<Row colors={colors}><Text style={styles.label}>Especialidade</Text><Text style={[styles.value,{color:colors.textPrimary}]}>{details.especialidade ?? 'Não informada'}</Text></Row>}
      <Row colors={colors}><Text style={styles.label}>Status</Text><Pill colors={colors} tone={details.ativo===false?'danger':'success'}>{details.ativo===false?'Inativo':'Ativo'}</Pill></Row>
    </Card>
    {user?.perfil==='ALUNO'&&<Card colors={colors}><Text style={[styles.section,{color:colors.textPrimary}]}>Biometria facial</Text><Text style={{color:colors.textSecondary,lineHeight:19}}>O cadastro facial é necessário para usar a chamada biométrica.</Text><View style={{marginTop:12}}><PrimaryButton colors={colors} title="Ver status biométrico" variant="outline" onPress={async()=>{try{const r=await api.get(`/biometria/amostras/${user.id}/status`);Alert.alert('Biometria',r.data?.cadastrada?'Face cadastrada.':'Face ainda não cadastrada.')}catch(e){Alert.alert('Biometria','Não foi possível consultar o status agora.')}}}/></View></Card>}
    <PrimaryButton colors={colors} title="Sair do portal" variant="danger" onPress={()=>Alert.alert('Sair','Deseja encerrar a sessão?',[{text:'Cancelar',style:'cancel'},{text:'Sair',style:'destructive',onPress:signOut}])}/>
  </Screen>;
};
const styles=StyleSheet.create({hero:{flexDirection:'row',alignItems:'center',gap:14},avatar:{width:68,height:68,borderRadius:22,alignItems:'center',justifyContent:'center'},avatarText:{fontSize:27,fontWeight:'900'},name:{fontSize:20,fontWeight:'900'},section:{fontSize:16,fontWeight:'900',marginBottom:2},label:{width:118,fontSize:12,fontWeight:'800',color:'#777'},value:{flex:1,textAlign:'right',fontSize:13,fontWeight:'700'}});
