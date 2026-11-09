import { beforeEach, describe, expect, it } from 'vitest';
import { clearToken, getToken, setToken } from '@/lib/tokenStorage';
import { STORAGE_KEYS } from '@/utils/constants';

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('sem "Lembrar login" o token fica só na sessão (some ao fechar)', () => {
    setToken('abc', false);
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBe('abc');
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(getToken()).toBe('abc');
  });

  it('com "Lembrar login" o token vai para o localStorage e não sobra cópia na sessão', () => {
    setToken('abc', false);
    setToken('xyz', true);
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe('xyz');
    expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBeNull();
    expect(getToken()).toBe('xyz');
  });

  it('clearToken limpa os dois lugares', () => {
    setToken('a', true);
    sessionStorage.setItem(STORAGE_KEYS.token, 'b');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
