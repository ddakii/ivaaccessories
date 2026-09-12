import slugifyLib from "slugify";

export function slugify(value: string) {
  return slugifyLib(value, { lower: true, strict: true, trim: true });
}

export function uniqueSlug(base: string, suffix?: string) {
  return suffix ? `${slugify(base)}-${suffix}` : slugify(base);
}
