import { GestorHomeScreen } from '../screens/gestor/GestorHomeScreen';
import { createProfileTabs } from './createProfileTabs';

export const GestorTabNavigator = createProfileTabs(GestorHomeScreen);
