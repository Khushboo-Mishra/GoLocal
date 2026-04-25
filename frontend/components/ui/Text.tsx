import React from 'react';
import { Text as RNText, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

type TextVariant =
  | 'display'        // Instrument Serif 30
  | 'displayItalic'  // Instrument Serif italic 30
  | 'title'          // Instrument Serif 24
  | 'subtitle'       // Instrument Serif 22
  | 'body'           // Sora Regular 15
  | 'bodyMedium'     // Sora Medium 13
  | 'bodySemibold'   // Sora SemiBold 13
  | 'caption'        // Sora Regular 12
  | 'label'          // Sora SemiBold 11 uppercase
  | 'micro';         // Sora Regular 10

interface ThemedTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
}

export function Text({ variant = 'body', color, style, ...props }: ThemedTextProps) {
  const { tokens } = useTheme();
  const { fonts } = tokens.typography;

  const variantStyle = variantStyles(fonts)[variant];

  return (
    <RNText
      style={[
        { color: color ?? tokens.colors.textPrimary },
        variantStyle,
        style,
      ]}
      {...props}
    />
  );
}

function variantStyles(fonts: ReturnType<typeof useTheme>['tokens']['typography']['fonts']) {
  return StyleSheet.create({
    display: { fontFamily: fonts.serif, fontSize: 30, letterSpacing: -0.6, lineHeight: 36 },
    displayItalic: { fontFamily: fonts.serifItalic, fontSize: 30, letterSpacing: -0.6, lineHeight: 36 },
    title: { fontFamily: fonts.serif, fontSize: 24, letterSpacing: -0.3, lineHeight: 28 },
    subtitle: { fontFamily: fonts.serif, fontSize: 22, letterSpacing: -0.2, lineHeight: 26 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
    bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 13, lineHeight: 20 },
    bodySemibold: { fontFamily: fonts.bodySemibold, fontSize: 13, lineHeight: 20 },
    caption: { fontFamily: fonts.body, fontSize: 12, lineHeight: 18 },
    label: { fontFamily: fonts.bodySemibold, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase' },
    micro: { fontFamily: fonts.body, fontSize: 10, lineHeight: 14 },
  });
}
