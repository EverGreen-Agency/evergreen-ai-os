"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createCredentialAction } from "@/server/actions/vault";
import type { ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CredentialForm({ tenantId }: { tenantId: string }) {
  const t = useTranslations("vault.form");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createCredentialAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3" autoComplete="off">
      <input type="hidden" name="tenantId" value={tenantId} />
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-platform">{t("platform")}</Label>
        <Input id="cred-platform" name="platform" required minLength={2} maxLength={60} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-label">{t("label")}</Label>
        <Input id="cred-label" name="label" required minLength={2} maxLength={200} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-username">{t("username")}</Label>
        <Input id="cred-username" name="username" autoComplete="off" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-password">{t("password")}</Label>
        <Input id="cred-password" name="password" type="password" autoComplete="new-password" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-token">{t("token")}</Label>
        <Input id="cred-token" name="token" type="password" autoComplete="off" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-recovery">{t("recoveryCodes")}</Label>
        <Input id="cred-recovery" name="recoveryCodes" type="password" autoComplete="off" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cred-notes">{t("notes")}</Label>
        <Input id="cred-notes" name="notes" autoComplete="off" />
      </div>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {tErrors(state.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
