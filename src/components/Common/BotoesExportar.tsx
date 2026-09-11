import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { IconButton } from '@/components/UI';

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
 * Exportar de fato depende de backend, então os botões ficam inertes.
 */
export function BotoesExportar({
  quantidade = 3,
  variante = 'dim',
  rotulo = 'Exportar',
}: {
  quantidade?: number;
  variante?: 'dim' | 'outline';
  rotulo?: string;
}) {
  const icones = [FileText, FileSpreadsheet, Download].slice(0, quantidade);

  return (
    <span className="flex shrink-0 items-center gap-2">
      {icones.map((Icone, indice) => (
        <IconButton
          key={indice}
          aria-label={rotulo}
          title="Ainda não disponível"
          variant={variante}
        >
          <Icone />
        </IconButton>
      ))}
    </span>
  );
}
