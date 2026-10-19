import { AlunoHomeScreen } from '../screens/aluno/AlunoHomeScreen';
import { createProfileTabs } from './createProfileTabs';

export const AlunoTabNavigator = createProfileTabs(AlunoHomeScreen);
