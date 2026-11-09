import { expect, it } from 'vitest';
import { esquemaDoCadastro, idadeEm, payloadDoCadastro, type ValoresCadastro } from './CadastroForm';

const base: ValoresCadastro = {
  role: 'PLAYER',
  name: 'Ana Dev',
  email: 'ana@estudio.com',
  birthDate: '2000-01-01',
  location: 'BRASIL',
  password: 'Senha@123',
  confirmacao: 'Senha@123',
  acceptTerms: true,
  marketingOptIn: false,
};

it('sem aceitar os Termos de Uso não cria a conta', () => {
  const resultado = esquemaDoCadastro.safeParse({ ...base, acceptTerms: false });
  expect(resultado.success).toBe(false);
  expect(resultado.error?.issues[0].path).toEqual(['acceptTerms']);
});

it('as novidades são opcionais', () => {
  expect(esquemaDoCadastro.safeParse({ ...base, marketingOptIn: false }).success).toBe(true);
  expect(esquemaDoCadastro.safeParse({ ...base, marketingOptIn: true }).success).toBe(true);
});

it('a senha segue a regra do app e a confirmação precisa bater', () => {
  expect(esquemaDoCadastro.safeParse({ ...base, password: '12345678', confirmacao: '12345678' }).success).toBe(false);
  const diferente = esquemaDoCadastro.safeParse({ ...base, confirmacao: 'Outra@123' });
  expect(diferente.success).toBe(false);
  expect(diferente.error?.issues[0].path).toEqual(['confirmacao']);
});

it('país e data de nascimento são obrigatórios para os dois perfis', () => {
  for (const role of ['STUDIO', 'PLAYER'] as const) {
    expect(esquemaDoCadastro.safeParse({ ...base, role, location: '' }).success).toBe(false);
    expect(esquemaDoCadastro.safeParse({ ...base, role, birthDate: '' }).success).toBe(false);
  }
});

it('menor de 16 anos não cria conta', () => {
  const quinze = new Date();
  quinze.setFullYear(quinze.getFullYear() - 15);
  expect(esquemaDoCadastro.safeParse({ ...base, birthDate: quinze.toISOString().slice(0, 10) }).success).toBe(false);
});

it('a idade conta o aniversário que ainda não chegou', () => {
  expect(idadeEm('2000-06-15', new Date(2026, 5, 14))).toBe(25);
  expect(idadeEm('2000-06-15', new Date(2026, 5, 15))).toBe(26);
});

it('o nome do estúdio vira a organização e o nome da conta', () => {
  expect(payloadDoCadastro({ ...base, role: 'STUDIO', name: ' Blackstar ', marketingOptIn: true })).toEqual({
    role: 'STUDIO',
    name: 'Blackstar',
    organization: 'Blackstar',
    email: 'ana@estudio.com',
    password: 'Senha@123',
    birthDate: '2000-01-01',
    location: 'BRASIL',
    acceptTerms: true,
    marketingOptIn: true,
  });
});

it('o cadastro do jogador não leva organização nem a confirmação da senha', () => {
  const payload = payloadDoCadastro(base);
  expect(payload).not.toHaveProperty('organization');
  expect(payload).not.toHaveProperty('confirmacao');
  expect(payload).toMatchObject({ role: 'PLAYER', name: 'Ana Dev', acceptTerms: true, marketingOptIn: false });
});
