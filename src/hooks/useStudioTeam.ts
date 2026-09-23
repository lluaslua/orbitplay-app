import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import { queryKeys } from '@/lib/queryClient';
import type { StudioTeam } from '@/types';

/** Grupos e membros do estúdio — `GET /studio/team`, usado em "Responsáveis e permissões". */
export function useStudioTeam() {
  return useQuery({
    queryKey: queryKeys.studioTeam,
    queryFn: () => get<StudioTeam>('/studio/team'),
  });
}
