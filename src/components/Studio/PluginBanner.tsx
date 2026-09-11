import { ArrowRight } from 'lucide-react';
import { Button, Card } from '@/components/UI';

/**
 * Banner do OrbitPlug-in — Figma 304:1999, 884×384.
 *
 * A arte de fundo é a mesma do arquivo, a 35% de opacidade, e as marcas de Unity
 * e Unreal usam `plus-lighter` para o preto do PNG sumir sobre o fundo escuro.
 *
 * O fundo é um loop animado. O original vinha como GIF de 5 MB (com extensão
 * .png), o que sozinho dominava o instalador; virou WebP animado — 30 frames a
 * 90ms, mesmo loop de ~2,7s, metade da taxa de quadros original. Depois passou
 * a 289 KB reencodando a 25 de qualidade e sem canal alfa (que era todo opaco);
 * a 35% de opacidade atrás do texto o erro cai a um terço e não aparece.
 *
 * O lockup do topo, no Figma, é um grupo de posições absolutas (elipse, dois
 * traços e a marca). Aqui virou uma linha flex com a elipse atrás: o resultado
 * na tela é o mesmo e sobrevive a mudança de largura.
 */
const RECURSOS = [
  ['Gatilhos in-game', 'Tempo de fase', 'Taxa de conslusão'],
  ['Visualize Mapas e heatmaps', 'Melhore o fluxo do jogador', 'Tome decisões com dados reais'],
];

export function PluginBanner() {
  return (
    <Card className="relative items-center gap-4 overflow-hidden">
      <img
        src="./images/plugin-banner.webp"
        alt=""
        className="pointer-events-none absolute inset-0 size-full object-cover opacity-35"
      />

      {/* Lockup: traço · marca · traço, com a elipse por trás */}
      <div className="relative flex shrink-0 items-center justify-center">
        <img
          src="./icons/figma/plugin-ellipse.svg"
          alt=""
          className="pointer-events-none absolute h-[31.568px] w-[371.435px]"
        />
        <img src="./icons/figma/plugin-line-left.svg" alt="" className="relative w-[106px]" />

        <span className="relative mx-3 flex items-center gap-1">
          <span className="relative">
            <img src="./icons/figma/plugin-mark.svg" alt="" className="size-9" />
            <img
              src="./icons/figma/plugin-sparkle.svg"
              alt=""
              className="absolute left-[21px] top-[3.4px] h-[16.8px] w-[18px]"
            />
          </span>
          <span className="text-[28.8px] text-white">
            <strong className="font-bold">Orbit</strong>
            <span className="font-normal">Plug-in</span>
          </span>
        </span>

        <img src="./icons/figma/plugin-line-right.svg" alt="" className="relative w-[106px]" />
      </div>

      <h2 className="relative w-full text-center text-headline text-white">
        Ative nosso plug-in de telemetria!
      </h2>

      <p className="relative w-full text-center text-subtitle text-white">
        Obtenha dados avançados de cliques, movimento de câmera, hitbox e tempo de fase, aumente a
        precisão do feedback em até 80%.
      </p>

      <div className="relative flex w-full items-center justify-center gap-6">
        {RECURSOS.map((coluna) => (
          <ul key={coluna[0]} className="flex flex-col gap-2">
            {coluna.map((recurso) => (
              <li key={recurso} className="flex items-center gap-1 text-subtitle text-white">
                <img
                  src="./icons/figma/plugin-bullet.svg"
                  alt=""
                  className="h-[16.8px] w-[18px] shrink-0"
                />
                {recurso}
              </li>
            ))}
          </ul>
        ))}
      </div>

      <div className="relative flex w-full items-center gap-4">
        <a
          href="#documentacao"
          className="flex shrink-0 items-center gap-1 text-button text-orbit-orange hover:underline"
        >
          Ver documentação
          <ArrowRight className="size-5" />
        </a>

        <span className="flex-1" />

        {/*
          Os logos oficiais vêm escuros sobre fundo transparente, e o banner é
          escuro. `brightness(0) invert(1)` zera a cor mantendo o canal alfa e
          devolve a silhueta em branco — que é como o Figma os mostra. Fica no
          CSS, e não em arquivos brancos separados, para o original continuar
          servindo se algum dia houver superfície clara.

          As caixas são as medidas do arquivo; os PNGs têm a mesma proporção em
          resolução cheia (676×246 e 288×343), então não borram em tela HiDPI.
        */}
        <span className="flex shrink-0 items-center gap-4 [&_img]:[filter:brightness(0)_invert(1)]">
          <img src="./images/engines/unity.png" alt="Unity" className="h-[29.52px] w-[81.12px]" />
          <img
            src="./images/engines/unreal.png"
            alt="Unreal Engine"
            className="h-[41.16px] w-[34.56px]"
          />
        </span>

        {/* O banner desenha este CTA com raio 12 e px 28, não os 8/32 do resto. */}
        <Button variant="flame" className="shrink-0 rounded-xl px-7">
          Baixar plug-in
          <img src="./icons/figma/plugin-download.svg" alt="" className="size-6" />
        </Button>
      </div>
    </Card>
  );
}
