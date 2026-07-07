"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";

import {
  revealCredentialAction,
  setCredentialStatusAction,
  type RevealedSecrets,
} from "@/server/actions/vault";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type CredentialMeta = {
  id: string;
  platform: string;
  label: string;
  status: string;
  updatedAt: string;
};

const STATUS_VARIANT: Record<string, "secondary" | "destructive" | "outline"> = {
  active: "secondary",
  expired: "outline",
  rotating: "outline",
  compromised: "destructive",
  revoked: "destructive",
};

export function CredentialRow({
  credential,
  tenantId,
  canReveal,
  canManage,
}: {
  credential: CredentialMeta;
  tenantId: string;
  canReveal: boolean;
  canManage: boolean;
}) {
  const t = useTranslations("vault");
  const [revealOpen, setRevealOpen] = useState(false);
  const [state, revealAction, pending] = useActionState<RevealedSecrets, FormData>(
    revealCredentialAction,
    {},
  );

  const blocked = credential.status === "revoked" || credential.status === "compromised";
  const secretEntries = state.secrets
    ? (
        [
          ["username", state.secrets.username],
          ["password", state.secrets.password],
          ["token", state.secrets.token],
          ["recoveryCodes", state.secrets.recoveryCodes],
          ["notes", state.secrets.notes],
        ] as const
      ).filter(([, v]) => v)
    : [];

  return (
    <>
      <tr className="border-b border-border/60">
        <td className="py-2 pr-4 font-mono text-xs">{credential.platform}</td>
        <td className="py-2 pr-4 font-medium">{credential.label}</td>
        <td className="py-2 pr-4">
          <Badge variant={STATUS_VARIANT[credential.status] ?? "outline"}>
            {t(`status.${credential.status}`)}
          </Badge>
        </td>
        <td className="py-2 pr-4 whitespace-nowrap text-muted-foreground">
          {new Date(credential.updatedAt).toLocaleString()}
        </td>
        <td className="py-2 text-right">
          <div className="flex justify-end gap-1">
            {canReveal && !blocked ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealOpen((v) => !v)}
              >
                {revealOpen ? t("reveal.hide") : t("reveal.button")}
              </Button>
            ) : null}
            {canManage ? (
              <StatusButtons credential={credential} tenantId={tenantId} />
            ) : null}
          </div>
        </td>
      </tr>
      {revealOpen ? (
        <tr className="border-b border-border/60 bg-muted/40">
          <td colSpan={5} className="p-3">
            {blocked ? (
              <p className="text-sm text-destructive">{t("reveal.blocked")}</p>
            ) : secretEntries.length > 0 ? (
              <dl className="grid gap-2 sm:grid-cols-2">
                {secretEntries.map(([key, value]) => (
                  <div key={key} className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">
                      {t(`reveal.${key}`)}
                    </dt>
                    <dd className="break-all font-mono text-sm">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <form action={revealAction} className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <input type="hidden" name="credentialId" value={credential.id} />
                <input type="hidden" name="tenantId" value={tenantId} />
                <div className="flex flex-1 flex-col gap-1">
                  <Label htmlFor={`reason-${credential.id}`} className="text-xs">
                    {t("reveal.reasonLabel")}
                  </Label>
                  <Input
                    id={`reason-${credential.id}`}
                    name="reason"
                    required
                    minLength={3}
                    maxLength={500}
                    placeholder={t("reveal.reasonPlaceholder")}
                  />
                </div>
                {state.error ? (
                  <p className="text-sm text-destructive" role="alert">
                    {state.error === "credential_blocked"
                      ? t("errors.credential_blocked")
                      : t("reveal.blocked")}
                  </p>
                ) : null}
                <Button type="submit" size="sm" disabled={pending}>
                  {t("reveal.confirm")}
                </Button>
              </form>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function StatusButtons({
  credential,
  tenantId,
}: {
  credential: CredentialMeta;
  tenantId: string;
}) {
  const t = useTranslations("vault.actions");
  const next: Array<{ status: string; label: string; variant: "outline" | "destructive" | "secondary" }> =
    credential.status === "active"
      ? [
          { status: "rotating", label: t("rotate"), variant: "outline" },
          { status: "compromised", label: t("markCompromised"), variant: "destructive" },
          { status: "revoked", label: t("revoke"), variant: "destructive" },
        ]
      : [{ status: "active", label: t("reactivate"), variant: "secondary" }];

  return (
    <>
      {next.map((n) => (
        <form key={n.status} action={setCredentialStatusAction}>
          <input type="hidden" name="credentialId" value={credential.id} />
          <input type="hidden" name="tenantId" value={tenantId} />
          <input type="hidden" name="status" value={n.status} />
          <Button type="submit" size="sm" variant={n.variant}>
            {n.label}
          </Button>
        </form>
      ))}
    </>
  );
}
