import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSettings } from '../context/AppSettingsContext';
import { getTheme } from '../theme';
import { Icon } from '../components/UI';
import { AlunoHomeScreen } from '../screens/aluno/AlunoHomeScreen';
import { AlunoAgendaScreen, AlunoFrequencyScreen, AlunoNotesScreen, AlunoNoticesScreen, AlunoFaceScreen } from '../screens/aluno/AlunoScreens';
import { ProfessorHomeScreen } from '../screens/professor/ProfessorHomeScreen';
import { ProfessorTurmasScreen, ProfessorAlunosScreen, ProfessorNotesScreen, ProfessorOccurrencesScreen, ProfessorCallScreen, ProfessorHistoryScreen, ProfessorStudentDetailScreen } from '../screens/professor/ProfessorScreens';
import { GestorHomeScreen } from '../screens/gestor/GestorHomeScreen';
import { GestorTurmasScreen, GestorUsuariosScreen, GestorDisciplinesScreen, GestorOccurrencesScreen } from '../screens/gestor/GestorScreens';
import { ProfileScreen } from '../screens/shared/ProfileScreen';
import { SettingsScreen } from '../screens/shared/SettingsScreen';
import { MoreScreen } from '../screens/shared/MoreScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function Tabs({ profile }: { profile: 'ALUNO' | 'PROFESSOR' | 'GESTOR' }) {
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);

  const common = {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textSoft,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      height: 70,
      paddingBottom: 10,
      paddingTop: 7,
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
    },
    tabBarLabelStyle: { fontSize: 10, fontWeight: '700' as const },
  };

  if (profile === 'ALUNO') {
    return <Tab.Navigator screenOptions={common}>
      <Tab.Screen name="Inicio" component={AlunoHomeScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'home' : 'home-outline'} color={color} size={size} />, title: 'Home' }} />
      <Tab.Screen name="Frequencia" component={AlunoFrequencyScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'pie-chart' : 'pie-chart-outline'} color={color} size={size} />, title: 'Frequência' }} />
      <Tab.Screen name="Avisos" component={AlunoNoticesScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'notifications' : 'notifications-outline'} color={color} size={size} />, title: 'Avisos' }} />
      <Tab.Screen name="Notas" component={AlunoNotesScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'school' : 'school-outline'} color={color} size={size} /> }} />
      <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: ({ color, size }) => <Icon name="ellipsis-horizontal" color={color} size={size + 1} /> }} />
    </Tab.Navigator>;
  }

  if (profile === 'PROFESSOR') {
    return <Tab.Navigator screenOptions={common}>
      <Tab.Screen name="Inicio" component={ProfessorHomeScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'home' : 'home-outline'} color={color} size={size} />, title: 'Home' }} />
      <Tab.Screen name="Turmas" component={ProfessorTurmasScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'people' : 'people-outline'} color={color} size={size} /> }} />
      <Tab.Screen name="Alunos" component={ProfessorAlunosScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'person' : 'person-outline'} color={color} size={size} /> }} />
      <Tab.Screen name="Chamada" component={ProfessorCallScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'checkmark-circle' : 'checkmark-circle-outline'} color={color} size={size} /> }} />
      <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: ({ color, size }) => <Icon name="ellipsis-horizontal" color={color} size={size + 1} /> }} />
    </Tab.Navigator>;
  }

  return <Tab.Navigator screenOptions={common}>
    <Tab.Screen name="Inicio" component={GestorHomeScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'home' : 'home-outline'} color={color} size={size} />, title: 'Home' }} />
    <Tab.Screen name="Turmas" component={GestorTurmasScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'business' : 'business-outline'} color={color} size={size} /> }} />
    <Tab.Screen name="Usuarios" component={GestorUsuariosScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'people' : 'people-outline'} color={color} size={size} />, title: 'Usuários' }} />
    <Tab.Screen name="Ocorrencias" component={GestorOccurrencesScreen} options={{ tabBarIcon: ({ color, size, focused }) => <Icon name={focused ? 'alert-circle' : 'alert-circle-outline'} color={color} size={size} />, title: 'Ocorrências' }} />
    <Tab.Screen name="Mais" component={MoreScreen} initialParams={{ profile }} options={{ tabBarIcon: ({ color, size }) => <Icon name="ellipsis-horizontal" color={color} size={size + 1} /> }} />
  </Tab.Navigator>;
}

export function ProfileNavigator({ profile }: { profile: 'ALUNO' | 'PROFESSOR' | 'GESTOR' }) {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs">{() => <Tabs profile={profile} />}</Stack.Screen>
    {profile === 'ALUNO' && <>
      <Stack.Screen name="AgendaAluno" component={AlunoAgendaScreen} />
      <Stack.Screen name="ChamadaFacial" component={AlunoFaceScreen} />
    </>}
    {profile === 'PROFESSOR' && <>
      <Stack.Screen name="NotasProfessor" component={ProfessorNotesScreen} />
      <Stack.Screen name="OcorrenciasProfessor" component={ProfessorOccurrencesScreen} />
      <Stack.Screen name="HistoricoProfessor" component={ProfessorHistoryScreen} />
      <Stack.Screen name="AlunoDetalheProfessor" component={ProfessorStudentDetailScreen} />
    </>}
    {profile === 'GESTOR' && <Stack.Screen name="Disciplinas" component={GestorDisciplinesScreen} />}
    <Stack.Screen name="Perfil" component={ProfileScreen} />
    <Stack.Screen name="Configuracoes" component={SettingsScreen} />
  </Stack.Navigator>;
}
