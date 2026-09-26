import { X } from 'lucide-react';
import {
  Button,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/UI';

/**
 * O modal branco de 300px das confirmações (Figma: os cinco frames "Modal").
 *
 * Fechar de 40px no canto, o selo de 64px com "!" (ações destrutivas) ou "?"
 * (as reversíveis), título 16 Bold, texto 14 e a linha "Cancelar" + ação.
 */
export function ModalConfirmacao({
  aberto,
  onOpenChange,
  selo,
  titulo,
  descricao,
  acao,
  carregando,
  onConfirmar,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  selo: 'alerta' | 'pergunta';
  titulo: string;
  descricao: string;
  acao: string;
  carregando?: boolean;
  onConfirmar: () => void;
}) {
  return (
    <Modal open={aberto} onOpenChange={onOpenChange}>
      <ModalContent
        hideClose
        className="flex w-[300px] max-w-none flex-col gap-0 rounded-2xl border-orbit-light bg-white p-6 pb-[22px] pt-[77px] text-center shadow-none"
      >
        <ModalClose
          aria-label="Fechar"
          className="absolute right-4 top-3 grid size-10 place-items-center rounded-lg bg-slate-100 text-orbit-dark orbit-focus-ring"
        >
          <X className="size-4" strokeWidth={2.5} />
        </ModalClose>

        {/* Selo: dois anéis translúcidos do azul da marca em volta do glifo em degradê. */}
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-orbit-blue/10">
          <span className="grid size-12 place-items-center rounded-full bg-orbit-blue/10">
            <img src={`./icons/figma/acessos/selo-${selo}.svg`} alt="" />
          </span>
        </span>

        <ModalTitle className="mt-[22px] text-subtitle leading-[25px] text-orbit-dark">
          {titulo}
        </ModalTitle>

        <ModalDescription className="mt-[26px] text-[16px] leading-5 text-orbit-dark">{descricao}</ModalDescription>

        <div className="mt-6 flex items-center justify-between">
          <ModalClose className="h-12 px-5 text-button text-orbit-blue orbit-focus-ring">Cancelar</ModalClose>
          <Button variant="nightfall" loading={carregando} onClick={onConfirmar}>
            {acao}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
