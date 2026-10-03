/** Curated initials for known institutional partners — keeps the placeholder
 * readable for names an auto-generated acronym would mangle (e.g. long official
 * ministry names). Falls back to an automatic acronym for anything else, so a
 * newly added partner never renders with no initials at all. */
const KNOWN_INITIALS: Record<string, string> = {
  "sodiam": "SODIAM",
  "sociedade mineira de catoca": "CAT",
  "ministério dos recursos minerais e petróleos": "MIREMPET",
  "endiama mining": "EM",
  "clínica sagrada esperança": "CSE",
};

const STOPWORDS = new Set(["de", "da", "do", "das", "dos", "e", "a", "o", "para", "com"]);

export function getPartnerInitials(name: string): string {
  const known = KNOWN_INITIALS[name.trim().toLowerCase()];
  if (known) return known;

  const words = name
    .trim()
    .split(/\s+/)
    .filter((w) => !STOPWORDS.has(w.toLowerCase()));

  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 6).toUpperCase();

  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
