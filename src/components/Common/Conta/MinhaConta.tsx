import { useState } from 'react';
import { Controller, useForm, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AvisoConta, CampoConta } from '@/components/Auth/MolduraConta';
import { idadeEm, IDADE_MINIMA, PAISES } from '@/components/Auth/CadastroForm';
import { FotoPerfil } from '@/components/Common/Conta/FotoPerfil';
import { ModalAlterarSenha } from '@/components/Common/Conta/ModalAlterarSenha';
import { PageHeading } from '@/components/Common/PageHeading';
import { Input, SelectField, Switch } from '@/components/UI';
import { useEnviarFoto, useSalvarConta } from '@/hooks/useConta';
import { useAuthStore } from '@/stores/authStore';
import type { AuthUser, UpdateMePayload } from '@/types';
import { ROUTES } from '@/utils/constants';

export const esquemaMinhaConta = z.object({
  name: z.string().trim().min(2, 'Informe o nome ou apelido.').max(120, 'Use até 120 caracteres.'),
  birthDate: z
    .string()
    .refine((valor) => !valor || idadeEm(valor) >= IDADE_MINIMA, `É preciso ter ${IDADE_MINIMA} anos ou mais.`),
  location: z.union([z.enum(['BRASIL', 'EUA']), z.literal('')]),
  organization: z.string().trim().max(120, 'Use até 120 caracteres.'),
  jobTitle: z.string().trim().max(80, 'Use até 80 caracteres.'),
  website: z
    .string()
    .trim()
    .refine((valor) => !valor || /^https?:\/\/\S+\.\S+/.test(valor), 'Informe o endereço com https://.'),
  emailNotifications: z.boolean(),
  mfaEnabled: z.boolean(),
});

export type ValoresMinhaConta = z.infer<typeof esquemaMinhaConta>;

/** O que a conta já tem, no formato do formulário. */
export function valoresDaConta(conta: AuthUser): ValoresMinhaConta {
  const estudio = conta.role === 'STUDIO' ? conta.studio : null;
  const pessoa = estudio ?? (conta.role === 'PLAYER' ? conta.player : null);
  const local = pessoa?.location === 'BRASIL' || pessoa?.location === 'EUA' ? pessoa.location : '';
  return {
    name: conta.name,
    birthDate: pessoa?.birthDate ?? '',
    location: local,
    organization: estudio?.organization ?? '',
    jobTitle: estudio?.jobTitle ?? '',
    website: estudio?.website ?? '',
    emailNotifications: conta.emailNotifications ?? true,
    mfaEnabled: conta.mfaEnabled ?? false,
  };
}

/**
 * O que vai no `PATCH /me`. O jogador não manda os campos do estúdio; quem não
 * gerencia o estúdio não manda nome nem site (a API recusaria). Data e país
 * vazios ficam de fora — a API não apaga o que já está guardado.
 */
export function payloadDaConta(conta: AuthUser, valores: ValoresMinhaConta): UpdateMePayload {
  const payload: UpdateMePayload = {
    name: valores.name.trim(),
    emailNotifications: valores.emailNotifications,
    mfaEnabled: valores.mfaEnabled,
    ...(valores.birthDate ? { birthDate: valores.birthDate } : {}),
    ...(valores.location ? { location: valores.location } : {}),
  };
  if (conta.role !== 'STUDIO') return payload;

  payload.jobTitle = valores.jobTitle.trim();
  if (conta.studio.permission === 'MANAGE') {
    payload.organization = valores.organization.trim();
    payload.website = valores.website.trim();
  }
  return payload;
}

/**
 * "Minha conta" — Figma: frames do estúdio e do jogador ("Meu perfil"). Os
 * dois têm a foto, nome ou apelido, e-mail, nascimento, país e os dois
 * interruptores; o estúdio ainda tem nome do estúdio, cargo e site.
 *
 * O e-mail é só leitura: trocar exigiria confirmar o endereço novo, que ainda
 * não existe. Nome e site do estúdio só se editam com permissão MANAGE.
 */
export function MinhaConta({ conta }: { conta: AuthUser }) {
  const salvar = useSalvarConta();
  const enviarFoto = useEnviarFoto();
  const [foto, setFoto] = useState<File | null>(null);
  const [senhaAberta, setSenhaAberta] = useState(false);
  const [aviso, setAviso] = useState<{ tom: 'ok' | 'erro'; texto: string } | null>(null);

  const estudio = conta.role === 'STUDIO' ? conta.studio : null;
  const gerencia = estudio?.permission === 'MANAGE';

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ValoresMinhaConta>({
    resolver: zodResolver(esquemaMinhaConta),
    mode: 'onBlur',
    defaultValues: valoresDaConta(conta),
  });

  const onSubmit = handleSubmit(async (valores) => {
    setAviso(null);
    try {
      if (estudio && gerencia && !valores.organization.trim()) {
        setAviso({ tom: 'erro', texto: 'Informe o nome do estúdio.' });
        return;
      }
      let atualizada = await salvar.mutateAsync(payloadDaConta(conta, valores));
      if (foto) {
        atualizada = await enviarFoto.mutateAsync(foto);
        setFoto(null);
      }
      reset(valoresDaConta(atualizada));
      setAviso({ tom: 'ok', texto: 'Alterações salvas.' });
    } catch (erro) {
      setAviso({ tom: 'erro', texto: (erro as { message?: string }).message ?? 'Não foi possível salvar.' });
    }
  });

  const home = conta.role === 'STUDIO' ? ROUTES.studio.home : ROUTES.player.home;
  const nada = !isDirty && !foto;

  return (
    <div className="flex flex-col gap-6">
      <PageHeading trilha={[{ label: 'Home', to: home }, { label: 'Minha conta' }]} titulo="Minha conta" linha="azul" />

      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6 rounded-3xl border border-orbit-border/40 bg-orbit-card p-6">
        <header className="flex flex-col gap-1 border-b border-orbit-border/60 pb-4">
          <h2 className="text-h2 text-white">Meu perfil</h2>
          <p className="text-caption text-white">Atualize suas informações e preferências de jogo.</p>
        </header>

        <FotoPerfil nome={conta.name} fotoAtual={conta.avatarUrl} arquivo={foto} onArquivo={setFoto} />

        <div className="grid grid-cols-2 gap-x-4 gap-y-4 figma:grid-cols-4">
          <CampoConta id="conta-nome" rotulo="Nome ou apelido" erro={errors.name?.message}>
            <Input id="conta-nome" autoComplete="nickname" placeholder="Digite..." error={errors.name ? ' ' : undefined} {...register('name')} />
          </CampoConta>

          <CampoConta id="conta-email" rotulo="E-mail">
            <Input id="conta-email" type="email" value={conta.email} readOnly aria-readonly title="O e-mail da conta não se altera por aqui." />
          </CampoConta>

          <CampoConta id="conta-nascimento" rotulo="Data de nascimento" erro={errors.birthDate?.message}>
            <Input id="conta-nascimento" type="date" autoComplete="bday" className="[&_input]:[color-scheme:dark]" error={errors.birthDate ? ' ' : undefined} {...register('birthDate')} />
          </CampoConta>

          <CampoConta id="conta-pais" rotulo="País / região" erro={errors.location?.message}>
            <SelectField id="conta-pais" autoComplete="country" {...register('location')}>
              <option value="" disabled className="bg-orbit-bg">
                Selecione
              </option>
              {PAISES.map((pais) => (
                <option key={pais.id} value={pais.id} className="bg-orbit-bg">
                  {pais.rotulo}
                </option>
              ))}
            </SelectField>
          </CampoConta>

          {estudio && (
            <>
              <CampoConta id="conta-estudio" rotulo="Nome do Estúdio" erro={errors.organization?.message}>
                <Input
                  id="conta-estudio"
                  autoComplete="organization"
                  placeholder="Digite..."
                  disabled={!gerencia}
                  title={gerencia ? undefined : 'Só quem gerencia o estúdio muda o nome.'}
                  {...register('organization')}
                />
              </CampoConta>

              <CampoConta id="conta-cargo" rotulo="Cargo / função" erro={errors.jobTitle?.message}>
                <Input id="conta-cargo" autoComplete="organization-title" placeholder="Digite..." {...register('jobTitle')} />
              </CampoConta>

              <CampoConta id="conta-site" rotulo="Site" erro={errors.website?.message}>
                <Input
                  id="conta-site"
                  type="url"
                  placeholder="Digite..."
                  disabled={!gerencia}
                  title={gerencia ? undefined : 'Só quem gerencia o estúdio muda o site.'}
                  error={errors.website ? ' ' : undefined}
                  {...register('website')}
                />
              </CampoConta>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Interruptor control={control} nome="emailNotifications" rotulo="Notificações via E-mail." />
          <Interruptor control={control} nome="mfaEnabled" rotulo="MFA por E-mail." />
        </div>

        {aviso && <AvisoConta tom={aviso.tom}>{aviso.texto}</AvisoConta>}

        <footer className="flex items-center justify-end gap-6">
          <button
            type="button"
            onClick={() => setSenhaAberta(true)}
            className="flex items-center gap-1 text-caption-bold text-orbit-blue hover:underline"
          >
            Alterar senha
            <img src="./icons/figma/login-key.svg" alt="" className="size-4" />
          </button>
          <button
            type="submit"
            disabled={isSubmitting || nada}
            className="flex h-10 items-center rounded-lg bg-orbit-action-wide px-8 text-caption-bold text-white shadow-bevel transition-opacity disabled:opacity-60"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </footer>
      </form>

      <ModalAlterarSenha
        aberto={senhaAberta}
        onAbertoChange={setSenhaAberta}
        onAlterada={() => setAviso({ tom: 'ok', texto: 'Senha alterada. As outras sessões desta conta foram encerradas.' })}
      />
    </div>
  );
}

/** Interruptor com o rótulo à direita, como no frame. */
function Interruptor({
  control,
  nome,
  rotulo,
}: {
  control: Control<ValoresMinhaConta>;
  nome: 'emailNotifications' | 'mfaEnabled';
  rotulo: string;
}) {
  return (
    <Controller
      control={control}
      name={nome}
      render={({ field }) => (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-caption-bold text-white">
          <Switch checked={field.value} onCheckedChange={field.onChange} />
          {rotulo}
        </label>
      )}
    />
  );
}

/** A conta da sessão; o guard do `MainLayout` garante que ela existe nesta rota. */
export function MinhaContaDaSessao() {
  const conta = useAuthStore((state) => state.user);
  return conta ? <MinhaConta conta={conta} /> : null;
}
