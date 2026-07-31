from typing import Any
from uuid import UUID

MEMORY_COLUMNS = "id, workspace_id, category, title, body, authored_by, status, created_at, updated_at"
SKILL_COLUMNS = (
    "id, workspace_id, name, description, procedure, status, proposed_by, source_context, "
    "reviewed_by, reviewed_at, review_note, use_count, last_used_at, created_at, updated_at"
)


def list_memories(conn, workspace_id: UUID | None, include_global: bool, status: str = "active") -> list[dict]:
    """Memória do workspace + (se pedido) a global da EG, na mesma lista.

    `workspace_id=None` sem `include_global` não devolve nada — chamador deve
    pedir global explicitamente, nunca por omissão silenciosa.
    """
    if workspace_id and include_global:
        return conn.execute(
            f"""
            select {MEMORY_COLUMNS} from agent_memories
            where status = %s and (workspace_id = %s or workspace_id is null)
            order by workspace_id nulls last, category, created_at desc
            """,
            (status, workspace_id),
        ).fetchall()
    if workspace_id:
        return conn.execute(
            f"select {MEMORY_COLUMNS} from agent_memories where status = %s and workspace_id = %s order by category, created_at desc",
            (status, workspace_id),
        ).fetchall()
    return conn.execute(
        f"select {MEMORY_COLUMNS} from agent_memories where status = %s and workspace_id is null order by category, created_at desc",
        (status,),
    ).fetchall()


def get_memory(conn, memory_id: UUID) -> dict | None:
    return conn.execute(f"select {MEMORY_COLUMNS} from agent_memories where id = %s", (memory_id,)).fetchone()


def create_memory(
    conn, workspace_id: UUID | None, category: str, title: str, body: str, authored_by: UUID | None, reason: str
) -> dict:
    row = conn.execute(
        f"""
        insert into agent_memories (workspace_id, category, title, body, authored_by)
        values (%s, %s, %s, %s, %s)
        returning {MEMORY_COLUMNS}
        """,
        (workspace_id, category, title, body, authored_by),
    ).fetchone()
    conn.execute(
        """
        insert into agent_memory_revisions (memory_id, action, previous_body, new_body, actor_user_id, reason)
        values (%s, 'created', null, %s, %s, %s)
        """,
        (row["id"], body, authored_by, reason),
    )
    return row


def update_memory_body(conn, memory_id: UUID, new_body: str, actor_user_id: UUID | None, reason: str) -> dict | None:
    current = get_memory(conn, memory_id)
    if not current:
        return None
    row = conn.execute(
        f"update agent_memories set body = %s, updated_at = now() where id = %s returning {MEMORY_COLUMNS}",
        (new_body, memory_id),
    ).fetchone()
    conn.execute(
        """
        insert into agent_memory_revisions (memory_id, action, previous_body, new_body, actor_user_id, reason)
        values (%s, 'updated', %s, %s, %s, %s)
        """,
        (memory_id, current["body"], new_body, actor_user_id, reason),
    )
    return row


def set_memory_status(conn, memory_id: UUID, status: str, actor_user_id: UUID | None, reason: str) -> dict | None:
    current = get_memory(conn, memory_id)
    if not current:
        return None
    row = conn.execute(
        f"update agent_memories set status = %s, updated_at = now() where id = %s returning {MEMORY_COLUMNS}",
        (status, memory_id),
    ).fetchone()
    action = "archived" if status == "archived" else "restored"
    conn.execute(
        """
        insert into agent_memory_revisions (memory_id, action, previous_body, new_body, actor_user_id, reason)
        values (%s, %s, %s, %s, %s, %s)
        """,
        (memory_id, action, current["body"], current["body"], actor_user_id, reason),
    )
    return row


def list_memory_revisions(conn, memory_id: UUID) -> list[dict]:
    return conn.execute(
        """
        select id, memory_id, action, previous_body, new_body, actor_user_id, reason, created_at
        from agent_memory_revisions
        where memory_id = %s
        order by created_at desc
        """,
        (memory_id,),
    ).fetchall()


def list_skills(conn, workspace_id: UUID | None, include_global: bool, status: str | None = None) -> list[dict]:
    clauses = ["1 = 1"]
    params: list[Any] = []
    if status:
        clauses.append("status = %s")
        params.append(status)
    if workspace_id and include_global:
        clauses.append("(workspace_id = %s or workspace_id is null)")
        params.append(workspace_id)
    elif workspace_id:
        clauses.append("workspace_id = %s")
        params.append(workspace_id)
    else:
        clauses.append("workspace_id is null")
    where = " and ".join(clauses)
    return conn.execute(
        f"select {SKILL_COLUMNS} from agent_skills where {where} order by created_at desc",
        tuple(params),
    ).fetchall()


def get_skill(conn, skill_id: UUID) -> dict | None:
    return conn.execute(f"select {SKILL_COLUMNS} from agent_skills where id = %s", (skill_id,)).fetchone()


def create_skill(
    conn,
    workspace_id: UUID | None,
    name: str,
    description: str,
    procedure: str,
    proposed_by: UUID | None,
    source_context: str | None,
) -> dict:
    return conn.execute(
        f"""
        insert into agent_skills (workspace_id, name, description, procedure, proposed_by, source_context)
        values (%s, %s, %s, %s, %s, %s)
        returning {SKILL_COLUMNS}
        """,
        (workspace_id, name, description, procedure, proposed_by, source_context),
    ).fetchone()


def review_skill(conn, skill_id: UUID, status: str, reviewed_by: UUID, review_note: str | None) -> dict | None:
    return conn.execute(
        f"""
        update agent_skills
        set status = %s, reviewed_by = %s, reviewed_at = now(), review_note = %s, updated_at = now()
        where id = %s and status = 'pending_review'
        returning {SKILL_COLUMNS}
        """,
        (status, reviewed_by, review_note, skill_id),
    ).fetchone()


def retire_skill(conn, skill_id: UUID) -> dict | None:
    return conn.execute(
        f"update agent_skills set status = 'retired', updated_at = now() where id = %s and status = 'approved' returning {SKILL_COLUMNS}",
        (skill_id,),
    ).fetchone()


def record_skill_use(conn, skill_id: UUID) -> None:
    conn.execute(
        "update agent_skills set use_count = use_count + 1, last_used_at = now() where id = %s",
        (skill_id,),
    )
