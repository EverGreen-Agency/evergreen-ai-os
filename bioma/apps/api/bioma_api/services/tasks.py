from uuid import UUID
from fastapi import HTTPException
from pydantic import TypeAdapter

from bioma_api.db import connect
from bioma_api.schemas.auth import CurrentUserResponse
from bioma_api.schemas.tasks import TaskList, TaskListCreate, Task, TaskCreate, TaskUpdate

def list_task_lists(workspace_id: UUID, user: CurrentUserResponse) -> list[TaskList]:
    # TODO: Add RLS/Workspace Access Checks
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, workspace_id, name, type, created_at, updated_at
                FROM eg_task_lists
                WHERE workspace_id = %s
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
                SELECT id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, created_at, updated_at
                FROM eg_tasks
                WHERE list_id = %s
            """, (str(list_id),))
            tasks_rows = cur.fetchall()
            
            tasks = []
            for row in tasks_rows:
                task = dict(row)
                
                cur.execute("""
                    SELECT id, task_id, field_name, field_value
                    FROM eg_task_custom_fields
                    WHERE task_id = %s
                """, (str(task["id"]),))
                task["custom_fields"] = [dict(cf) for cf in cur.fetchall()]
                
                cur.execute("""
                    SELECT id, task_id, depends_on_task_id, type
                    FROM eg_task_dependencies
                    WHERE task_id = %s
                """, (str(task["id"]),))
                task["dependencies"] = [dict(d) for d in cur.fetchall()]
                
                tasks.append(Task(**task))
            return tasks

def create_task(list_id: UUID, data: TaskCreate, user: CurrentUserResponse) -> Task:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO eg_tasks (list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, created_at, updated_at
            """, (
                str(list_id), data.title, data.description, data.status, data.group_status,
                data.priority, str(data.assignee_id) if data.assignee_id else None,
                str(data.owner_id) if data.owner_id else None, data.due_date
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
                
            conn.commit()
            
            task_row["custom_fields"] = custom_fields
            task_row["dependencies"] = deps
            return Task(**task_row)

def update_task(task_id: UUID, data: TaskUpdate, user: CurrentUserResponse) -> Task:
    update_fields = []
    params = []
    
    for field, value in data.model_dump(exclude_unset=True).items():
        update_fields.append(f"{field} = %s")
        if isinstance(value, UUID):
            params.append(str(value))
        else:
            params.append(value)
            
    if not update_fields:
        # TODO: Fetch and return existing
        raise HTTPException(status_code=400, detail="No fields provided for update")
        
    update_fields.append("updated_at = now()")
    params.append(str(task_id))
    
    query = f"""
        UPDATE eg_tasks 
        SET {', '.join(update_fields)}
        WHERE id = %s
        RETURNING id, list_id, title, description, status, group_status, priority, assignee_id, owner_id, due_date, created_at, updated_at
    """
    
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute(query, tuple(params))
            row = cur.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Task not found")
                
            task = dict(row)
            
            cur.execute("""
                SELECT id, task_id, field_name, field_value
                FROM eg_task_custom_fields
                WHERE task_id = %s
            """, (str(task["id"]),))
            task["custom_fields"] = [dict(cf) for cf in cur.fetchall()]
            
            cur.execute("""
                SELECT id, task_id, depends_on_task_id, type
                FROM eg_task_dependencies
                WHERE task_id = %s
            """, (str(task["id"]),))
            task["dependencies"] = [dict(d) for d in cur.fetchall()]
            
            conn.commit()
            return Task(**task)

def delete_task(task_id: UUID, user: CurrentUserResponse):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM eg_tasks WHERE id = %s RETURNING id", (str(task_id),))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Task not found")
            conn.commit()
