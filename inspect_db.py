import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('d:/NEXORA/.env')

db_url = os.getenv('DATABASE_URL')
# Change postgresql:// to postgresql+psycopg2:// if needed? Wait, psycopg2 connects using postgresql:// fine.

try:
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    """)
    tables = cursor.fetchall()
    print("Tables in public schema:")
    for table in tables:
        print(f"- {table[0]}")
        cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table[0]}'")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[0]} ({col[1]})")
            
    cursor.close()
    conn.close()
except Exception as e:
    print(f"Error: {e}")
