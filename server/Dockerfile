FROM dockerhub.timeweb.cloud/library/python:3.11-bookworm
# FROM python:3.11-bookworm

WORKDIR /app

# Сначала копируем только requirements для кэширования слоёв
COPY requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENTRYPOINT ["python", "src/main.py"]