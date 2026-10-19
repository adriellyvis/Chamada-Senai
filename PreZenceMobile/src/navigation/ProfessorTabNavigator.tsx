import { ProfessorHomeScreen } from '../screens/professor/ProfessorHomeScreen';
import { createProfileTabs } from './createProfileTabs';

export const ProfessorTabNavigator = createProfileTabs(ProfessorHomeScreen);
