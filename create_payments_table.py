from backend.database import engine, Base
from backend.models import Payment

def create_tables():
    print("Creating tables...")
    Payment.__table__.create(bind=engine, checkfirst=True)
    print("Payments table created or already exists.")

if __name__ == '__main__':
    create_tables()
