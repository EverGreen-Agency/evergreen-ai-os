import { getTranslations } from "next-intl/server";
import { FolderX } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

/**
 * Estado "memória interna indisponível" (CA7): mostrado quando o repo
 * `_opensquad/_memory` não existe neste ambiente (ex.: deploy cloud).
 * O cockpit degrada com elegância — nunca derruba o app.
 */
export async function MemoryUnavailable() {
  const t = await getTranslations("viveiro.unavailable");
  return (
    <Card>
      <CardContent className="flex items-start gap-3 pt-6">
        <FolderX className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div>
          <p className="font-medium">{t("title")}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t("body")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
