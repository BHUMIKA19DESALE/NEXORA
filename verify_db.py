import sys
from dotenv import load_dotenv

# Ensure we use psycopg2
load_dotenv('.env')

from backend.database import engine, Base
from backend.models import *

def main():
    try:
        print("Testing Supabase connection...")
        with engine.connect() as conn:
            print("Connection successful!")
            
        print("Verifying/Creating tables in Supabase...")
        Base.metadata.create_all(bind=engine)
        print("Schema verification complete! All tables verified/created.")
        sys.exit(0)
    except Exception as e:
        print(f"Error connecting or migrating: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
