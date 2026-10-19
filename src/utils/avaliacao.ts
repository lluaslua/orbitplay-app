import type { FormQuestion, SessionEventInput } from '@/types';

/**
 * Regras da avaliação que o tester responde (TELA 18): o formulário é o que o
 * estúdio montou na etapa 2 do Novo teste, e a resposta de cada pergunta vai
 * para a API no formato do tipo dela.
 *
 *   texto, data, hora, lista, escolha   string
 *   escala linear, nota                 number
 *   caixas de seleção, grades           string[]  (grade: "Linha: Coluna")
 *   envio de arquivo                    data URL da imagem
 */
export type Resposta = string | number | string[];
export type Respostas = Record<string, Resposta | undefined>;

export const GRADES: FormQuestion['type'][] = ['MULTIPLE_CHOICE_GRID', 'CHECKBOX_GRID'];

export function respostaVazia(valor: Resposta | undefined): boolean {
  if (valor === undefined || valor === null) return true;
  if (typeof valor === 'string') return !valor.trim();
  if (Array.isArray(valor)) return valor.length === 0;
  return Number.isNaN(valor);
}

/** A marca de uma célula da grade, como a API guarda e o relatório conta. */
export function marcaDaGrade(linha: string, coluna: string): string {
  return `${linha}: ${coluna}`;
}

/**
 * Marca uma célula da grade. Na grade de escolha cada linha tem uma resposta só
 * (marcar outra coluna troca); na de caixas, marcar de novo desmarca.
 */
export function marcarNaGrade(
  atual: Resposta | undefined,
  linha: string,
  coluna: string,
  unica: boolean,
): string[] {
  const lista = Array.isArray(atual) ? atual : [];
  const marca = marcaDaGrade(linha, coluna);
  if (unica) return [...lista.filter((item) => !item.startsWith(`${linha}: `)), marca];
  return lista.includes(marca) ? lista.filter((item) => item !== marca) : [...lista, marca];
}

/** Marca ou desmarca uma opção das caixas de seleção. */
export function alternarOpcao(atual: Resposta | undefined, opcao: string): string[] {
  const lista = Array.isArray(atual) ? atual : [];
  return lista.includes(opcao) ? lista.filter((item) => item !== opcao) : [...lista, opcao];
}

/**
 * Erros por pergunta antes do envio — a mesma regra da API, para o tester ver
 * o campo destacado sem ida e volta. Obrigatória em branco recusa; na grade
 * obrigatória, toda linha precisa de resposta.
 */
export function validarRespostas(perguntas: FormQuestion[], respostas: Respostas): Record<string, string> {
  const erros: Record<string, string> = {};

  for (const pergunta of perguntas) {
    if (!pergunta.required) continue;
    const valor = respostas[pergunta.id];

    if (respostaVazia(valor)) {
      erros[pergunta.id] = 'Resposta obrigatória.';
      continue;
    }

    if (GRADES.includes(pergunta.type)) {
      const marcadas = Array.isArray(valor) ? valor : [];
      const faltando = (pergunta.options ?? []).filter(
        (linha) => !marcadas.some((marca) => marca.startsWith(`${linha}: `)),
      );
      if (faltando.length) erros[pergunta.id] = `Responda todas as linhas (falta: ${faltando.join(', ')}).`;
    }
  }

  return erros;
}

/** As respostas que vão no envio: só as das perguntas do teste, sem as em branco. */
export function montarEnvio(perguntas: FormQuestion[], respostas: Respostas): Record<string, Resposta> {
  const envio: Record<string, Resposta> = {};
  for (const pergunta of perguntas) {
    const valor = respostas[pergunta.id];
    if (!respostaVazia(valor)) envio[pergunta.id] = typeof valor === 'string' ? valor.trim() : valor!;
  }
  return envio;
}

/**
 * O bloco fixo "Você encontrou algum problema?" vira os bugs reportados: um
 * evento BUG por problema marcado, com a explicação junto, no fim da sessão.
 */
export function eventosDosProblemas(problemas: string[], explicacao: string, atSecond: number): SessionEventInput[] {
  const detalhe = explicacao.trim() || undefined;
  return problemas.map((problema) => ({ atSecond, type: 'BUG', label: problema, detail: detalhe }));
}
