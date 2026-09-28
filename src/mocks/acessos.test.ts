import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AccessGroup, AccessOverview, AccessUser } from '@/types';
import type { HttpMethod, MockRoute } from './routes';

let rotas: MockRoute[];

/** O banco em memória é compartilhado: cada caso recarrega o módulo para partir das fixtures. */
beforeEach(async () => {
  vi.resetModules();
  rotas = (await import('./routes')).routes;
});

function chamar<T>(method: HttpMethod, path: string, body?: unknown, params: Record<string, string> = {}) {
  const rota = rotas.find((item) => item.method === method && item.path === path);
  if (!rota) throw new Error(`rota ${method} ${path} não existe`);
  const resposta = rota.resolve({ params, query: new URLSearchParams(), body, headers: {} });
  return { status: resposta.status, data: resposta.data as T };
}

const visao = () => chamar<AccessOverview>('GET', '/studio/access').data;

describe('gerenciamento de acessos', () => {
  it('lista o usuário com os grupos em que ele está', () => {
    const hideo = visao().users.find((usuario) => usuario.id === 'usr-hideo');

    expect(hideo?.groups).toEqual(['Diretoria', 'QA']);
  });

  it('grupo sem participantes fica inativo', () => {
    const grupos = visao().groups;

    expect(grupos.find((grupo) => grupo.name === 'Rh')?.status).toBe('INACTIVE');
    expect(grupos.find((grupo) => grupo.name === 'QA')?.status).toBe('ACTIVE');
  });

  it('convite entra como pendente e soma nos convites pendentes', () => {
    const antes = visao().summary.pendingInvites;
    const resposta = chamar<AccessUser>('POST', '/studio/access/users', { email: 'keanu.reeves@example.com' });

    expect(resposta.status).toBe(201);
    expect(resposta.data.status).toBe('PENDING');
    expect(visao().summary.pendingInvites).toBe(antes + 1);
  });

  it('recusa convite para e-mail que já tem acesso', () => {
    expect(chamar('POST', '/studio/access/users', { email: 'hideo.kojima@example.com' }).status).toBe(409);
  });

  it('suspender tira o usuário da contagem de ativos', () => {
    const antes = visao().summary.activeUsers;
    chamar('PATCH', '/studio/access/users/:id', { status: 'INACTIVE' }, { id: 'usr-hideo' });

    expect(visao().summary.activeUsers).toBe(antes - 1);
  });

  it('excluir usuário também o tira dos grupos', () => {
    chamar('DELETE', '/studio/access/users/:id', undefined, { id: 'usr-hideo' });
    const { users, groups } = visao();

    expect(users.some((usuario) => usuario.id === 'usr-hideo')).toBe(false);
    expect(groups.find((grupo) => grupo.name === 'QA')?.members.map((membro) => membro.id)).not.toContain('usr-hideo');
  });

  it('não exclui o administrador do estúdio', () => {
    expect(chamar('DELETE', '/studio/access/users/:id', undefined, { id: 'usr-blackstar' }).status).toBe(409);
  });

  it('recusa senha que não cumpre as regras', () => {
    expect(chamar('POST', '/studio/access/users/:id/password', { password: 'fraca' }, { id: 'usr-hideo' }).status).toBe(400);
    expect(chamar('POST', '/studio/access/users/:id/password', { password: 'Forte#2026' }, { id: 'usr-hideo' }).status).toBe(200);
  });

  it('limpar participantes deixa o grupo inativo', () => {
    const resposta = chamar<AccessGroup>('PATCH', '/studio/access/groups/:id', { memberIds: [] }, { id: 'grp-qa' });

    expect(resposta.data.members).toEqual([]);
    expect(resposta.data.status).toBe('INACTIVE');
  });

  it('cria o grupo com os membros escolhidos, sem repetir', () => {
    const resposta = chamar<AccessGroup>('POST', '/studio/access/groups', {
      name: 'Marketing',
      memberIds: ['usr-gaules', 'usr-gaules', 'usr-cellbit'],
    });

    expect(resposta.status).toBe(201);
    expect(resposta.data.members.map((membro) => membro.id)).toEqual(['usr-gaules', 'usr-cellbit']);
    expect(visao().summary.groups).toBe(5);
  });
});
