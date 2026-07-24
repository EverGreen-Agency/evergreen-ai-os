import json
from typing import Any
from uuid import UUID
from psycopg.rows import dict_row

def list_opportunities(conn, status_filter: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    query = """
        select id, source_platform, external_id, title, url, description, budget_text,
               fit_score, fit_analysis, status, raw_payload, created_at, updated_at
        from opportunity_radar
    """
    params = []
    if status_filter:
        query += " where status = %s"
        params.append(status_filter)
    query += " order by created_at desc limit %s"
    params.append(limit)

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, params)
        return list(cur.fetchall())

def create_opportunity(conn, data: dict[str, Any]) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into opportunity_radar (
                source_platform, external_id, title, url, description,
                budget_text, fit_score, fit_analysis, status, raw_payload
            ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            returning *
            """,
            (
                data["source_platform"],
                data.get("external_id"),
                data["title"],
                data.get("url"),
                data.get("description"),
                data.get("budget_text"),
                data.get("fit_score", 0),
                data.get("fit_analysis"),
                data.get("status", "new"),
                json.dumps(data.get("raw_payload", {})),
            ),
        )
        return dict(cur.fetchone())

def update_opportunity_status(conn, opp_id: UUID, status_val: str, fit_score: int | None = None, fit_analysis: str | None = None) -> dict[str, Any]:
    updates = ["status = %s", "updated_at = now()"]
    params = [status_val]
    if fit_score is not None:
        updates.append("fit_score = %s")
        params.append(fit_score)
    if fit_analysis is not None:
        updates.append("fit_analysis = %s")
        params.append(fit_analysis)
    params.append(opp_id)

    query = f"update opportunity_radar set {', '.join(updates)} where id = %s returning *"
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, params)
        return dict(cur.fetchone())

def list_proposals(conn, limit: int = 50) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select id, opportunity_id, client_name, target_niche, executive_summary,
                   scope_offer, scope_conversion, scope_demand, scope_items,
                   pricing_cents, delivery_days, status, public_token,
                   created_by_user_id, created_at, updated_at
            from commercial_proposals
            order by created_at desc
            limit %s
            """,
            (limit,),
        )
        return list(cur.fetchall())

def create_proposal(conn, data: dict[str, Any], user_id: UUID | None = None) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into commercial_proposals (
                opportunity_id, client_name, target_niche, executive_summary,
                scope_offer, scope_conversion, scope_demand, scope_items,
                pricing_cents, delivery_days, status, created_by_user_id
            ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            returning *
            """,
            (
                data.get("opportunity_id"),
                data["client_name"],
                data.get("target_niche"),
                data["executive_summary"],
                data.get("scope_offer"),
                data.get("scope_conversion"),
                data.get("scope_demand"),
                json.dumps(data.get("scope_items", [])),
                data.get("pricing_cents", 0),
                data.get("delivery_days", 15),
                data.get("status", "draft"),
                user_id,
            ),
        )
        return dict(cur.fetchone())

def update_proposal(conn, proposal_id: UUID, data: dict[str, Any]) -> dict[str, Any]:
    fields = []
    params = []
    for key, val in data.items():
        if val is not None and key not in ("id", "public_token", "created_at"):
            fields.append(f"{key} = %s")
            params.append(json.dumps(val) if isinstance(val, (dict, list)) else val)

    if not fields:
        with conn.cursor(row_factory=dict_row) as cur:
            cur.execute("select * from commercial_proposals where id = %s", (proposal_id,))
            return dict(cur.fetchone())

    fields.append("updated_at = now()")
    params.append(proposal_id)
    query = f"update commercial_proposals set {', '.join(fields)} where id = %s returning *"

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, params)
        return dict(cur.fetchone())

def get_proposal_by_public_token(conn, public_token: str) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            "select * from commercial_proposals where public_token = %s",
            (public_token,),
        )
        row = cur.fetchone()
        return dict(row) if row else None
