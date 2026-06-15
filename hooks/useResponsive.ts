import { useWindowDimensions } from 'react-native';
import { PHONE, TABLET } from '@/constants/breakpoints';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  const columns = width < PHONE ? 2 : width < TABLET ? 3 : 4;
  const isTablet = width >= TABLET;
  const isLandscape = width > height;
  return { width, height, columns, isTablet, isLandscape };
}
