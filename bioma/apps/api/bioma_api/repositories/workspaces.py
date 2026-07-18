from uuid import UUID


def find_accessible_client(conn, context_id: UUID, is_admin: bool, user_id: UUID):
    """Resolve o adapter de cliente somente dentro de um workspace ativo.

    Platform admin pode operar tanto o workspace interno quanto workspaces
    cliente. Demais usuários precisam de membership `client_user` direta em um
    workspace `client`; membership na organização interna nunca basta.
    """
    return conn.execute(
        """
        select
          c.id,
          c.name,
          c.organization_id,
          c.clickup_folder_id,
          o.name as organization_name,
          o.enabled_modules,
          w.id as workspace_id,
          w.kind as workspace_kind
        from clients c
        join organizations o on o.id = c.organization_id
        join workspaces w
          on w.subject_organization_id = c.organization_id
         and w.status = 'active'
        left join memberships membership
          on membership.organization_id = c.organization_id
         and membership.user_id = %s
        where (w.id = %s or c.id = %s)
          and (
            %s
            or (w.kind = 'client' and membership.role = 'client_user')
          )
        order by case when w.id = %s then 0 else 1 end
        limit 1
        """,
        (user_id, context_id, context_id, is_admin, context_id),
    ).fetchone()


def find_accessible_organization(conn, organization_id: UUID, is_admin: bool, user_id: UUID):
    """Resolve uma organização operacional pelo mesmo gate de workspace."""
    return conn.execute(
        """
        select
          o.id as organization_id,
          o.enabled_modules,
          w.id as workspace_id,
          w.kind as workspace_kind
        from organizations o
        join workspaces w
          on w.subject_organization_id = o.id
         and w.status = 'active'
        left join memberships membership
          on membership.organization_id = o.id
         and membership.user_id = %s
        where o.id = %s
          and (
            %s
            or (w.kind = 'client' and membership.role = 'client_user')
          )
        """,
        (user_id, organization_id, is_admin),
    ).fetchone()


def list_accessible_workspaces(conn, is_admin: bool, user_id: UUID):
    return conn.execute(
        """
        select
          w.id,
          w.tenant_organization_id,
          tenant.name as tenant_name,
          tenant.slug as tenant_slug,
          w.subject_organization_id as organization_id,
          subject.name as organization_name,
          subject.slug as organization_slug,
          w.kind,
          w.name,
          w.slug,
          w.status,
          case when w.kind = 'client' then c.id end as client_id,
          case when w.kind = 'agency_internal' then c.id end as legacy_client_id,
          c.id as operational_client_id,
          case when w.kind = 'client' then c.status end as client_status,
          case when w.kind = 'client' then c.responsible_name end as responsible_name,
          subject.enabled_modules,
          case when %s then 'platform_admin' else membership.role end as access_role
        from workspaces w
        join organizations tenant on tenant.id = w.tenant_organization_id
        join organizations subject on subject.id = w.subject_organization_id
        left join clients c on c.organization_id = w.subject_organization_id
        left join memberships membership
          on membership.organization_id = w.subject_organization_id
         and membership.user_id = %s
        where w.status = 'active'
          and (
            %s
            or (w.kind = 'client' and membership.role = 'client_user')
          )
        order by
          case w.kind when 'agency_internal' then 0 else 1 end,
          lower(w.name),
          w.id
        """,
        (is_admin, user_id, is_admin),
    ).fetchall()


def find_platform_tenant_id(conn, user_id: UUID) -> UUID | None:
    row = conn.execute(
        """
        select o.id
        from memberships m
        join organizations o on o.id = m.organization_id
        where m.user_id = %s
          and m.role = 'eg_admin'
          and o.type = 'eg'
          and o.slug = 'eg'
        order by o.created_at asc
        limit 1
        """,
        (user_id,),
    ).fetchone()
    return row["id"] if row else None


def provision_agency_workspace(conn, organization_id: UUID, workspace_name: str) -> UUID:
    row = conn.execute(
        """
        insert into workspaces (
          tenant_organization_id,
          subject_organization_id,
          kind,
          name,
          slug
        )
        select %s, %s, 'agency_internal', %s, o.slug
        from organizations o
        where o.id = %s and o.type in ('eg', 'agency')
        on conflict (subject_organization_id)
        do update set
          name = excluded.name,
          slug = excluded.slug,
          status = 'active',
          updated_at = now()
        where workspaces.kind = 'agency_internal'
          and workspaces.tenant_organization_id = excluded.tenant_organization_id
        returning id
        """,
        (organization_id, organization_id, workspace_name, organization_id),
    ).fetchone()
    if not row:
        raise RuntimeError("Não foi possível provisionar o workspace interno sem violar seus invariantes.")
    return row["id"]


def provision_client_workspace(
    conn,
    tenant_organization_id: UUID,
    organization_id: UUID,
    name: str,
    slug: str,
) -> UUID:
    row = conn.execute(
        """
        insert into workspaces (
          tenant_organization_id,
          subject_organization_id,
          kind,
          name,
          slug
        )
        values (%s, %s, 'client', %s, %s)
        on conflict (subject_organization_id)
        do update set
          name = excluded.name,
          slug = excluded.slug,
          status = 'active',
          updated_at = now()
        where workspaces.kind = 'client'
          and workspaces.tenant_organization_id = excluded.tenant_organization_id
        returning id
        """,
        (tenant_organization_id, organization_id, name, slug),
    ).fetchone()
    if not row:
        raise RuntimeError("Não foi possível provisionar o workspace cliente sem violar seus invariantes.")
    return row["id"]


def update_client_workspace_name(conn, organization_id: UUID, name: str) -> None:
    conn.execute(
        """
        update workspaces
        set name = %s, updated_at = now()
        where subject_organization_id = %s and kind = 'client'
        """,
        (name, organization_id),
    )
