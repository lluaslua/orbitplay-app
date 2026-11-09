import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/authStore';
import { getToken, setToken } from '@/lib/tokenStorage';
import { api } from '@/lib/api';
import { STORAGE_KEYS } from '@/utils/constants';

describe('authStore — token e logout', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    useAuthStore.setState({ user: null, token: null, status: 'idle', error: null });
  });

  it('o token nunca é persistido junto do perfil do Zustand', () => {
    setToken('segredo-do-token', false);
    useAuthStore.setState({
      user: { id: 'u1', role: 'STUDIO', name: 'Ana', email: 'a@a.com' } as never,
      token: 'segredo-do-token',
      remember: false,
    });
    const guardado = sessionStorage.getItem(STORAGE_KEYS.user) ?? localStorage.getItem(STORAGE_KEYS.user) ?? '';
    expect(guardado).toContain('u1');
    expect(guardado).not.toContain('segredo-do-token');
  });

  it('logout apaga o token local e pede à API que o revogue, enviando o token explicitamente', async () => {
    setToken('token-a-revogar', true);
    useAuthStore.setState({ user: { id: 'u1', role: 'PLAYER' } as never, token: 'token-a-revogar' });
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { success: true } });

    useAuthStore.getState().logout();

    expect(getToken()).toBeNull();
    expect(useAuthStore.getState().user).toBeNull();
    expect(post).toHaveBeenCalledWith('/auth/logout', undefined, {
      headers: { Authorization: 'Bearer token-a-revogar' },
    });
  });

  it('logout sem token não chama a API', () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: {} });
    useAuthStore.getState().logout();
    expect(post).not.toHaveBeenCalled();
  });
});
