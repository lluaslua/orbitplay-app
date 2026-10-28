import { expect, it } from 'vitest';
import type { FormQuestion } from '@/types';
import {
  alternarOpcao,
  eventosDosProblemas,
  marcarNaGrade,
  montarEnvio,
  respostaVazia,
  validarRespostas,
} from './avaliacao';

const pergunta = (extra: Partial<FormQuestion>): FormQuestion => ({
  id: 'q-1',
  type: 'SHORT_TEXT',
  label: 'Pergunta do estúdio',
  required: false,
  ...extra,
});

it('texto só com espaços, lista vazia e ausência contam como em branco', () => {
  expect(respostaVazia('   ')).toBe(true);
  expect(respostaVazia([])).toBe(true);
  expect(respostaVazia(undefined)).toBe(true);
  expect(respostaVazia(0)).toBe(false);
});

it('obrigatória em branco recusa o envio com o erro na pergunta', () => {
  const perguntas = [pergunta({ id: 'q-1', required: true }), pergunta({ id: 'q-2' })];

  expect(validarRespostas(perguntas, { 'q-2': 'resposta' })).toEqual({ 'q-1': 'Resposta obrigatória.' });
  expect(validarRespostas(perguntas, { 'q-1': 'resposta' })).toEqual({});
});

it('na grade obrigatória toda linha precisa de resposta', () => {
  const grade = pergunta({ type: 'MULTIPLE_CHOICE_GRID', required: true, options: ['Terra', 'Asfalto'], columns: ['Ruim', 'Ótima'] });

  expect(validarRespostas([grade], { 'q-1': ['Terra: Ótima'] })['q-1']).toContain('Asfalto');
  expect(validarRespostas([grade], { 'q-1': ['Terra: Ótima', 'Asfalto: Ruim'] })).toEqual({});
});

it('na grade de escolha cada linha fica com uma coluna só', () => {
  const primeira = marcarNaGrade(undefined, 'Terra', 'Ruim', true);
  const trocada = marcarNaGrade(primeira, 'Terra', 'Ótima', true);
  const outraLinha = marcarNaGrade(trocada, 'Asfalto', 'Ruim', true);

  expect(outraLinha).toEqual(['Terra: Ótima', 'Asfalto: Ruim']);
});

it('na grade de caixas marcar de novo desmarca', () => {
  const marcada = marcarNaGrade(undefined, 'Travamento', 'Pista Terra', false);

  expect(marcarNaGrade(marcada, 'Travamento', 'Pista Terra', false)).toEqual([]);
  expect(marcarNaGrade(marcada, 'Travamento', 'Pista Noturna', false)).toHaveLength(2);
});

it('as caixas de seleção alternam a opção', () => {
  expect(alternarOpcao(['Campeonato'], 'Campeonato')).toEqual([]);
  expect(alternarOpcao(undefined, 'Campeonato')).toEqual(['Campeonato']);
});

it('o envio leva só as respostas preenchidas das perguntas do teste', () => {
  const perguntas = [pergunta({ id: 'q-1' }), pergunta({ id: 'q-2', type: 'LINEAR_SCALE' }), pergunta({ id: 'q-3' })];

  expect(montarEnvio(perguntas, { 'q-1': '  ótimo  ', 'q-2': 4, 'q-3': '', 'outra': 'x' })).toEqual({ 'q-1': 'ótimo', 'q-2': 4 });
});

it('cada problema marcado vira um bug com a explicação', () => {
  expect(eventosDosProblemas(['Travamentos', 'Bug visual'], ' Na curva do túnel ', 300)).toEqual([
    { atSecond: 300, type: 'BUG', label: 'Travamentos', detail: 'Na curva do túnel' },
    { atSecond: 300, type: 'BUG', label: 'Bug visual', detail: 'Na curva do túnel' },
  ]);
});
