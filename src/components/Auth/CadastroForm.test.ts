import { expect, it } from 'vitest';
import { esquemaDoEstudio, esquemaDoTester, idadeEm, payloadDoCadastro } from './CadastroForm';

const base = { name: 'Ana Dev', email: 'ana@estudio.com', password: 'Senha@123', confirmacao: 'Senha@123' };

it('o estúdio precisa do nome da organização', () => {
  expect(esquemaDoEstudio.safeParse({ ...base, organization: '' }).success).toBe(false);
  expect(esquemaDoEstudio.safeParse({ ...base, organization: 'Blackstar' }).success).toBe(true);
});

it('o site do estúdio, quando vem, tem https://', () => {
  expect(esquemaDoEstudio.safeParse({ ...base, organization: 'Blackstar', website: 'blackstar.gg' }).success).toBe(false);
  expect(esquemaDoEstudio.safeParse({ ...base, organization: 'Blackstar', website: 'https://blackstar.gg' }).success).toBe(true);
});

it('a senha segue a regra do app e a confirmação precisa bater', () => {
  expect(esquemaDoEstudio.safeParse({ ...base, organization: 'X', password: '12345678', confirmacao: '12345678' }).success).toBe(false);
  const diferente = esquemaDoEstudio.safeParse({ ...base, organization: 'X', confirmacao: 'Outra@123' });
  expect(diferente.success).toBe(false);
  expect(diferente.error?.issues[0].path).toEqual(['confirmacao']);
});

const tester = { ...base, birthDate: '2000-01-01', location: 'BRASIL', playerType: 'CASUAL', archetype: 'EXPLORER' };

it('o tester informa idade, onde mora, como joga e o estilo', () => {
  expect(esquemaDoTester.safeParse(tester).success).toBe(true);
  expect(esquemaDoTester.safeParse({ ...tester, location: '' }).success).toBe(false);
  expect(esquemaDoTester.safeParse({ ...tester, archetype: 'ALL' }).success).toBe(false);
});

it('menor de 16 anos não se cadastra como tester', () => {
  const ontem16 = new Date();
  ontem16.setFullYear(ontem16.getFullYear() - 15);
  expect(esquemaDoTester.safeParse({ ...tester, birthDate: ontem16.toISOString().slice(0, 10) }).success).toBe(false);
});

it('a idade conta o aniversário que ainda não chegou', () => {
  expect(idadeEm('2000-06-15', new Date(2026, 5, 14))).toBe(25);
  expect(idadeEm('2000-06-15', new Date(2026, 5, 15))).toBe(26);
});

it('o cadastro do estúdio não leva campos do tester, e opcional vazio não vai', () => {
  expect(payloadDoCadastro('STUDIO', { ...base, organization: ' Blackstar ', cnpj: '', website: '' })).toEqual({
    role: 'STUDIO',
    name: 'Ana Dev',
    email: 'ana@estudio.com',
    password: 'Senha@123',
    organization: 'Blackstar',
    cnpj: undefined,
    website: undefined,
  });
});
