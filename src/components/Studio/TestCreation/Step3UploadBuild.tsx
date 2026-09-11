import { useRef } from 'react';
import { LockupPlugin } from '@/components/Common/LockupPlugin';
import { Button, Checkbox, Input, SelectField, Switch, Tag } from '@/components/UI';
import { useTestStore } from '@/stores/testStore';
import { PLUGIN_HEATMAPS, PLUGIN_TRIGGERS, type PluginDetection } from '@/utils/constants';

/**
 * ETAPA 3 — Envio da build. Figma: `319:7985` (vazio) e `319:8624` (com arquivo).
 *
 * A área de upload é a mesma nos dois estados; o que muda é o bloco verde com o
 * nome do arquivo e, abaixo, todo o painel do Orbit Plug-in — que só aparece
 * depois que a build é lida.
 *
 * Os gatilhos e mapas de calor são um resultado de leitura da build. Como não
 * há backend, vêm de uma lista fixa em `constants`, com o conteúdo do arquivo.
 */
export function Step3UploadBuild() {
  const draft = useTestStore((state) => state.draft);
  const setBuild = useTestStore((state) => state.setBuild);
  const setRecordingOptions = useTestStore((state) => state.setRecordingOptions);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const enviado = !!draft.buildFileName;

  function receber(arquivo: File | undefined) {
    if (!arquivo) return;
    setBuild({
      name: arquivo.name,
      sizeMb: Number((arquivo.size / (1024 * 1024)).toFixed(1)),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Envie a versão que será testada</h2>
        <p className="text-body text-white">
          Faça upload da build e configure a telemetria. Se o plugin estiver ativo, você terá acesso
          a dados avançados de comportamento e performance.
        </p>
      </div>

      {/* Área de arrastar e soltar */}
      <div
        onDragOver={(evento) => evento.preventDefault()}
        onDrop={(evento) => {
          evento.preventDefault();
          receber(evento.dataTransfer.files[0]);
        }}
        className="flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-white p-6"
      >
        <img src="./icons/figma/build-upload.svg" alt="" className="size-[72px]" />

        <div className="w-full text-center">
          <p className="text-body-bold text-white">Arraste e solte a sua build aqui</p>
          <p className="text-caption text-orbit-muted">
            Tipos de arquivo aceitos (.exe, .dmg, .unity, .unreal)
          </p>
        </div>

        {enviado ? (
          <div className="w-full text-center">
            <p className="text-body-bold text-orbit-success">{draft.buildFileName}</p>
            <p className="text-caption text-orbit-heavy">Seu arquivo está pronto para uso!</p>
          </div>
        ) : (
          <Button variant="nightfall" onClick={() => inputArquivo.current?.click()}>
            Importar
            <img src="./icons/figma/build-upload.svg" alt="" className="size-6" />
          </Button>
        )}

        <input
          ref={inputArquivo}
          type="file"
          accept=".exe,.dmg,.unity,.unreal"
          className="hidden"
          onChange={(evento) => receber(evento.target.files?.[0])}
        />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-3">
        <Switch
          checked={draft.requiresRecording}
          onCheckedChange={(checked) => setRecordingOptions({ requiresRecording: checked })}
        />
        <span className="text-body text-white">Jogável com controle*</span>
      </label>

      {enviado && (
        <>
          <p className="flex items-center gap-1 text-subtitle text-white">
            <img src="./icons/figma/build-verified.svg" alt="" className="size-6" />
            Orbit Plug-in verificado com sucesso, pronto para configurar!
          </p>

          <PainelPlugin />
        </>
      )}
    </div>
  );
}

/** Painel laranja com o que a leitura da build encontrou. */
function PainelPlugin() {
  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-orbit-orange p-6">
      <LockupPlugin />

      <p className="flex items-center gap-1 text-subtitle text-white">
        <img src="./icons/figma/model/telemetry-3.svg" alt="" className="size-6" />
        {PLUGIN_TRIGGERS.length} gatilhos encontrados
      </p>

      <TabelaDeteccao itens={PLUGIN_TRIGGERS} rotuloNome="Nome do gatilho" />

      <p className="flex items-center gap-1 text-subtitle text-white">
        <img src="./icons/figma/model/telemetry-1.svg" alt="" className="size-6" />
        {PLUGIN_HEATMAPS.length} mapas de calor encontrados
      </p>

      <TabelaDeteccao itens={PLUGIN_HEATMAPS} rotuloNome="Nome da cena" />

      <div className="flex items-start gap-6">
        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-blue hover:underline"
          title="Ainda não disponível"
        >
          Configurar na unity
          <img src="./icons/figma/build-unity.svg" alt="" className="size-6" />
        </button>
        <button
          type="button"
          className="flex items-center gap-1 text-button text-orbit-error-l hover:underline"
          title="Ainda não disponível"
        >
          Remover Plug-in
          <img src="./icons/figma/build-remove.svg" alt="" className="size-6" />
        </button>
      </div>
    </section>
  );
}

function TabelaDeteccao({
  itens,
  rotuloNome,
}: {
  itens: PluginDetection[];
  rotuloNome: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-orbit-border bg-orbit-card">
      <div className="flex items-center gap-6 bg-orbit-info-bg px-6 py-3.5 text-body text-orbit-dark">
        <span className="w-[125px] shrink-0">Tipo Variável</span>
        <span className="flex-1">{rotuloNome}</span>
        <span className="flex-1">Tipo</span>
        <span className="w-[181px] shrink-0">Quantidade controle</span>
        <span className="w-[410px] shrink-0">Ações</span>
      </div>

      {itens.map((item) => (
        <div key={item.id} className="flex items-center gap-6 px-6 py-2">
          <span className="w-[125px] shrink-0">
            <Tag tone={item.varTone}>{item.varType}</Tag>
          </span>

          <Input className="flex-1" defaultValue={item.name} aria-label={rotuloNome} />

          {/* O tipo vem lido da build: é um seletor de um valor só. */}
          <SelectField className="flex-1" value={item.kind} onChange={() => {}} aria-label="Tipo">
            <option className="bg-orbit-bg">{item.kind}</option>
          </SelectField>

          <Input
            className="w-[181px] shrink-0"
            disabled={!item.amountEditable}
            placeholder={item.amountEditable ? 'Digite...' : 'Indisponível'}
            aria-label="Quantidade controle"
          />

          <span className="flex w-[410px] shrink-0 items-center gap-2.5">
            {item.metrics.map((metrica) => (
              <label key={metrica} className="flex cursor-pointer items-center gap-2">
                <Checkbox />
                <span className="whitespace-nowrap text-body text-white">{metrica}</span>
              </label>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

