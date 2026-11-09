import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AvisoConta, BotaoConta, Caixa, CampoConta, CLASSE_INPUT, IconeCampo } from '@/components/Auth/MolduraConta';
import { Modal, ModalContent, ModalDescription, ModalTitle } from '@/components/UI';
import { useAlterarSenha } from '@/hooks/useConta';
import { senhaValida } from '@/utils/helpers';

export const esquemaAlterarSenha = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.'),
    newPassword: z
      .string()
      .refine(senhaValida, 'Use 8 ou mais caracteres com maiúscula, minúscula, número e símbolo.'),
    confirmacao: z.string().min(1, 'Repita a nova senha.'),
  })
  .refine((valores) => valores.newPassword === valores.confirmacao, {
    message: 'As senhas não são iguais.',
    path: ['confirmacao'],
  })
  .refine((valores) => valores.newPassword !== valores.currentPassword, {
    message: 'A nova senha precisa ser diferente da atual.',
    path: ['newPassword'],
  });

type Valores = z.infer<typeof esquemaAlterarSenha>;

/**
 * "Alterar senha" da Minha conta. O Figma não desenha o destino desse link:
 * aqui é um modal com os campos e o botão dos cartões de conta ("Criar nova
 * senha"), mais a senha atual, que a API exige. Trocar derruba as outras sessões.
 */
export function ModalAlterarSenha({
  aberto,
  onAbertoChange,
  onAlterada,
}: {
  aberto: boolean;
  onAbertoChange: (aberto: boolean) => void;
  onAlterada: () => void;
}) {
  const alterar = useAlterarSenha();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<Valores>({ resolver: zodResolver(esquemaAlterarSenha), mode: 'onBlur' });

  function fechar(abrir: boolean) {
    if (!abrir) {
      reset();
      alterar.reset();
    }
    onAbertoChange(abrir);
  }

  const onSubmit = handleSubmit(async ({ currentPassword, newPassword }) => {
    await alterar.mutateAsync({ currentPassword, newPassword }).then(
      () => {
        fechar(false);
        onAlterada();
      },
      () => undefined, // O erro aparece no aviso do modal.
    );
  });

  return (
    <Modal open={aberto} onOpenChange={fechar}>
      <ModalContent className="w-[560px] max-w-[calc(100vw-32px)] gap-0 rounded-3xl border-none bg-orbit-conta p-10">
        <ModalTitle className="text-[28px] font-bold leading-none text-white">Alterar senha</ModalTitle>
        <ModalDescription className="pt-4 text-graphic text-white">
          Ao trocar, as outras sessões abertas desta conta são encerradas.
        </ModalDescription>

        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4 pt-6">
          <CampoConta id="senha-atual" rotulo="Senha atual" obrigatorio erro={errors.currentPassword?.message}>
            <Caixa erro={!!errors.currentPassword} icone={<IconeCampo nome="login-key" />}>
              <input id="senha-atual" type="password" autoComplete="current-password" placeholder="Digite..." className={CLASSE_INPUT} {...register('currentPassword')} />
            </Caixa>
          </CampoConta>
          <CampoConta id="senha-nova" rotulo="Nova senha" obrigatorio erro={errors.newPassword?.message}>
            <Caixa erro={!!errors.newPassword} icone={<IconeCampo nome="login-key" />}>
              <input id="senha-nova" type="password" autoComplete="new-password" placeholder="Digite..." className={CLASSE_INPUT} {...register('newPassword')} />
            </Caixa>
          </CampoConta>
          <CampoConta id="senha-confirmacao" rotulo="Confirmar nova senha" obrigatorio erro={errors.confirmacao?.message}>
            <Caixa erro={!!errors.confirmacao} icone={<IconeCampo nome="login-key" />}>
              <input id="senha-confirmacao" type="password" autoComplete="new-password" placeholder="Digite..." className={CLASSE_INPUT} {...register('confirmacao')} />
            </Caixa>
          </CampoConta>

          {alterar.error && <AvisoConta tom="erro">{(alterar.error as { message?: string }).message ?? 'Não foi possível trocar a senha.'}</AvisoConta>}

          <BotaoConta ocupado={alterar.isPending} className="mt-2 w-full">
            {alterar.isPending ? 'Salvando...' : 'Alterar senha'}
          </BotaoConta>
        </form>
      </ModalContent>
    </Modal>
  );
}
