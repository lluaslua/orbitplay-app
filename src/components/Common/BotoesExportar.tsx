import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { IconButton } from '@/components/UI';
import { cn } from '@/utils/helpers';

/**
 * Os botões de exportar que o arquivo desenha no canto dos blocos de relatório:
 * PDF, planilha e download, nessa ordem.
 *
 * Nem todo bloco mostra os três — o cabeçalho do jogo traz dois, o de telemetria
 * traz um, o painel de insights traz os três —, então `quantidade` corta a lista
 * pelo começo, como no desenho.
 *
 * Estava duplicado em três telas antes de virar componente. As duas aparências
 * são as do arquivo: preenchido (`dim`) na maioria dos blocos e só contorno
 * (`outline`) no painel de insights do relatório.
 *
 * PDF e planilha continuam inertes. O terceiro ícone, o de download, baixa o
 * CSV quando a tela passa `aoBaixar`.
 */
export function BotoesExportar({
  quantidade = 3,
  variante = 'dim',
  rotulo = 'Exportar',
  className,
  aoBaixar,
  baixando,
}: {
  quantidade?: number;
  variante?: 'dim' | 'outline';
  rotulo?: string;
  /** O espaço entre os botões varia por tela: 8 nos relatórios, 24 em "Gerenciamento de acessos". */
  className?: string;
  /** Só o ícone de download (o terceiro). PDF e planilha não têm formato na API. */
  aoBaixar?: () => void;
  baixando?: boolean;
}) {
  const icones = [FileText, FileSpreadsheet, Download].slice(0, quantidade);

  return (
    <span className={cn('flex shrink-0 items-center gap-2', className)}>
      {icones.map((Icone, indice) => {
        const download = indice === 2 && !!aoBaixar;

        return (
          <IconButton
            key={indice}
            aria-label={download ? 'Baixar CSV' : rotulo}
            title={download ? 'Baixar CSV' : 'Ainda não disponível'}
            variant={variante}
            disabled={download && baixando}
            onClick={download ? aoBaixar : undefined}
          >
            <Icone />
          </IconButton>
        );
      })}
    </span>
  );
}
