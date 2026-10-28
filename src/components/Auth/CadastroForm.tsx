import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle } from 'lucide-react';
import { Input, SelectField } from '@/components/UI';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterPayload, UserRole } from '@/types';
import { ARCHETYPES, PLAYER_TYPES } from '@/utils/constants';
import { senhaValida } from '@/utils/helpers';

/** A idade mínima do público dos testes (etapa 4 do Novo teste). */
export const IDADE_MINIMA = 16;

/** Anos completos em `hoje` de quem nasceu em `nascimento` (AAAA-MM-DD). */
export function idadeEm(nascimento: string, hoje = new Date()): number {
  const [ano, mes, dia] = nascimento.split('-').map(Number);
  let idade = hoje.getFullYear() - ano;
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade -= 1;
  return idade;
}

const comuns = {
  name: z.string().trim().min(2, 'Informe o seu nome.').max(120, 'Use até 120 caracteres.'),
  email: z.string().trim().min(1, 'Informe o seu e-mail.').email('Digite um e-mail válido (ex.: nome@estudio.com).'),
  password: z
    .string()
    .refine(senhaValida, 'Use 8 ou mais caracteres com maiúscula, minúscula, número e símbolo.'),
  confirmacao: z.string().min(1, 'Repita a senha.'),
};

const senhasIguais = (valores: { password: string; confirmacao: string }) => valores.password === valores.confirmacao;
const senhasDiferentes = { message: 'As senhas não são iguais.', path: ['confirmacao'] };

/**
 * As regras do cadastro, por perfil. O estúdio informa a organização (CNPJ e
 * site são opcionais); o tester informa o que decide em quais testes ele entra:
 * idade, onde mora, como joga e o estilo de jogo.
 */
export const esquemaDoEstudio = z
  .object({
    ...comuns,
    organization: z.string().trim().min(1, 'Informe o nome do estúdio.').max(120, 'Use até 120 caracteres.'),
    cnpj: z.string().trim().max(20, 'Use até 20 caracteres.').optional(),
    website: z
      .string()
      .trim()
      .optional()
      .refine((valor) => !valor || /^https?:\/\/\S+\.\S+/.test(valor), 'Informe o endereço com https://.'),
  })
  .refine(senhasIguais, senhasDiferentes);

export const esquemaDoTester = z
  .object({
    ...comuns,
    birthDate: z
      .string()
      .min(1, 'Informe a sua data de nascimento.')
      .refine((valor) => idadeEm(valor) >= IDADE_MINIMA, `É preciso ter ${IDADE_MINIMA} anos ou mais para testar.`),
    location: z.enum(['BRASIL', 'EUA'], { errorMap: () => ({ message: 'Escolha onde você mora.' }) }),
    playerType: z.enum(['CASUAL', 'EXPERIENT', 'TRAINED'], { errorMap: () => ({ message: 'Escolha como você joga.' }) }),
    archetype: z.enum(['CONQUEROR', 'EXPLORER', 'SOCIALIZER', 'KILLER'], {
      errorMap: () => ({ message: 'Escolha o seu estilo.' }),
    }),
  })
  .refine(senhasIguais, senhasDiferentes);

type Valores = Partial<z.infer<typeof esquemaDoEstudio> & z.infer<typeof esquemaDoTester>>;

/** Os valores do formulário no formato do `POST /auth/register`. */
export function payloadDoCadastro(role: Extract<UserRole, 'STUDIO' | 'PLAYER'>, valores: Valores): RegisterPayload {
  const base = { role, name: valores.name!.trim(), email: valores.email!.trim(), password: valores.password! };
  if (role === 'STUDIO') {
    return {
      ...base,
      organization: valores.organization!.trim(),
      cnpj: valores.cnpj?.trim() || undefined,
      website: valores.website?.trim() || undefined,
    };
  }
  return {
    ...base,
    birthDate: valores.birthDate,
    location: valores.location,
    playerType: valores.playerType,
    archetype: valores.archetype,
  };
}

/**
 * Formulário de "Criar uma conta grátis" — tela provisória, sem frame no Figma
 * (ver AGENTS.md). Usa as mesmas peças do login; os campos vão em duas colunas
 * e rolam dentro do cartão de 926×619. Criar a conta já entra no app.
 */
export function CadastroForm({ role }: { role: Extract<UserRole, 'STUDIO' | 'PLAYER'> }) {
  const { register: criarConta, isLoading, error, clearError } = useAuth();
  const estudio = role === 'STUDIO';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Valores>({
    resolver: zodResolver(estudio ? esquemaDoEstudio : esquemaDoTester),
    mode: 'onBlur',
  });

  const ocupado = isLoading || isSubmitting;

  const onSubmit = handleSubmit(async (valores) => {
    clearError();
    await criarConta(payloadDoCadastro(role, valores)).catch(() => {
      // O erro fica no store e aparece no bloco abaixo.
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex w-[560px] max-w-full flex-col gap-4" noValidate>
      <h1 className="font-label text-[32px] font-normal text-white">Crie sua conta</h1>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Input label={estudio ? 'Seu nome' : 'Nome'} required autoComplete="name" placeholder="Digite..." error={errors.name?.message} {...register('name')} />
        <Input label="E-mail" required type="email" autoComplete="email" placeholder="Digite..." error={errors.email?.message} {...register('email')} />
        <Input
          label="Senha"
          required
          type="password"
          autoComplete="new-password"
          placeholder="Digite..."
          hint="8+ caracteres, maiúscula, número e símbolo"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          label="Confirme a senha"
          required
          type="password"
          autoComplete="new-password"
          placeholder="Digite..."
          error={errors.confirmacao?.message}
          {...register('confirmacao')}
        />

        {estudio ? (
          <>
            <Input
              label="Nome do estúdio"
              required
              autoComplete="organization"
              placeholder="Digite..."
              className="col-span-2"
              error={errors.organization?.message}
              {...register('organization')}
            />
            <Input label="CNPJ" placeholder="Opcional" error={errors.cnpj?.message} {...register('cnpj')} />
            <Input label="Site" type="url" placeholder="https://" error={errors.website?.message} {...register('website')} />
          </>
        ) : (
          <>
            <Input label="Data de nascimento" required type="date" error={errors.birthDate?.message} {...register('birthDate')} />
            <SelectField label="Onde você mora" required defaultValue="" error={errors.location?.message} {...register('location')}>
              <Opcao valor="" rotulo="Selecione..." />
              <Opcao valor="BRASIL" rotulo="Brasil" />
              <Opcao valor="EUA" rotulo="Estados Unidos" />
            </SelectField>
            <SelectField label="Como você joga" required defaultValue="" error={errors.playerType?.message} {...register('playerType')}>
              <Opcao valor="" rotulo="Selecione..." />
              {PLAYER_TYPES.filter((tipo) => ['CASUAL', 'EXPERIENT', 'TRAINED'].includes(tipo.id)).map((tipo) => (
                <Opcao key={tipo.id} valor={tipo.id} rotulo={tipo.name} />
              ))}
            </SelectField>
            <SelectField label="Seu estilo de jogo" required defaultValue="" error={errors.archetype?.message} {...register('archetype')}>
              <Opcao valor="" rotulo="Selecione..." />
              {ARCHETYPES.filter((arquetipo) => arquetipo.id !== 'ALL').map((arquetipo) => (
                <Opcao key={arquetipo.id} valor={arquetipo.id} rotulo={arquetipo.name} />
              ))}
            </SelectField>
          </>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-orbit-error/40 bg-orbit-error/10 p-3 text-graphic text-orbit-error-l"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={ocupado}
        className="flex h-[58px] w-full shrink-0 items-center justify-center rounded-lg bg-orbit-action font-label text-[24px] font-normal text-white shadow-bevel disabled:opacity-60"
      >
        {ocupado ? 'Criando...' : 'Criar conta!'}
      </button>
    </form>
  );
}

function Opcao({ valor, rotulo }: { valor: string; rotulo: string }) {
  return (
    <option value={valor} className="bg-orbit-bg">
      {rotulo}
    </option>
  );
}
