import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useAppSettings } from '../../context/AppSettingsContext';
import { getTheme } from '../../theme';
import { Card, Icon, initials, Screen } from '../../components/UI';
import { AppIconName } from '../../components/ui/AppIcon';

const entries: Record<'ALUNO' | 'PROFESSOR' | 'GESTOR', readonly [string, AppIconName, string, string][]> = {
  ALUNO: [
    ['AgendaAluno', 'calendar-outline', 'Agenda semanal', 'Consulte sua grade completa de aulas'],
    ['ChamadaFacial', 'scan-circle-outline', 'Chamada facial', 'Acompanhe sua validação biométrica'],
  ],
  PROFESSOR: [
    ['NotasProfessor', 'school-outline', 'Lançar notas', 'Gerencie avaliações por turma'],
    ['OcorrenciasProfessor', 'alert-circle-outline', 'Ocorrências', 'Registre e acompanhe situações'],
    ['HistoricoProfessor', 'time-outline', 'Histórico de aulas', 'Consulte aulas e presenças registradas'],
  ],
  GESTOR: [
    ['Disciplinas', 'book-outline', 'Disciplinas', 'Cadastre e edite disciplinas'],
  ],
};

export const MoreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, signOut } = useAuth();
  const { darkMode } = useAppSettings();
  const colors = getTheme(darkMode);
  const profile = (route.params?.profile || user?.perfil) as 'ALUNO' | 'PROFESSOR' | 'GESTOR';

  const go = (name: string) => navigation.getParent()?.navigate(name);

  return <Screen colors={colors} title="MAIS" subtitle="Acesse as funções secundárias do seu portal.">
    <Card colors={colors} style={styles.hero}>
      <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}><Text style={[styles.avatarText, { color: colors.primaryStrong }]}>{initials(user?.nome)}</Text></View>
      <View style={{ flex: 1 }}><Text style={[styles.name, { color: colors.textPrimary }]}>{user?.nome}</Text><Text style={{ color: colors.textSecondary }}>{user?.email}</Text></View>
    </Card>

    {entries[profile].map(([name, iconName, title, desc]) => (
      <Pressable
        key={name}
        accessibilityRole="button"
        onPress={() => go(name)}
        style={({ pressed }) => [styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}
      >
        <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}><Icon name={iconName} color={colors.primaryStrong} size={22} /></View>
        <View style={{ flex: 1 }}><Text style={[styles.menuTitle, { color: colors.textPrimary }]}>{title}</Text><Text style={{ color: colors.textSecondary, marginTop: 2 }}>{desc}</Text></View>
        <Icon name="chevron-forward" size={21} color={colors.textSoft} />
      </Pressable>
    ))}

    <Pressable onPress={() => go('Perfil')} style={({ pressed }) => [styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}><Icon name="person-circle-outline" color={colors.primaryStrong} size={23} /></View>
      <Text style={[styles.menuTitle, { color: colors.textPrimary, flex: 1 }]}>Meu perfil</Text>
      <Icon name="chevron-forward" size={21} color={colors.textSoft} />
    </Pressable>

    <Pressable onPress={() => go('Configuracoes')} style={({ pressed }) => [styles.menuCard, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.65 : 1 }]}>
      <View style={[styles.menuIcon, { backgroundColor: colors.primaryLight }]}><Icon name="settings-outline" color={colors.primaryStrong} size={22} /></View>
      <Text style={[styles.menuTitle, { color: colors.textPrimary, flex: 1 }]}>Configurações</Text>
      <Icon name="chevron-forward" size={21} color={colors.textSoft} />
    </Pressable>

    <Pressable
      onPress={() => Alert.alert('Sair', 'Deseja encerrar a sessão?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Sair', style: 'destructive', onPress: signOut }])}
      style={({ pressed }) => [styles.logout, { borderColor: colors.danger, opacity: pressed ? 0.7 : 1 }]}
    >
      <Icon name="log-out-outline" color={colors.danger} size={20} />
      <Text style={[styles.logoutText, { color: colors.danger }]}>Sair do portal</Text>
    </Pressable>
  </Screen>;
};

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '900' },
  name: { fontSize: 17, fontWeight: '800' },
  menuCard: { minHeight: 72, borderWidth: 1, borderRadius: 18, padding: 13, flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  menuTitle: { fontSize: 15, fontWeight: '800' },
  logout: { borderWidth: 1, borderRadius: 16, minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  logoutText: { fontWeight: '900' },
});
