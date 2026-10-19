import { useEffect, useRef } from 'react';
import { LockupPlugin } from '@/components/Common/LockupPlugin';
import { Button, Checkbox, Input, Progress, SelectField, Switch, Tag } from '@/components/UI';
import { useBuild, useEnviarBuild, useLigarPlugin } from '@/hooks/useBuilds';
import { useTestStore } from '@/stores/testStore';
import type { BuildInfo, PluginDetection, TestModel } from '@/types';
import { cn } from '@/utils/helpers';

/** O `accept` do seletor e o texto do Figma: os tipos que a etapa aceita. */
const TIPOS_ACEITOS = ['.exe', '.dmg', '.unity', '.unreal'];

/**
 * ETAPA 3 — Envio da build. Figma: `319:7985` (vazio) e `319:8624` (com arquivo).
 *
 * A build sobe para a API (`POST /games/:gameId/builds`) com a barra de
 * progresso do envio; a API responde PROCESSING enquanto calcula o hash e
 * procura o Orbit Plug-in, e a etapa consulta até ficar VALID ou INVALID. O
 * painel do plug-in mostra o que a leitura encontrou, e só aparece quando há
 * plug-in na build.
 *
 * O "Próximo" só libera com a build válida e combinando com o modelo: o de
 * telemetria precisa do plug-in ligado, os outros não aceitam build com ele
 * ligado ("Remover Plug-in" resolve). O A/B de imagens não precisa de build.
 */
export function Step3UploadBuild() {
  const draft = useTestStore((state) => state.draft);
  const uploadState = useTestStore((state) => state.uploadState);
  const uploadProgress = useTestStore((state) => state.uploadProgress);
  const setBuild = useTestStore((state) => state.setBuild);
  const setUploadState = useTestStore((state) => state.setUploadState);
  const setUploadProgress = useTestStore((state) => state.setUploadProgress);
  const setBuildValida = useTestStore((state) => state.setBuildValida);
  const setRecordingOptions = useTestStore((state) => state.setRecordingOptions);
  const inputArquivo = useRef<HTMLInputElement>(null);

  const enviar = useEnviarBuild(draft.gameId);
  const build = useBuild(draft.gameId, draft.buildId);
  const dados = build.data;
  const problema = dados ? incompatibilidade(dados, draft.model) : null;

  // Quem decide se a etapa passa é a build que a API leu, não o arquivo escolhido.
  useEffect(() => {
    setBuildValida(!!dados && dados.status === 'VALID' && !problema);
  }, [dados, problema, setBuildValida]);

  async function receber(arquivo: File | undefined) {
    if (!arquivo || !draft.gameId) return;

    const extensao = arquivo.name.slice(arquivo.name.lastIndexOf('.')).toLowerCase();
    if (!TIPOS_ACEITOS.includes(extensao)) {
      enviar.reset();
      setUploadState('error');
      return;
    }

    setUploadProgress(0);
    setUploadState('uploading');
    try {
      const enviada = await enviar.mutateAsync({ arquivo, onProgresso: setUploadProgress });
      setBuild({ id: enviada.id, name: enviada.fileName, sizeMb: enviada.sizeMb, version: enviada.version });
      setUploadState('done');
    } catch {
      setUploadState('error');
    }
  }

  const enviando = uploadState === 'uploading';
  const processando = !enviando && dados?.status === 'PROCESSING';
  const pronta = !enviando && dados?.status === 'VALID';
  const podeEscolher = !!draft.gameId && !enviando && !processando;

  /** Abrir o seletor: a área toda é clicável, assim a build pronta se troca sem botão extra. */
  function abrirSeletor() {
    if (podeEscolher) inputArquivo.current?.click();
  }
  const erro =
    uploadState === 'error'
      ? enviar.error
        ? ((enviar.error as { message?: string }).message ?? 'Não foi possível enviar a build.')
        : `Tipo de arquivo não aceito. Envie ${TIPOS_ACEITOS.join(', ')}.`
      : !enviando && dados?.status === 'INVALID'
        ? (dados.error ?? 'A build não pôde ser lida. Envie de novo.')
        : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-headline text-white">Envie a versão que será testada</h2>
        <p className="text-body text-white">
          Faça upload da build e configure a telemetria. Se o plugin estiver ativo, você terá acesso
          a dados avançados de comportamento e performance.
        </p>
      </div>

      {/*
        Área de arrastar e soltar. Com a build pronta o desenho não tem botão
        (`319:8624`): para trocar, clique na área ou solte outro arquivo.
      */}
      <div
        onClick={abrirSeletor}
        onKeyDown={(evento) => {
          if (pronta && evento.target === evento.currentTarget && (evento.key === 'Enter' || evento.key === ' ')) {
            evento.preventDefault();
            abrirSeletor();
          }
        }}
        onDragOver={(evento) => evento.preventDefault()}
        onDrop={(evento) => {
          evento.preventDefault();
          if (!enviando) void receber(evento.dataTransfer.files[0]);
        }}
        role={pronta ? 'button' : undefined}
        tabIndex={pronta ? 0 : undefined}
        aria-label={pronta ? 'Trocar a build' : undefined}
        className={cn(
          'flex flex-col items-center justify-center gap-6 rounded-2xl border-2 border-dashed border-white p-6',
          podeEscolher && 'cursor-pointer',
        )}
      >
        <img src="./icons/figma/build-upload.svg" alt="" className="size-[72px]" />

        <div className="w-full text-center">
          <p className="text-body-bold text-white">Arraste e solte a sua build aqui</p>
          <p className="text-caption text-orbit-muted">
            Tipos de arquivo aceitos ({TIPOS_ACEITOS.join(', ')})
          </p>
        </div>

        {enviando && (
          <div className="flex w-full max-w-[560px] flex-col gap-2 text-center">
            <p className="text-body-bold text-white">Enviando a build… {Math.round(uploadProgress * 100)}%</p>
            <Progress value={uploadProgress * 100} />
          </div>
        )}

        {processando && (
          <div className="w-full text-center">
            <p className="text-body-bold text-white">{dados.fileName}</p>
            <p className="text-caption text-orbit-heavy">Validando a build e procurando o Orbit Plug-in…</p>
          </div>
        )}

        {pronta && (
          <div className="w-full text-center">
            <p className="text-body-bold text-orbit-success">{dados.fileName}</p>
            <p className="text-caption text-orbit-heavy">Seu arquivo está pronto para uso!</p>
          </div>
        )}

        {erro && <p className="w-full text-center text-body-bold text-orbit-error-l">{erro}</p>}

        {/* O clique sobe até a área, que abre o seletor. */}
        {!enviando && !processando && !pronta && (
          <Button variant="nightfall" disabled={!draft.gameId}>
            Importar
            <img src="./icons/figma/build-upload.svg" alt="" className="size-6" />
          </Button>
        )}

        <input
          ref={inputArquivo}
          type="file"
          accept={TIPOS_ACEITOS.join(',')}
          className="hidden"
          onClick={(evento) => evento.stopPropagation()}
          onChange={(evento) => {
            void receber(evento.target.files?.[0]);
            // Escolher o mesmo arquivo de novo também dispara o envio.
            evento.target.value = '';
          }}
        />
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-3">
        <Switch
          checked={draft.requiresController}
          onCheckedChange={(checked) => setRecordingOptions({ requiresController: checked })}
        />
        <span className="text-body text-white">Jogável com controle*</span>
      </label>

      {pronta && problema && <p className="text-body-bold text-orbit-error-l">{problema}</p>}

      {pronta && dados.plugin.detected && (
        <>
          {dados.plugin.enabled && (
            <p className="flex items-center gap-1 text-subtitle text-white">
              <img src="./icons/figma/build-verified.svg" alt="" className="size-6" />
              Orbit Plug-in verificado com sucesso, pronto para configurar!
            </p>
          )}

          <PainelPlugin build={dados} />
        </>
      )}
    </div>
  );
}

/** Por que a build não serve para o modelo escolhido — `null` quando serve. */
function incompatibilidade(build: BuildInfo, model: TestModel | null): string | null {
  if (build.status !== 'VALID') return null;
  if (model === 'TELEMETRY' && !(build.plugin.detected && build.plugin.enabled)) {
    return 'O modelo com Telemetria precisa de uma build com o Orbit Plug-in ligado.';
  }
  if (model !== 'TELEMETRY' && build.plugin.enabled) {
    return 'Este modelo não usa telemetria: remova o Orbit Plug-in desta build para continuar.';
  }
  return null;
}

/** Painel laranja com o que a leitura da build encontrou. */
function PainelPlugin({ build }: { build: BuildInfo }) {
  const ligar = useLigarPlugin(build.gameId, build.id);
  const { triggers, heatmaps, enabled } = build.plugin;

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-orbit-orange p-6">
      <LockupPlugin />

      <p className="flex items-center gap-1 text-subtitle text-white">
        <img src="./icons/figma/model/telemetry-3.svg" alt="" className="size-6" />
        {triggers.length} gatilhos encontrados
      </p>

      <TabelaDeteccao itens={triggers} rotuloNome="Nome do gatilho" />

      <p className="flex items-center gap-1 text-subtitle text-white">
        <img src="./icons/figma/model/telemetry-1.svg" alt="" className="size-6" />
        {heatmaps.length} mapas de calor encontrados
      </p>

      <TabelaDeteccao itens={heatmaps} rotuloNome="Nome da cena" />

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
          onClick={() => ligar.mutate(!enabled)}
          disabled={ligar.isPending}
          className="flex items-center gap-1 text-button text-orbit-error-l hover:underline disabled:opacity-60"
        >
          {enabled ? 'Remover Plug-in' : 'Religar Plug-in'}
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
