/**
 * Deterministic (seeded) picker for the category-page hero background —
 * always a real local photograph from public/images/photos, never a
 * generated/mock asset. Category records don't carry their own hero image,
 * so this maps each known category slug to a themed pool of real photos.
 */
function hashStringToInt(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededInt(key: string, min: number, max: number): number {
  const random = mulberry32(hashStringToInt(key))();
  return Math.floor(min + random * (max - min + 1));
}

const CATEGORY_PHOTO_POOL: Record<string, string[]> = {
  "operacoes-mineiras": ["mining-01.jpg", "mining-02.jpg", "mining-03.jpg", "mining-04.jpg", "mining-05.jpg", "mining-06.jpg", "catoca-01.jpg", "catoca-02.jpg", "geology-01.jpg", "drone-01.jpg"],
  "grupo-endiama": ["auction-01.jpg", "handshake-01.jpg", "office-building-01.jpg"],
  comercializacao: ["diamond-01.jpg", "diamond-02.jpg", "gemologist-01.jpg", "chart-01.jpg"],
  institucional: ["office-building-01.jpg", "meeting-01.jpg", "portrait-man-01.jpg"],
  "responsabilidade-social": ["classroom-01.jpg", "hospital-01.jpg", "hospital-02.jpg", "community-01.jpg", "children-01.jpg"],
  sustentabilidade: ["solar-01.jpg", "drone-solar-01.jpg", "geology-01.jpg"],
  multimedia: ["drone-01.jpg", "chart-01.jpg", "meeting-01.jpg"],
  tecnologia: ["drone-01.jpg", "drone-solar-01.jpg", "chart-01.jpg"],
  lapidacao: ["diamond-01.jpg", "diamond-02.jpg", "gemologist-01.jpg"],
  internacional: ["globe-01.jpg"],
  cultura: ["community-01.jpg", "children-01.jpg"],
  desporto: ["meeting-01.jpg"],
  diamante: ["diamond-01.jpg", "diamond-02.jpg", "gemologist-01.jpg"],
};

const DEFAULT_POOL = ["office-building-01.jpg", "meeting-01.jpg"];

export function getCategoryHeroPhoto(slug: string): string {
  const pool = CATEGORY_PHOTO_POOL[slug] ?? DEFAULT_POOL;
  const index = seededInt(`${slug}-hero-photo`, 0, pool.length - 1);
  return `/images/photos/${pool[index]}`;
}
