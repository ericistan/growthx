export type Variant = "a" | "b";

export function assignVariant(anonymousVisitorId: string): Variant {
  let hash = 2166136261;
  for (const character of anonymousVisitorId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2 === 0 ? "a" : "b";
}
