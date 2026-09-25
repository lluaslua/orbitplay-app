import { useRef, useState, type ChangeEvent } from 'react';
import { Eye, Plus } from 'lucide-react';
import { Checkbox, FieldError, IconButton, Input, Radio, SelectField } from '@/components/UI';
import { useTestStore } from '@/stores/testStore';
import type { FormQuestion, QuestionType } from '@/types';
import { cn } from '@/utils/helpers';
import { reduzirImagem } from '@/utils/imagem';
import { DropdownTipoPergunta } from './DropdownTipoPergunta';

function precisaOpcoes(type: QuestionType) {
  return type === 'MULTIPLE_CHOICE' || type === 'CHECKBOXES' || type === 'DROPDOWN';
}

/**
 * ETAPA 2 — A avaliação do seu teste. Figma: `319:7290`, card `319:7695`.
 *
 * Cada pergunta é um card: linha de tipo (seletor + botão de imagem +
 * "Obrigatória" + ações à direita), divisória, o enunciado e o campo de
 * resposta. Os campos têm 390px fixos, como no arquivo.
 *
 * O botão de imagem anexa uma imagem à pergunta. O arquivo só desenha o botão,
 * então a imagem escolhida entra logo abaixo do enunciado, na largura dos
 * campos, com "Trocar" e "Remover" no mesmo estilo das ações do card.
 *
 * O rodapé com "Voltar", "Pré-visualizar" e "Próximo" fica na casca do fluxo,
 * em `pages/studio/tests/new.tsx`.
 */
export function Step2CreateForm() {
  const questions = useTestStore((state) => state.draft.questions);
  const addQuestion = useTestStore((state) => state.addQuestion);
  const updateQuestion = useTestStore((state) => state.updateQuestion);
  const removeQuestion = useTestStore((state) => state.removeQuestion);
  const moveQuestion = useTestStore((state) => state.moveQuestion);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">A avaliação do seu teste</h2>
        <p className="text-body text-white">
          Monte formulários inteligentes, combinando perguntas objetivas, feedback aberto e análises
          automáticas por IA.
        </p>
      </div>

      {questions.map((question, indice) => (
        <CardPergunta
          key={question.id}
          pergunta={question}
          onChange={(patch) => updateQuestion(question.id, patch)}
          onSubir={indice > 0 ? () => moveQuestion(question.id, -1) : undefined}
          onDescer={
            indice < questions.length - 1 ? () => moveQuestion(question.id, 1) : undefined
          }
          onDuplicar={() => addQuestion({ ...question, id: undefined })}
          onDeletar={() => removeQuestion(question.id)}
        />
      ))}

      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => addQuestion({})}
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
        >
          Adicionar pergunta
          <Plus className="size-6" />
        </button>

        <span className="flex-1" />

        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
          title="Ainda não disponível"
        >
          Pré-visualizar
          <Eye className="size-6" />
        </button>
      </div>
    </div>
  );
}

function CardPergunta({
  pergunta,
  onChange,
  onSubir,
  onDescer,
  onDuplicar,
  onDeletar,
}: {
  pergunta: FormQuestion;
  onChange: (patch: Partial<FormQuestion>) => void;
  onSubir?: () => void;
  onDescer?: () => void;
  onDuplicar: () => void;
  onDeletar: () => void;
}) {
  const seletorDeImagem = useRef<HTMLInputElement>(null);
  const [erroImagem, setErroImagem] = useState<string | null>(null);

  const escolherImagem = () => seletorDeImagem.current?.click();

  async function receberImagem(evento: ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    // Zera o campo para o mesmo arquivo poder ser escolhido de novo.
    evento.target.value = '';
    if (!arquivo) return;

    try {
      onChange({ imageUrl: await reduzirImagem(arquivo) });
      setErroImagem(null);
    } catch {
      setErroImagem('Não foi possível abrir essa imagem. Use PNG, JPG ou WebP.');
    }
  }

  return (
    <section className="flex w-full flex-col items-start gap-6 rounded-3xl border border-white p-6">
      {/* Tipo · imagem · obrigatória · ações (Figma: ações na mesma fileira, à direita). */}
      <div className="flex w-full flex-wrap items-end gap-6">
        <DropdownTipoPergunta
          className="w-[390px]"
          valor={pergunta.type}
          onChange={(type) => {
            onChange({
              type,
              options:
                precisaOpcoes(type) && !pergunta.options?.length
                  ? ['', '', '', '']
                  : pergunta.options,
            });
          }}
        />

        <IconButton
          aria-label={
            pergunta.imageUrl ? 'Trocar a imagem da pergunta' : 'Adicionar imagem à pergunta'
          }
          onClick={escolherImagem}
          className="size-[46px] shrink-0 rounded-xl"
        >
          <img src="./icons/figma/question-image.svg" alt="" className="size-6" />
        </IconButton>
        <input
          ref={seletorDeImagem}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={receberImagem}
        />

        <label className="flex h-[46px] shrink-0 cursor-pointer items-center gap-2">
          <Checkbox
            checked={pergunta.required}
            onCheckedChange={(checked) => onChange({ required: checked === true })}
          />
          <span className="text-body text-white">Obrigatória</span>
        </label>

        <div className="ml-auto flex h-[46px] items-center gap-6">
          <AcaoPergunta rotulo="Subir" icone="question-up" onClick={onSubir} />
          <AcaoPergunta rotulo="Descer" icone="question-down" onClick={onDescer} />
          <AcaoPergunta rotulo="Duplicar" icone="question-copy" onClick={onDuplicar} />
          <AcaoPergunta rotulo="Deletar" icone="question-trash" onClick={onDeletar} destrutiva />
        </div>
      </div>

      <hr className="w-full border-orbit-border" />

      <Input
        label="Pergunta"
        required
        className="w-[390px]"
        value={pergunta.label}
        onChange={(event) => onChange({ label: event.target.value })}
        placeholder="Digite..."
      />

      {pergunta.imageUrl && (
        <figure className="flex w-[390px] flex-col items-start gap-2">
          <img
            src={pergunta.imageUrl}
            alt="Imagem da pergunta"
            className="max-h-[390px] w-full rounded-xl object-cover"
          />
          <div className="flex items-start gap-6">
            <AcaoPergunta rotulo="Trocar" icone="question-image" onClick={escolherImagem} tingido />
            <AcaoPergunta
              rotulo="Remover"
              icone="question-trash"
              onClick={() => onChange({ imageUrl: undefined })}
              destrutiva
            />
          </div>
        </figure>
      )}

      {erroImagem && <FieldError message={erroImagem} />}

      {precisaOpcoes(pergunta.type) && (
        <OpcoesEditor
          opcoes={pergunta.options ?? []}
          modo={
            pergunta.type === 'MULTIPLE_CHOICE'
              ? 'radio'
              : pergunta.type === 'CHECKBOXES'
                ? 'checkbox'
                : 'lista'
          }
          onChange={(options) => onChange({ options })}
        />
      )}

      {pergunta.type === 'LINEAR_SCALE' && (
        <EscalaLinearEditor pergunta={pergunta} onChange={onChange} />
      )}
    </section>
  );
}

/**
 * Lista de opções de "Escolha" (radio), "Múltipla escolha" (checkbox) e
 * "Lista suspensa". O círculo/quadrado é só ilustrativo: quem edita é o campo
 * de texto ao lado, não o próprio indicador.
 */
function OpcoesEditor({
  opcoes,
  modo,
  onChange,
}: {
  opcoes: string[];
  modo: 'radio' | 'checkbox' | 'lista';
  onChange: (opcoes: string[]) => void;
}) {
  function atualizar(indice: number, valor: string) {
    onChange(opcoes.map((opcao, i) => (i === indice ? valor : opcao)));
  }

  function remover(indice: number) {
    onChange(opcoes.filter((_, i) => i !== indice));
  }

  return (
    <div className="flex flex-col gap-3">
      {opcoes.map((opcao, indice) => (
        <div key={indice} className="flex items-center gap-3">
          {modo === 'radio' && <Radio disabled />}
          {modo === 'checkbox' && <Checkbox disabled />}
          <Input
            className="w-[390px]"
            value={opcao}
            onChange={(event) => atualizar(indice, event.target.value)}
            placeholder="Digite..."
            aria-label={`Opção ${indice + 1}`}
          />
          <button
            type="button"
            onClick={() => remover(indice)}
            aria-label={`Remover opção ${indice + 1}`}
            className="orbit-focus-ring"
          >
            <img src="./icons/figma/question-trash.svg" alt="" className="size-6" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...opcoes, ''])}
        className="flex w-fit items-center gap-1 text-button text-orbit-blue hover:underline"
      >
        Adicionar opção
        <Plus className="size-5" />
      </button>
    </div>
  );
}

/** Faixa de "Escala linear": intervalo numérico + rótulo das duas pontas. */
const ESCALA_MIN_OPCOES = [0, 1];
const ESCALA_MAX_OPCOES = [2, 3, 4, 5, 6, 7, 8, 9, 10];

function EscalaLinearEditor({
  pergunta,
  onChange,
}: {
  pergunta: FormQuestion;
  onChange: (patch: Partial<FormQuestion>) => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <SelectField
          className="w-[100px]"
          aria-label="Valor inicial da escala"
          value={pergunta.scaleMin ?? 1}
          onChange={(event) => onChange({ scaleMin: Number(event.target.value) })}
        >
          {ESCALA_MIN_OPCOES.map((numero) => (
            <option key={numero} value={numero} className="bg-orbit-bg">
              {numero}
            </option>
          ))}
        </SelectField>

        <span className="text-body text-white">a</span>

        <SelectField
          className="w-[100px]"
          aria-label="Valor final da escala"
          value={pergunta.scaleMax ?? 5}
          onChange={(event) => onChange({ scaleMax: Number(event.target.value) })}
        >
          {ESCALA_MAX_OPCOES.map((numero) => (
            <option key={numero} value={numero} className="bg-orbit-bg">
              {numero}
            </option>
          ))}
        </SelectField>
      </div>

      <div className="flex items-center gap-6">
        <Input
          label="Primeiro marcador"
          className="w-[390px]"
          placeholder="Digite..."
          value={pergunta.scaleMinLabel ?? ''}
          onChange={(event) => onChange({ scaleMinLabel: event.target.value })}
        />
        <Input
          label="Último marcador"
          className="w-[390px]"
          placeholder="Digite..."
          value={pergunta.scaleMaxLabel ?? ''}
          onChange={(event) => onChange({ scaleMaxLabel: event.target.value })}
        />
      </div>
    </div>
  );
}

function AcaoPergunta({
  rotulo,
  icone,
  onClick,
  destrutiva,
  tingido,
}: {
  rotulo: string;
  icone: string;
  onClick?: () => void;
  destrutiva?: boolean;
  /**
   * Pinta o ícone com a cor do texto, por máscara. O `pic_2_fill` do arquivo
   * só existe escuro — é o do botão cinza —, e aqui ele acompanha o azul.
   */
  tingido?: boolean;
}) {
  const src = `./icons/figma/${icone}.svg`;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        'flex items-center gap-1 text-button hover:underline disabled:cursor-not-allowed disabled:opacity-40',
        destrutiva ? 'text-orbit-error-l' : 'text-orbit-blue',
      )}
    >
      {rotulo}
      {tingido ? (
        <span
          aria-hidden
          className="size-6 bg-current"
          style={{
            WebkitMaskImage: `url(${src})`,
            maskImage: `url(${src})`,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
          }}
        />
      ) : (
        <img src={src} alt="" className="size-6" />
      )}
    </button>
  );
}
