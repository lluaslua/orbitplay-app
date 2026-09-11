import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { FormQuestion, PlaytestAudience, PlaytestBudget, TestDraft, TestModel } from '@/types';
import { STORAGE_KEYS } from '@/utils/constants';
import { uid } from '@/utils/helpers';

/** Estado inicial da etapa 4 — os mesmos valores que o Figma mostra pré-selecionados. */
const emptyAudience: PlaytestAudience = {
  locations: ['BRASIL'],
  playerType: 'CASUAL',
  archetype: 'ALL',
  minAge: 20,
  maxAge: 78,
};

const emptyBudget: PlaytestBudget = {
  slots: 750,
  untilDisabled: false,
  basePriceCents: 0,
  audienceCents: 0,
  boostCents: 0,
  pricePerTestCents: 0,
  totalCents: 0,
  rewardPerSessionCents: 250,
  durationDays: 14,
};

const emptyDraft: TestDraft = {
  gameId: null,
  model: null,
  title: '',
  instructions: '',
  questions: [],
  requiresRecording: true,
  requiresMicrophone: false,
  requiresWebcam: false,
  buildFileName: null,
  buildSizeMb: null,
  buildVersion: '',
  audience: emptyAudience,
  budget: emptyBudget,
};

/**
 * Fecha a conta da compra: `(base + perfil + impulso) × quantidade`.
 *
 * É a fórmula do "Resumo da compra" — 0,69 + 0,10 + 0,15 = 0,94 por teste, que
 * em 750 testes dá os R$ 705,00 que o Figma mostra.
 */
export function calculateBudget(budget: PlaytestBudget): PlaytestBudget {
  const pricePerTestCents = budget.basePriceCents + budget.audienceCents + budget.boostCents;

  return {
    ...budget,
    pricePerTestCents,
    totalCents: budget.untilDisabled ? 0 : pricePerTestCents * budget.slots,
  };
}

interface TestState {
  draft: TestDraft;
  currentStep: number;
  /** Etapas ja visitadas - o stepper so deixa voltar para o que existe. */
  maxStepReached: number;
  uploadProgress: number;
  uploadState: 'idle' | 'uploading' | 'validating' | 'done' | 'error';

  setStep: (step: number) => void;
  nextStep: () => void;
  previousStep: () => void;

  setGame: (gameId: string) => void;
  setModel: (model: TestModel) => void;
  setDetails: (patch: Partial<Pick<TestDraft, 'title' | 'instructions'>>) => void;
  setRecordingOptions: (
    patch: Partial<Pick<TestDraft, 'requiresRecording' | 'requiresMicrophone' | 'requiresWebcam'>>,
  ) => void;

  addQuestion: (question?: Partial<FormQuestion>) => void;
  updateQuestion: (id: string, patch: Partial<FormQuestion>) => void;
  removeQuestion: (id: string) => void;
  moveQuestion: (id: string, direction: -1 | 1) => void;

  setBuild: (file: { name: string; sizeMb: number; version?: string } | null) => void;
  setUploadProgress: (progress: number) => void;
  setUploadState: (state: TestState['uploadState']) => void;

  setAudience: (patch: Partial<PlaytestAudience>) => void;
  setBudget: (patch: Partial<PlaytestBudget>) => void;

  isStepValid: (step: number) => boolean;
  reset: () => void;
}

export const useTestStore = create<TestState>()(
  persist(
    (set, get) => ({
      draft: emptyDraft,
      currentStep: 1,
      maxStepReached: 1,
      uploadProgress: 0,
      uploadState: 'idle',

      setStep: (step) =>
        set((state) => ({
          currentStep: Math.min(Math.max(step, 1), 5),
          maxStepReached: Math.max(state.maxStepReached, Math.min(step, 5)),
        })),

      nextStep: () =>
        set((state) => {
          const next = Math.min(state.currentStep + 1, 5);
          return { currentStep: next, maxStepReached: Math.max(state.maxStepReached, next) };
        }),

      previousStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      setGame: (gameId) => set((state) => ({ draft: { ...state.draft, gameId } })),

      setModel: (model) => set((state) => ({ draft: { ...state.draft, model } })),

      setDetails: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

      setRecordingOptions: (patch) => set((state) => ({ draft: { ...state.draft, ...patch } })),

      addQuestion: (question) =>
        set((state) => ({
          draft: {
            ...state.draft,
            questions: [
              ...state.draft.questions,
              {
                id: uid('q'),
                // Padrão do seletor no Figma: a pergunta nova nasce como "Resposta curta".
                type: 'SHORT_TEXT',
                label: '',
                required: true,
                scaleMin: 1,
                scaleMax: 5,
                options: [],
                ...question,
              } satisfies FormQuestion,
            ],
          },
        })),

      updateQuestion: (id, patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            questions: state.draft.questions.map((question) =>
              question.id === id ? { ...question, ...patch } : question,
            ),
          },
        })),

      removeQuestion: (id) =>
        set((state) => ({
          draft: {
            ...state.draft,
            questions: state.draft.questions.filter((question) => question.id !== id),
          },
        })),

      moveQuestion: (id, direction) =>
        set((state) => {
          const questions = [...state.draft.questions];
          const index = questions.findIndex((question) => question.id === id);
          const target = index + direction;
          if (index === -1 || target < 0 || target >= questions.length) return state;
          [questions[index], questions[target]] = [questions[target], questions[index]];
          return { draft: { ...state.draft, questions } };
        }),

      setBuild: (file) =>
        set((state) => ({
          draft: {
            ...state.draft,
            buildFileName: file?.name ?? null,
            buildSizeMb: file?.sizeMb ?? null,
            buildVersion: file?.version ?? state.draft.buildVersion,
          },
        })),

      setUploadProgress: (uploadProgress) => set({ uploadProgress }),
      setUploadState: (uploadState) => set({ uploadState }),

      setAudience: (patch) =>
        set((state) => ({
          draft: { ...state.draft, audience: { ...state.draft.audience, ...patch } },
        })),

      setBudget: (patch) =>
        set((state) => ({
          draft: {
            ...state.draft,
            budget: calculateBudget({ ...state.draft.budget, ...patch }),
          },
        })),

      isStepValid: (step) => {
        const { draft } = get();
        switch (step) {
          // O jogo vem da tela de onde o fluxo parte, não de um seletor: a
          // etapa 1 do Figma só escolhe o modelo.
          case 1:
            return !!draft.model;
          // A etapa 2 desenha só as perguntas — título e instruções não estão lá.
          case 2:
            return (
              draft.questions.length > 0 &&
              draft.questions.every((question) => question.label.trim().length >= 5)
            );
          case 3:
            return !!draft.buildFileName;
          case 4:
            return (
              (draft.budget.untilDisabled || draft.budget.slots > 0) &&
              draft.audience.locations.length > 0
            );
          case 5:
            return true;
          default:
            return false;
        }
      },

      reset: () =>
        set({
          draft: { ...emptyDraft, budget: calculateBudget(emptyBudget) },
          currentStep: 1,
          maxStepReached: 1,
          uploadProgress: 0,
          uploadState: 'idle',
        }),
    }),
    {
      name: STORAGE_KEYS.testDraft,
      storage: createJSONStorage(() => localStorage),
      // O progresso do upload nao sobrevive ao reload: a build precisa ser reenviada.
      partialize: (state) => ({
        draft: state.draft,
        currentStep: state.currentStep,
        maxStepReached: state.maxStepReached,
      }),
    },
  ),
);
