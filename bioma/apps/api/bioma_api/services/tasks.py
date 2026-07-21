from uuid import UUID
from datetime import datetime, timedelta
from fastapi import HTTPException

from bioma_api.db import connect
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.tasks import TaskList, TaskListCreate, Task, TaskCreate, TaskUpdate

def list_task_lists(workspace_id: UUID, user: CurrentUserResponse) -> list[TaskList]:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, workspace_id, name, type, created_at, updated_at
                FROM eg_task_lists
                WHERE workspace_id = %s
                ORDER BY created_at ASC
            """, (str(workspace_id),))
            rows = cur.fetchall()
            return [TaskList(**row) for row in rows]

def create_task_list(workspace_id: UUID, data: TaskListCreate, user: CurrentUserResponse) -> TaskList:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO eg_task_lists (workspace_id, name, type)
                VALUES (%s, %s, %s)
                RETURNING id, workspace_id, name, type, created_at, updated_at
            """, (str(workspace_id), data.name, data.type))
            row = cur.fetchone()
            conn.commit()
            return TaskList(**row)

def get_tasks_in_list(list_id: UUID, user: CurrentUserResponse) -> list[Task]:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence, created_at, updated_at
                FROM eg_tasks
                WHERE list_id = %s
                ORDER BY created_at DESC
            """, (str(list_id),))
            tasks_rows = cur.fetchall()
            if not tasks_rows:
                return []

            task_ids = [str(r["id"]) for r in tasks_rows]

            cur.execute("""
                SELECT id, task_id, field_name, field_value
                FROM eg_task_custom_fields
                WHERE task_id = ANY(%s)
            """, (task_ids,))
            cfs_by_task: dict[str, list[dict]] = {}
            for cf in cur.fetchall():
                tid = str(cf["task_id"])
                cfs_by_task.setdefault(tid, []).append(dict(cf))

            cur.execute("""
                SELECT id, task_id, depends_on_task_id, type
                FROM eg_task_dependencies
                WHERE task_id = ANY(%s)
            """, (task_ids,))
            deps_by_task: dict[str, list[dict]] = {}
            for dep in cur.fetchall():
                tid = str(dep["task_id"])
                deps_by_task.setdefault(tid, []).append(dict(dep))

            cur.execute("""
                SELECT id, task_id, title, is_completed, created_at, updated_at
                FROM eg_task_subtasks
                WHERE task_id = ANY(%s)
                ORDER BY created_at ASC
            """, (task_ids,))
            subtasks_by_task: dict[str, list[dict]] = {}
            for st in cur.fetchall():
                tid = str(st["task_id"])
                subtasks_by_task.setdefault(tid, []).append(dict(st))

            tasks = []
            for row in tasks_rows:
                task = dict(row)
                tid = str(task["id"])
                task["custom_fields"] = cfs_by_task.get(tid, [])
                task["dependencies"] = deps_by_task.get(tid, [])
                task["subtasks"] = subtasks_by_task.get(tid, [])
                tasks.append(Task(**task))
            return tasks

def create_task(list_id: UUID, data: TaskCreate, user: CurrentUserResponse) -> Task:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO eg_tasks (list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence, created_at, updated_at
            """, (
                str(list_id), data.title, data.description, data.status, data.group_status,
                data.priority, str(data.assignee_id) if data.assignee_id else None,
                str(data.owner_id) if data.owner_id else None, data.due_date, data.recurrence or "none"
            ))
            task_row = dict(cur.fetchone())
            task_id = str(task_row["id"])
            
            custom_fields = []
            for cf in data.custom_fields:
                cur.execute("""
                    INSERT INTO eg_task_custom_fields (task_id, field_name, field_value)
                    VALUES (%s, %s, %s)
                    RETURNING id, task_id, field_name, field_value
                """, (task_id, cf.field_name, cf.field_value))
                custom_fields.append(dict(cur.fetchone()))
                
            deps = []
            for dep in data.dependencies:
                cur.execute("""
                    INSERT INTO eg_task_dependencies (task_id, depends_on_task_id, type)
                    VALUES (%s, %s, %s)
                    RETURNING id, task_id, depends_on_task_id, type
                """, (task_id, str(dep.depends_on_task_id), dep.type))
                deps.append(dict(cur.fetchone()))

            subtasks = []
            for st in data.subtasks:
                cur.execute("""
                    INSERT INTO eg_task_subtasks (task_id, title, is_completed)
                    VALUES (%s, %s, %s)
                    RETURNING id, task_id, title, is_completed, created_at, updated_at
                """, (task_id, st.title, st.is_completed))
                subtasks.append(dict(cur.fetchone()))
                
            conn.commit()
            
            task_row["custom_fields"] = custom_fields
            task_row["dependencies"] = deps
            task_row["subtasks"] = subtasks
            return Task(**task_row)

def update_task(task_id: UUID, data: TaskUpdate, user: CurrentUserResponse) -> Task:
    update_data = data.model_dump(exclude_unset=True)
    custom_fields_update = update_data.pop("custom_fields", None)

    update_fields = []
    params = []
    
    for field, value in update_data.items():
        update_fields.append(f"{field} = %s")
        if isinstance(value, UUID):
            params.append(str(value))
        else:
            params.append(value)
            
    with connect() as conn:
        with conn.cursor() as cur:
            if update_fields:
                update_fields.append("updated_at = now()")
                params.append(str(task_id))
                
                query = f"""
                    UPDATE eg_tasks 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence, created_at, updated_at
                """
                cur.execute(query, tuple(params))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Task not found")
                task = dict(row)
            else:
                cur.execute("""
                    SELECT id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence, created_at, updated_at
                    FROM eg_tasks WHERE id = %s
                """, (str(task_id),))
                row = cur.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Task not found")
                task = dict(row)

            # Se custom_fields foi fornecido, sobrescrever
            if custom_fields_update is not None:
                cur.execute("DELETE FROM eg_task_custom_fields WHERE task_id = %s", (str(task_id),))
                for cf in custom_fields_update:
                    cur.execute("""
                        INSERT INTO eg_task_custom_fields (task_id, field_name, field_value)
                        VALUES (%s, %s, %s)
                    """, (str(task_id), cf["field_name"], cf["field_value"]))

            # Carregar custom_fields, dependencies e subtasks
            cur.execute("SELECT id, task_id, field_name, field_value FROM eg_task_custom_fields WHERE task_id = %s", (str(task_id),))
            task["custom_fields"] = [dict(cf) for cf in cur.fetchall()]

            cur.execute("SELECT id, task_id, depends_on_task_id, type FROM eg_task_dependencies WHERE task_id = %s", (str(task_id),))
            task["dependencies"] = [dict(d) for d in cur.fetchall()]

            cur.execute("SELECT id, task_id, title, is_completed, created_at, updated_at FROM eg_task_subtasks WHERE task_id = %s ORDER BY created_at ASC", (str(task_id),))
            task["subtasks"] = [dict(st) for st in cur.fetchall()]

            # Regra de Recorrência Automatizada (Growth/ClickUp Rule)
            if data.group_status in ["DONE", "CLOSED"] and task.get("recurrence") in ["weekly", "monthly"]:
                current_due = task["due_date"] or datetime.now()
                next_due = current_due + timedelta(days=7 if task["recurrence"] == "weekly" else 30)
                
                # Criar a próxima tarefa recorrente zerada
                cur.execute("""
                    INSERT INTO eg_tasks (list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, recurrence)
                    VALUES (%s, %s, %s, %s, 'NOT_STARTED', %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    str(task["list_id"]), task["title"], task["description"], "pending",
                    task["priority"], str(task["assignee_id"]) if task["assignee_id"] else None,
                    str(task["owner_id"]) if task["owner_id"] else None, next_due, task["recurrence"]
                ))
                new_task_id = str(cur.fetchone()["id"])
                
                # Copiar custom fields para a nova tarefa
                for cf in task["custom_fields"]:
                    cur.execute("""
                        INSERT INTO eg_task_custom_fields (task_id, field_name, field_value)
                        VALUES (%s, %s, %s)
                    """, (new_task_id, cf["field_name"], cf["field_value"]))

            conn.commit()
            return Task(**task)

def delete_task(task_id: UUID, user: CurrentUserResponse):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM eg_tasks WHERE id = %s RETURNING id", (str(task_id),))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Task not found")
            conn.commit()

def add_subtask(task_id: UUID, title: str, user: CurrentUserResponse):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO eg_task_subtasks (task_id, title, is_completed)
                VALUES (%s, %s, false)
                RETURNING id, task_id, title, is_completed, created_at, updated_at
            """, (str(task_id), title))
            row = dict(cur.fetchone())
            conn.commit()
            return row

def toggle_subtask(subtask_id: UUID, user: CurrentUserResponse):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE eg_task_subtasks
                SET is_completed = NOT is_completed, updated_at = now()
                WHERE id = %s
                RETURNING id, task_id, title, is_completed, created_at, updated_at
            """, (str(subtask_id),))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Subtask not found")
            conn.commit()
            return dict(row)

def delete_subtask(subtask_id: UUID, user: CurrentUserResponse):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM eg_task_subtasks WHERE id = %s RETURNING id", (str(subtask_id),))
            conn.commit()
