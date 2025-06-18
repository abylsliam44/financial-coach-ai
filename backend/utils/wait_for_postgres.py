import time
import psycopg2
import os

host = os.getenv("POSTGRES_HOST", "localhost")
port = os.getenv("POSTGRES_PORT", "5432")
user = os.getenv("POSTGRES_USER", "postgres")
password = os.getenv("POSTGRES_PASSWORD", "postgres")
dbname = os.getenv("POSTGRES_DB", "postgres")

while True:
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname
        )
        conn.close()
        print("✅ PostgreSQL is ready.")
        break
    except psycopg2.OperationalError:
        print("⏳ Waiting for PostgreSQL...")
        time.sleep(1)
