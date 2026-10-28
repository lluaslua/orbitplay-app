import { beforeEach, expect, it, vi } from 'vitest';
import { post, SESSAO_EXPIRADA } from '@/lib/api';
import { STORAGE_KEYS } from '@/utils/constants';
import { CONTA_SEM_APP, useAuthStore } from './authStore';

// O cadastro não tem rota no mock: a resposta da API é simulada aqui.
vi.mock('@/lib/api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/api')>();
  return { ...original, post: vi.fn() };
});

const sessao = (role: string) => ({
  token: 'token-novo',
  expiresAt: '2026-12-31T00:00:00.000Z',
  user: { id: 'u-1', name: 'Ana', email: 'ana@x.com', role, status: 'ACTIVE', createdAt: '2026-10-05T00:00:00.000Z' },
});

beforeEach(() => {
  localStorage.clear();
  vi.mocked(post).mockReset();
  vi.mocked(post).mockResolvedValue(undefined);
  useAuthStore.setState({ user: null, token: null, status: 'idle', error: null });
});

it('criar a conta já entra no app, como o login', async () => {
  vi.mocked(post).mockResolvedValueOnce(sessao('PLAYER'));

  await useAuthStore.getState().register({ role: 'PLAYER', name: 'Ana', email: 'ana@x.com', password: 'Senha@123' });

  expect(vi.mocked(post).mock.calls[0][0]).toBe('/auth/register');
  expect(useAuthStore.getState()).toMatchObject({ token: 'token-novo', status: 'authenticated' });
  expect(localStorage.getItem(STORAGE_KEYS.token)).toBe('token-novo');
});

it('conta da administração da plataforma não entra no app', async () => {
  vi.mocked(post).mockResolvedValueOnce(sessao('OWNER'));

  await expect(
    useAuthStore.getState().login({ email: 'owner@x.com', password: '123456', role: 'PLAYER' }),
  ).rejects.toMatchObject({ message: CONTA_SEM_APP });

  expect(useAuthStore.getState()).toMatchObject({ user: null, error: CONTA_SEM_APP });
  expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
});

it('sessão recusada pela API sai da conta', async () => {
  vi.mocked(post).mockResolvedValueOnce(sessao('STUDIO'));
  await useAuthStore.getState().login({ email: 'ana@x.com', password: '123456', role: 'STUDIO' });

  window.dispatchEvent(new Event(SESSAO_EXPIRADA));

  expect(useAuthStore.getState()).toMatchObject({ user: null, token: null });
});
