import { beforeEach, expect, it } from 'vitest';
import type { FormQuestion } from '@/types';
import { perguntaValida, useTestStore } from './testStore';

const pergunta = (extra: Partial<FormQuestion>): FormQuestion => ({
  id: 'q-1',
  type: 'SHORT_TEXT',
  label: 'Uma pergunta qualquer',
  required: true,
  ...extra,
});

beforeEach(() => {
  localStorage.clear();
  useTestStore.getState().reset();
});

it('trocar de jogo começa um rascunho novo, sem a build do jogo anterior', () => {
  const store = useTestStore.getState();
  store.setGame('game-a');
  store.setModel('FREE_EXPLORATION');
  store.setBuild({ id: 'build-a', name: 'a.exe', sizeMb: 1 });
  store.setStep(3);

  useTestStore.getState().setGame('game-b');

  const { draft, currentStep } = useTestStore.getState();
  expect(draft.gameId).toBe('game-b');
  expect(draft.buildId).toBeNull();
  expect(draft.model).toBeNull();
  expect(currentStep).toBe(1);
});

it('preencher o jogo do rascunho vazio não apaga o que já foi escolhido', () => {
  useTestStore.getState().setModel('AB_TEST');
  useTestStore.getState().setGame('game-a');

  expect(useTestStore.getState().draft.model).toBe('AB_TEST');
});

it('a etapa 2 exige duas opções nas perguntas de escolha e na lista suspensa', () => {
  expect(perguntaValida(pergunta({ type: 'DROPDOWN', options: ['Só uma', ''] }))).toBe(false);
  expect(perguntaValida(pergunta({ type: 'DROPDOWN', options: ['Uma', 'Outra'] }))).toBe(true);
  expect(perguntaValida(pergunta({ type: 'MULTIPLE_CHOICE', options: ['Sim'] }))).toBe(false);
});

it('a grade precisa de uma linha e duas colunas', () => {
  expect(perguntaValida(pergunta({ type: 'CHECKBOX_GRID', options: ['Linha'], columns: ['A'] }))).toBe(false);
  expect(perguntaValida(pergunta({ type: 'CHECKBOX_GRID', options: [], columns: ['A', 'B'] }))).toBe(false);
  expect(perguntaValida(pergunta({ type: 'MULTIPLE_CHOICE_GRID', options: ['Linha'], columns: ['A', 'B'] }))).toBe(true);
});

it('pergunta com menos de 5 caracteres não avança', () => {
  expect(perguntaValida(pergunta({ label: 'Oi?' }))).toBe(false);
});

it('a etapa 3 só passa com a build validada', () => {
  const store = useTestStore.getState();
  store.setModel('FREE_EXPLORATION');
  store.setBuild({ id: 'build-a', name: 'a.exe', sizeMb: 1 });
  expect(useTestStore.getState().isStepValid(3)).toBe(false);

  useTestStore.getState().setBuildValida(true);
  expect(useTestStore.getState().isStepValid(3)).toBe(true);
});

it('o A/B de imagens passa da etapa 3 sem build', () => {
  useTestStore.getState().setModel('AB_IMAGES');
  expect(useTestStore.getState().isStepValid(3)).toBe(true);
});

it('trocar o modelo obriga a conferir a build de novo', () => {
  const store = useTestStore.getState();
  store.setModel('FREE_EXPLORATION');
  store.setBuild({ id: 'build-a', name: 'a.exe', sizeMb: 1 });
  store.setBuildValida(true);

  useTestStore.getState().setModel('TELEMETRY');

  expect(useTestStore.getState().buildValida).toBe(false);
});

it('o teste criado na API é esquecido quando a build muda', () => {
  const store = useTestStore.getState();
  store.setTestIdCriado('test-1');
  store.setBuild({ id: 'build-b', name: 'b.exe', sizeMb: 1 });

  expect(useTestStore.getState().testIdCriado).toBeNull();
});

it('o rascunho novo abre com "Jogável com controle" ligado, como no desenho', () => {
  expect(useTestStore.getState().draft.requiresController).toBe(true);
});
