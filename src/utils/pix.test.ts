import { describe, expect, it } from 'vitest';
import { centavosDoCampo, pixKeyType } from './pix';

describe('pixKeyType', () => {
  it('reconhece os cinco formatos de chave', () => {
    expect(pixKeyType('123.456.789-09')).toBe('CPF');
    expect(pixKeyType('12.345.678/0001-95')).toBe('CNPJ');
    expect(pixKeyType('+55 (11) 91234-5678')).toBe('PHONE');
    expect(pixKeyType('tester@orbitplay.com')).toBe('EMAIL');
    expect(pixKeyType('123e4567-e89b-42d3-a456-426614174000')).toBe('RANDOM');
  });

  it('recusa o que não é chave', () => {
    expect(pixKeyType('')).toBeNull();
    expect(pixKeyType('minha chave')).toBeNull();
    expect(pixKeyType('111.111.111-11')).toBeNull();
    expect(pixKeyType('12345')).toBeNull();
    // Telefone só vale com o +55; sem ele, 11 dígitos seguem como CPF.
    expect(pixKeyType('(11) 91234-5678')).toBeNull();
  });
});

describe('centavosDoCampo', () => {
  it('cada dígito entra pela direita, em centavos', () => {
    expect(centavosDoCampo('')).toBe(0);
    expect(centavosDoCampo('5')).toBe(5);
    expect(centavosDoCampo('2000')).toBe(2000);
    expect(centavosDoCampo('R$ 20,00')).toBe(2000);
  });

  it('ignora zeros à esquerda e respeita o teto', () => {
    expect(centavosDoCampo('000150')).toBe(150);
    expect(centavosDoCampo('99999999999')).toBe(99_999_999);
  });
});
