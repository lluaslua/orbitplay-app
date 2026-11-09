export type PixKeyType = 'CPF' | 'CNPJ' | 'PHONE' | 'EMAIL' | 'RANDOM';

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  PHONE: 'Telefone',
  EMAIL: 'E-mail',
  RANDOM: 'Chave aleatória',
};

const EMAIL = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const ALEATORIA = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Os cinco formatos de chave Pix — as mesmas regras da API (`wallet/pix-key.ts`).
 * Só confere o formato: o Pix é simulado e a API é quem decide se aceita.
 */
export function pixKeyType(valor: string): PixKeyType | null {
  const chave = valor.trim();
  const digitos = chave.replace(/[.\-/\s]/g, '');
  if (/^\d{11}$/.test(digitos) && !/^(\d)\1{10}$/.test(digitos)) return 'CPF';
  if (/^\d{14}$/.test(digitos) && !/^(\d)\1{13}$/.test(digitos)) return 'CNPJ';
  if (/^\+55\d{10,11}$/.test(chave.replace(/[\s()-]/g, ''))) return 'PHONE';
  if (chave.length <= 77 && EMAIL.test(chave)) return 'EMAIL';
  if (ALEATORIA.test(chave)) return 'RANDOM';
  return null;
}

/** O campo de valor trabalha em centavos: cada dígito digitado entra pela direita, como nos apps de banco. */
export function centavosDoCampo(texto: string, maximo = 99_999_999): number {
  const digitos = texto.replace(/\D/g, '').replace(/^0+/, '');
  if (!digitos) return 0;
  return Math.min(Number(digitos.slice(0, 9)), maximo);
}
