import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors, colors as defaultColors } from '../../theme/colors';
import { Header } from './Header';

interface ScreenProps {
  colors?: AppColors;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  refreshing?: boolean;
  onRefresh?: () => void;
  scroll?: boolean;
  showBack?: boolean;
}

export function Screen({
  colors = defaultColors,
  children,
  title,
  subtitle,
  refreshing = false,
  onRefresh,
  scroll = true,
  showBack,
}: ScreenProps) {
  const navigation = useNavigation<any>();
  const navigationState = navigation.getState?.();
  const isStackChild = navigationState?.type === 'stack' && navigationState.index > 0;
  const shouldShowBack = showBack ?? isStackChild;

  const content = (
    <View style={styles.content}>
      {title ? (
        <Header
          colors={colors}
          title={title}
          subtitle={subtitle}
          onBackPress={shouldShowBack && navigation.canGoBack?.() ? () => navigation.goBack() : undefined}
        />
      ) : null}
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={['top']}
      style={[
        styles.safe,
        { backgroundColor: colors.background },
      ]}
    >
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 30,
  },
  content: {
    width: '100%',
  },
});
