import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightTokens, darkTokens, type Tokens } from './tokens';
import { usePersistedState } from '@/hooks/usePersistedState';

type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  scheme: 'light' | 'dark';
  tokens: Tokens;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = usePersistedState<ThemeMode>('golocal:themeMode', 'system');

  const scheme: 'light' | 'dark' = useMemo(() => {
    if (mode === 'light') return 'light';
    if (mode === 'dark') return 'dark';
    return systemScheme === 'dark' ? 'dark' : 'light';
  }, [mode, systemScheme]);

  const tokens = scheme === 'dark' ? darkTokens : lightTokens;

  const value: ThemeContextValue = useMemo(
    () => ({ mode, setMode, scheme, tokens }),
    [mode, setMode, scheme, tokens],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
