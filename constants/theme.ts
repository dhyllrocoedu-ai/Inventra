export const BrandColors = {
  primary: '#2563EB',
  navy: '#0F172A',
  teal: '#14B8A6',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
} as const;

export const DashboardCardColors = {
  revenue: { bg: '#DBEAFE', accent: '#2563EB' },
  profit: { bg: '#DCFCE7', accent: '#22C55E' },
  products: { bg: '#E0F2FE', accent: '#0EA5E9' },
  lowStock: { bg: '#FEF3C7', accent: '#F59E0B' },
} as const;

export const StatusColors = {
  healthy: { bg: '#DCFCE7', text: '#15803D' },
  warning: { bg: '#FEF3C7', text: '#B45309' },
  critical: { bg: '#FEE2E2', text: '#B91C1C' },
} as const;

export const StatusBorders = {
  healthy: '#22C55E',
  warning: '#F59E0B',
  critical: '#EF4444',
} as const;

export const NeutralColors = {
  background: '#F8FAFC',
  secondaryBg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#E2E8F0',
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textDisabled: '#94A3B8',
  textInverse: '#FFFFFF',
} as const;

export const Colors = {
  light: {
    text: NeutralColors.textPrimary,
    background: NeutralColors.background,
    tint: BrandColors.primary,
    icon: NeutralColors.textSecondary,
    tabIconDefault: NeutralColors.textDisabled,
    tabIconSelected: BrandColors.primary,
  },
  dark: {
    text: '#F8FAFC',
    background: '#0B1120',
    tint: BrandColors.primary,
    icon: '#CBD5E1',
    tabIconDefault: '#475569',
    tabIconSelected: BrandColors.primary,
  },
};

export const Fonts = {
  sans: 'Inter_400Regular' as const,
  sansMedium: 'Inter_500Medium' as const,
  sansSemiBold: 'Inter_600SemiBold' as const,
  sansBold: 'Inter_700Bold' as const,
  sansExtraBold: 'Inter_800ExtraBold' as const,
  sansBlack: 'Inter_900Black' as const,
};

export const FontSizes = {
  appTitle: 28,
  sectionTitle: 20,
  cardValue: 24,
  body: 14,
  caption: 12,
} as const;

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semiBold: '600' as const,
  bold: '700' as const,
  extraBold: '800' as const,
  black: '900' as const,
};
