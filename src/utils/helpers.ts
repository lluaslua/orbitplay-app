import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * A escala tipográfica do design system, declarada para o `tailwind-merge`.
 *
 * Sem isto ele não sabe que `text-button` é **tamanho** e trata a classe como se
 * fosse **cor** — no mesmo grupo de `text-orbit-dark`. Quando as duas apareciam
 * juntas, uma era descartada em silêncio: foi assim que o `⋮` das tabelas
 * perdeu o `text-orbit-dark` e passou a herdar branco sobre o chip claro.
 *
 * A lista espelha as chaves de `fontSize` em `tailwind.config.js`. Ao criar um
 * tamanho novo lá, acrescente aqui também.
 */
const TAMANHOS_DE_TEXTO = [
  'display-lg',
  'display-md',
  'headline',
  'headline-mobile',
  'subtitle',
  'body',
  'body-bold',
  'button',
  'graphic',
  'caption',
  'caption-bold',
  'label-xs',
  'label-m',
  'title-s',
  'title-5',
  'h1',
  'h2',
  'h3',
  'h4',
  'small',
];

const mesclar = extendTailwindMerge({
  extend: { classGroups: { 'font-size': [{ text: TAMANHOS_DE_TEXTO }] } },
});

/** Merge de classes Tailwind (padrao shadcn/ui), ciente dos tokens do projeto. */
export function cn(...inputs: ClassValue[]) {
  return mesclar(clsx(inputs));
}

/** Valores monetarios circulam em centavos para evitar erro de ponto flutuante. */
export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(cents / 100);
}

export function formatCompactCurrency(cents: number): string {
  const value = cents / 100;
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1).replace('.', ',')}k`;
  }
  return formatCurrency(cents);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Valor sem o símbolo: "1.575,00".
 *
 * O card de jogo compõe o preço com dois tamanhos — "R$" em 12 e o número em 24
 * —, então precisa das duas partes separadas, coisa que `formatCurrency` não dá.
 */
export function formatAmount(cents: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** "27h 32m" — contagem até `iso`. Devolve `null` se a data já passou. */
export function formatCountdown(iso: string): string | null {
  const minutosTotais = Math.floor((new Date(iso).getTime() - Date.now()) / 60000);
  if (minutosTotais <= 0) return null;

  const horas = Math.floor(minutosTotais / 60);
  const minutos = minutosTotais % 60;
  return `${horas}h ${String(minutos).padStart(2, '0')}m`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(iso));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/** "há 3 dias" / "em 12 dias" - usado nos prazos de teste. */
export function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const diffDays = Math.round(diffMs / 86_400_000);
  const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });
  if (Math.abs(diffDays) >= 1) return rtf.format(diffDays, 'day');
  const diffHours = Math.round(diffMs / 3_600_000);
  if (Math.abs(diffHours) >= 1) return rtf.format(diffHours, 'hour');
  return rtf.format(Math.round(diffMs / 60_000), 'minute');
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/** 1387 -> "23:07" (usado no timer de gameplay e na duracao das sessoes). */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

export function formatFileSize(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function percent(value: number, total: number): number {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let idCounter = 0;
/** Ids estaveis para itens criados no cliente (perguntas, jogos, testes). */
export function uid(prefix = 'id'): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter.toString(36)}`;
}

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Busca sem acento/caixa - usada em todos os filtros de tabela e catalogo. */
export function matchesSearch(haystack: string, needle: string): boolean {
  if (!needle.trim()) return true;
  const normalize = (v: string) =>
    v.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalize(haystack).includes(normalize(needle));
}

export function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function isElectron(): boolean {
  return typeof window !== 'undefined' && window.orbit?.isElectron === true;
}

/**
 * Regras de senha do modal "Redefinir senha de usuário": número, símbolo,
 * minúscula, maiúscula, mínimo de 8 caracteres e só o alfabeto latino (sem acento).
 */
export function senhaValida(senha: string): boolean {
  return (
    senha.length >= 8 &&
    /\d/.test(senha) &&
    /[^A-Za-z0-9]/.test(senha) &&
    /[a-z]/.test(senha) &&
    /[A-Z]/.test(senha) &&
    /^[\x20-\x7E]*$/.test(senha)
  );
}
