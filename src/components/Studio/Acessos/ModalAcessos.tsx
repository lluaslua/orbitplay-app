import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button, Modal, ModalClose, ModalContent, ModalTitle } from '@/components/UI';
import { cn } from '@/utils/helpers';

/**
 * O modal escuro de 800px dos formulários (Figma: os frames "Adicionar membro").
 *
 * Fundo `#080321` com borda clara, título Bold 32 e o "×" no canto. O rodapé é
 * sempre o botão em degradê à direita, com ou sem o "Cancelar" à esquerda.
 */
export function ModalAcessos({
  aberto,
  onOpenChange,
  titulo,
  acao,
  cancelar,
  carregando,
  desabilitado,
  onConfirmar,
  children,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  acao: string;
  /** "Novo usuário" e "Novo grupo" não têm o "Cancelar"; só fecham no "×". */
  cancelar?: boolean;
  carregando?: boolean;
  desabilitado?: boolean;
  onConfirmar: () => void;
  children: ReactNode;
}) {
  return (
    <Modal open={aberto} onOpenChange={onOpenChange}>
      <ModalContent
        hideClose
        className="flex w-[800px] max-w-none flex-col gap-0 rounded-xl border-orbit-dim bg-orbit-bg p-6 pb-5 pt-4 shadow-none"
      >
        <div className="flex items-start justify-between gap-6">
          <ModalTitle className="text-headline text-white">{titulo}</ModalTitle>
          <ModalClose aria-label="Fechar" className="-mr-[7px] mt-1 text-white orbit-focus-ring">
            <X className="size-5" strokeWidth={2.5} />
          </ModalClose>
        </div>

        {children}

        <div className={cn('mt-6 flex items-center', cancelar ? 'justify-between' : 'justify-end')}>
          {cancelar && (
            <ModalClose className="h-12 px-8 text-button text-orbit-blue orbit-focus-ring">
              Cancelar
            </ModalClose>
          )}
          <Button variant="nightfall" loading={carregando} disabled={desabilitado} onClick={onConfirmar}>
            {acao}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
