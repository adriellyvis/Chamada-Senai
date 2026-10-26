import React, { ComponentProps } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

const LEGACY_ICON_MAP: Record<string, AppIconName> = {
  '⌂': 'home-outline',
  '▦': 'calendar-outline',
  '◒': 'pie-chart-outline',
  'A': 'school-outline',
  '◎': 'scan-circle-outline',
  '!': 'alert-circle-outline',
  '◉': 'people-outline',
  '↺': 'time-outline',
  '⋯': 'ellipsis-horizontal',
  '⚙': 'settings-outline',
  '☾': 'moon-outline',
  '↗': 'log-out-outline',
  '›': 'chevron-forward',
  '☰': 'menu-outline',
  '♧': 'notifications-outline',
  '＋': 'add',
  '+': 'add',
};

interface AppIconProps {
  name?: AppIconName;
  glyph?: string;
  color?: string;
  size?: number;
}

export function AppIcon({ name, glyph, color, size = 20 }: AppIconProps) {
  const resolvedName = name ?? (glyph ? LEGACY_ICON_MAP[glyph] : undefined) ?? 'ellipse-outline';
  return <Ionicons name={resolvedName} size={size} color={color} />;
}
