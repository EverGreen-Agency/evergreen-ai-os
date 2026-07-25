import json
from typing import Any
from uuid import UUID
from psycopg.rows import dict_row

DEFAULT_PLATFORMS = [
    {"platform_key": "freelancer_br", "platform_name": "Freelancer.com.br", "status": "active", "monthly_cost_cents": 0, "notes": "RSS Feed XML Nativo Gratuito"},
    {"platform_key": "weworkremotely", "platform_name": "WeWorkRemotely", "status": "active", "monthly_cost_cents": 0, "notes": "Feed RSS Global de Vagas Remotas"},
    {"platform_key": "99freela", "platform_name": "99freela", "status": "active", "monthly_cost_cents": 0, "notes": "Varredura Pública e Captura Manual por URL"},
    {"platform_key": "workana", "platform_name": "Workana", "status": "paused", "monthly_cost_cents": 5990, "notes": "Subscrição Workana Pro / Token de Sessão"},
    {"platform_key": "upwork", "platform_name": "UpWork", "status": "paused", "monthly_cost_cents": 11500, "notes": "Plano Freelancer Plus / API Key Developer"},
    {"platform_key": "toptal", "platform_name": "Toptal & Ecossistema", "status": "not_configured", "monthly_cost_cents": 0, "notes": "Portal Privado / Ingestão por E-mail"},
    {"platform_key": "contra", "platform_name": "Contra.com / Malt", "status": "active", "monthly_cost_cents": 0, "notes": "Ingestão por URL / Webhook"},
    {"platform_key": "others", "platform_name": "Outras Plataformas", "status": "active", "monthly_cost_cents": 0, "notes": "Captura por Link / IA (Guru, Jobbers, etc)"},
]

def ensure_platform_configs_table(conn):
    with conn.cursor() as cur:
        cur.execute("""
            create table if not exists opportunity_platform_configs (
                id uuid primary key default gen_random_uuid(),
                platform_key varchar(50) not null unique,
                platform_name varchar(100) not null,
                status varchar(20) not null default 'active',
                rss_url text,
                api_key_or_token text,
                monthly_cost_cents bigint not null default 0,
                notes text,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            );
            create table if not exists freelancer_profiles (
                id uuid primary key default gen_random_uuid(),
                platform_key varchar(50) not null,
                profile_url text not null unique,
                profile_name varchar(255),
                headline text,
                bio text,
                skills jsonb default '[]'::jsonb,
                portfolio_items jsonb default '[]'::jsonb,
                audit_score integer default 0,
                audit_analysis jsonb default '{}'::jsonb,
                last_audited_at timestamptz,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            );
            create table if not exists tech_skill_inventory (
                id uuid primary key default gen_random_uuid(),
                skill_name varchar(100) not null unique,
                category varchar(50) not null default 'general',
                status varchar(20) not null default 'available',
                case_count integer not null default 1,
                notes text,
                created_at timestamptz not null default now(),
                updated_at timestamptz not null default now()
            );
            create table if not exists opportunity_skill_gaps (
                id uuid primary key default gen_random_uuid(),
                opportunity_id uuid references opportunity_radar(id) on delete cascade,
                missing_skill varchar(100) not null,
                impact_level varchar(20) not null default 'high',
                opportunity_title text not null,
                opportunity_url text,
                status varchar(20) not null default 'open',
                created_at timestamptz not null default now()
            );
            alter table commercial_proposals add column if not exists attached_cases jsonb default '[]'::jsonb;
            alter table commercial_proposals add column if not exists win_loss_feedback text;
        """)

def list_tech_skills(conn) -> list[dict[str, Any]]:
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from tech_skill_inventory order by case_count desc, skill_name asc")
        return list(cur.fetchall())

def upsert_tech_skill(conn, skill_name: str, category: str = "general", notes: str | None = None) -> dict[str, Any]:
    ensure_platform_configs_table(conn)
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
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from opportunity_skill_gaps where status = %s order by created_at desc", (status_val,))
        return list(cur.fetchall())

def create_skill_gap(conn, opp_id: UUID | None, missing_skill: str, opp_title: str, opp_url: str | None = None) -> dict[str, Any]:
    ensure_platform_configs_table(conn)
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
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("update opportunity_skill_gaps set status = 'resolved' where id = %s returning *", (gap_id,))
        row = cur.fetchone()
        if row:
            upsert_tech_skill(conn, row["missing_skill"], category="general", notes=f"Adicionado via resolução do gap em '{row['opportunity_title']}'")
            return dict(row)
        return {}

def find_matching_cases_for_opportunity(conn, opp_title: str, opp_description: str | None) -> list[dict[str, Any]]:
    ensure_platform_configs_table(conn)
    skills = list_tech_skills(conn)
    matched_cases = []
    text_search = (opp_title + " " + (opp_description or "")).lower()

    for skill in skills:
        if skill["status"] == "available" and skill["skill_name"].lower() in text_search:
            matched_cases.append({
                "case_title": f"Projeto de Sucesso com {skill['skill_name']}",
                "description": skill.get("notes") or f"Case validado de implementação de {skill['skill_name']} para clientes B2B.",
                "skill": skill["skill_name"],
                "results_highlight": "+40% de conversão e redução de CPL",
            })

    if not matched_cases:
        matched_cases.append({
            "case_title": "Case Geral de Growth & Tração B2B EverGreen",
            "description": "Estrutura completa de aquisição de clientes com tráfego pago, funil de vendas e automação de atendimento.",
            "skill": "Growth B2B",
            "results_highlight": "Arquitetura escalável de vendas e captação de leads",
        })

    return matched_cases[:3]


def list_freelancer_profiles(conn) -> list[dict[str, Any]]:
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from freelancer_profiles order by updated_at desc")
        return list(cur.fetchall())

def upsert_freelancer_profile(conn, data: dict[str, Any]) -> dict[str, Any]:
    ensure_platform_configs_table(conn)
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
    ensure_platform_configs_table(conn)
    with conn.cursor() as cur:
        cur.execute("delete from freelancer_profiles where id = %s", (profile_id,))
        return cur.rowcount > 0


def list_platform_configs(conn) -> list[dict[str, Any]]:
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute("select * from opportunity_platform_configs order by created_at asc")
        existing = {r["platform_key"]: dict(r) for r in cur.fetchall()}
        
        # Seed defaults if not inserted
        for p in DEFAULT_PLATFORMS:
            if p["platform_key"] not in existing:
                cur.execute(
                    """
                    insert into opportunity_platform_configs (platform_key, platform_name, status, monthly_cost_cents, notes)
                    values (%s, %s, %s, %s, %s)
                    returning *
                    """,
                    (p["platform_key"], p["platform_name"], p["status"], p["monthly_cost_cents"], p["notes"]),
                )
                existing[p["platform_key"]] = dict(cur.fetchone())
        return list(existing.values())

def upsert_platform_config(conn, platform_key: str, data: dict[str, Any]) -> dict[str, Any]:
    ensure_platform_configs_table(conn)
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(
            """
            insert into opportunity_platform_configs (platform_key, platform_name, status, rss_url, api_key_or_token, monthly_cost_cents, notes)
            values (%s, %s, %s, %s, %s, %s, %s)
            on conflict (platform_key) do update set
                status = excluded.status,
                rss_url = excluded.rss_url,
                api_key_or_token = excluded.api_key_or_token,
                monthly_cost_cents = excluded.monthly_cost_cents,
                notes = excluded.notes,
                updated_at = now()
            returning *
            """,
            (
                platform_key,
                data.get("platform_name", platform_key.capitalize()),
                data.get("status", "active"),
                data.get("rss_url"),
                data.get("api_key_or_token"),
                data.get("monthly_cost_cents", 0),
                data.get("notes"),
            ),
        )
        result = dict(cur.fetchone())

        # Registra despesa financeira se custo mensal for informado
        cost = data.get("monthly_cost_cents", 0)
        if cost > 0:
            p_name = result["platform_name"]
            cur.execute(
                """
                insert into financial_records (title, amount_cents, kind, status, due_date, notes)
                values (%s, %s, 'expense', 'paid', current_date, %s)
                """,
                (f"Assinatura Plataforma: {p_name}", cost, f"Despesa recorrente de prospecção em {p_name}"),
            )

        return result


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

def get_proposal_analytics_metrics(conn) -> dict[str, Any]:
    proposals = list_proposals(conn, limit=500)
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

        platform = (prop.get("target_niche") or "Outros").capitalize()
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

    decided_proposals = status_counts["won"] + status_counts["lost"] + status_counts["sent"]
    win_rate = round((status_counts["won"] / decided_proposals * 100), 1) if decided_proposals > 0 else 0.0
    avg_won_ticket = round(total_won_value_cents / status_counts["won"]) if status_counts["won"] > 0 else 0

    platform_performance = []
    for p_name, p_data in platform_map.items():
        p_decided = p_data["won"] + p_data["lost"] + p_data["sent"]
        p_win_rate = round((p_data["won"] / p_decided * 100), 1) if p_decided > 0 else 0.0
        platform_performance.append({
            "platform_name": p_name,
            "total_proposals": p_data["total"],
            "won_proposals": p_data["won"],
            "lost_proposals": p_data["lost"],
            "win_rate_percentage": p_win_rate,
            "won_revenue_cents": p_data["won_value_cents"],
        })

    platform_performance.sort(key=lambda x: x["won_revenue_cents"], reverse=True)

    return {
        "total_proposals": total_proposals,
        "status_counts": status_counts,
        "win_rate_percentage": win_rate,
        "total_pipeline_value_cents": total_pipeline_value_cents,
        "total_won_value_cents": total_won_value_cents,
        "average_won_ticket_cents": avg_won_ticket,
        "platform_performance": platform_performance,
    }

