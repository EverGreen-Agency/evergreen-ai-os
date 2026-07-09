"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createMemberAction } from "@/server/actions/members";
import type { ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES = ["tenant_admin", "operator", "client_viewer", "super_admin"] as const;

export function MemberForm({ orgs }: { orgs: { id: string; name: string }[] }) {
  const t = useTranslations("admin.members");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createMemberAction,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-email">{t("email")}</Label>
        <Input id="member-email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-name">{t("displayName")}</Label>
        <Input id="member-name" name="displayName" required minLength={2} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-password">{t("password")}</Label>
        <Input
          id="member-password"
          name="password"
          type="password"
          required
          minLength={10}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-org">{t("org")}</Label>
        <Select id="member-org" name="orgId" required>
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="member-role">{t("role")}</Label>
        <Select id="member-role" name="roleKey" required>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {t(`roles.${role}`)}
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
