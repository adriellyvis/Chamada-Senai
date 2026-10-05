import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { useAppSettings } from '../context/AppSettingsContext';
import { getTheme } from '../theme';
import { AlunoHomeScreen } from '../screens/aluno/AlunoHomeScreen';
import { AlunoAgendaScreen, AlunoFrequencyScreen, AlunoNotesScreen, AlunoNoticesScreen, AlunoFaceScreen } from '../screens/aluno/AlunoScreens';
import { ProfessorHomeScreen } from '../screens/professor/ProfessorHomeScreen';
import { ProfessorTurmasScreen, ProfessorAlunosScreen, ProfessorNotesScreen, ProfessorOccurrencesScreen, ProfessorCallScreen, ProfessorHistoryScreen } from '../screens/professor/ProfessorScreens';
import { GestorHomeScreen } from '../screens/gestor/GestorHomeScreen';
import { GestorTurmasScreen, GestorAlunosScreen, GestorDisciplinesScreen, GestorOccurrencesScreen } from '../screens/gestor/GestorScreens';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { MoreScreen } from '../screens/shared/MoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const labels: Record<string, string> = {
  Inicio: '⌂', Agenda: '▦', Frequencia: '◒', Notas: 'A', Chamada: '◎', Avisos: '!', Turmas: '⌂', Alunos: '◉', Ocorrencias: '!', Historico: '↺', Mais: '⋯',
};

function Tabs({ profile }: { profile: 'ALUNO' | 'PROFESSOR' | 'GESTOR' }) {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  const common = { headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.textSoft, tabBarStyle: { height: 68, paddingBottom: 10, paddingTop: 7, backgroundColor: colors.surface, borderTopColor: colors.border }, tabBarLabelStyle: { fontSize: 10, fontWeight: '700' as const } };

  if (profile === 'ALUNO') {
    return <Tab.Navigator screenOptions={common}>
      <Tab.Screen name="Inicio" component={AlunoHomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⌂</Text>, title: 'Home' }} />
      <Tab.Screen name="Agenda" component={AlunoAgendaScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>▦</Text> }} />
      <Tab.Screen name="Frequencia" component={AlunoFrequencyScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>◒</Text>, title: 'Frequência' }} />
      <Tab.Screen name="Notas" component={AlunoNotesScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>A</Text> }} />
      <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>⋯</Text> }} />
    </Tab.Navigator>;
  }
  if (profile === 'PROFESSOR') {
    return <Tab.Navigator screenOptions={common}>
      <Tab.Screen name="Inicio" component={ProfessorHomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⌂</Text>, title: 'Home' }} />
      <Tab.Screen name="Turmas" component={ProfessorTurmasScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⌂</Text> }} />
      <Tab.Screen name="Alunos" component={ProfessorAlunosScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>◉</Text> }} />
      <Tab.Screen name="Chamada" component={ProfessorCallScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>◎</Text> }} />
      <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>⋯</Text> }} />
    </Tab.Navigator>;
  }
  return <Tab.Navigator screenOptions={common}>
    <Tab.Screen name="Inicio" component={GestorHomeScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⌂</Text>, title: 'Home' }} />
    <Tab.Screen name="Turmas" component={GestorTurmasScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>⌂</Text> }} />
    <Tab.Screen name="Alunos" component={GestorAlunosScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>◉</Text> }} />
    <Tab.Screen name="Ocorrencias" component={GestorOccurrencesScreen} options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>!</Text>, title: 'Ocorrências' }} />
    <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: () => <Text style={{ fontSize: 24 }}>⋯</Text> }} />
  </Tab.Navigator>;
}

export function ProfileNavigator({ profile }: { profile: 'ALUNO' | 'PROFESSOR' | 'GESTOR' }) {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs">{() => <Tabs profile={profile} />}</Stack.Screen>
    {profile === 'ALUNO' && <>
      <Stack.Screen name="ChamadaFacial" component={AlunoFaceScreen} />
      <Stack.Screen name="Avisos" component={AlunoNoticesScreen} />
    </>}
    {profile === 'PROFESSOR' && <>
      <Stack.Screen name="NotasProfessor" component={ProfessorNotesScreen} />
      <Stack.Screen name="OcorrenciasProfessor" component={ProfessorOccurrencesScreen} />
      <Stack.Screen name="HistoricoProfessor" component={ProfessorHistoryScreen} />
    </>}
    {profile === 'GESTOR' && <Stack.Screen name="Disciplinas" component={GestorDisciplinesScreen} />}
    <Stack.Screen name="Perfil" component={ProfileScreen} />
    <Stack.Screen name="Configuracoes" component={SettingsScreen} />
  </Stack.Navigator>;
}
