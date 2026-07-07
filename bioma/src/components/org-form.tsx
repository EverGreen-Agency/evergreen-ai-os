"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createOrgAction, type ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ORG_TYPES = ["client", "partner_agency", "agency_client", "independent"] as const;

export function OrgForm({ parents }: { parents: { id: string; name: string }[] }) {
  const t = useTranslations("admin.orgs");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createOrgAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name">{t("name")}</Label>
        <Input id="org-name" name="name" required minLength={2} maxLength={120} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-slug">{t("slug")}</Label>
        <Input
          id="org-slug"
          name="slug"
          required
          pattern="[a-z0-9][a-z0-9-]*"
          maxLength={60}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-type">{t("type")}</Label>
        <Select id="org-type" name="orgType" required>
          {ORG_TYPES.map((type) => (
            <option key={type} value={type}>
              {t(`types.${type}`)}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-parent">{t("parent")}</Label>
        <Select id="org-parent" name="parentOrgId" required>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive" role="alert">
          {tErrors(state.error)}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {tCommon("create")}
      </Button>
    </form>
  );
}
