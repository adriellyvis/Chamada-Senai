import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Pill, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { getNotasAluno } from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import { NotaAluno } from '../../types/aluno';

function percentual(nota: number, maxima: number) {
  if (!maxima) return 0;
  return (Number(nota || 0) / Number(maxima)) * 100;
}
function formatarData(valor?: string | null) {
  if (!valor) return '—';
  const [a,m,d] = valor.slice(0,10).split('-');
  return a && m && d ? `${d}/${m}/${a}` : valor;
}
function toneNota(p: number): 'success' | 'warning' | 'danger' {
  if (p >= 70) return 'success';
  if (p >= 50) return 'warning';
  return 'danger';
}

export const AlunoNotesScreen: React.FC = () => {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [notas, setNotas] = useState<NotaAluno[]>([]);
  const [disciplina, setDisciplina] = useState('TODAS');
  const [bimestre, setBimestre] = useState(0);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  const carregar = useCallback(async () => {
    try { setLoading(true); setErro(''); setNotas(await getNotasAluno()); }
    catch (error) { setErro(getApiErrorMessage(error)); }
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const disciplinas = useMemo(() => Array.from(new Set(notas.map((n) => n.disciplinaNome).filter(Boolean))).sort(), [notas]);
  const filtradas = useMemo(() => [...notas]
    .filter((n) => (disciplina === 'TODAS' || n.disciplinaNome === disciplina) && (!bimestre || n.bimestre === bimestre))
    .sort((a, b) => String(b.dataAvaliacao || b.dataCriacao || '').localeCompare(String(a.dataAvaliacao || a.dataCriacao || ''))), [notas, disciplina, bimestre]);

  const mediaPercentual = useMemo(() => {
    if (!filtradas.length) return 0;
    return filtradas.reduce((s,n) => s + percentual(n.nota,n.notaMaxima), 0) / filtradas.length;
  }, [filtradas]);

  return (
    <Screen colors={colors} title="NOTAS" subtitle="Consulte suas avaliações e desempenho." refreshing={loading} onRefresh={carregar}>
      <View style={styles.stats}>
        <Card colors={colors} style={styles.stat}><Text style={[styles.statLabel,{color:colors.textSecondary}]}>Avaliações</Text><Text style={[styles.statValue,{color:colors.primary}]}>{filtradas.length}</Text></Card>
        <Card colors={colors} style={styles.stat}><Text style={[styles.statLabel,{color:colors.textSecondary}]}>Média relativa</Text><Text style={[styles.statValue,{color:mediaPercentual>=70?colors.success:mediaPercentual>=50?colors.warning:colors.danger}]}>{mediaPercentual.toFixed(0)}%</Text></Card>
      </View>

      <Text style={[styles.filterLabel,{color:colors.textPrimary}]}>Bimestre</Text>
      <View style={styles.chips}>
        {[0,1,2,3,4].map((b) => <Pressable key={b} onPress={() => setBimestre(b)} style={[styles.chip,{borderColor:bimestre===b?colors.primary:colors.border,backgroundColor:bimestre===b?colors.primaryLight:colors.surface}]}><Text style={{color:bimestre===b?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>{b===0?'Todos':`${b}º`}</Text></Pressable>)}
      </View>

      <Text style={[styles.filterLabel,{color:colors.textPrimary}]}>Disciplina</Text>
      <View style={styles.chips}>
        <Pressable onPress={() => setDisciplina('TODAS')} style={[styles.chip,{borderColor:disciplina==='TODAS'?colors.primary:colors.border,backgroundColor:disciplina==='TODAS'?colors.primaryLight:colors.surface}]}><Text style={{color:disciplina==='TODAS'?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>Todas</Text></Pressable>
        {disciplinas.map((d) => <Pressable key={d} onPress={() => setDisciplina(d)} style={[styles.chip,{borderColor:disciplina===d?colors.primary:colors.border,backgroundColor:disciplina===d?colors.primaryLight:colors.surface}]}><Text style={{color:disciplina===d?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>{d}</Text></Pressable>)}
      </View>

      {erro ? <Text style={{color:colors.danger,fontWeight:'700',marginBottom:12}}>{erro}</Text> : null}
      {loading && !notas.length ? <ActivityIndicator color={colors.primary} /> : null}
      {!loading && !filtradas.length ? <Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhuma nota encontrada para este filtro.</Text></Card> : null}

      {filtradas.map((nota) => {
        const p = percentual(nota.nota, nota.notaMaxima);
        return (
          <Card colors={colors} key={nota.id}>
            <View style={styles.rowTop}>
              <View style={{flex:1}}>
                <Text style={[styles.title,{color:colors.textPrimary}]}>{nota.titulo}</Text>
                <Text style={[styles.sub,{color:colors.textSecondary}]}>{nota.disciplinaNome} • {nota.bimestre}º bimestre</Text>
              </View>
              <Pill colors={colors} tone={toneNota(p)}>{p.toFixed(0)}%</Pill>
            </View>
            <View style={[styles.scoreBox,{backgroundColor:colors.primaryLight}]}>
              <Text style={[styles.score,{color:colors.primaryStrong}]}>{Number(nota.nota).toFixed(1)}</Text>
              <Text style={[styles.max,{color:colors.primaryStrong}]}> / {Number(nota.notaMaxima).toFixed(1)}</Text>
            </View>
            <Text style={[styles.sub,{color:colors.textSecondary}]}>Avaliação: {formatarData(nota.dataAvaliacao)}</Text>
            {nota.observacao ? <View style={[styles.obs,{borderColor:colors.border,backgroundColor:colors.background}]}><Text style={[styles.obsTitle,{color:colors.textPrimary}]}>Observação</Text><Text style={[styles.obsText,{color:colors.textSecondary}]}>{nota.observacao}</Text></View> : null}
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  stats:{flexDirection:'row',gap:10},stat:{flex:1,minHeight:96},statLabel:{fontSize:11,fontWeight:'800',textTransform:'uppercase'},statValue:{fontSize:27,fontWeight:'900',marginTop:8},filterLabel:{fontSize:14,fontWeight:'900',marginTop:8,marginBottom:8},chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:12},chip:{borderWidth:1,borderRadius:999,minHeight:36,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},rowTop:{flexDirection:'row',alignItems:'flex-start',gap:10},title:{fontSize:16,fontWeight:'900'},sub:{fontSize:12,lineHeight:18,marginTop:4},scoreBox:{alignSelf:'flex-start',borderRadius:14,paddingHorizontal:12,paddingVertical:8,flexDirection:'row',alignItems:'baseline',marginTop:14,marginBottom:8},score:{fontSize:24,fontWeight:'900'},max:{fontSize:13,fontWeight:'800'},obs:{borderWidth:1,borderRadius:14,padding:12,marginTop:12},obsTitle:{fontWeight:'900',marginBottom:4},obsText:{fontSize:13,lineHeight:19},
});
