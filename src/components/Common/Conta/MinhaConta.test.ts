import { expect, it } from 'vitest';
import { accounts } from '@/mocks/fixtures/players.json';
import type { AuthUser, StudioUser } from '@/types';
import { problemaDaFoto } from './FotoPerfil';
import { esquemaMinhaConta, payloadDaConta, valoresDaConta } from './MinhaConta';

const [estudio, tester] = accounts.map((conta) => conta.user as AuthUser) as [StudioUser, AuthUser];
const estudioSemGestao: StudioUser = { ...estudio, studio: { ...estudio.studio, permission: 'EDIT' } };

it('o jogador não manda os campos do estúdio', () => {
  const payload = payloadDaConta(tester, { ...valoresDaConta(tester), jobTitle: 'QA', organization: 'X', website: 'https://x.dev' });

  expect(payload).not.toHaveProperty('jobTitle');
  expect(payload).not.toHaveProperty('organization');
  expect(payload).not.toHaveProperty('website');
});

it('o estúdio que gerencia manda nome, site e cargo', () => {
  const payload = payloadDaConta(estudio, {
    ...valoresDaConta(estudio),
    organization: ' Novo ',
    website: 'https://novo.dev',
    jobTitle: 'Produtora',
  });

  expect(payload).toMatchObject({ organization: 'Novo', website: 'https://novo.dev', jobTitle: 'Produtora' });
});

it('sem MANAGE o estúdio manda o cargo, mas não o nome nem o site', () => {
  const payload = payloadDaConta(estudioSemGestao, { ...valoresDaConta(estudioSemGestao), jobTitle: 'Dev' });

  expect(payload.jobTitle).toBe('Dev');
  expect(payload).not.toHaveProperty('organization');
  expect(payload).not.toHaveProperty('website');
});

it('data e país vazios não vão, para não apagar o que a API guarda', () => {
  const payload = payloadDaConta(tester, { ...valoresDaConta(tester), birthDate: '', location: '' });

  expect(payload).not.toHaveProperty('birthDate');
  expect(payload).not.toHaveProperty('location');
});

it('as preferências vão sempre, e a conta sem elas começa com notificações ligadas e MFA desligado', () => {
  const valores = valoresDaConta({ ...tester, emailNotifications: undefined, mfaEnabled: undefined });

  expect(valores).toMatchObject({ emailNotifications: true, mfaEnabled: false });
  expect(payloadDaConta(tester, { ...valores, mfaEnabled: true })).toMatchObject({ emailNotifications: true, mfaEnabled: true });
});

it('o site precisa de https:// e o nome não fica vazio', () => {
  const valores = valoresDaConta(estudio);

  expect(esquemaMinhaConta.safeParse({ ...valores, website: 'novo.dev' }).success).toBe(false);
  expect(esquemaMinhaConta.safeParse({ ...valores, name: ' ' }).success).toBe(false);
  expect(esquemaMinhaConta.safeParse({ ...valores, website: '' }).success).toBe(true);
});

it('a foto aceita só JPG, PNG e WebP de até 5 MB', () => {
  const arquivo = (tipo: string, bytes = 10) => new File([new Uint8Array(bytes)], 'foto', { type: tipo });

  expect(problemaDaFoto(arquivo('image/png'))).toBeNull();
  expect(problemaDaFoto(arquivo('image/gif'))).toMatch(/JPG, PNG ou WebP/);
  expect(problemaDaFoto(arquivo('image/webp', 5 * 1024 * 1024 + 1))).toMatch(/5 MB/);
});
