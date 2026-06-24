from datetime import datetime
import hashlib

from database import SessionLocal, engine
from models import Base, User, Branch


Base.metadata.create_all(bind=engine)


def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


def seed_data():
    db = SessionLocal()

    try:
        existing_branch = db.query(Branch).first()

        if not existing_branch:
            branches = [
                Branch(
                    branch_code="BR-0001",
                    branch_name="Hyderabad Main Branch",
                    city="Hyderabad",
                    state="Telangana",
                    address="Madhapur, Hyderabad",
                    phone="040-11112222",
                    created_at=datetime.utcnow(),
                ),
                Branch(
                    branch_code="BR-0002",
                    branch_name="Secunderabad Branch",
                    city="Secunderabad",
                    state="Telangana",
                    address="SD Road, Secunderabad",
                    phone="040-33334444",
                    created_at=datetime.utcnow(),
                ),
                Branch(
                    branch_code="BR-0003",
                    branch_name="Bangalore City Branch",
                    city="Bangalore",
                    state="Karnataka",
                    address="MG Road, Bangalore",
                    phone="080-55556666",
                    created_at=datetime.utcnow(),
                ),
            ]

            db.add_all(branches)
            db.commit()

        existing_super_admin = db.query(User).filter(
            User.username == "super_admin"
        ).first()

        if existing_super_admin:
            print("Seed data already exists")
            return

        users = [
            User(
                user_code="USR-0001",
                name="Super Admin",
                username="super_admin",
                password=hash_password("Super@123"),
                role="SUPER_ADMIN",
                email="superadmin@wisebank.com",
                phone="9000000001",
                employee_code="EMP-0001",
                customer_code=None,
                bank_id="WB-0001",
                branch_code=None,
                branch_name="All Branches",
                city="Hyderabad",
                state="Telangana",
                address="WiseBank Head Office",
                date_of_birth=None,
                status="Active",
                must_change_password="No",
                created_by="SYSTEM",
                created_by_role="SYSTEM",
                created_at=datetime.utcnow(),
            ),
            User(
                user_code="USR-0002",
                name="Operations Admin",
                username="admin_ops",
                password=hash_password("Admin@123"),
                role="ADMIN",
                email="admin@wisebank.com",
                phone="9000000002",
                employee_code="EMP-0002",
                customer_code=None,
                bank_id="WB-0002",
                branch_code=None,
                branch_name="All Branches",
                city="Hyderabad",
                state="Telangana",
                address="WiseBank Admin Office",
                date_of_birth=None,
                status="Active",
                must_change_password="No",
                created_by="SYSTEM",
                created_by_role="SYSTEM",
                created_at=datetime.utcnow(),
            ),
            User(
                user_code="USR-0003",
                name="Hyderabad Manager",
                username="manager_hyd",
                password=hash_password("Manager@123"),
                role="BANK_MANAGER",
                email="managerhyd@wisebank.com",
                phone="9000000003",
                employee_code="EMP-0003",
                customer_code=None,
                bank_id="WB-0003",
                branch_code="BR-0001",
                branch_name="Hyderabad Main Branch",
                city="Hyderabad",
                state="Telangana",
                address="Hyderabad Main Branch",
                date_of_birth=None,
                status="Active",
                must_change_password="No",
                created_by="SYSTEM",
                created_by_role="SYSTEM",
                created_at=datetime.utcnow(),
            ),
            User(
                user_code="USR-0004",
                name="Hyderabad Loan Officer",
                username="loan_hyd",
                password=hash_password("Loan@123"),
                role="LOAN_OFFICER",
                email="loanhyd@wisebank.com",
                phone="9000000004",
                employee_code="EMP-0004",
                customer_code=None,
                bank_id="WB-0004",
                branch_code="BR-0001",
                branch_name="Hyderabad Main Branch",
                city="Hyderabad",
                state="Telangana",
                address="Hyderabad Main Branch",
                date_of_birth=None,
                status="Active",
                must_change_password="No",
                created_by="SYSTEM",
                created_by_role="SYSTEM",
                created_at=datetime.utcnow(),
            ),
            User(
                user_code="USR-0005",
                name="Hyderabad Risk Officer",
                username="risk_hyd",
                password=hash_password("Risk@123"),
                role="RISK_OFFICER",
                email="riskhyd@wisebank.com",
                phone="9000000005",
                employee_code="EMP-0005",
                customer_code=None,
                bank_id="WB-0005",
                branch_code="BR-0001",
                branch_name="Hyderabad Main Branch",
                city="Hyderabad",
                state="Telangana",
                address="Hyderabad Main Branch",
                date_of_birth=None,
                status="Active",
                must_change_password="No",
                created_by="SYSTEM",
                created_by_role="SYSTEM",
                created_at=datetime.utcnow(),
            ),
        ]

        db.add_all(users)
        db.commit()

        print("Seed data inserted successfully")

    finally:
        db.close()


if __name__ == "__main__":
    seed_data()