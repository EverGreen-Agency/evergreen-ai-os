/**
 * Criptografia de tokens OAuth — AES-256-GCM (CA3: dump do banco não vaza
 * token em claro; RF6: tokens por tenant, nunca em .env global).
 *
 * Formato do ciphertext: "v1.<iv b64>.<tag b64>.<payload b64>".
 * Chave: TOKEN_ENCRYPTION_KEY (32 bytes em base64) — server-only, fora do git.
 *
 * Obs.: sem `import "server-only"` aqui de propósito — o módulo não carrega
 * segredo algum em si (a chave é lida do env em runtime) e precisa ser
 * importável pelo vitest. Os call-sites (actions/queue) são server-only.
 */
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

const VERSION = "v1";
const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;

function getKey(): Buffer {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY ausente (32 bytes base64 — ver .env.example)",
    );
  }
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error("TOKEN_ENCRYPTION_KEY inválida: esperados 32 bytes em base64");
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, getKey(), iv);
  const payload = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    VERSION,
    iv.toString("base64"),
    tag.toString("base64"),
    payload.toString("base64"),
  ].join(".");
}

export function decryptToken(ciphertext: string): string {
  const parts = ciphertext.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new Error("Ciphertext de token em formato desconhecido");
  }
  const [, ivB64, tagB64, payloadB64] = parts;
  const decipher = createDecipheriv(ALGO, getKey(), Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(payloadB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}

/** Comparação constant-time para segredos curtos (evita timing attack). */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}
