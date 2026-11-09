import { useState } from 'react';
import { expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CodigoVerificacao, digitosDoCodigo } from './CodigoVerificacao';

/** O campo com estado de verdade, como a tela usa. */
function Campo({ inicial = '' }: { inicial?: string }) {
  const [codigo, setCodigo] = useState(inicial);
  return (
    <>
      <CodigoVerificacao valor={codigo} onChange={setCodigo} />
      <output data-testid="codigo">{codigo}</output>
    </>
  );
}

const caixas = () => screen.getAllByRole('textbox') as HTMLInputElement[];
const codigo = () => screen.getByTestId('codigo').textContent;

it('o código só aceita dígitos e para em seis', () => {
  expect(digitosDoCodigo('12a-34 5678')).toBe('123456');
});

it('digitar preenche a caixa e passa o foco para a próxima', () => {
  render(<Campo />);
  fireEvent.change(caixas()[0], { target: { value: '4' } });

  expect(codigo()).toBe('4');
  expect(caixas()[0].value).toBe('4');
  expect(document.activeElement).toBe(caixas()[1]);
});

it('digitar numa caixa adiante preenche a primeira vazia, sem deixar buraco', () => {
  render(<Campo inicial="1" />);
  fireEvent.change(caixas()[4], { target: { value: '7' } });

  expect(codigo()).toBe('17');
  expect(document.activeElement).toBe(caixas()[2]);
});

it('letra não entra no código', () => {
  render(<Campo />);
  fireEvent.change(caixas()[0], { target: { value: 'a' } });

  expect(codigo()).toBe('');
});

it('colar o código do e-mail preenche as seis caixas', () => {
  render(<Campo />);
  fireEvent.paste(caixas()[0], { clipboardData: { getData: () => ' 987 654 ' } });

  expect(codigo()).toBe('987654');
  expect(caixas().map((caixa) => caixa.value)).toEqual(['9', '8', '7', '6', '5', '4']);
});

it('Backspace numa caixa vazia apaga a anterior e volta para ela', () => {
  render(<Campo inicial="12" />);
  fireEvent.keyDown(caixas()[2], { key: 'Backspace' });

  expect(codigo()).toBe('1');
  expect(document.activeElement).toBe(caixas()[1]);
});
