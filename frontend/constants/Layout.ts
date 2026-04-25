import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const Layout = {
  screenWidth,
  screenHeight,
  isSmallDevice: screenWidth < 375,
} as const;
