// 12 base32-ish characters excluding 0/O, 1/I, L, U (accidental words). 32^12 ≈ 1.15e18 ≈ 60 bits of entropy.
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateToken(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let raw = "";
  for (let i = 0; i < 12; i++) raw += ALPHABET[bytes[i] % ALPHABET.length];
  // Format: DMI-BIZ-XXXX-XXXX-XXXX
  return `DMI-BIZ-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}`;
}

export function maskToken(token: string): string {
  // Keeps the first 4-character group visible so support can look it up without seeing the whole token.
  return token.replace(/^DMI-BIZ-([A-Z0-9]{4})-.*$/, "DMI-BIZ-$1-****-****");
}

export async function hashToken(token: string, pepper: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(pepper),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(token.trim().toUpperCase()),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
