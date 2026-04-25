import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';

export function usePersistedState<T>(
  key: string,
  initial: T,
): [T, (v: T) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(key).then((raw) => {
      if (raw !== null) {
        try {
          setValue(JSON.parse(raw) as T);
        } catch {
          // corrupted value — fall back to initial
        }
      }
      setLoaded(true);
    });
  }, [key]);

  const set = useCallback(
    (v: T) => {
      setValue(v);
      AsyncStorage.setItem(key, JSON.stringify(v));
    },
    [key],
  );

  return [value, set, loaded];
}
