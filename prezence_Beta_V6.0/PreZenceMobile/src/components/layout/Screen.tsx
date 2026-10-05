import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '../../theme/colors';

interface ScreenProps {
  colors: AppColors;
  children: React.ReactNode;

  refreshing?: boolean;
  onRefresh?: () => void;

  scroll?: boolean;
}

export function Screen({
  colors,
  children,
  refreshing = false,
  onRefresh,
  scroll = true,
}: ScreenProps) {
  const content = (
    <View style={styles.content}>
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