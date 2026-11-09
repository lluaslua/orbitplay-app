import { Pencil, Save, Trash2, X } from 'lucide-react';
import {
  Button,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalTitle,
} from '@/components/UI';

/**
 * Pergunta ao estúdio o que fazer com o teste em andamento ao sair do "Novo
 * teste" pela seta de voltar.
 *
 * Fundo branco e fechar de 40px no canto, como os outros modais. No topo, um
 * selo em degradê Nightfall com o ícone de salvar e um halo suave; depois o
 * título e o texto. A ação
 * principal ocupa a largura toda; "Descartar" (vermelho) e "Continuar
 * editando" (azul) dividem a linha de baixo como botões de contorno.
 */
export function ModalSairDoTeste({
  aberto,
  onOpenChange,
  onSalvar,
  onDescartar,
}: {
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onSalvar: () => void;
  onDescartar: () => void;
}) {
  return (
    <Modal open={aberto} onOpenChange={onOpenChange}>
      <ModalContent
        hideClose
        className="flex w-[380px] max-w-none flex-col gap-0 rounded-3xl border-orbit-light bg-white px-8 pb-8 pt-10 text-center shadow-none"
      >
        <ModalClose
          aria-label="Fechar"
          className="absolute right-4 top-4 grid size-10 place-items-center rounded-lg bg-slate-100 text-orbit-dark orbit-focus-ring"
        >
          <X className="size-4" strokeWidth={2.5} />
        </ModalClose>

        <span className="relative mx-auto grid size-[88px] place-items-center">
          <span className="absolute inset-0 rounded-full bg-orbit-nightfall opacity-10" />
          <span className="absolute inset-2 rounded-full bg-orbit-nightfall opacity-10" />
          <span className="relative grid size-14 place-items-center rounded-2xl bg-orbit-nightfall shadow-lg shadow-orbit-blue/30">
            <Save className="size-7 text-white" strokeWidth={2} />
          </span>
        </span>

        <ModalTitle className="mt-6 text-[22px] font-bold leading-7 text-orbit-dark">
          Salvar como rascunho?
        </ModalTitle>

        <ModalDescription className="mt-2 text-[15px] leading-6 text-slate-600">
          Salve no rascunho caso queira alterar mais tarde.
        </ModalDescription>

        <div className="mt-8 flex flex-col gap-3">
          <Button variant="nightfall" block onClick={onSalvar}>
            <Save className="size-5" />
            Salvar rascunho
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onDescartar}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-orbit-error/30 text-button text-orbit-error transition-colors hover:bg-orbit-error/5 orbit-focus-ring"
            >
              <Trash2 className="size-4" />
              Descartar
            </button>
            <ModalClose aria-label="Continuar editando" className="flex h-12 items-center justify-center gap-2 rounded-xl border border-orbit-blue/30 text-button text-orbit-blue transition-colors hover:bg-orbit-blue/5 orbit-focus-ring">
              <Pencil className="size-4" />
              Continuar
            </ModalClose>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
