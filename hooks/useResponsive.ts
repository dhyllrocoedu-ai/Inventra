import { useWindowDimensions } from 'react-native';
import { PHONE, TABLET } from '@/constants/breakpoints';
import { Spacing } from '@/constants/spacing';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const columns = width < PHONE ? 2 : width < TABLET ? 3 : 4;
  const isTablet = width >= TABLET;
  const isLandscape = width > height;

  const header = {
    titleSize: isLandscape ? 22 : 28,
    sectionTitleSize: isLandscape ? 17 : 20,
    subTitleSize: isLandscape ? 12 : 14,
    paddingHorizontal: Spacing.md,
    paddingVertical: isLandscape ? Spacing.sm : Spacing.md,
    marginBottom: isLandscape ? 4 : 8,
  };

  return { width, height, columns, isTablet, isLandscape, header };
}
