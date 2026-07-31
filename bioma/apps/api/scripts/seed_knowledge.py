"""Importa a base de conhecimento de `seed_data/` para o Postgres.

Roda a cada boot (chamado por `start.py`, depois das migrações) e é
**idempotente**: reimportar não duplica nem sobrescreve edição feita dentro do
produto.

Por que este arquivo existe: Banco de Ideias, Stack e Arquitetura liam
`_opensquad/_memory/` do disco. Esse diretório fica FORA do contexto de build do
Dockerfile da API, então nunca existiu em staging/produção — as telas apareciam
vazias lá. Com o dado semeado no banco, elas passam a funcionar em qualquer
ambiente, e o repositório pode ser limpo.

Regra de sobrescrita: o seeder só atualiza o que ele mesmo semeou
(`seeded = true`). Vale para ideias, stack E documentos — qualquer registro
editado dentro do Bioma deixa de ser semente e nunca é revertido por redeploy.
"""

from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from bioma_api.db import connect  # noqa: E402

SEED_DIR = ROOT / "seed_data"


def _array(value) -> list[str]:
    if isinstance(value, list):
        return [str(item) for item in value if item]
    if value:
        return [str(value)]
    return []


def seed_ideas(conn) -> int:
    path = SEED_DIR / "ideas.json"
    if not path.exists():
        return 0
    payload = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for item in payload.get("ideas", []):
        slug = item.get("id")
        if not slug:
            continue
        conn.execute(
            """
            insert into eg_ideas (
              slug, title, description, category, stage, horizon, origin, source,
              readiness, part_of, depends_on, enables, archived
            )
            values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            on conflict (slug) do update set
              title = excluded.title,
              description = excluded.description,
              category = excluded.category,
              stage = excluded.stage,
              horizon = excluded.horizon,
              origin = excluded.origin,
              source = excluded.source,
              readiness = excluded.readiness,
              part_of = excluded.part_of,
              depends_on = excluded.depends_on,
              enables = excluded.enables,
              archived = excluded.archived,
              updated_at = now()
            -- Só atualiza enquanto o registro continua sendo semente. Editou
            -- pela tela? O deploy não reverte mais.
            where eg_ideas.seeded = true
            """,
            (
                slug,
                item.get("title") or slug,
                item.get("desc"),
                item.get("category"),
                item.get("stage"),
                item.get("horizon"),
                item.get("origin"),
                item.get("source"),
                item.get("readiness"),
                item.get("part_of"),
                _array(item.get("depends_on")),
                _array(item.get("enables")),
                bool(item.get("archived")),
            ),
        )
        count += 1
    return count


def seed_stack(conn) -> int:
    path = SEED_DIR / "stack.json"
    if not path.exists():
        return 0
    payload = json.loads(path.read_text(encoding="utf-8"))
    count = 0
    for item in payload.get("techs", []):
        slug = item.get("id")
        if not slug:
            continue
        conn.execute(
            """
            insert into eg_stack_techs (slug, name, ring, quadrant, note, adr, source)
            values (%s, %s, %s, %s, %s, %s, %s)
            on conflict (slug) do update set
              name = excluded.name,
              ring = excluded.ring,
              quadrant = excluded.quadrant,
              note = excluded.note,
              adr = excluded.adr,
              source = excluded.source,
              updated_at = now()
            where eg_stack_techs.seeded = true
            """,
            (
                slug,
                item.get("name") or slug,
                item.get("ring") or "assess",
                item.get("quadrant") or "tools",
                item.get("note"),
                item.get("adr"),
                item.get("source"),
            ),
        )
        count += 1
    return count


def seed_docs(conn) -> int:
    directory = SEED_DIR / "knowledge"
    if not directory.is_dir():
        return 0
    count = 0
    for path in sorted(directory.glob("*.md")):
        category, _, filename = path.name.partition("__")
        if category not in ("knowledge", "engineering", "architecture", "company"):
            category, filename = "knowledge", path.name
        content = path.read_text(encoding="utf-8", errors="replace")
        title = filename.removesuffix(".md")
        conn.execute(
            """
            insert into eg_knowledge_docs (path, category, title, content, seeded)
            values (%s, %s, %s, %s, true)
            on conflict (path) do update set
              content = excluded.content,
              title = excluded.title,
              updated_at = now()
            -- Só sobrescreve o que continua sendo semente: documento editado
            -- dentro do Bioma não é revertido por redeploy.
            where eg_knowledge_docs.seeded = true
            """,
            (path.name, category, title, content),
        )
        count += 1
    return count


def main() -> None:
    if not SEED_DIR.is_dir():
        print("seed_knowledge: seed_data/ ausente, nada a importar.")
        return
    with connect() as conn:
        ideas = seed_ideas(conn)
        techs = seed_stack(conn)
        docs = seed_docs(conn)
    print(f"seed_knowledge: {ideas} ideia(s), {techs} tecnologia(s), {docs} documento(s).")


if __name__ == "__main__":
    main()
