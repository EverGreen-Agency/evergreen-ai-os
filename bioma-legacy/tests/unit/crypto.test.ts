/**
 * CA3 (parte token): token OAuth persistido cifrado — o ciphertext não pode
 * conter o token em claro e o roundtrip deve funcionar.
 */
import { randomBytes } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

import { decryptToken, encryptToken, safeEqual } from "@/server/crypto";

beforeAll(() => {
  process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("CA3 — criptografia de tokens OAuth (AES-256-GCM)", () => {
  const token = "EAAG-meta-access-token-super-secreto-1234567890";

  it("roundtrip encrypt → decrypt", () => {
    const ct = encryptToken(token);
    expect(decryptToken(ct)).toBe(token);
  });

  it("ciphertext NÃO contém o token em claro (nem em base64 óbvio)", () => {
    const ct = encryptToken(token);
    expect(ct).not.toContain(token);
    expect(ct).not.toContain(Buffer.from(token).toString("base64"));
    expect(ct.startsWith("v1.")).toBe(true);
  });

  it("IV aleatório: mesmo token cifra diferente a cada vez", () => {
    expect(encryptToken(token)).not.toBe(encryptToken(token));
  });

  it("ciphertext adulterado é rejeitado (GCM auth tag)", () => {
    const ct = encryptToken(token);
    const parts = ct.split(".");
    const corrupted = Buffer.from(parts[3], "base64");
    corrupted[0] = corrupted[0] ^ 0xff;
    parts[3] = corrupted.toString("base64");
    expect(() => decryptToken(parts.join("."))).toThrow();
  });

  it("chave errada não decifra", () => {
    const ct = encryptToken(token);
    process.env.TOKEN_ENCRYPTION_KEY = randomBytes(32).toString("base64");
    expect(() => decryptToken(ct)).toThrow();
  });

  it("safeEqual compara em tempo constante", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "ab")).toBe(false);
  });
});
