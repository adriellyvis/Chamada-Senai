import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Screen } from '../../components/UI';
import { StatCard } from '../../components/ui/StatCard';
import { getApiErrorMessage } from '../../services/api';
import { getGestorDashboard, getGestorOcorrencias } from '../../services/gestorService';
import { GestorDashboard, GestorOcorrencia } from '../../types/gestor';

const vazio: GestorDashboard = {
  usuariosAtivos: 0, professoresAtivos: 0, alunosAtivos: 0, totalTurmas: 0,
  turmasSemProfessor: 0, baixaFrequencia: 0, chamadasHoje: 0, chamadasAbertas: 0,
  alertasCriticos: 0, presencasHoje: 0, chamadasEncerradas: 0, alunosAusentes: 0,
};

export const GestorHomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [dados, setDados] = useState(vazio);
  const [ocorrencias, setOcorrencias] = useState<GestorOcorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try {
      setLoading(true); setErro('');
      const [dashboard, ocorr] = await Promise.all([
        getGestorDashboard(),
        getGestorOcorrencias().catch(() => []),
      ]);
      setDados(dashboard);
      setOcorrencias(ocorr.slice(0, 4));
    } catch (e) {
      setErro(getApiErrorMessage(e));
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  return <Screen colors={colors} title="DASHBOARD" subtitle="Visão geral da instituição." refreshing={loading} onRefresh={carregar}>
    {loading && dados.usuariosAtivos === 0 ? <ActivityIndicator color={colors.primary} /> : null}
    {erro ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{erro}</Text> : null}

    <View style={styles.grid}>
      <StatCard colors={colors} label="Usuários ativos" value={dados.usuariosAtivos} icon="people-outline" hint={`${dados.professoresAtivos} professores • ${dados.alunosAtivos} alunos`} />
      <StatCard colors={colors} label="Turmas" value={dados.totalTurmas} icon="business-outline" hint="em funcionamento" />
    </View>
    <View style={styles.grid}>
      <StatCard colors={colors} label="Chamadas hoje" value={dados.chamadasHoje} icon="checkmark-circle-outline" hint={`${dados.chamadasAbertas} abertas`} />
      <StatCard colors={colors} label="Alertas críticos" value={dados.alertasCriticos || dados.baixaFrequencia} icon="alert-circle-outline" hint="atenção à frequência" />
    </View>

    <Text style={[styles.section, { color: colors.textPrimary }]}>Painel institucional</Text>
    <Card colors={colors}>
      <Metric label="Professores ativos" value={dados.professoresAtivos} colors={colors} />
      <Metric label="Turmas sem professor" value={dados.turmasSemProfessor} colors={colors} danger={dados.turmasSemProfessor > 0} />
      <Metric label="Baixa frequência" value={dados.baixaFrequencia} colors={colors} danger={dados.baixaFrequencia > 0} />
      <Metric label="Chamadas abertas" value={dados.chamadasAbertas} colors={colors} />
    </Card>

    <Text style={[styles.section, { color: colors.textPrimary }]}>Resumo do dia</Text>
    <View style={styles.grid}>
      <StatCard colors={colors} label="Presenças" value={dados.presencasHoje} icon="checkmark-done-outline" />
      <StatCard colors={colors} label="Encerradas" value={dados.chamadasEncerradas} icon="lock-closed-outline" />
      <StatCard colors={colors} label="Ausentes" value={dados.alunosAusentes} icon="person-remove-outline" />
    </View>

    <Text style={[styles.section, { color: colors.textPrimary }]}>Gestão rápida</Text>
    <View style={styles.actions}>
      <Quick title="Gerenciar turmas" onPress={() => navigation.navigate('Turmas')} colors={colors} />
      <Quick title="Listar usuários" onPress={() => navigation.navigate('Usuarios')} colors={colors} />
      <Quick title="Disciplinas" onPress={() => navigation.getParent()?.navigate('Disciplinas')} colors={colors} />
      <Quick title="Ocorrências" onPress={() => navigation.navigate('Ocorrencias')} colors={colors} />
    </View>

    <Text style={[styles.section, { color: colors.textPrimary }]}>Ocorrências recentes</Text>
    {ocorrencias.length === 0 ? <Card colors={colors}><Text style={{ color: colors.textSecondary }}>Nenhuma ocorrência recente encontrada.</Text></Card> : ocorrencias.map(item =>
      <Pressable key={item.id} onPress={() => navigation.navigate('Ocorrencias')}>
        <Card colors={colors}>
          <Text style={[styles.itemTitle, { color: colors.textPrimary }]}>{item.titulo || item.tipo || 'Ocorrência'}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{item.alunoNome || item.professorNome || 'Registro institucional'}</Text>
          <Text numberOfLines={2} style={{ color: colors.textSecondary, marginTop: 6 }}>{item.descricao}</Text>
          <Text style={{ color: colors.primary, marginTop: 9, fontWeight: '900', fontSize: 12 }}>Toque para gerenciar</Text>
        </Card>
      </Pressable>
    )}
  </Screen>;
};

function Metric({ label, value, colors, danger = false }: any) {
  return <View style={styles.metric}><Text style={{ color: colors.textSecondary }}>{label}</Text><Text style={{ color: danger ? colors.danger : colors.textPrimary, fontWeight: '900', fontSize: 18 }}>{value}</Text></View>;
}
function Quick({ title, onPress, colors }: any) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quick, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? .7 : 1 }]}><Text style={{ color: colors.primary, fontWeight: '900' }}>{title}</Text></Pressable>;
}
const styles = StyleSheet.create({ grid:{flexDirection:'row',gap:10,marginBottom:10},section:{fontSize:16,fontWeight:'900',marginTop:12,marginBottom:10},metric:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8},actions:{flexDirection:'row',flexWrap:'wrap',gap:10},quick:{width:'48%',minHeight:62,borderWidth:1,borderRadius:16,padding:12,justifyContent:'center'},itemTitle:{fontSize:15,fontWeight:'900'} });
