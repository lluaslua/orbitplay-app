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
  sessionStorage.clear();
  vi.mocked(post).mockReset();
  vi.mocked(post).mockResolvedValue(undefined);
  useAuthStore.setState({ user: null, token: null, status: 'idle', error: null });
});

it('criar a conta não entra: a sessão só sai depois do código do e-mail', async () => {
  vi.mocked(post).mockResolvedValueOnce({ email: 'ana@x.com' });

  const resultado = await useAuthStore
    .getState()
    .register({ role: 'PLAYER', name: 'Ana', email: 'ana@x.com', password: 'Senha@123', acceptTerms: true });

  expect(vi.mocked(post).mock.calls[0][0]).toBe('/auth/register');
  expect(resultado).toEqual({ email: 'ana@x.com' });
  expect(useAuthStore.getState()).toMatchObject({ user: null, token: null });
});

it('verificar o e-mail devolve a sessão sem entrar; aplicar a sessão é que entra', async () => {
  vi.mocked(post).mockResolvedValueOnce(sessao('STUDIO'));

  const session = await useAuthStore.getState().verificarEmail('ana@x.com', '123456');

  expect(vi.mocked(post).mock.calls[0]).toEqual(['/auth/verify-email', { email: 'ana@x.com', code: '123456' }]);
  expect(useAuthStore.getState().user).toBeNull();

  useAuthStore.getState().aplicarSessao(session, false);
  expect(useAuthStore.getState()).toMatchObject({ token: 'token-novo', status: 'authenticated' });
  // Sem "Lembrar login" o token fica só na sessão do navegador (não em localStorage).
  expect(sessionStorage.getItem(STORAGE_KEYS.token)).toBe('token-novo');
  expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull();
});

it('login de conta com MFA devolve o desafio e não entra', async () => {
  vi.mocked(post).mockResolvedValueOnce({ mfaRequired: true, email: 'ana@x.com' });

  const resposta = await useAuthStore.getState().login({ email: 'ana@x.com', password: '123456', role: 'PLAYER', remember: true });

  expect(resposta).toEqual({ mfaRequired: true, email: 'ana@x.com' });
  expect(useAuthStore.getState()).toMatchObject({ user: null, token: null, status: 'idle' });
});

it('o código do login com MFA entra e respeita o "Lembrar login" do primeiro passo', async () => {
  vi.mocked(post).mockResolvedValueOnce(sessao('PLAYER'));

  await useAuthStore.getState().verificarLogin('ana@x.com', '654321', true);

  expect(vi.mocked(post).mock.calls[0]).toEqual(['/auth/verify-login', { email: 'ana@x.com', code: '654321', remember: true }]);
  expect(useAuthStore.getState()).toMatchObject({ token: 'token-novo', remember: true, status: 'authenticated' });
  expect(localStorage.getItem(STORAGE_KEYS.token)).toBe('token-novo');
});

it('código recusado fica no erro do store para a tela mostrar', async () => {
  vi.mocked(post).mockRejectedValueOnce({ message: 'Código inválido ou expirado.', code: 'INVALID_VERIFICATION_CODE' });

  await expect(useAuthStore.getState().verificarEmail('ana@x.com', '000000')).rejects.toMatchObject({
    code: 'INVALID_VERIFICATION_CODE',
  });
  expect(useAuthStore.getState()).toMatchObject({ status: 'error', error: 'Código inválido ou expirado.' });
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
