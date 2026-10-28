import { beforeEach, expect, it } from 'vitest';
import { useSessaoStore } from './sessaoStore';

beforeEach(() => {
  sessionStorage.clear();
  useSessaoStore.getState().limpar();
});

it('conta os segundos desde o "Iniciar Jogo!"', () => {
  useSessaoStore.getState().iniciar('test-1', 'part-1', 1_000);

  expect(useSessaoStore.getState().segundos(61_000)).toBe(60);
});

it('o "Finalizar teste" para o cronômetro', () => {
  const sessao = useSessaoStore.getState();
  sessao.iniciar('test-1', 'part-1', 0);
  useSessaoStore.getState().encerrar(90_000);

  expect(useSessaoStore.getState().segundos(500_000)).toBe(90);
});

it('iniciar de novo o mesmo teste continua a sessão em andamento', () => {
  useSessaoStore.getState().iniciar('test-1', 'part-1', 0);
  useSessaoStore.getState().iniciar('test-1', 'part-1', 30_000);

  expect(useSessaoStore.getState().inicio).toBe(0);
});

it('outro teste começa uma sessão nova', () => {
  useSessaoStore.getState().iniciar('test-1', 'part-1', 0);
  useSessaoStore.getState().iniciar('test-2', 'part-2', 30_000);

  expect(useSessaoStore.getState()).toMatchObject({ testId: 'test-2', participationId: 'part-2', inicio: 30_000 });
});

it('sem sessão a duração é zero', () => {
  expect(useSessaoStore.getState().segundos()).toBe(0);
});
