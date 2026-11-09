import { useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { cn } from '@/utils/helpers';

export const TAMANHO_CODIGO = 6;

/** Só os dígitos de `texto`, cortados no tamanho do código. */
export function digitosDoCodigo(texto: string): string {
  return texto.replace(/\D/g, '').slice(0, TAMANHO_CODIGO);
}

/**
 * As seis caixas brancas de "Verifique seu e-mail". Cada caixa guarda um
 * dígito; digitar passa para a próxima, Backspace numa caixa vazia volta, e
 * colar o código inteiro (do e-mail) preenche todas.
 */
export function CodigoVerificacao({
  valor,
  onChange,
  invalido,
  desabilitado,
}: {
  valor: string;
  onChange: (codigo: string) => void;
  invalido?: boolean;
  desabilitado?: boolean;
}) {
  const caixas = useRef<(HTMLInputElement | null)[]>([]);
  const focar = (indice: number) => caixas.current[Math.max(0, Math.min(indice, TAMANHO_CODIGO - 1))]?.focus();

  function digitar(indice: number, texto: string) {
    const digitos = digitosDoCodigo(texto);
    if (!digitos) return;
    // Mais de um dígito numa caixa (autocompletar do sistema) preenche a partir dela. Digitar
    // numa caixa adiante da primeira vazia preenche a vazia: o código nunca fica com buraco.
    const novo = (valor.slice(0, indice) + digitos).slice(0, TAMANHO_CODIGO);
    onChange(novo);
    focar(novo.length);
  }

  function apagar(indice: number, evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key === 'ArrowLeft') return focar(indice - 1);
    if (evento.key === 'ArrowRight') return focar(indice + 1);
    if (evento.key !== 'Backspace') return;
    evento.preventDefault();
    // Apaga a caixa atual; se ela já está vazia, apaga a anterior e volta.
    const alvo = valor[indice] ? indice : indice - 1;
    if (alvo < 0) return;
    onChange(valor.slice(0, alvo));
    focar(alvo);
  }

  function colar(evento: ClipboardEvent<HTMLInputElement>) {
    evento.preventDefault();
    const digitos = digitosDoCodigo(evento.clipboardData.getData('text'));
    if (!digitos) return;
    onChange(digitos);
    focar(digitos.length);
  }

  return (
    <div className="flex gap-[15px]" role="group" aria-label="Código de verificação">
      {Array.from({ length: TAMANHO_CODIGO }, (_, indice) => (
        <input
          key={indice}
          ref={(elemento) => {
            caixas.current[indice] = elemento;
          }}
          value={valor[indice] ?? ''}
          onChange={(evento) => digitar(indice, evento.target.value)}
          onKeyDown={(evento) => apagar(indice, evento)}
          onPaste={colar}
          inputMode="numeric"
          autoComplete={indice === 0 ? 'one-time-code' : 'off'}
          maxLength={TAMANHO_CODIGO}
          disabled={desabilitado}
          aria-label={`Dígito ${indice + 1}`}
          aria-invalid={invalido}
          className={cn(
            'size-10 rounded-lg border-2 bg-white text-center text-h3 text-orbit-dark outline-none transition-colors',
            'focus:border-orbit-blue disabled:opacity-60',
            invalido ? 'border-orbit-error' : 'border-white',
          )}
        />
      ))}
    </div>
  );
}
