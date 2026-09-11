import * as React from 'react';
import { Card } from './Card';
import { cn } from '@/utils/helpers';

/**
 * Tabela do design system (Figma: prancha "17 Table (List)", node `151:8167` —
 * sets `Table` e `Table actions`).
 *
 * O set `Table` tem três variantes, e é delas que saem as medidas:
 *
 *   Web Table Header  h48 · pad 16/24 · gap 24 · fundo #F8F8F9 · texto #111827
 *   Table Row         h48 · pad  0/24 · gap 24 · sem fundo     · texto #FFFFFF
 *   Table Hover       h48 · pad 24/24 · gap 24 · fundo #585D68
 *
 * **Divergência com as telas:** o cabeçalho da prancha é #F8F8F9, mas todos os
 * frames do app usam `Systems/S-Info Bg` (#E8EDF9) — o azul claro que aparece em
 * todas as tabelas. Vale a tela, como no resto da refatoração.
 *
 * Não é `<table>`: os frames desenham linhas de auto-layout com colunas que ora
 * esticam, ora têm largura fixa. Flex reproduz isso direto, e foi assim que as
 * telas já estavam — o componente só para de repetir as mesmas classes em seis
 * arquivos.
 *
 * `larguraMinima` liga a rolagem horizontal para as tabelas que não cabem numa
 * janela estreita (a de "Testes disponíveis" soma mais de 1150px de colunas
 * fixas). A rolagem fica dentro do card, sem empurrar a página.
 */
export function Table({
  larguraMinima,
  transparente,
  className,
  children,
}: {
  larguraMinima?: number;
  /**
   * Sem o véu translúcido do `Card`. Dois blocos do arquivo desenham a tabela
   * só com contorno, dentro de um card que já existe — aninhar dois véus
   * escureceria o segundo.
   */
  transparente?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Card
      className={cn('gap-0 overflow-hidden p-0', transparente && 'bg-transparent', className)}
    >
      <div className={cn(larguraMinima && 'overflow-x-auto')}>
        <div style={larguraMinima ? { minWidth: larguraMinima } : undefined}>{children}</div>
      </div>
    </Card>
  );
}

/** `State=Web Table Header`: a única superfície clara da tabela. */
export function TableHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-6 bg-orbit-info-bg px-6 py-4 text-body text-orbit-dark',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * `State=Table Row`, com o `State=Table Hover` no `hover:`.
 *
 * O realce de linha é da prancha (#585D68) e as telas não o mostravam por não
 * haver componente; aqui ele volta, atenuado, porque sobre o card translúcido do
 * app o cinza cheio apagaria o conteúdo.
 */
export function TableRow({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-6 px-6 py-3 transition-colors hover:bg-orbit-faint/30',
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Rodapé de paginação: linha divisória e a contagem de registros. */
export function TableFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <hr className="mx-6 border-orbit-border" />
      <div className={cn('flex items-center gap-6 px-6 py-4', className)}>{children}</div>
    </>
  );
}
