import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Card, Screen } from '../../components/UI';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { getAgenda } from '../../services/alunoService';
import { getApiErrorMessage } from '../../services/api';
import { HorarioAula } from '../../types/aluno';

const DIAS = [
  ['MONDAY', 'Segunda'],
  ['TUESDAY', 'Terça'],
  ['WEDNESDAY', 'Quarta'],
  ['THURSDAY', 'Quinta'],
  ['FRIDAY', 'Sexta'],
  ['SATURDAY', 'Sábado'],
] as const;

function horaCurta(valor?: string | null) {
  return String(valor ?? '').slice(0, 5) || '--:--';
}

function codigoDiaAtual() {
  const codigos = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const codigo = codigos[new Date().getDay()] ?? '';
  return DIAS.some(([item]) => item === codigo) ? codigo : '';
}

export const AlunoAgendaScreen: React.FC = () => {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const [agenda, setAgenda] = useState<HorarioAula[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');
  const [dia, setDia] = useState<string>(() => codigoDiaAtual());

  const carregar = useCallback(async () => {
    try {
      setLoading(true);
      setErro('');
      setAgenda(await getAgenda());
    } catch (error) {
      setErro(getApiErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void carregar(); }, [carregar]));

  const filtradas = useMemo(() => {
    const ativas = agenda.filter((a) => a.ativo !== false);
    const itens = dia ? ativas.filter((a) => a.diaSemana === dia) : ativas;
    return [...itens].sort((a, b) => {
      const da = DIAS.findIndex(([codigo]) => codigo === a.diaSemana);
      const db = DIAS.findIndex(([codigo]) => codigo === b.diaSemana);
      if (da !== db) return da - db;
      return a.horaInicio.localeCompare(b.horaInicio);
    });
  }, [agenda, dia]);

  const agendaAtiva = agenda.filter((a) => a.ativo !== false);
  const totalDisciplinas = new Set(agendaAtiva.map((a) => a.disciplinaId || a.disciplina)).size;

  return (
    <Screen colors={colors} title="AGENDA" subtitle="Sua grade semanal de aulas." refreshing={loading} onRefresh={carregar}>
      <View style={styles.stats}>
        <Card colors={colors} style={styles.stat}><Text style={[styles.statLabel,{color:colors.textSecondary}]}>Horários</Text><Text style={[styles.statValue,{color:colors.primary}]}>{agendaAtiva.length}</Text></Card>
        <Card colors={colors} style={styles.stat}><Text style={[styles.statLabel,{color:colors.textSecondary}]}>Disciplinas</Text><Text style={[styles.statValue,{color:colors.primary}]}>{totalDisciplinas}</Text></Card>
      </View>

      <View style={styles.chips}>
        <Pressable onPress={() => setDia('')} style={[styles.chip,{borderColor:!dia?colors.primary:colors.border,backgroundColor:!dia?colors.primaryLight:colors.surface}]}><Text style={{color:!dia?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>Todos</Text></Pressable>
        {DIAS.map(([codigo, nome]) => (
          <Pressable key={codigo} onPress={() => setDia(codigo)} style={[styles.chip,{borderColor:dia===codigo?colors.primary:colors.border,backgroundColor:dia===codigo?colors.primaryLight:colors.surface}]}><Text style={{color:dia===codigo?colors.primaryStrong:colors.textSecondary,fontWeight:'800'}}>{nome.slice(0,3)}</Text></Pressable>
        ))}
      </View>

      {erro ? <Text style={[styles.error,{color:colors.danger}]}>{erro}</Text> : null}
      {loading && !agenda.length ? <ActivityIndicator color={colors.primary} style={{marginTop:24}} /> : null}

      {!loading && filtradas.length === 0 ? (
        <Card colors={colors}><Text style={{color:colors.textSecondary}}>Nenhuma aula encontrada para este filtro.</Text></Card>
      ) : null}

      {filtradas.map((aula) => {
        const diaNome = DIAS.find(([codigo]) => codigo === aula.diaSemana)?.[1] ?? aula.diaSemana;
        return (
          <Card colors={colors} key={aula.id}>
            <View style={styles.rowTop}>
              <View style={{flex:1}}>
                <Text style={[styles.title,{color:colors.textPrimary}]}>{aula.disciplina}</Text>
                <Text style={[styles.subtitle,{color:colors.textSecondary}]}>{aula.siglaDisciplina || 'Disciplina'} • {diaNome}</Text>
              </View>
              <View style={[styles.timeBox,{backgroundColor:colors.primaryLight}]}>
                <Text style={[styles.time,{color:colors.primaryStrong}]}>{horaCurta(aula.horaInicio)}</Text>
                <Text style={[styles.timeSmall,{color:colors.primaryStrong}]}>{horaCurta(aula.horaFim)}</Text>
              </View>
            </View>
            <View style={[styles.separator,{backgroundColor:colors.border}]} />
            <Text style={[styles.info,{color:colors.textSecondary}]}>Professor: {aula.professor}</Text>
            <Text style={[styles.info,{color:colors.textSecondary}]}>Turma: {aula.turma}</Text>
            <Text style={[styles.info,{color:colors.textSecondary}]}>Sala: {aula.sala || 'Não informada'}</Text>
          </Card>
        );
      })}
    </Screen>
  );
};

const styles = StyleSheet.create({
  stats:{flexDirection:'row',gap:10},stat:{flex:1,minHeight:96},statLabel:{fontSize:12,fontWeight:'800',textTransform:'uppercase'},statValue:{fontSize:28,fontWeight:'900',marginTop:8},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:14},chip:{borderWidth:1,borderRadius:999,minHeight:36,paddingHorizontal:12,alignItems:'center',justifyContent:'center'},
  error:{fontWeight:'700',marginBottom:12},rowTop:{flexDirection:'row',gap:12,alignItems:'center'},title:{fontSize:16,fontWeight:'900'},subtitle:{fontSize:12,marginTop:4},timeBox:{borderRadius:14,paddingHorizontal:12,paddingVertical:8,alignItems:'center'},time:{fontSize:16,fontWeight:'900'},timeSmall:{fontSize:11,fontWeight:'700',marginTop:2},separator:{height:1,marginVertical:12},info:{fontSize:13,lineHeight:20},
});
