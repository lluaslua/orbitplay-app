; Personalização do instalador NSIS do OrbitPlay.
;
; Acrescenta uma caixa "Ver o tutorial de playtest" na última página do setup,
; ao lado da "Executar OrbitPlay". Marcada, ela abre o vídeo no navegador padrão
; quando a instalação termina.
;
; POR QUE `customFinishPage` E NÃO `customHeader`
; ------------------------------------------------
; A primeira tentativa pôs os defines em `customHeader` e o NSIS recusou com
; `warning 6010: install function "AbrirTutorial" not referenced`. O motivo está
; na ordem de `templates/nsis/installer.nsi`: o `assistedInstaller.nsh` — que já
; monta a página final — é incluído ANTES do `!insertmacro customHeader`. Os
; defines chegavam tarde, a página já estava pronta, e a função ficava órfã.
;
; `customFinishPage` é inserido no lugar certo, logo depois do `MUI_PAGE_INSTFILES`.
; Em compensação ele SUBSTITUI a página inteira: o "Executar OrbitPlay" que o
; electron-builder põe sozinho tem que ser reescrito aqui, senão some.
;
; `MUI_FINISHPAGE_SHOWREADME` é o único gancho de caixa extra que o Modern UI
; oferece nessa página. O nome fala em "readme", mas o rótulo e a ação são
; livres.
;
; A página final só existe porque `nsis.oneClick` é `false` em
; electron-builder.yml. Virando um clique só, esta caixa some com a página.

!macro customFinishPage
  ; --- "Executar OrbitPlay": cópia do que o template faz por padrão -----------
  ; `HIDE_RUN_AFTER_FINISH` é definido pelo electron-builder quando
  ; `nsis.runAfterFinish` é false; respeitamos isso como o original.
  !ifndef HIDE_RUN_AFTER_FINISH
    Function StartApp
      ${if} ${isUpdated}
        StrCpy $1 "--updated"
      ${else}
        StrCpy $1 ""
      ${endif}
      ${StdUtils.ExecShellAsUser} $0 "$launchLink" "open" "$1"
    FunctionEnd

    !define MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN_FUNCTION "StartApp"
  !endif

  ; --- "Ver o tutorial de playtest" ------------------------------------------
  ; `ExecShell` entrega a URL ao Windows, que abre no navegador padrão. Aqui vai
  ; o endereço normal do YouTube, não o de embed (`youtube-nocookie.com/embed/`):
  ; aquele serve para iframe e, aberto sozinho, mostra uma página vazia.
  Function AbrirTutorial
    ExecShell "open" "https://www.youtube.com/watch?v=5E_m9mv83k0"
  FunctionEnd

  !define MUI_FINISHPAGE_SHOWREADME ""
  !define MUI_FINISHPAGE_SHOWREADME_TEXT "Ver o tutorial de playtest"
  !define MUI_FINISHPAGE_SHOWREADME_FUNCTION "AbrirTutorial"

  !insertmacro MUI_PAGE_FINISH
!macroend
