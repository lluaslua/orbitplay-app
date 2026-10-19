import { useRef, useState } from 'react';
import { Checkbox, FieldError, Input, Radio, SelectField, Textarea } from '@/components/UI';
import type { FormQuestion } from '@/types';
import { alternarOpcao, marcarNaGrade, marcaDaGrade, type Resposta } from '@/utils/avaliacao';
import { reduzirImagem } from '@/utils/imagem';

/**
 * Uma pergunta do formulário do estúdio, no visual da "Avaliação do jogo"
 * (Figma `235:7874`): rótulo em negrito com `*` nas obrigatórias, escalas com o
 * número em cima de cada rádio, opções lado a lado e texto em campo largo.
 * Os tipos sem desenho no arquivo (lista, grades, data, hora, arquivo) usam as
 * mesmas peças do design system.
 */
export function CampoPergunta({
  pergunta,
  valor,
  erro,
  onChange,
}: {
  pergunta: FormQuestion;
  valor: Resposta | undefined;
  erro?: string;
  onChange: (valor: Resposta) => void;
}) {
  const rotulo = `${pergunta.label}${pergunta.required ? '*' : ''}`;

  return (
    <div className="flex flex-col gap-1">
      {pergunta.imageUrl && (
        <img src={pergunta.imageUrl} alt="" className="mb-2 max-h-[280px] w-fit max-w-full rounded-xl object-cover" />
      )}

      {/* Texto e lista já trazem o rótulo dentro do campo, como o Input do design system. */}
      {!['SHORT_TEXT', 'PARAGRAPH', 'DROPDOWN', 'DATE', 'TIME'].includes(pergunta.type) && (
        <span className="text-body-bold text-white">
          {pergunta.label}
          {/* O `*` da obrigatória é vermelho no arquivo ("Avaliação geral*", `235:7874`). */}
          {pergunta.required && <span className="text-orbit-error-l">*</span>}
        </span>
      )}
      {pergunta.helperText && <span className="text-caption text-orbit-muted">{pergunta.helperText}</span>}

      <Controle pergunta={pergunta} rotulo={rotulo} valor={valor} erro={erro} onChange={onChange} />

      {erro && !['SHORT_TEXT', 'PARAGRAPH', 'DROPDOWN', 'DATE', 'TIME'].includes(pergunta.type) && (
        <FieldError message={erro} />
      )}
    </div>
  );
}

function Controle({
  pergunta,
  rotulo,
  valor,
  erro,
  onChange,
}: {
  pergunta: FormQuestion;
  rotulo: string;
  valor: Resposta | undefined;
  erro?: string;
  onChange: (valor: Resposta) => void;
}) {
  const texto = typeof valor === 'string' ? valor : '';
  // Opção repetida marcaria todas as iguais de uma vez: a resposta é guardada pelo texto.
  const opcoes = [...new Set((pergunta.options ?? []).filter((opcao) => opcao.trim()))];

  switch (pergunta.type) {
    case 'SHORT_TEXT':
      return (
        <Input label={rotulo} value={texto} error={erro} onChange={(e) => onChange(e.target.value)} placeholder="Digite..." />
      );

    case 'PARAGRAPH':
      return (
        <Textarea label={rotulo} value={texto} error={erro} onChange={(e) => onChange(e.target.value)} placeholder="Digite..." />
      );

    case 'DATE':
    case 'TIME':
      return (
        <Input
          label={rotulo}
          type={pergunta.type === 'DATE' ? 'date' : 'time'}
          className="w-[280px]"
          value={texto}
          error={erro}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case 'DROPDOWN':
      return (
        <SelectField label={rotulo} className="w-[390px]" value={texto} error={erro} onChange={(e) => onChange(e.target.value)}>
          <option value="" className="bg-orbit-bg">
            Selecione...
          </option>
          {opcoes.map((opcao) => (
            <option key={opcao} value={opcao} className="bg-orbit-bg">
              {opcao}
            </option>
          ))}
        </SelectField>
      );

    // Uma alternativa embaixo da outra, o rádio antes do texto.
    case 'MULTIPLE_CHOICE':
      return (
        <div className="flex flex-col gap-3">
          {opcoes.map((opcao) => (
            <label key={opcao} className="flex cursor-pointer items-center gap-2">
              <Radio name={pergunta.id} checked={valor === opcao} onChange={() => onChange(opcao)} />
              <span className="text-body text-white">{opcao}</span>
            </label>
          ))}
        </div>
      );

    // Uma alternativa embaixo da outra, a caixa antes do texto.
    case 'CHECKBOXES':
      return (
        <div className="flex flex-col gap-3">
          {opcoes.map((opcao) => (
            <label key={opcao} className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={Array.isArray(valor) && valor.includes(opcao)}
                onCheckedChange={() => onChange(alternarOpcao(valor, opcao))}
              />
              <span className="text-body text-white">{opcao}</span>
            </label>
          ))}
        </div>
      );

    case 'LINEAR_SCALE':
    case 'RATING':
      return (
        <Escala
          nome={pergunta.id}
          rotulo={pergunta.label}
          minimo={pergunta.type === 'RATING' ? 1 : (pergunta.scaleMin ?? 1)}
          maximo={pergunta.scaleMax ?? 5}
          inicio={pergunta.scaleMinLabel}
          fim={pergunta.scaleMaxLabel}
          valor={typeof valor === 'number' ? valor : undefined}
          onChange={onChange}
        />
      );

    case 'MULTIPLE_CHOICE_GRID':
    case 'CHECKBOX_GRID':
      return <Grade pergunta={pergunta} valor={valor} onChange={onChange} />;

    case 'FILE_UPLOAD':
      return <EnvioDeImagem valor={texto} onChange={onChange} />;

    default:
      return null;
  }
}

/**
 * Escala numérica, uma nota embaixo da outra, com os rótulos das pontas na
 * primeira e na última. Todas são rádio: é uma nota só.
 */
function Escala({
  nome,
  rotulo,
  minimo,
  maximo,
  inicio,
  fim,
  valor,
  onChange,
}: {
  nome: string;
  rotulo: string;
  minimo: number;
  maximo: number;
  inicio?: string;
  fim?: string;
  valor?: number;
  onChange: (valor: number) => void;
}) {
  const notas = Array.from({ length: Math.max(0, maximo - minimo + 1) }, (_, indice) => minimo + indice);

  return (
    <div className="flex flex-col gap-3">
      {notas.map((nota, indice) => (
        <label key={nota} className="flex cursor-pointer items-center gap-2">
          <Radio name={nome} checked={valor === nota} onChange={() => onChange(nota)} aria-label={`${rotulo}: ${nota}`} />
          <span className="text-body text-white">
            {nota}
            {indice === 0 && inicio ? ` — ${inicio}` : ''}
            {indice === notas.length - 1 && fim ? ` — ${fim}` : ''}
          </span>
        </label>
      ))}
    </div>
  );
}

/** Grade: cada linha escolhe entre as colunas — rádio na de escolha, caixa na de caixas. */
function Grade({
  pergunta,
  valor,
  onChange,
}: {
  pergunta: FormQuestion;
  valor: Resposta | undefined;
  onChange: (valor: Resposta) => void;
}) {
  const unica = pergunta.type === 'MULTIPLE_CHOICE_GRID';
  const linhas = (pergunta.options ?? []).filter((linha) => linha.trim());
  const colunas = (pergunta.columns ?? []).filter((coluna) => coluna.trim());
  const marcadas = Array.isArray(valor) ? valor : [];

  return (
    <table className="w-fit border-separate border-spacing-x-6 border-spacing-y-2">
      <thead>
        <tr>
          <th />
          {colunas.map((coluna) => (
            <th key={coluna} className="text-center text-caption font-normal text-white">
              {coluna}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {linhas.map((linha) => (
          <tr key={linha}>
            <th scope="row" className="whitespace-nowrap text-left text-body font-normal text-white">
              {linha}
            </th>
            {colunas.map((coluna) => {
              const marcada = marcadas.includes(marcaDaGrade(linha, coluna));
              const mudar = () => onChange(marcarNaGrade(valor, linha, coluna, unica));
              return (
                <td key={coluna} className="text-center">
                  {unica ? (
                    <Radio name={`${pergunta.id}-${linha}`} checked={marcada} onChange={mudar} aria-label={`${linha}: ${coluna}`} />
                  ) : (
                    <Checkbox checked={marcada} onCheckedChange={mudar} aria-label={`${linha}: ${coluna}`} />
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** "Envio de arquivo": uma imagem, reduzida antes de ir (a API grava e guarda o link). */
function EnvioDeImagem({ valor, onChange }: { valor: string; onChange: (valor: string) => void }) {
  const seletor = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function receber(arquivo: File | undefined) {
    if (!arquivo) return;
    try {
      setErro(null);
      onChange(await reduzirImagem(arquivo, 1280));
    } catch (motivo) {
      setErro((motivo as Error).message);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {valor && <img src={valor} alt="Imagem enviada" className="max-h-[220px] rounded-xl object-cover" />}
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => seletor.current?.click()}
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
        >
          <img src="./icons/figma/question-image.svg" alt="" className="size-6" />
          {valor ? 'Trocar imagem' : 'Escolher imagem'}
        </button>
        {valor && (
          <button type="button" onClick={() => onChange('')} className="text-button text-orbit-error-l hover:underline">
            Remover
          </button>
        )}
      </div>
      {erro && <FieldError message={erro} />}
      <input
        ref={seletor}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(evento) => {
          void receber(evento.target.files?.[0]);
          evento.target.value = '';
        }}
      />
    </div>
  );
}
