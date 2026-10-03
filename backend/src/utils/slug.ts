import slugifyLib from "slugify";

export function toSlug(value: string): string {
  return slugifyLib(value, { lower: true, strict: true, trim: true, locale: "pt" });
}

export async function ensureUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>
): Promise<string> {
  const baseSlug = toSlug(base) || "item";
  let slug = baseSlug;
  let counter = 2;
  while (await exists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
  return slug;
}
