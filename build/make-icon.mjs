/**
 * Gera build/icon.png (512x512) — o ícone do executável.
 *
 * Redesenha a marca do OrbitPlay (`public/icons/orbitplay-mark.svg`) em um buffer
 * RGBA e codifica o PNG à mão com o zlib nativo do Node, para não trazer uma
 * dependência de rasterização só por causa de um arquivo. O electron-builder
 * converte este PNG em .ico/.icns sozinho.
 *
 * A marca, no sistema de coordenadas do SVG (viewBox 84x66):
 *   anel     centro (33, 33), raio externo 33, interno 16.9612,
 *            gradiente #248FF7 -> #875AF2 na diagonal
 *   brilho   quatro pontas em (65.56, 21.6), branco
 *
 * Rode com: node build/make-icon.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SIZE = 512;
const SS = 3; // supersampling por eixo (antialias)
const W = SIZE * SS;

const BG = [8, 3, 33, 255]; // BW/Background #080321
const FROM = [36, 143, 247]; // #248FF7
const TO = [135, 90, 242]; // #875AF2

// A marca tem 84x66. Encaixamos com folga e centralizamos no quadrado.
const ART_W = 84;
const ART_H = 66;
const PAD = 0.14; // 14% de respiro em cada lado
const SCALE = (W * (1 - PAD * 2)) / ART_W;
const OFF_X = (W - ART_W * SCALE) / 2;
const OFF_Y = (W - ART_H * SCALE) / 2;

/** Converte pixel do canvas para o sistema de coordenadas da arte. */
const toArt = (px, py) => [(px - OFF_X) / SCALE, (py - OFF_Y) / SCALE];

/** Gradiente do anel: de (0,33) a (52.8,73.3) no espaço da arte. */
function ringGradient(ax, ay) {
  const t = Math.min(1, Math.max(0, (ax / 52.8173 + (ay - 33) / 40.296) / 2 + 0.25));
  return [
    Math.round(FROM[0] + (TO[0] - FROM[0]) * t),
    Math.round(FROM[1] + (TO[1] - FROM[1]) * t),
    Math.round(FROM[2] + (TO[2] - FROM[2]) * t),
  ];
}

function insideRoundedRect(x, y, r) {
  const maxX = W - r;
  const maxY = W - r;
  if (x >= r && x <= maxX) return y >= 0 && y <= W;
  if (y >= r && y <= maxY) return x >= 0 && x <= W;
  const cx = x < r ? r : maxX;
  const cy = y < r ? r : maxY;
  return (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
}

/**
 * Brilho de quatro pontas: superelipse de expoente 0.5.
 * Com expoente < 1 os lados ficam côncavos, que é o que dá as pontas.
 */
function insideSparkle(ax, ay) {
  const dx = Math.abs(ax - 65.5603) / 18;
  const dy = Math.abs(ay - 21.6) / 16.8;
  return Math.sqrt(dx) + Math.sqrt(dy) <= 1;
}

function sample(px, py) {
  if (!insideRoundedRect(px, py, W * 0.22)) return [0, 0, 0, 0];

  const [ax, ay] = toArt(px, py);

  // O brilho fica por cima do anel, como no SVG.
  if (insideSparkle(ax, ay)) return [255, 255, 255, 255];

  const d = Math.hypot(ax - 33, ay - 33);
  if (d <= 33 && d >= 16.9612) return [...ringGradient(ax, ay), 255];

  return BG;
}

// --- Rasteriza com supersampling ---
const rgba = Buffer.alloc(SIZE * SIZE * 4);
for (let py = 0; py < SIZE; py++) {
  for (let px = 0; px < SIZE; px++) {
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 0;

    for (let sy = 0; sy < SS; sy++) {
      for (let sx = 0; sx < SS; sx++) {
        const [cr, cg, cb, ca] = sample(px * SS + sx + 0.5, py * SS + sy + 0.5);
        const alpha = ca / 255;
        r += cr * alpha;
        g += cg * alpha;
        b += cb * alpha;
        a += ca;
      }
    }

    const n = SS * SS;
    const outA = a / n;
    const scale = a > 0 ? 255 / a : 0;
    const i = (py * SIZE + px) * 4;
    rgba[i] = Math.round(r * scale);
    rgba[i + 1] = Math.round(g * scale);
    rgba[i + 2] = Math.round(b * scale);
    rgba[i + 3] = Math.round(outA);
  }
}

// --- Codifica o PNG ---
const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 6; // RGBA

const raw = Buffer.alloc(SIZE * (SIZE * 4 + 1));
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filtro 0
  rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
]);

const out = path.join(path.dirname(fileURLToPath(import.meta.url)), 'icon.png');
writeFileSync(out, png);
console.log(`icon.png gerado: ${SIZE}x${SIZE}, ${(png.length / 1024).toFixed(1)} KB`);
