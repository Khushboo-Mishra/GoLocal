import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/theme';
import { Svg, Path, Circle, Line, Polyline } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BubbleDef = {
  id: string;
  label: string;
  route: string;
  targetX: number;
  targetY: number;
};

const BUBBLES: BubbleDef[] = [
  { id: 'home', label: 'Home', route: '/(app)/', targetX: -121, targetY: -32 },
  { id: 'rooms', label: 'Rooms', route: '/(app)/rooms', targetX: -76, targetY: -99 },
  { id: 'create', label: 'Create', route: '/(app)/create', targetX: 0, targetY: -125 },
  { id: 'profile', label: 'Profile', route: '/(app)/profile', targetX: 76, targetY: -99 },
  { id: 'settings', label: 'Settings', route: '/(app)/settings', targetX: 121, targetY: -32 },
];

function BubbleIcon({ id, selected }: { id: string; selected: boolean }) {
  const strokeColor = selected ? '#0d2528' : 'rgba(255,255,255,0.8)';
  const fillColor = selected ? '#0d2528' : 'none';

  switch (id) {
    case 'home':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill={selected ? strokeColor : 'currentColor'}>
          <Path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill={strokeColor} />
        </Svg>
      );
    case 'rooms':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <Circle cx={9} cy={7} r={4} />
          <Path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <Path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </Svg>
      );
    case 'profile':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <Circle cx={12} cy={7} r={4} />
        </Svg>
      );
    case 'settings':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={strokeColor} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
          <Circle cx={12} cy={12} r={3} />
          <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </Svg>
      );
    case 'create':
      return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={strokeColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Line x1="12" y1="5" x2="12" y2="19" />
          <Line x1="5" y1="12" x2="19" y2="12" />
        </Svg>
      );
    default:
      return null;
  }
}

interface NavBubbleProps {
  bubble: BubbleDef;
  isOpen: SharedValue<number>;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}

function NavBubble({ bubble, isOpen, isSelected, onPress, index }: NavBubbleProps) {
  const { tokens } = useTheme();
  const c = tokens.colors;

  const animStyle = useAnimatedStyle(() => {
    const open = isOpen.value;
    const tx = -24 + open * (bubble.targetX - -24);
    const ty = -24 + open * (bubble.targetY - -24);
    const sc = 0.2 + open * 0.8;
    return {
      transform: [
        { translateX: tx },
        { translateY: ty },
        { scale: sc },
      ],
      opacity: open,
    };
  });

  const bubbleIconBg = isSelected ? c.brand : c.surface;
  const bubbleBorder = isSelected ? 'transparent' : c.border;
  const labelColor = isSelected ? c.brandDeep : c.textSecondary;

  return (
    <Animated.View style={[styles.bubble, animStyle]}>
      <Pressable onPress={onPress} style={styles.bubblePressable}>
        <View style={[
          styles.bubbleIcon,
          {
            backgroundColor: bubbleIconBg,
            borderColor: bubbleBorder,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.1,
            shadowRadius: 24,
            elevation: 6,
          },
        ]}>
          <BubbleIcon id={bubble.id} selected={isSelected} />
        </View>
        <Text style={[styles.bubbleLabel, { color: labelColor }]}>{bubble.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export function RadialNav() {
  const { tokens } = useTheme();
  const c = tokens.colors;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();

  const isOpenValue = useSharedValue(0);
  const fabRotation = useSharedValue(0);
  const hintOpacity = useSharedValue(1);
  const [menuOpen, setMenuOpen] = useState(false);

  const fabBottom = 30 + insets.bottom;

  function getActiveId(): string {
    if (pathname === '/' || pathname === '/index') return 'home';
    if (pathname === '/rooms') return 'rooms';
    if (pathname === '/create') return 'create';
    if (pathname === '/profile') return 'profile';
    if (pathname === '/settings') return 'settings';
    return 'home';
  }

  function toggleOpen() {
    const next = isOpenValue.value < 0.5 ? 1 : 0;
    isOpenValue.value = withTiming(next, { duration: 180, easing: Easing.out(Easing.cubic) });
    fabRotation.value = withTiming(next * 45, { duration: 180, easing: Easing.out(Easing.cubic) });
    if (next === 1) {
      hintOpacity.value = withTiming(0, { duration: 300 });
    }
    setMenuOpen(next === 1);
  }

  function navigateTo(route: string) {
    Haptics.selectionAsync();
    isOpenValue.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    fabRotation.value = withTiming(0, { duration: 180, easing: Easing.out(Easing.cubic) });
    router.push(route as any);
  }

  const fabIconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${fabRotation.value}deg` }],
  }));

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value,
  }));

  const navBgColors = [c.bg, c.bg, `${c.bg}f2`, `${c.bg}00`] as const;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay]} pointerEvents="box-none">
      {/* Nav bg gradient */}
      <LinearGradient
        colors={['transparent', 'transparent', c.bg, c.bg]}
        locations={[0, 0.35, 0.65, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.navBg]}
        pointerEvents="none"
      />

      {/* Hint label */}
      <Animated.Text style={[
        styles.navHint,
        { color: c.textTertiary, bottom: fabBottom + 142 },
        hintStyle,
      ]} pointerEvents="none">
        tap to navigate
      </Animated.Text>

      {/* Bubble ring — origin at FAB center */}
      <View style={[
        styles.bubbleRing,
        { bottom: fabBottom + 28, left: SCREEN_WIDTH / 2 },
      ]} pointerEvents={menuOpen ? 'box-none' : 'none'}>
        {BUBBLES.map((bubble, index) => (
          <NavBubble
            key={bubble.id}
            bubble={bubble}
            isOpen={isOpenValue}
            isSelected={getActiveId() === bubble.id}
            onPress={() => navigateTo(bubble.route)}
            index={index}
          />
        ))}
      </View>

      {/* FAB */}
      <Pressable
        onPress={toggleOpen}
        style={[
          styles.fab,
          {
            bottom: fabBottom,
            backgroundColor: c.brand,
            shadowColor: c.brand,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.55,
            shadowRadius: 24,
            elevation: 10,
          },
        ]}
      >
        <Animated.View style={fabIconStyle}>
          <Text style={[styles.fabGlyph, { color: c.brandInk }]}>G</Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 20,
  },
  navBg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 186,
    pointerEvents: 'none',
  } as any,
  navHint: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: 'Sora_500Medium',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  bubbleRing: {
    position: 'absolute',
    width: 0,
    height: 0,
  },
  bubble: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  bubblePressable: {
    alignItems: 'center',
    gap: 6,
  },
  bubbleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleLabel: {
    fontFamily: 'Sora_500Medium',
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    left: SCREEN_WIDTH / 2 - 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlyph: {
    fontFamily: 'InstrumentSerif_400Regular',
    fontSize: 28,
    lineHeight: 30,
  },
});
