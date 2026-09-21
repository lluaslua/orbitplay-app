/**
 * Imagem escolhida pelo estúdio, pronta para guardar no rascunho do Novo teste.
 *
 * O rascunho vive no `localStorage` (a cota é de ~5 MB), então uma foto crua
 * não cabe. A imagem é reduzida para no máximo `larguraMaxima` — o dobro dos
 * 390px do campo, para continuar nítida em tela de alta densidade — e vira
 * WebP. Um GIF animado fica só com o primeiro quadro.
 */
export async function reduzirImagem(arquivo: File, larguraMaxima = 780): Promise<string> {
  if (!arquivo.type.startsWith('image/')) {
    throw new Error('O arquivo escolhido não é uma imagem.');
  }

  const bitmap = await createImageBitmap(arquivo);
  const escala = Math.min(1, larguraMaxima / bitmap.width);
  const largura = Math.round(bitmap.width * escala);
  const altura = Math.round(bitmap.height * escala);

  const canvas = document.createElement('canvas');
  canvas.width = largura;
  canvas.height = altura;
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  return canvas.toDataURL('image/webp', 0.85);
}
