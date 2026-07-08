"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createPurposeAction } from "@/server/actions/lgpd";
import type { ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const LEGAL_BASES = [
  "consentimento",
  "legitimo_interesse",
  "execucao_contrato",
  "obrigacao_legal",
] as const;

export function PurposeForm({
  orgs,
  defaultOrgId,
  dataClasses,
}: {
  orgs: { id: string; name: string }[];
  defaultOrgId: string;
  dataClasses: string[];
}) {
  const t = useTranslations("lgpd.purposes");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createPurposeAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3 text-[12px]">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purpose-org">{t("org")}</Label>
        <Select id="purpose-org" name="tenantId" defaultValue={defaultOrgId} required>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purpose-text">{t("purpose")}</Label>
        <Input id="purpose-text" name="purpose" required minLength={5} maxLength={500} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="purpose-basis">{t("legalBasis")}</Label>
        <Select id="purpose-basis" name="legalBasis" required>
          {LEGAL_BASES.map((b) => (
            <option key={b} value={b}>
              {t(`bases.${b}`)}
            </option>
          ))}
        </Select>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-medium">{t("dataClasses")}</legend>
        <div className="grid grid-cols-2 gap-1">
          {dataClasses.map((c) => (
            <label key={c} className="flex items-center gap-1.5 font-mono">
              <input type="checkbox" name="dataClasses" value={c} className="accent-current" />
              {c}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex items-center gap-1.5">
        <input type="checkbox" name="externalAiAllowed" className="accent-current" />
        {t("externalAi")}
      </label>
      {state.error ? (
        <p className="text-destructive" role="alert">
          {tErrors(state.error)}
        </p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {tCommon("create")}
      </Button>
    </form>
  );
}
