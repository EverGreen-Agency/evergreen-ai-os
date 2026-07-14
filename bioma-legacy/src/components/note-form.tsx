"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

import { createNoteAction } from "@/server/actions/notes";
import type { ActionState } from "@/server/actions/orgs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NoteForm({ tenantId }: { tenantId: string }) {
  const t = useTranslations("landing.notes");
  const tErrors = useTranslations("common.errors");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createNoteAction,
    {},
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-title">{t("newTitle")}</Label>
            <Input id="note-title" name="title" required maxLength={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="note-body">{t("newBody")}</Label>
            <Input id="note-body" name="body" maxLength={5000} />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {tErrors(state.error)}
            </p>
          ) : null}
          <Button type="submit" disabled={pending}>
            {t("add")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
