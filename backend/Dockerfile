FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir --default-timeout=100 --retries 5 -r requirements.txt

COPY . .

EXPOSE 8001

CMD ["python", "-m", "flask", "--app", "app.main:app", "run", "--host", "0.0.0.0", "--port", "8001"]
