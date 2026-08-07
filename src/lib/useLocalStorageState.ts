import { useState } from 'react';
import { readLocalStorage, writeLocalStorage } from './safeStorage';

export function useLocalStorageState<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
): [T, (value: T) => void] {
  const [value, setValue] = useState(() => parse(readLocalStorage(key)));
  const set = (next: T) => {
    setValue(next);
    writeLocalStorage(key, serialize(next));
  };
  return [value, set];
}
