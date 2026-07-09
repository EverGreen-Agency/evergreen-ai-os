"use client";

import { useRef } from "react";

import { switchOrgAction } from "@/server/actions/orgs";
import { Select } from "@/components/ui/select";

export function OrgSwitcher({
  orgs,
  activeOrgId,
  label,
}: {
  orgs: { id: string; name: string }[];
  activeOrgId: string;
  label: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={switchOrgAction}>
      <Select
        name="orgId"
        defaultValue={activeOrgId}
        aria-label={label}
        className="max-w-48"
        onChange={() => formRef.current?.requestSubmit()}
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
