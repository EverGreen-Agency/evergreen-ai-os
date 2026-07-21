import sys, os, httpx, re
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')

# Adicionar pasta da api ao path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + "/.."))

from bioma_api.db import connect
from bioma_api.config import get_settings

settings = get_settings()
token = settings.clickup_api_token
if not token:
    raise SystemExit("CLICKUP_API_TOKEN is required to run the live ClickUp import.")
headers = {"Authorization": token}

def map_status_to_group(status_str: str) -> str:
    s = status_str.lower()
    if s in ["done", "completed", "finalizado", "publicado", "ready for release"]:
        return "DONE"
    if s in ["closed", "descartado"]:
        return "CLOSED"
    if s in ["in progress", "em produção", "roteirização", "em ajuste", "revisão interna", "aprovação cliente"]:
        return "ACTIVE"
    return "NOT_STARTED"

def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def resolve_custom_field_value(cf):
    val = cf.get("value")
    if val is None:
        return None
    cf_type = cf.get("type")
    options = cf.get("type_config", {}).get("options", [])
    
    if cf_type == "drop_down" and isinstance(val, int):
        for opt in options:
            if opt.get("orderindex") == val:
                return opt.get("name") or opt.get("label")
    elif cf_type in ["labels", "drop_down"] and isinstance(val, list):
        resolved = []
        for v in val:
            for opt in options:
                if opt.get("id") == v or str(opt.get("orderindex")) == str(v):
                    resolved.append(opt.get("name") or opt.get("label"))
        if resolved:
            return ", ".join(resolved)
    return str(val)

def run_import():
    print("🚀 Iniciando migração total de dados com resolução de campos do ClickUp...")

    with httpx.Client(timeout=30) as client:
        space_id = "90174075681"
        f_r = client.get(f"https://api.clickup.com/api/v2/space/{space_id}/folder", headers=headers)
        if f_r.status_code != 200:
            print(f"❌ Erro ao acessar ClickUp API: {f_r.status_code} - {f_r.text}")
            return
            
        folders = f_r.json().get("folders", [])
        
        with connect() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id FROM organizations WHERE type = 'eg' LIMIT 1")
                eg_org = cur.fetchone()
                if not eg_org:
                    print("❌ Organização EG não encontrada no banco.")
                    return
                eg_org_id = str(eg_org["id"])

                for folder in folders:
                    folder_name = folder["name"].strip()
                    folder_id = folder["id"]
                    
                    if "[TEMPLATE]" in folder_name:
                        print(f"\n⏩ Ignorando pasta modelo '{folder_name}'.")
                        continue

                    # Buscar ou criar cliente no Bioma
                    cur.execute("""
                        SELECT c.id as client_id, c.name as client_name, w.id as workspace_id
                        FROM clients c
                        JOIN workspaces w ON w.subject_organization_id = c.organization_id
                        WHERE LOWER(c.name) = LOWER(%s)
                    """, (folder_name,))
                    matched = cur.fetchone()

                    if not matched:
                        print(f"\n✨ Criando novo Cliente e Workspace no Bioma: '{folder_name}'...")
                        cur.execute("""
                            INSERT INTO organizations (name, slug, type)
                            VALUES (%s, %s, 'client')
                            RETURNING id
                        """, (folder_name, slugify(folder_name)))
                        client_org_id = str(cur.fetchone()["id"])

                        cur.execute("""
                            INSERT INTO clients (organization_id, name, status, responsible_name, clickup_folder_id)
                            VALUES (%s, %s, 'active', 'Eduardo EG', %s)
                            RETURNING id
                        """, (client_org_id, folder_name, folder_id))
                        client_id = str(cur.fetchone()["id"])

                        # 3. Criar Workspace do Cliente
                        cur.execute("""
                            INSERT INTO workspaces (tenant_organization_id, subject_organization_id, kind, name, slug, status)
                            VALUES (%s, %s, 'client', %s, %s, 'active')
                            RETURNING id
                        """, (eg_org_id, client_org_id, folder_name, slugify(folder_name)))
                        workspace_id = str(cur.fetchone()["id"])

                        # 4. Adicionar membros EG Admin a esta organização
                        cur.execute("SELECT user_id FROM memberships WHERE role = 'eg_admin'")
                        eg_admins = list(set([row["user_id"] for row in cur.fetchall()]))
                        for admin_uid in eg_admins:
                            cur.execute("""
                                INSERT INTO memberships (user_id, organization_id, role)
                                VALUES (%s, %s, 'eg_admin')
                                ON CONFLICT DO NOTHING
                            """, (admin_uid, client_org_id))
                    else:
                        workspace_id = str(matched["workspace_id"])
                        print(f"\n📦 Atualizando Cliente existente: '{matched['client_name']}' (Workspace ID: {workspace_id})...")

                    # Buscar listas da pasta no ClickUp
                    l_r = client.get(f"https://api.clickup.com/api/v2/folder/{folder_id}/list", headers=headers)
                    lists = l_r.json().get("lists", [])
                    
                    for l in lists:
                        list_name = l["name"]
                        list_id = l["id"]
                        
                        list_type = "general"
                        if "social" in list_name.lower():
                            list_type = "social"
                        elif "growth" in list_name.lower():
                            list_type = "growth"
                        elif "tech" in list_name.lower():
                            list_type = "tech"
                            
                        cur.execute("""
                            SELECT id FROM eg_task_lists
                            WHERE workspace_id = %s AND name = %s
                        """, (workspace_id, list_name))
                        existing_list = cur.fetchone()
                        
                        if existing_list:
                            bioma_list_id = str(existing_list["id"])
                        else:
                            cur.execute("""
                                INSERT INTO eg_task_lists (workspace_id, name, type)
                                VALUES (%s, %s, %s)
                                RETURNING id
                            """, (workspace_id, list_name, list_type))
                            bioma_list_id = str(cur.fetchone()["id"])
                            print(f"   ➕ Criada lista '{list_name}' no Bioma.")
                            
                        # Buscar tarefas da lista no ClickUp
                        t_r = client.get(f"https://api.clickup.com/api/v2/list/{list_id}/task?include_subtasks=true", headers=headers)
                        tasks = t_r.json().get("tasks", [])
                        
                        imported_count = 0
                        for t in tasks:
                            task_title = t["name"]
                            task_desc = t.get("text_content") or t.get("description") or ""
                            clickup_status = t["status"]["status"]
                            group_status = map_status_to_group(clickup_status)
                            
                            due_date = None
                            if t.get("due_date"):
                                due_date = datetime.fromtimestamp(int(t["due_date"])/1000, tz=timezone.utc)
                                
                            priority_str = None
                            if t.get("priority"):
                                pr_map = {"1": "Alta", "2": "Alta", "3": "Média", "4": "Baixa"}
                                priority_str = pr_map.get(str(t["priority"].get("id")), "Média")

                            # Buscar tarefa existente
                            cur.execute("SELECT id FROM eg_tasks WHERE list_id = %s AND title = %s", (bioma_list_id, task_title))
                            existing_task = cur.fetchone()
                            if existing_task:
                                bioma_task_id = str(existing_task["id"])
                            else:
                                cur.execute("""
                                    INSERT INTO eg_tasks (list_id, title, description, status, group_status, priority, due_date)
                                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                                    RETURNING id
                                """, (bioma_list_id, task_title, task_desc, clickup_status.upper(), group_status, priority_str, due_date))
                                bioma_task_id = str(cur.fetchone()["id"])
                            
                            # Limpar e re-inserir campos personalizados com valores resolvidos
                            cur.execute("DELETE FROM eg_task_custom_fields WHERE task_id = %s", (bioma_task_id,))
                            if t.get("custom_fields"):
                                for cf in t["custom_fields"]:
                                    resolved_val = resolve_custom_field_value(cf)
                                    if resolved_val:
                                        cur.execute("""
                                            INSERT INTO eg_task_custom_fields (task_id, field_name, field_value)
                                            VALUES (%s, %s, %s)
                                        """, (bioma_task_id, cf["name"], resolved_val))

                            imported_count += 1
                            
                        print(f"   ✅ Lista '{list_name}': {imported_count} tarefas processadas/atualizadas.")

                conn.commit()
                print("\n🎉 RESOLUÇÃO DE CAMPOS E IMPORTAÇÃO CONCLUÍDAS COM SUCESSO!")

if __name__ == "__main__":
    run_import()
