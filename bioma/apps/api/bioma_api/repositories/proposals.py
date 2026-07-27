import json
from typing import Any
from uuid import UUID
from psycopg.rows import dict_row

def list_tech_skills(conn) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from tech_skill_inventory order by case_count desc, skill_name asc")
        return list(cur.fetchall())

def upsert_tech_skill(conn, skill_name: str, category: str = "general", notes: str | None = None) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into tech_skill_inventory (skill_name, category, status, case_count, notes)
            values (%s, %s, 'available', 1, %s)
            on conflict (skill_name) do update set
                category = excluded.category,
                status = 'available',
                notes = coalesce(excluded.notes, tech_skill_inventory.notes),
                updated_at = now()
            returning *
            """,
            (skill_name, category, notes),
        )
        return dict(cur.fetchone())

def list_skill_gaps(conn, status_val: str = "open") -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from opportunity_skill_gaps where status = %s order by created_at desc", (status_val,))
        return list(cur.fetchall())

def create_skill_gap(conn, opp_id: UUID | None, missing_skill: str, opp_title: str, opp_url: str | None = None) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into opportunity_skill_gaps (opportunity_id, missing_skill, opportunity_title, opportunity_url)
            values (%s, %s, %s, %s)
            returning *
            """,
            (opp_id, missing_skill, opp_title, opp_url),
        )
        return dict(cur.fetchone())

def resolve_skill_gap(conn, gap_id: UUID) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("update opportunity_skill_gaps set status = 'resolved' where id = %s returning *", (gap_id,))
        row = cur.fetchone()
        if row:
            upsert_tech_skill(conn, row["missing_skill"], category="general", notes=f"Adicionado via resolução do gap em '{row['opportunity_title']}'")
            return dict(row)
        return {}

def find_matching_cases_for_opportunity(conn, opp_title: str, opp_description: str | None) -> list[dict[str, Any]]:
    # O inventário de habilidades não é evidência de case. Enquanto não houver
    # uma biblioteca de cases aprovada, nenhuma prova social é fabricada.
    return []


def list_freelancer_profiles(conn) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from freelancer_profiles order by updated_at desc")
        return list(cur.fetchall())

def upsert_freelancer_profile(conn, data: dict[str, Any]) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into freelancer_profiles (
                platform_key, profile_url, profile_name, headline, bio,
                audit_score, audit_analysis, last_audited_at
            ) values (%s, %s, %s, %s, %s, %s, %s, now())
            on conflict (profile_url) do update set
                platform_key = excluded.platform_key,
                profile_name = excluded.profile_name,
                headline = excluded.headline,
                bio = excluded.bio,
                audit_score = excluded.audit_score,
                audit_analysis = excluded.audit_analysis,
                last_audited_at = now(),
                updated_at = now()
            returning *
            """,
            (
                data.get("platform_key", "other"),
                data["profile_url"],
                data.get("profile_name", "Perfil Freelancer"),
                data.get("headline"),
                data.get("bio"),
                data.get("audit_score", 0),
                json.dumps(data.get("audit_analysis", {})),
            ),
        )
        return dict(cur.fetchone())

def delete_freelancer_profile(conn, profile_id: UUID) -> bool:
    with conn.cursor() as cur:
        cur.execute("delete from freelancer_profiles where id = %s", (profile_id,))
        return cur.rowcount > 0


def list_platform_configs(conn) -> list[dict[str, Any]]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select id, platform_key, platform_name, status, rss_url,
                   monthly_cost_cents, notes, created_at, updated_at
            from opportunity_platform_configs
            order by created_at asc
            """
        )
        return list(cur.fetchall())

def upsert_platform_config(conn, platform_key: str, data: dict[str, Any]) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into opportunity_platform_configs (
                platform_key, platform_name, status, rss_url, monthly_cost_cents, notes
            )
            values (%s, %s, %s, %s, %s, %s)
            on conflict (platform_key) do update set
                platform_name = excluded.platform_name,
                status = excluded.status,
                rss_url = excluded.rss_url,
                monthly_cost_cents = excluded.monthly_cost_cents,
                notes = excluded.notes,
                updated_at = now()
            returning id, platform_key, platform_name, status, rss_url,
                      monthly_cost_cents, notes, created_at, updated_at
            """,
            (
                platform_key,
                data.get("platform_name", platform_key.capitalize()),
                data.get("status", "active"),
                data.get("rss_url"),
                data.get("monthly_cost_cents", 0),
                data.get("notes"),
            ),
        )
        return dict(cur.fetchone())


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

def find_existing_opportunity(conn, url: str | None, source_platform: str, title: str) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        if url and url.strip():
            cur.execute("select * from opportunity_radar where url = %s limit 1", (url.strip(),))
            row = cur.fetchone()
            if row:
                return dict(row)
        cur.execute("select * from opportunity_radar where source_platform = %s and title = %s limit 1", (source_platform, title))
        row = cur.fetchone()
        return dict(row) if row else None


def get_opportunity(conn, opportunity_id: UUID) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from opportunity_radar where id = %s", (opportunity_id,))
        row = cur.fetchone()
        return dict(row) if row else None

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
            select cp.id, cp.opportunity_id, cp.client_name, cp.target_niche, cp.executive_summary,
                   cp.scope_offer, cp.scope_conversion, cp.scope_demand, cp.scope_items,
                   cp.attached_cases, cp.win_loss_feedback,
                   cp.pricing_cents, cp.delivery_days, cp.status, cp.public_token,
                   cp.generation_mode, cp.public_expires_at, cp.created_by_user_id,
                   cp.created_at, cp.updated_at,
                   coalesce(o.source_platform, cp.target_niche, 'Outros') as source_platform
            from commercial_proposals cp
            left join opportunity_radar o on o.id = cp.opportunity_id
            order by cp.created_at desc
            limit %s
            """,
            (limit,),
        )
        return list(cur.fetchall())

def create_proposal(conn, data: dict[str, Any], user_id: UUID | None = None) -> dict[str, Any]:
    with conn.cursor(row_factory=dict_row) as cur:
        valid_user_id = None
        if user_id:
            cur.execute("select id from users where id = %s", (user_id,))
            if cur.fetchone():
                valid_user_id = user_id

        cur.execute(
            """
            insert into commercial_proposals (
                opportunity_id, client_name, target_niche, executive_summary,
                scope_offer, scope_conversion, scope_demand, scope_items,
                attached_cases, pricing_cents, delivery_days, status,
                generation_mode, created_by_user_id
            ) values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
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
                json.dumps(data.get("attached_cases", [])),
                data.get("pricing_cents", 0),
                data.get("delivery_days", 0),
                data.get("status", "draft"),
                data.get("generation_mode", "manual"),
                valid_user_id,
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
            row = cur.fetchone()
            return dict(row) if row else {}

    fields.append("updated_at = now()")
    params.append(proposal_id)
    query = f"update commercial_proposals set {', '.join(fields)} where id = %s returning *"

    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query, params)
        row = cur.fetchone()
        return dict(row) if row else {}

def get_proposal_by_public_token(conn, public_token: str) -> dict[str, Any] | None:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            select *
            from commercial_proposals
            where public_token = %s and public_expires_at > now()
            """,
            (public_token,),
        )
        row = cur.fetchone()
        return dict(row) if row else None

def get_proposal_analytics_metrics(conn) -> dict[str, Any]:
    proposals = list_proposals(conn, limit=500)
    configs = list_platform_configs(conn)
    cost_by_platform_key: dict[str, int] = {c["platform_key"]: c.get("monthly_cost_cents", 0) for c in configs}
    cost_by_platform_name: dict[str, int] = {c["platform_name"].lower(): c.get("monthly_cost_cents", 0) for c in configs}

    total_proposals = len(proposals)
    
    status_counts = {"draft": 0, "sent": 0, "won": 0, "lost": 0}
    total_pipeline_value_cents = 0
    total_won_value_cents = 0
    
    platform_map: dict[str, dict[str, Any]] = {}

    for prop in proposals:
        st = prop.get("status", "draft")
        if st in status_counts:
            status_counts[st] += 1
        else:
            status_counts["draft"] += 1
            
        price = prop.get("pricing_cents", 0) or 0
        total_pipeline_value_cents += price
        
        if st == "won":
            total_won_value_cents += price

        platform = prop.get("source_platform") or "Outros"
        if platform not in platform_map:
            platform_map[platform] = {"total": 0, "won": 0, "lost": 0, "sent": 0, "total_value_cents": 0, "won_value_cents": 0}
            
        platform_map[platform]["total"] += 1
        platform_map[platform]["total_value_cents"] += price
        if st == "won":
            platform_map[platform]["won"] += 1
            platform_map[platform]["won_value_cents"] += price
        elif st == "lost":
            platform_map[platform]["lost"] += 1
        elif st == "sent":
            platform_map[platform]["sent"] += 1

    decided_proposals = status_counts["won"] + status_counts["lost"]
    win_rate = round((status_counts["won"] / decided_proposals * 100), 1) if decided_proposals > 0 else 0.0
    avg_won_ticket = round(total_won_value_cents / status_counts["won"]) if status_counts["won"] > 0 else 0

    total_platform_investment_cents = sum(c.get("monthly_cost_cents", 0) for c in configs)
    net_growth_profit_cents = total_won_value_cents - total_platform_investment_cents
    overall_roi = round((net_growth_profit_cents / total_platform_investment_cents * 100), 1) if total_platform_investment_cents > 0 else 0.0

    platform_performance = []
    for p_name, p_data in platform_map.items():
        p_lower = p_name.lower()
        # Find matching platform cost
        m_cost = 0
        for pk, cost in cost_by_platform_key.items():
            if pk in p_lower or p_lower in pk:
                m_cost = cost
                break
        if m_cost == 0 and p_lower in cost_by_platform_name:
            m_cost = cost_by_platform_name[p_lower]

        p_decided = p_data["won"] + p_data["lost"]
        p_win_rate = round((p_data["won"] / p_decided * 100), 1) if p_decided > 0 else 0.0
        
        cpp_cents = round(m_cost / p_data["total"]) if p_data["total"] > 0 else 0
        cac_cents = round(m_cost / p_data["won"]) if p_data["won"] > 0 else 0
        net_profit_cents = p_data["won_value_cents"] - m_cost
        p_roi = round((net_profit_cents / m_cost * 100), 1) if m_cost > 0 else 0.0

        platform_performance.append({
            "platform_name": p_name,
            "monthly_cost_cents": m_cost,
            "total_proposals": p_data["total"],
            "won_proposals": p_data["won"],
            "lost_proposals": p_data["lost"],
            "win_rate_percentage": p_win_rate,
            "cost_per_proposal_cents": cpp_cents,
            "cac_cents": cac_cents,
            "won_revenue_cents": p_data["won_value_cents"],
            "net_profit_cents": net_profit_cents,
            "roi_percentage": p_roi,
        })

    platform_performance.sort(key=lambda x: x["won_revenue_cents"], reverse=True)

    return {
        "total_proposals": total_proposals,
        "status_counts": status_counts,
        "win_rate_percentage": win_rate,
        "total_pipeline_value_cents": total_pipeline_value_cents,
        "total_won_value_cents": total_won_value_cents,
        "average_won_ticket_cents": avg_won_ticket,
        "total_platform_investment_cents": total_platform_investment_cents,
        "net_growth_profit_cents": net_growth_profit_cents,
        "overall_roi_percentage": overall_roi,
        "platform_performance": platform_performance,
    }
