import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Icon, PrimaryButton, Row, Screen } from '../../components/UI';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const s = useAppSettings();
  const colors = getTheme(s.darkMode);
  return <Screen colors={colors} title="CONFIGURAÇÕES" subtitle="Personalize o Portal do PreZence.">
    <Card colors={colors}>
      <Text style={[styles.section, { color: colors.textPrimary }]}>Aparência</Text>
      <Row colors={colors}><View style={styles.rowIcon}><Icon glyph="☾" color={colors.primary} /></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:colors.textPrimary}]}>Tema escuro</Text><Text style={{color:colors.textSecondary}}>Use a mesma identidade noturna da aplicação web.</Text></View><Switch value={s.darkMode} onValueChange={(v)=>s.updateSettings({darkMode:v})} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={s.darkMode ? colors.primary : colors.textSoft}/></Row>
    </Card>
    <Card colors={colors}>
      <Text style={[styles.section, { color: colors.textPrimary }]}>Notificações</Text>
      <Row colors={colors}><View style={styles.rowIcon}><Icon glyph="!" color={colors.primary}/></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:colors.textPrimary}]}>Frequência</Text><Text style={{color:colors.textSecondary}}>Avisar quando a frequência pedir atenção.</Text></View><Switch value={s.notificacoesFrequencia} onValueChange={(v)=>s.updateSettings({notificacoesFrequencia:v})} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={s.notificacoesFrequencia ? colors.primary : colors.textSoft}/></Row>
      <Row colors={colors}><View style={styles.rowIcon}><Icon glyph="◎" color={colors.primary}/></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:colors.textPrimary}]}>Chamada</Text><Text style={{color:colors.textSecondary}}>Avisar quando houver chamada aberta.</Text></View><Switch value={s.notificacoesChamada} onValueChange={(v)=>s.updateSettings({notificacoesChamada:v})} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={s.notificacoesChamada ? colors.primary : colors.textSoft}/></Row>
    </Card>
    <Card colors={colors}>
      <Text style={[styles.section,{color:colors.textPrimary}]}>Comportamento</Text>
      <Row colors={colors}><View style={styles.rowIcon}><Icon glyph="↗" color={colors.primary}/></View><View style={{flex:1}}><Text style={[styles.rowTitle,{color:colors.textPrimary}]}>Confirmar saída</Text><Text style={{color:colors.textSecondary}}>Perguntar antes de encerrar o portal.</Text></View><Switch value={s.confirmarSaida} onValueChange={(v)=>s.updateSettings({confirmarSaida:v})} trackColor={{ false: colors.border, true: colors.primaryLight }} thumbColor={s.confirmarSaida ? colors.primary : colors.textSoft}/></Row>
    </Card>
    <PrimaryButton colors={colors} title="Voltar" variant="outline" onPress={()=>navigation.goBack()} />
  </Screen>;
};
const styles=StyleSheet.create({section:{fontSize:16,fontWeight:'900',marginBottom:2},rowIcon:{width:38,height:38,borderRadius:12,backgroundColor:'#00000008',alignItems:'center',justifyContent:'center'},rowTitle:{fontSize:14,fontWeight:'800'},});
