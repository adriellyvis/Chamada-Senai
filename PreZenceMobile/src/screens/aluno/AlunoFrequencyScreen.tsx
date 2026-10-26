import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Pill, Screen } from '../../components/UI';
import { getDashboard, getDesempenhoDisciplinas, getPresencas } from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import { AlunoDashboard, AlunoDesempenhoDisciplina, HistoricoPresenca } from '../../types/aluno';

function normalizar(valor?: string | null) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();
}

function statusTone(status: string): 'default' | 'success' | 'danger' | 'warning' {
  const s = normalizar(status);
  if (s === 'PRESENTE') return 'success';
  if (s === 'AUSENTE') return 'danger';
  if (s === 'ATRASADO' || s === 'SAIDA_TEMPORARIA') return 'warning';
  return 'default';
}

function labelStatus(status: string) {
  const mapa: Record<string,string> = {
    PRESENTE: 'Presente',
    AUSENTE: 'Ausente',
    ATRASADO: 'Atrasado',
    SAIDA_TEMPORARIA: 'Saída temporária',
  };
  return mapa[normalizar(status)] ?? status;
}

function formatarData(valor: string) {
  if (!valor) return '—';
  const [a,m,d] = valor.slice(0,10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : valor;
}

function formatarHorario(valor?: string | null) {
  if (!valor) return '';
  const texto = String(valor);
  const horario = texto.includes('T') ? texto.split('T')[1]?.slice(0,5) : texto.slice(0,5);
  return horario || '';
}

function ehBiometria(metodo?: string | null) {
  const valor = normalizar(metodo);
  return valor.includes('BIOMETR') || valor.includes('FACIAL') || valor.includes('FACE');
}

export const AlunoFrequencyScreen: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [dashboard, setDashboard] = useState<AlunoDashboard | null>(null);
  const [disciplinas, setDisciplinas] = useState<AlunoDesempenhoDisciplina[]>([]);
  const [historico, setHistorico] = useState<HistoricoPresenca[]>([]);
  const [filtro, setFiltro] = useState('TODOS');
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      setErro('');
      const [d,ds,h] = await Promise.all([
        getDashboard(user.id),
        getDesempenhoDisciplinas(user.id),
        getPresencas(user.id),
      ]);
      setDashboard(d);
      setDisciplinas(ds);
      setHistorico([...h].sort((a,b) => {
        const data = String(b.dataAula || '').localeCompare(String(a.dataAula || ''));
        if (data !== 0) return data;
        return String(b.horarioRegistro || '').localeCompare(String(a.horarioRegistro || ''));
      }));
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const lista = useMemo(() => {
    if (filtro === 'TODOS') return historico;
    if (filtro === 'BIOMETRIA') return historico.filter((h) => ehBiometria(h.metodo));
    return historico.filter((h) => normalizar(h.status) === filtro);
  }, [historico, filtro]);

  const quantidadeBiometria = useMemo(() => historico.filter((h) => ehBiometria(h.metodo)).length, [historico]);

  return (
    <Screen colors={colors} title="FREQUÊNCIA" subtitle="Acompanhe presenças, faltas e registros biométricos." refreshing={loading} onRefresh={carregar}>
      {dashboard ? (
        <>
          <View style={styles.stats}>
            <Card colors={colors} style={styles.stat}><Text style={[styles.label,{color:colors.textSecondary}]}>Frequência</Text><Text style={[styles.value,{color:colors.primary}]}>{Number(dashboard.frequencia || 0).toFixed(1)}%</Text></Card>
            <Card colors={colors} style={styles.stat}><Text style={[styles.label,{color:colors.textSecondary}]}>Presenças</Text><Text style={[styles.value,{color:colors.success}]}>{dashboard.presencas}</Text></Card>
            <Card colors={colors} style={styles.stat}><Text style={[styles.label,{color:colors.textSecondary}]}>Faltas</Text><Text style={[styles.value,{color:colors.danger}]}>{dashboard.faltas}</Text></Card>
            <Card colors={colors} style={styles.stat}><Text style={[styles.label,{color:colors.textSecondary}]}>Atrasos</Text><Text style={[styles.value,{color:colors.warning}]}>{dashboard.atrasos}</Text></Card>
          </View>
          <Card colors={colors}>
            <View style={styles.progressHead}><Text style={[styles.title,{color:colors.textPrimary}]}>Aproveitamento geral</Text><Text style={[styles.title,{color:colors.primary}]}>{Number(dashboard.frequencia || 0).toFixed(1)}%</Text></View>
            <View style={[styles.track,{backgroundColor:colors.border}]}><View style={[styles.bar,{backgroundColor:colors.primary,width:`${Math.min(100,Math.max(0,Number(dashboard.frequencia||0)))}%`}]} /></View>
            <Text style={[styles.small,{color:colors.textSecondary}]}>{dashboard.aulasAssistidas} aulas assistidas de {dashboard.totalAulas} • {dashboard.faltasMes} faltas neste mês</Text>
          </Card>
          <Card colors={colors}>
            <View style={styles.progressHead}>
              <View style={{flex:1}}>
                <Text style={[styles.title,{color:colors.textPrimary}]}>Registros biométricos</Text>
                <Text style={[styles.small,{color:colors.textSecondary}]}>Presenças registradas por biometria facial.</Text>
              </View>
              <Text style={[styles.valueSmall,{color:colors.primary}]}>{quantidadeBiometria}</Text>
            </View>
          </Card>
        </>
      ) : null}

      <Text style={[styles.section,{color:colors.textPrimary}]}>Por disciplina</Text>
      {!loading && !disciplinas.length ? <Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhum desempenho por disciplina encontrado.</Text></Card> : null}
      {disciplinas.map((d) => (
        <Card colors={colors} key={d.disciplina}>
          <View style={styles.progressHead}><Text style={[styles.title,{color:colors.textPrimary}]}>{d.disciplina}</Text><Text style={[styles.title,{color:colors.primary}]}>{Number(d.frequencia||0).toFixed(1)}%</Text></View>
          <View style={[styles.track,{backgroundColor:colors.border,marginTop:10}]}><View style={[styles.bar,{backgroundColor:Number(d.frequencia||0)>=75?colors.success:colors.warning,width:`${Math.min(100,Math.max(0,Number(d.frequencia||0)))}%`}]} /></View>
          <Text style={[styles.small,{color:colors.textSecondary}]}>Presenças {d.presencas} • Faltas {d.faltas} • Atrasos {d.atrasos}</Text>
        </Card>
      ))}

      <Text style={[styles.section,{color:colors.textPrimary}]}>Histórico</Text>
      <View style={styles.chips}>
        {[
          ['TODOS','Todos'],
          ['PRESENTE','Presentes'],
          ['AUSENTE','Ausentes'],
          ['ATRASADO','Atrasos'],
          ['BIOMETRIA',`Biometria (${quantidadeBiometria})`],
        ].map(([valor,label]) => (
          <Pressable key={valor} onPress={() => setFiltro(valor)} style={[styles.chip,{borderColor:filtro===valor?colors.primary:colors.border,backgroundColor:filtro===valor?colors.primaryLight:colors.surface}]}><Text style={{color:filtro===valor?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>{label}</Text></Pressable>
        ))}
      </View>

      {erro ? <Text style={{color:colors.danger,fontWeight:'700',marginBottom:12}}>{erro}</Text> : null}
      {loading && !historico.length ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && !lista.length ? <Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhum registro encontrado para este filtro.</Text></Card> : null}
      {lista.map((item, index) => {
        const horario = formatarHorario(item.horarioRegistro);
        const biometrico = ehBiometria(item.metodo);
        return (
          <Card colors={colors} key={`${item.aulaId}-${item.dataAula}-${index}`} style={biometrico ? {borderColor:colors.primary} : undefined}>
            <View style={styles.row}>
              <View style={{flex:1}}>
                <Text style={[styles.title,{color:colors.textPrimary}]}>{item.disciplina}</Text>
                <Text style={[styles.small,{color:colors.textSecondary}]}>{formatarData(item.dataAula)}{horario ? ` • ${horario}` : ''} • {item.professor}</Text>
              </View>
              <Pill colors={colors} tone={statusTone(item.status)}>{labelStatus(item.status)}</Pill>
            </View>
            <View style={styles.methodRow}>
              <Text style={[styles.small,{color:colors.textSoft,marginTop:0}]}>Método: {item.metodo || 'Não informado'}</Text>
              {biometrico ? <Pill colors={colors}>Biometria</Pill> : null}
            </View>
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  stats:{flexDirection:'row',flexWrap:'wrap',gap:10},
  stat:{width:'48%',minHeight:92},
  label:{fontSize:11,fontWeight:'800',textTransform:'uppercase'},
  value:{fontSize:27,fontWeight:'900',marginTop:8},
  valueSmall:{fontSize:28,fontWeight:'900'},
  progressHead:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'},
  title:{fontSize:15,fontWeight:'900'},
  small:{fontSize:12,lineHeight:18,marginTop:6},
  track:{height:9,borderRadius:999,overflow:'hidden',marginTop:14},
  bar:{height:'100%',borderRadius:999},
  section:{fontSize:17,fontWeight:'900',marginTop:12,marginBottom:10},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},
  chip:{borderWidth:1,borderRadius:999,paddingHorizontal:12,minHeight:36,alignItems:'center',justifyContent:'center'},
  row:{flexDirection:'row',alignItems:'flex-start',gap:10},
  methodRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:10,marginTop:10},
});
