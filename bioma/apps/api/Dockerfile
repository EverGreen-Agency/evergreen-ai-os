FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system bioma && useradd --system --gid bioma --create-home bioma

COPY --chown=bioma:bioma . .

USER bioma

EXPOSE 8000

CMD ["python", "scripts/start.py"]
