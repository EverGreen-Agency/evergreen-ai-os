"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import { grantConsentAction } from "@/server/actions/lgpd";
import type { ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function ConsentForm({
  purposes,
}: {
  purposes: { id: string; tenantId: string; label: string }[];
}) {
  const t = useTranslations("lgpd.consents");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    grantConsentAction,
    {},
  );
  const [purposeId, setPurposeId] = useState(purposes[0]?.id ?? "");
  const tenantId = purposes.find((p) => p.id === purposeId)?.tenantId ?? "";

  if (purposes.length === 0) {
    return <p className="text-[12px] text-muted-foreground">{t("needPurpose")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-3 text-[12px]">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="consent-purpose">{t("purpose")}</Label>
        <Select
          id="consent-purpose"
          name="purposeId"
          value={purposeId}
          onChange={(e) => setPurposeId(e.target.value)}
          required
        >
          {purposes.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="consent-subject">{t("subjectLabel")}</Label>
        <Input
          id="consent-subject"
          name="subjectLabel"
          required
          minLength={2}
          maxLength={120}
          placeholder={t("subjectPlaceholder")}
        />
        <p className="text-[10px] text-muted-foreground">{t("subjectHint")}</p>
      </div>
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
