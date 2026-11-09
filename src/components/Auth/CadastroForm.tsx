import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarDays, Globe, User } from 'lucide-react';
import { AvisoConta, Caixa, CampoConta, CLASSE_INPUT, IconeCampo } from '@/components/Auth/MolduraConta';
import { Checkbox, Radio } from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterPayload, TestLocation, UserRole } from '@/types';
import { cn, senhaValida } from '@/utils/helpers';

/** A idade mínima do público dos testes (etapa 4 do Novo teste). */
export const IDADE_MINIMA = 16;

/** Anos completos em `hoje` de quem nasceu em `nascimento` (AAAA-MM-DD). */
export function idadeEm(nascimento: string, hoje = new Date()): number {
  const [ano, mes, dia] = nascimento.split('-').map(Number);
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade -= 1;
  return idade;
}

/** "País / região": os países em que o público dos testes pode morar. */
export const PAISES: { id: Exclude<TestLocation, 'GLOBAL'>; rotulo: string }[] = [
  { id: 'BRASIL', rotulo: 'Brasil' },
  { id: 'EUA', rotulo: 'Estados Unidos' },
];

/**
 * As regras do "Criar conta". Estúdio e jogador preenchem os mesmos campos
 * (Figma: os dois cartões "Criar conta"); o que muda é o rótulo. Os Termos de
 * Uso são obrigatórios, as novidades são opcionais e começam desmarcadas.
 */
export const esquemaDoCadastro = z
  .object({
    role: z.enum(['STUDIO', 'PLAYER']),
    name: z.string().trim().min(2, 'Informe o nome.').max(120, 'Use até 120 caracteres.'),
    email: z.string().trim().min(1, 'Informe o seu e-mail.').email('Digite um e-mail válido (ex.: nome@estudio.com).'),
    birthDate: z
      .string()
      .min(1, 'Informe a sua data de nascimento.')
      .refine((valor) => idadeEm(valor) >= IDADE_MINIMA, `É preciso ter ${IDADE_MINIMA} anos ou mais.`),
    location: z.enum(['BRASIL', 'EUA'], { errorMap: () => ({ message: 'Escolha o país.' }) }),
    password: z
      .string()
      .refine(senhaValida, 'Use 8 ou mais caracteres com maiúscula, minúscula, número e símbolo.'),
    confirmacao: z.string().min(1, 'Repita a senha.'),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: 'Aceite os Termos de Uso e a Política de Privacidade.' }),
    }),
    marketingOptIn: z.boolean(),
  })
  .refine((valores) => valores.password === valores.confirmacao, {
    message: 'As senhas não são iguais.',
    path: ['confirmacao'],
  });

export type ValoresCadastro = z.infer<typeof esquemaDoCadastro>;

/**
 * Os valores no formato do `POST /auth/register`. O cartão do estúdio pede só
 * o "Nome do estúdio": ele vira a organização e também o nome da conta, que a
 * pessoa troca depois em Minha conta ("Nome ou apelido").
 */
export function payloadDoCadastro(valores: ValoresCadastro): RegisterPayload {
  const nome = valores.name.trim();
  return {
    role: valores.role,
    name: nome,
    email: valores.email.trim(),
    password: valores.password,
    birthDate: valores.birthDate,
    location: valores.location,
    acceptTerms: valores.acceptTerms,
    marketingOptIn: valores.marketingOptIn,
    ...(valores.role === 'STUDIO' ? { organization: nome } : {}),
  };
}

export const ID_FORM_CADASTRO = 'form-cadastro';

/**
 * Formulário do "Criar conta" — Figma: cartões do estúdio e do jogador. O botão
 * "Criar conta" fica no rodapé do cartão (fora deste `<form>`) e o liga pelo
 * atributo `form`.
 */
export function CadastroForm({ roleInicial }: { roleInicial: Extract<UserRole, 'STUDIO' | 'PLAYER'> }) {
  const { register: criarConta, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<ValoresCadastro>({
    resolver: zodResolver(esquemaDoCadastro),
    mode: 'onBlur',
    defaultValues: {
      role: roleInicial,
      name: '',
      email: '',
      birthDate: '',
      password: '',
      confirmacao: '',
      marketingOptIn: false,
    } as Partial<ValoresCadastro>,
  });

  const role = watch('role');
  const estudio = role === 'STUDIO';

  const onSubmit = handleSubmit(async (valores) => {
    clearError();
    await criarConta(payloadDoCadastro(valores)).catch(() => {
      // O erro fica no store e aparece no aviso abaixo.
    });
  });

  return (
    <form
      id={ID_FORM_CADASTRO}
      onSubmit={onSubmit}
      noValidate
      className="-mr-2 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-2"
    >
      <fieldset className="flex items-center gap-4">
        <legend className="sr-only">Tipo de conta</legend>
        {(['STUDIO', 'PLAYER'] as const).map((opcao) => (
          <label key={opcao} className="flex cursor-pointer items-center gap-2 text-graphic text-white">
            <Radio value={opcao} checked={role === opcao} {...register('role', { onChange: clearError })} />
            {opcao === 'STUDIO' ? 'Estúdio' : 'Jogador'}
          </label>
        ))}
      </fieldset>

      <div className="grid grid-cols-2 gap-x-3 gap-y-4">
        <CampoConta
          id="cadastro-nome"
          rotulo={estudio ? 'Nome do estúdio' : 'Nome ou apelido'}
          obrigatorio
          erro={errors.name?.message}
        >
          <Caixa erro={!!errors.name} icone={<User className="size-5 text-white" />}>
            <input
              id="cadastro-nome"
              autoComplete={estudio ? 'organization' : 'nickname'}
              placeholder="Digite..."
              className={CLASSE_INPUT}
              {...register('name')}
            />
          </Caixa>
        </CampoConta>

        <CampoConta
          id="cadastro-email"
          rotulo={estudio ? 'E-mail profissional' : 'E-mail'}
          obrigatorio
          erro={errors.email?.message}
        >
          <Caixa erro={!!errors.email} icone={<IconeCampo nome="login-mail" />}>
            <input
              id="cadastro-email"
              type="email"
              autoComplete="email"
              placeholder="Digite..."
              className={CLASSE_INPUT}
              {...register('email')}
            />
          </Caixa>
        </CampoConta>

        <CampoConta id="cadastro-nascimento" rotulo="Data de nascimento" obrigatorio erro={errors.birthDate?.message}>
          <Caixa erro={!!errors.birthDate} icone={<CalendarDays className="size-5 text-white" />}>
            <input
              id="cadastro-nascimento"
              type="date"
              autoComplete="bday"
              className={cn(CLASSE_INPUT, '[color-scheme:dark]')}
              {...register('birthDate')}
            />
          </Caixa>
        </CampoConta>

        <CampoConta id="cadastro-pais" rotulo="País / região" obrigatorio erro={errors.location?.message}>
          <Caixa erro={!!errors.location} icone={<Globe className="size-5 text-white" />} seta>
            <select
              id="cadastro-pais"
              defaultValue=""
              autoComplete="country"
              className={cn(CLASSE_INPUT, 'appearance-none pr-6')}
              {...register('location')}
            >
              <option value="" disabled className="bg-orbit-bg">
                Selecione
              </option>
              {PAISES.map((pais) => (
                <option key={pais.id} value={pais.id} className="bg-orbit-bg">
                  {pais.rotulo}
                </option>
              ))}
            </select>
          </Caixa>
        </CampoConta>

        <CampoConta id="cadastro-senha" rotulo="Senha" obrigatorio erro={errors.password?.message}>
          <Caixa erro={!!errors.password} icone={<IconeCampo nome="login-key" />}>
            <input
              id="cadastro-senha"
              type="password"
              autoComplete="new-password"
              placeholder="Digite..."
              className={CLASSE_INPUT}
              {...register('password')}
            />
          </Caixa>
        </CampoConta>

        <CampoConta id="cadastro-confirmacao" rotulo="Confirmar senha" obrigatorio erro={errors.confirmacao?.message}>
          <Caixa erro={!!errors.confirmacao} icone={<IconeCampo nome="login-key" />}>
            <input
              id="cadastro-confirmacao"
              type="password"
              autoComplete="new-password"
              placeholder="Digite..."
              className={CLASSE_INPUT}
              {...register('confirmacao')}
            />
          </Caixa>
        </CampoConta>
      </div>

      <div className="flex flex-col gap-3">
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-caption text-white">
              <Checkbox
                checked={field.value === true}
                onCheckedChange={(marcado) => field.onChange(marcado === true)}
                onBlur={field.onBlur}
                aria-invalid={!!errors.acceptTerms}
              />
              {/* "Termos de Uso" e "Política de Privacidade" não têm frame: o link fica inerte de propósito. */}
              <span>
                Li e aceito os <span className="text-orbit-blue underline">Termos de Uso</span> e a{' '}
                <span className="text-orbit-blue underline">Política de Privacidade</span>.
              </span>
            </label>
          )}
        />
        {errors.acceptTerms && (
          <p className="-mt-2 px-1 text-caption text-orbit-error-l">{errors.acceptTerms.message}</p>
        )}

        <Controller
          control={control}
          name="marketingOptIn"
          render={({ field }) => (
            <label className="flex cursor-pointer items-center gap-2 text-caption text-white">
              <Checkbox checked={field.value} onCheckedChange={(marcado) => field.onChange(marcado === true)} />
              Quero receber novidades, conteúdos e atualizações da OrbitPlay.
            </label>
          )}
        />
      </div>

      {error && <AvisoConta tom="erro">{error}</AvisoConta>}
    </form>
  );
}

