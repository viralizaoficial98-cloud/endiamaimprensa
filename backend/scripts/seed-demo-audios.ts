/**
 * Fills the new Áudios section with visually- and audibly-real demonstration
 * content while the real editorial audio archive is still empty — mirrors
 * seed-demo-events.ts. Each row is tagged via `interviewee` ending in
 * "(dados de demonstração)" so it's easy to find and remove later:
 *   npx tsx scripts/remove-demo-audios.ts
 * or delete individually from Admin → Áudios.
 *
 * Generates short real (audible sine-tone) WAV files under uploads/audios/
 * since there is no official audio archive to draw from yet — clearly
 * temporary placeholders, not silence, so the player is genuinely testable.
 * Idempotent (matched by slug).
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { toSlug } from "../src/utils/slug";

const prisma = new PrismaClient();
const UPLOAD_ROOT = path.join(__dirname, "..", "uploads", "audios");
const DEMO_TAG = "(dados de demonstração)";

function writeToneWav(filename: string, seconds: number, frequencyHz: number): number {
  const sampleRate = 44100;
  const numSamples = Math.floor(seconds * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < numSamples; i++) {
    // Gentle fade in/out so it doesn't click, moderate amplitude.
    const t = i / sampleRate;
    const fade = Math.min(1, Math.min(t, seconds - t) / 0.15);
    const sample = Math.sin(2 * Math.PI * frequencyHz * t) * 0.2 * fade;
    buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2);
  }

  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_ROOT, filename), buffer);
  return Math.round(seconds);
}

// Dev-only seed script — audioUrl needs an absolute backend origin (the file
// is served from backend/uploads/, a different origin than the frontend).
// localhost is the only safe default; never hardcode a specific machine's LAN IP.
const API_BASE = process.env.API_BASE_URL ?? "http://localhost:4000";

const DEMO_AUDIOS = [
  {
    title: "Declaração do Presidente do Conselho de Administração sobre os Resultados de 2025",
    description: "Declaração institucional sobre o desempenho da ENDIAMA E.P. no exercício de 2025 e as prioridades para 2026.",
    // Sem fotografia oficial cadastrada — nunca associar um retrato genérico a um cargo real.
    coverImage: "/images/fallbacks/mining-news-default.webp",
    file: "declaracao-pca-resultados-2025.wav",
    seconds: 42,
    frequency: 220,
    interviewee: `Presidente do Conselho de Administração ${DEMO_TAG}`,
    location: "Luanda, Angola",
    categorySlug: "institucional",
    isFeatured: true,
  },
  {
    title: "Entrevista em Áudio: O Futuro da Comercialização de Diamantes Angolanos",
    description: "Conversa sobre as estratégias de comercialização e os mercados prioritários para o diamante angolano.",
    // Sem fotografia oficial cadastrada — nunca associar um retrato genérico a um cargo real.
    coverImage: "/images/fallbacks/diamonds-default.webp",
    file: "entrevista-comercializacao-diamantes.wav",
    seconds: 58,
    frequency: 262,
    interviewee: `Directora Comercial da SODIAM ${DEMO_TAG}`,
    location: "Luanda, Angola",
    categorySlug: "comercializacao",
    isFeatured: false,
  },
  {
    title: "Comunicado: Programa de Responsabilidade Social nas Lundas",
    description: "Comunicado sobre os investimentos sociais da ENDIAMA nas comunidades mineiras da Lunda Norte e Lunda Sul.",
    coverImage: "/images/photos/community-01.jpg",
    file: "comunicado-responsabilidade-social.wav",
    seconds: 35,
    frequency: 196,
    interviewee: `Departamento de Responsabilidade Social ${DEMO_TAG}`,
    location: "Saurimo, Lunda Sul",
    categorySlug: "responsabilidade-social",
    isFeatured: false,
  },
  {
    title: "Cobertura em Áudio: Fórum Nacional da Indústria Mineira 2026",
    description: "Registo sonoro dos principais momentos e intervenções do Fórum Nacional da Indústria Mineira.",
    coverImage: "/images/photos/meeting-01.jpg",
    file: "cobertura-forum-industria-mineira.wav",
    seconds: 50,
    frequency: 246,
    interviewee: `Redacção ENDIAMA Notícias ${DEMO_TAG}`,
    location: "Talatona, Luanda",
    categorySlug: "multimedia",
    isFeatured: false,
  },
  {
    title: "Pronunciamento: Início da Campanha de Prospecção Geológica 2026",
    description: "Pronunciamento institucional sobre o arranque da nova campanha de prospecção geológica em território nacional.",
    coverImage: "/images/fallbacks/mining-news-default.webp",
    file: "pronunciamento-prospeccao-geologica.wav",
    seconds: 38,
    frequency: 174,
    interviewee: `Direcção de Geologia e Minas ${DEMO_TAG}`,
    location: "Luanda, Angola",
    categorySlug: "operacoes-mineiras",
    isFeatured: false,
  },
  {
    title: "Reportagem em Áudio: Lapidação e Valorização do Diamante Angolano",
    description: "Reportagem sobre os investimentos na cadeia de lapidação local e a valorização do diamante angolano em bruto.",
    coverImage: "/images/fallbacks/diamonds-default.webp",
    file: "reportagem-lapidacao-diamante.wav",
    seconds: 46,
    frequency: 233,
    interviewee: `Redacção ENDIAMA Notícias ${DEMO_TAG}`,
    location: "Luanda, Angola",
    categorySlug: "lapidacao",
    isFeatured: false,
  },
];

async function main() {
  for (const item of DEMO_AUDIOS) {
    const slug = toSlug(item.title);
    const existing = await prisma.audio.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Já existe, a ignorar: ${item.title}`);
      continue;
    }

    const duration = writeToneWav(item.file, item.seconds, item.frequency);
    const category = await prisma.category.findUnique({ where: { slug: item.categorySlug } });

    await prisma.audio.create({
      data: {
        title: item.title,
        slug,
        description: item.description,
        coverImage: item.coverImage,
        audioUrl: `${API_BASE}/uploads/audios/${item.file}`,
        duration,
        categoryId: category?.id,
        interviewee: item.interviewee,
        location: item.location,
        isFeatured: item.isFeatured,
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });
    console.log(`Criado: ${item.title} (${slug}, ${duration}s)`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
