"""Tradução de status ClickUp → status de entregável do Bioma.

Função de classificação pura usada na projeção do legado ClickUp. Como o
ClickUp fica só como importador durante a migração (decisão 2026-07-22), o
mapeamento precisa ser resiliente a nomes de status arbitrários que vêm de
listas configuradas pelo cliente, sem cair no bucket errado.
"""

import pytest

from bioma_api.services.client_hub import _clickup_status_to_deliverable_status


@pytest.mark.parametrize(
    "clickup_status,esperado",
    [
        ("Done", "done"),
        ("Concluído", "done"),
        ("closed", "done"),
        ("finalizado", "done"),
        ("Blocked", "blocked"),
        ("bloqueado", "blocked"),
        ("Waiting approval", "waiting_approval"),
        ("Em aprovação", "waiting_approval"),
        ("Review", "waiting_approval"),
        ("In progress", "in_progress"),
        ("Em andamento", "in_progress"),
        ("doing", "in_progress"),
    ],
)
def test_status_conhecidos(clickup_status, esperado):
    assert _clickup_status_to_deliverable_status(clickup_status) == esperado


def test_status_desconhecido_cai_em_planned():
    assert _clickup_status_to_deliverable_status("Qualquer coisa") == "planned"


def test_none_cai_em_planned():
    # Sem status: default seguro, nunca "done".
    assert _clickup_status_to_deliverable_status(None) == "planned"


def test_case_insensitive():
    assert _clickup_status_to_deliverable_status("DONE") == "done"
    assert _clickup_status_to_deliverable_status("bLoCkEd") == "blocked"


def test_done_tem_precedencia_sobre_progress():
    # "done" é checado antes de "progress": um status que contém ambos vira done.
    assert _clickup_status_to_deliverable_status("progress done") == "done"
