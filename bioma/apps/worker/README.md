# Bioma Worker

Processo assíncrono do Bioma.

Não deve existir por hábito. Entra quando houver necessidade real de:

- sincronização recorrente com ClickUp;
- processamento de webhook;
- retry/backoff;
- chamada de IA com latência/custo relevante;
- geração recorrente de relatório, brand book ou calendário.

No MVP inicial, este diretório fica como contrato de arquitetura.
