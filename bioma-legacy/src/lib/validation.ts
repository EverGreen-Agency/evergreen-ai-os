import { z } from "zod";

/**
 * UUID no formato do Postgres (32 hex + hífens), SEM exigir versão RFC-9562.
 * O `z.string().uuid()`/`z.uuid()` do zod v4 rejeita uuids com nibble de
 * versão fora de 1-8 — mas o Postgres aceita qualquer hex (o seed de dev usa
 * ids fixos tipo 10000000-...). Use SEMPRE este schema para ids do banco.
 */
export const uuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    "invalid uuid",
  );
