from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from datetime import datetime, timedelta
from typing import Optional
import hashlib
import math
import random

from database import SessionLocal, engine
from models import Base, User, Branch, Loan, RiskReport, AuditLog, PasswordResetCode


# =========================================================
# APP SETUP
# =========================================================

app = FastAPI(title="WiseBank Backend")

Base.metadata.create_all(bind=engine)

DEFAULT_EMPLOYEE_PASSWORD = "1234"


def ensure_extra_columns():
    """Adds newly introduced columns when using an existing SQLite database.
    This prevents errors after updating SQLAlchemy models during development.
    """
    columns_to_add = {
        "users": {
            "can_create_branch": "VARCHAR DEFAULT 'No'",
            "can_manage_employees": "VARCHAR DEFAULT 'Yes'",
            "can_view_branch_tasks": "VARCHAR DEFAULT 'Yes'",
            "can_edit_employees": "VARCHAR DEFAULT 'No'",
            "can_delete_employees": "VARCHAR DEFAULT 'No'",
        },
        "loans": {
            "manager_decision_reason": "TEXT",
        },
    }

    try:
        with engine.begin() as connection:
            for table_name, table_columns in columns_to_add.items():
                existing_columns = connection.execute(
                    text(f"PRAGMA table_info({table_name})")
                ).fetchall()

                existing_column_names = {column[1] for column in existing_columns}

                for column_name, column_type in table_columns.items():
                    if column_name not in existing_column_names:
                        connection.execute(
                            text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")
                        )
    except Exception as error:
        print(f"Schema update skipped or failed: {error}")


ensure_extra_columns()



app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "https://wisbank2-0-5.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# DATABASE SESSION
# =========================================================

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =========================================================
# REQUEST MODELS
# =========================================================

class LoginInput(BaseModel):
    login_id: str
    password: str


class ChangePasswordInput(BaseModel):
    user_code: str
    old_password: str
    new_password: str


class CustomerRegisterInput(BaseModel):
    name: str
    username: str
    password: str
    phone: Optional[str] = None
    email: str
    date_of_birth: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    branch_code: str
    branch_name: str


class BranchCreate(BaseModel):
    branch_name: str
    city: str
    state: str
    address: Optional[str] = None
    phone: Optional[str] = None
    created_by: Optional[str] = None
    created_by_role: Optional[str] = None


class EmployeeCreate(BaseModel):
    name: str
    username: str
    role: str
    branch_code: Optional[str] = None
    branch_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    created_by: Optional[str] = None
    created_by_role: Optional[str] = None
    can_create_branch: Optional[str] = "No"
    can_manage_employees: Optional[str] = "Yes"
    can_view_branch_tasks: Optional[str] = "Yes"
    can_edit_employees: Optional[str] = "No"
    can_delete_employees: Optional[str] = "No"


class LoanApplyInput(BaseModel):
    customer_code: str
    customer_username: str
    customer_name: str
    customer_phone: Optional[str] = None
    branch_code: str
    branch_name: str
    loan_type: str
    loan_amount: float
    purpose: str


class RiskPredictionInput(BaseModel):
    no_of_dependents: int
    education: str
    self_employed: str
    income_annum: float
    loan_amount: float
    loan_term: float
    cibil_score: float
    residential_assets_value: float
    commercial_assets_value: float
    luxury_assets_value: float
    bank_asset_value: float


class ManagerDecision(BaseModel):
    decision: str
    reason: Optional[str] = None


class SendPasswordCodeInput(BaseModel):
    email: str


class VerifyPasswordCodeInput(BaseModel):
    email: str
    code: str


class ResetPasswordWithCodeInput(BaseModel):
    email: str
    code: str
    new_password: str
class SendPasswordCodeInput(BaseModel):
    email: str


class VerifyPasswordCodeInput(BaseModel):
    email: str
    code: str


class ResetPasswordWithCodeInput(BaseModel):
    email: str
    code: str
    new_password: str
# =========================================================
# HELPER FUNCTIONS
# =========================================================
import random
from datetime import timedelta

def generate_otp():
    return str(random.randint(100000, 999999))


def send_email_code_demo(email: str, code: str):
    print("\n====================================")
    print("WISEBANK PASSWORD VERIFICATION CODE")
    print(f"Email: {email}")
    print(f"Code: {code}")
    print("Valid for 10 minutes")
    print("====================================\n")


def get_valid_reset_code(db: Session, email: str, code: str):
    return (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.email == email.strip().lower(),
            PasswordResetCode.code == code.strip(),
            PasswordResetCode.is_used == "No",
            PasswordResetCode.expires_at >= datetime.utcnow(),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )
def generate_otp():
    return str(random.randint(100000, 999999))


def send_email_code_demo(email: str, code: str):
    print("\n==============================")
    print("WISEBANK PASSWORD RESET CODE")
    print(f"Email: {email}")
    print(f"Verification Code: {code}")
    print("==============================\n")


def get_valid_reset_code(db: Session, email: str, code: str):
    reset_code = (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.email == email.strip().lower(),
            PasswordResetCode.code == code.strip(),
            PasswordResetCode.is_used == "No",
            PasswordResetCode.expires_at >= datetime.utcnow(),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )

    return reset_code
def hash_password(password: str):
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str):
    return hash_password(plain_password) == hashed_password


def validate_strong_password(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain one capital letter"
        )

    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain one small letter"
        )

    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain one number"
        )

    if not any(not char.isalnum() for char in password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain one symbol"
        )


def safe_datetime(value):
    if value is None:
        return None

    if isinstance(value, datetime):
        return value.isoformat()

    return value


def generate_code(db: Session, model, prefix: str, field_name: str):
    count = db.query(model).count() + 1

    while True:
        code = f"{prefix}-{count:04d}"
        exists = db.query(model).filter(
            getattr(model, field_name) == code
        ).first()

        if not exists:
            return code

        count += 1


def create_audit(
    db: Session,
    action: str,
    loan_code: Optional[str],
    performed_by: Optional[str],
    performed_by_name: Optional[str],
    role: Optional[str],
    details: Optional[str],
):
    audit = AuditLog(
        action=action,
        loan_code=loan_code,
        performed_by=performed_by,
        performed_by_name=performed_by_name,
        role=role,
        details=details,
        created_at=datetime.utcnow(),
    )

    db.add(audit)


def serialize_user(user: User):
    return {
        "user_code": user.user_code,
        "name": user.name,
        "username": user.username,
        "role": user.role,
        "email": user.email,
        "phone": user.phone,
        "employee_code": user.employee_code,
        "customer_code": user.customer_code,
        "bank_id": user.bank_id,
        "branch_code": user.branch_code,
        "branch_name": user.branch_name,
        "city": user.city,
        "state": user.state,
        "address": user.address,
        "date_of_birth": user.date_of_birth,
        "status": user.status,
        "must_change_password": user.must_change_password,
        "can_create_branch": getattr(user, "can_create_branch", "No"),
        "can_manage_employees": getattr(user, "can_manage_employees", "Yes"),
        "can_view_branch_tasks": getattr(user, "can_view_branch_tasks", "Yes"),
        "can_edit_employees": getattr(user, "can_edit_employees", "No"),
        "can_delete_employees": getattr(user, "can_delete_employees", "No"),
        "created_at": safe_datetime(user.created_at),
    }


def serialize_branch(branch: Branch):
    return {
        "branch_code": branch.branch_code,
        "branch_name": branch.branch_name,
        "city": branch.city,
        "state": branch.state,
        "address": branch.address,
        "phone": branch.phone,
        "created_at": safe_datetime(branch.created_at),
    }


def get_latest_risk_report(db: Session, loan_code: str):
    return (
        db.query(RiskReport)
        .filter(RiskReport.loan_code == loan_code)
        .order_by(RiskReport.created_at.desc())
        .first()
    )


def serialize_risk_report(report: RiskReport):
    if not report:
        return None

    return {
        "id": report.id,
        "loan_code": report.loan_code,
        "prediction_status": report.prediction_status,
        "approved_probability": report.approved_probability,
        "rejected_probability": report.rejected_probability,
        "suggested_status": report.suggested_status,
        "total_assets_value": report.total_assets_value,
        "loan_to_income_ratio": report.loan_to_income_ratio,
        "loan_to_assets_ratio": report.loan_to_assets_ratio,
        "asset_to_income_ratio": report.asset_to_income_ratio,
        "risk_score": report.risk_score,
        "risk_level": report.risk_level,
        "risk_reasons": report.risk_reasons,
        "created_by": report.created_by,
        "created_by_name": report.created_by_name,
        "created_at": safe_datetime(report.created_at),
    }




def get_loan_history(db: Session, loan_code: str):
    logs = (
        db.query(AuditLog)
        .filter(AuditLog.loan_code == loan_code)
        .order_by(AuditLog.created_at.asc())
        .all()
    )

    return [
        {
            "id": log.id,
            "action": log.action,
            "loan_code": log.loan_code,
            "performed_by": log.performed_by,
            "performed_by_name": log.performed_by_name,
            "role": log.role,
            "details": log.details,
            "created_at": safe_datetime(log.created_at),
        }
        for log in logs
    ]


def serialize_loan(loan: Loan, db: Session):
    report = get_latest_risk_report(db, loan.loan_code)

    return {
        "id": loan.id,
        "loan_code": loan.loan_code,
        "customer_code": loan.customer_code,
        "customer_username": loan.customer_username,
        "customer_name": loan.customer_name,
        "customer_phone": loan.customer_phone,
        "branch_code": loan.branch_code,
        "branch_name": loan.branch_name,
        "loan_type": loan.loan_type,
        "loan_amount": loan.loan_amount,
        "purpose": loan.purpose,
        "status": loan.status,
        "assigned_loan_officer_code": loan.assigned_loan_officer_code,
        "assigned_loan_officer_name": loan.assigned_loan_officer_name,
        "assigned_risk_officer_code": loan.assigned_risk_officer_code,
        "assigned_risk_officer_name": loan.assigned_risk_officer_name,
        "verified_by": loan.verified_by,
        "verified_by_name": loan.verified_by_name,
        "risk_reviewed_by": loan.risk_reviewed_by,
        "risk_reviewed_by_name": loan.risk_reviewed_by_name,
        "approved_by": loan.approved_by,
        "approved_by_name": loan.approved_by_name,
        "manager_decision_reason": getattr(loan, "manager_decision_reason", None),
        "history": get_loan_history(db, loan.loan_code),
        "created_at": safe_datetime(loan.created_at),
        "verified_at": safe_datetime(loan.verified_at),
        "risk_reviewed_at": safe_datetime(loan.risk_reviewed_at),
        "approved_at": safe_datetime(loan.approved_at),
        "risk_report": serialize_risk_report(report),
    }


def get_status_chart(items):
    statuses = {}

    for item in items:
        statuses[item.status] = statuses.get(item.status, 0) + 1

    return [
        {"name": key, "value": value}
        for key, value in statuses.items()
    ]


def calculate_risk(data: RiskPredictionInput):
    total_assets = (
        data.residential_assets_value
        + data.commercial_assets_value
        + data.luxury_assets_value
        + data.bank_asset_value
    )

    loan_to_income_ratio = round(data.loan_amount / data.income_annum, 2) if data.income_annum else 0
    loan_to_assets_ratio = round(data.loan_amount / total_assets, 2) if total_assets else 0
    asset_to_income_ratio = round(total_assets / data.income_annum, 2) if data.income_annum else 0

    risk_score = 0
    reasons = []

    if data.cibil_score >= 750:
        risk_score += 10
    elif data.cibil_score >= 650:
        risk_score += 30
        reasons.append("Medium CIBIL score")
    else:
        risk_score += 55
        reasons.append("Low CIBIL score")

    if loan_to_income_ratio > 5:
        risk_score += 25
        reasons.append("Loan amount is high compared to annual income")
    elif loan_to_income_ratio > 3:
        risk_score += 15
        reasons.append("Moderate loan-to-income ratio")
    else:
        risk_score += 5

    if loan_to_assets_ratio > 1:
        risk_score += 20
        reasons.append("Loan amount is higher than total assets")
    elif loan_to_assets_ratio > 0.6:
        risk_score += 10
        reasons.append("Loan amount is moderately high compared to assets")
    else:
        risk_score += 4

    if data.loan_term > 15:
        risk_score += 10
        reasons.append("Long repayment term")

    risk_score = min(risk_score, 100)

    approved_probability = max(5, 100 - risk_score)
    rejected_probability = 100 - approved_probability

    if risk_score <= 35:
        risk_level = "Low Risk"
        suggested_status = "Approve"
        prediction_status = "Approved"
    elif risk_score <= 65:
        risk_level = "Medium Risk"
        suggested_status = "Manual Review"
        prediction_status = "Manual Review"
    else:
        risk_level = "High Risk"
        suggested_status = "Reject"
        prediction_status = "Rejected"

    if not reasons:
        reasons.append("Good repayment profile based on entered values")

    return {
        "total_assets_value": total_assets,
        "loan_to_income_ratio": loan_to_income_ratio,
        "loan_to_assets_ratio": loan_to_assets_ratio,
        "asset_to_income_ratio": asset_to_income_ratio,
        "approved_probability": round(approved_probability, 2),
        "rejected_probability": round(rejected_probability, 2),
        "risk_score": round(risk_score, 2),
        "risk_level": risk_level,
        "suggested_status": suggested_status,
        "prediction_status": prediction_status,
        "risk_reasons": ", ".join(reasons),
    }


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def home():
    return {
        "message": "WiseBank backend running successfully"
    }


# =========================================================
# AUTH
# =========================================================

@app.post("/auth/register-customer")
def register_customer(data: CustomerRegisterInput, db: Session = Depends(get_db)):
    username = data.username.strip().lower()

    existing_user = db.query(User).filter(User.username == username).first()

    if existing_user:
        raise HTTPException(status_code=400, detail="Username already taken")

    existing_email = db.query(User).filter(
        User.email == data.email.strip().lower()
    ).first()

    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    validate_strong_password(data.password)

    branch = db.query(Branch).filter(
        Branch.branch_code == data.branch_code
    ).first()

    if not branch:
        raise HTTPException(status_code=404, detail="Selected branch not found")

    customer_code = generate_code(db, User, "CUS", "customer_code")
    user_code = generate_code(db, User, "USR", "user_code")
    bank_id = generate_code(db, User, "WB", "bank_id")

    customer = User(
        user_code=user_code,
        name=data.name.strip(),
        username=username,
        password=hash_password(data.password.strip()),
        role="CUSTOMER",
        email=data.email.strip().lower(),
        phone=data.phone,
        customer_code=customer_code,
        employee_code=None,
        bank_id=bank_id,
        branch_code=branch.branch_code,
        branch_name=branch.branch_name,
        date_of_birth=data.date_of_birth,
        address=data.address,
        city=data.city,
        state=data.state,
        status="Active",
        must_change_password="No",
        created_at=datetime.utcnow(),
    )

    db.add(customer)

    create_audit(
        db=db,
        action="Customer Registered",
        loan_code=None,
        performed_by=customer.customer_code,
        performed_by_name=customer.name,
        role="CUSTOMER",
        details=f"Customer {customer.name} registered with username {username}",
    )

    db.commit()
    db.refresh(customer)

    return serialize_user(customer)


@app.post("/auth/login")
def login(data: LoginInput, db: Session = Depends(get_db)):
    raw_login_id = data.login_id.strip()
    login_id = raw_login_id.lower()
    password = data.password.strip()

    if not raw_login_id or not password:
        raise HTTPException(status_code=400, detail="Username/Bank ID and password are required")

    user = db.query(User).filter(
        or_(
            User.username == login_id,
            User.username == raw_login_id,
            User.bank_id == raw_login_id,
            User.bank_id == raw_login_id.upper(),
            User.employee_code == raw_login_id,
            User.customer_code == raw_login_id,
            User.user_code == raw_login_id,
        )
    ).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if user.status != "Active":
        raise HTTPException(status_code=403, detail="User account is inactive")

    password_valid = False

    # New users: hashed password
    if verify_password(password, user.password):
        password_valid = True

    # Old users/seed users: plain text password migration support
    elif user.password == password:
        password_valid = True
        user.password = hash_password(password)
        db.commit()
        db.refresh(user)

    # Development fallback for old employee default password migration
    elif password == DEFAULT_EMPLOYEE_PASSWORD and user.must_change_password == "Yes":
        password_valid = True
        user.password = hash_password(DEFAULT_EMPLOYEE_PASSWORD)
        db.commit()
        db.refresh(user)

    if not password_valid:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    return serialize_user(user)

@app.post("/auth/send-password-code")
def send_password_code(data: SendPasswordCodeInput, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    code = generate_otp()

    reset_code = PasswordResetCode(
        email=email,
        code=code,
        is_used="No",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        created_at=datetime.utcnow(),
    )

    db.add(reset_code)

    create_audit(
        db=db,
        action="Password Code Sent",
        loan_code=None,
        performed_by=user.employee_code or user.customer_code or user.bank_id,
        performed_by_name=user.name,
        role=user.role,
        details=f"Password verification code generated for {email}",
    )

    db.commit()

    send_email_code_demo(email, code)

    return {
        "message": "Verification code sent to registered email. Check backend terminal for demo code."
    }


@app.post("/auth/verify-password-code")
def verify_password_code(data: VerifyPasswordCodeInput, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    code = data.code.strip()

    reset_code = get_valid_reset_code(db, email, code)

    if not reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    return {
        "message": "Verification code is valid"
    }


@app.post("/auth/reset-password-with-code")
def reset_password_with_code(
    data: ResetPasswordWithCodeInput,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()
    code = data.code.strip()
    new_password = data.new_password.strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    reset_code = get_valid_reset_code(db, email, code)

    if not reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    validate_strong_password(new_password)

    user.password = hash_password(new_password)
    user.must_change_password = "No"

    reset_code.is_used = "Yes"

    create_audit(
        db=db,
        action="Password Reset With Email Code",
        loan_code=None,
        performed_by=user.employee_code or user.customer_code or user.bank_id,
        performed_by_name=user.name,
        role=user.role,
        details=f"{user.name} reset password using email verification",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Password changed successfully",
        "user": serialize_user(user)
    }
@app.post("/auth/send-password-code")
def send_password_code(data: SendPasswordCodeInput, db: Session = Depends(get_db)):
    email = data.email.strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    code = generate_otp()

    reset_code = PasswordResetCode(
        email=email,
        code=code,
        is_used="No",
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        created_at=datetime.utcnow(),
    )

    db.add(reset_code)

    create_audit(
        db=db,
        action="Password Verification Code Sent",
        loan_code=None,
        performed_by=user.employee_code or user.customer_code or user.bank_id,
        performed_by_name=user.name,
        role=user.role,
        details=f"Password verification code generated for {email}",
    )

    db.commit()

    send_email_code_demo(email, code)

    return {
        "message": "Verification code sent. For demo, check backend terminal."
    }


@app.post("/auth/verify-password-code")
def verify_password_code(data: VerifyPasswordCodeInput, db: Session = Depends(get_db)):
    email = data.email.strip().lower()
    code = data.code.strip()

    reset_code = get_valid_reset_code(db, email, code)

    if not reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    return {
        "message": "Verification code is valid"
    }


@app.post("/auth/reset-password-with-code")
def reset_password_with_code(
    data: ResetPasswordWithCodeInput,
    db: Session = Depends(get_db)
):
    email = data.email.strip().lower()
    code = data.code.strip()
    new_password = data.new_password.strip()

    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    reset_code = get_valid_reset_code(db, email, code)

    if not reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")

    validate_strong_password(new_password)

    user.password = hash_password(new_password)
    user.must_change_password = "No"

    reset_code.is_used = "Yes"

    create_audit(
        db=db,
        action="Password Changed With Email Code",
        loan_code=None,
        performed_by=user.employee_code or user.customer_code or user.bank_id,
        performed_by_name=user.name,
        role=user.role,
        details=f"{user.name} changed password using email verification",
    )

    db.commit()
    db.refresh(user)

    return {
        "message": "Password changed successfully",
        "user": serialize_user(user)
    }
@app.get("/profile/{user_code}")
def get_profile(user_code: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_code == user_code).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return serialize_user(user)


# =========================================================
# BRANCHES
# =========================================================

@app.get("/branches")
def get_branches(db: Session = Depends(get_db)):
    branches = db.query(Branch).order_by(Branch.created_at.desc()).all()

    return [serialize_branch(branch) for branch in branches]


@app.post("/branches")
def create_branch(data: BranchCreate, db: Session = Depends(get_db)):
    creator = None

    if data.created_by:
        creator = db.query(User).filter(
            or_(
                User.employee_code == data.created_by,
                User.user_code == data.created_by,
                User.bank_id == data.created_by,
            )
        ).first()

        if not creator:
            raise HTTPException(status_code=404, detail="Creator user not found")

        if creator.role == "ADMIN" and getattr(creator, "can_create_branch", "No") != "Yes":
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to create branches"
            )

        if creator.role not in ["SUPER_ADMIN", "ADMIN"]:
            raise HTTPException(
                status_code=403,
                detail="Only Super Admin or permitted Admin can create branches"
            )

    existing_branch = db.query(Branch).filter(
        Branch.branch_name == data.branch_name.strip()
    ).first()

    if existing_branch:
        raise HTTPException(status_code=400, detail="Branch already exists")

    branch = Branch(
        branch_code=generate_code(db, Branch, "BR", "branch_code"),
        branch_name=data.branch_name.strip(),
        city=data.city.strip(),
        state=data.state.strip(),
        address=data.address,
        phone=data.phone,
        created_at=datetime.utcnow(),
    )

    db.add(branch)

    create_audit(
        db=db,
        action="Branch Created",
        loan_code=None,
        performed_by=(
            creator.employee_code or creator.user_code or creator.bank_id
            if creator
            else "SYSTEM"
        ),
        performed_by_name=creator.name if creator else "System",
        role=creator.role if creator else data.created_by_role or "ADMIN",
        details=f"Branch {branch.branch_name} created",
    )

    db.commit()
    db.refresh(branch)

    return serialize_branch(branch)


@app.delete("/branches/{branch_code}")
def delete_branch(branch_code: str, db: Session = Depends(get_db)):
    branch = db.query(Branch).filter(Branch.branch_code == branch_code).first()

    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    employees = db.query(User).filter(User.branch_code == branch_code).count()
    loans = db.query(Loan).filter(Loan.branch_code == branch_code).count()

    if employees > 0 or loans > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete branch with employees or loans"
        )

    db.delete(branch)
    db.commit()

    return {"message": "Branch deleted successfully"}


# =========================================================
# EMPLOYEES
# =========================================================

@app.get("/employees")
def get_employees(
    viewer_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(User).filter(User.role != "CUSTOMER")

    if viewer_code:
        viewer = db.query(User).filter(
            or_(
                User.employee_code == viewer_code,
                User.user_code == viewer_code,
                User.bank_id == viewer_code,
            )
        ).first()

        if not viewer:
            raise HTTPException(status_code=404, detail="Viewer not found")

        if viewer.role == "SUPER_ADMIN":
            pass
        elif viewer.role == "ADMIN":
            if viewer.branch_code and viewer.branch_name != "All Branches":
                query = query.filter(User.branch_code == viewer.branch_code)
        else:
            query = query.filter(User.branch_code == viewer.branch_code)

    employees = query.order_by(User.created_at.desc()).all()

    return [serialize_user(employee) for employee in employees]


def normalize_yes_no(value: Optional[str], default: str = "No"):
    if value is None:
        return default

    text_value = str(value).strip().lower()

    if text_value in ["yes", "true", "1", "y"]:
        return "Yes"

    if text_value in ["no", "false", "0", "n"]:
        return "No"

    return default


@app.post("/employees")
def create_employee(data: EmployeeCreate, db: Session = Depends(get_db)):
    username = data.username.strip().lower()

    existing_username = db.query(User).filter(User.username == username).first()

    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    if data.email:
        existing_email = db.query(User).filter(
            User.email == data.email.strip().lower()
        ).first()

        if existing_email:
            raise HTTPException(
                status_code=400,
                detail="Email already exists. Use a unique email for each employee."
            )

    allowed_roles = ["ADMIN", "BANK_MANAGER", "LOAN_OFFICER", "RISK_OFFICER"]

    if data.role not in allowed_roles:
        raise HTTPException(status_code=400, detail="Invalid employee role")

    creator = None

    if data.created_by:
        creator = db.query(User).filter(
            or_(
                User.employee_code == data.created_by,
                User.user_code == data.created_by,
                User.bank_id == data.created_by,
            )
        ).first()

    if data.role == "ADMIN" and data.created_by_role != "SUPER_ADMIN":
        raise HTTPException(status_code=403, detail="Only Super Admin can create Admin users")

    if data.created_by_role == "ADMIN":
        if not creator:
            raise HTTPException(status_code=404, detail="Creator Admin not found")

        if getattr(creator, "can_manage_employees", "Yes") != "Yes":
            raise HTTPException(
                status_code=403,
                detail="You do not have permission to manage employees"
            )

        if creator.branch_code and creator.branch_name != "All Branches":
            if data.branch_code != creator.branch_code:
                raise HTTPException(
                    status_code=403,
                    detail="You can create employees only for your assigned branch"
                )

    selected_branch = None

    if data.branch_code:
        selected_branch = db.query(Branch).filter(
            Branch.branch_code == data.branch_code
        ).first()

        if not selected_branch:
            raise HTTPException(status_code=404, detail="Branch not found")

    if data.role != "ADMIN" and not selected_branch:
        raise HTTPException(
            status_code=400,
            detail="Branch is required for branch-level employees"
        )

    employee_code = generate_code(db, User, "EMP", "employee_code")
    bank_id = generate_code(db, User, "WB", "bank_id")
    user_code = generate_code(db, User, "USR", "user_code")

    admin_branch_code = None
    admin_branch_name = "All Branches"

    if data.role == "ADMIN" and selected_branch:
        admin_branch_code = selected_branch.branch_code
        admin_branch_name = selected_branch.branch_name

    employee_branch_code = selected_branch.branch_code if selected_branch else admin_branch_code
    employee_branch_name = selected_branch.branch_name if selected_branch else admin_branch_name

    employee = User(
        user_code=user_code,
        name=data.name.strip(),
        username=username,
        password=hash_password(DEFAULT_EMPLOYEE_PASSWORD),
        role=data.role,
        email=data.email.strip().lower() if data.email else None,
        phone=data.phone,
        employee_code=employee_code,
        customer_code=None,
        bank_id=bank_id,
        branch_code=employee_branch_code,
        branch_name=employee_branch_name,
        status="Active",
        must_change_password="Yes",
        can_create_branch=normalize_yes_no(data.can_create_branch, "No") if data.role == "ADMIN" else "No",
        can_manage_employees=normalize_yes_no(data.can_manage_employees, "Yes") if data.role == "ADMIN" else "Yes",
        can_view_branch_tasks=normalize_yes_no(data.can_view_branch_tasks, "Yes") if data.role == "ADMIN" else "Yes",
        can_edit_employees=normalize_yes_no(data.can_edit_employees, "No") if data.role == "ADMIN" else "No",
        can_delete_employees=normalize_yes_no(data.can_delete_employees, "No") if data.role == "ADMIN" else "No",
        created_by=data.created_by,
        created_by_role=data.created_by_role,
        created_at=datetime.utcnow(),
    )

    db.add(employee)

    create_audit(
        db=db,
        action="Employee Created",
        loan_code=None,
        performed_by=data.created_by,
        performed_by_name=creator.name if creator else data.created_by,
        role=data.created_by_role,
        details=f"{data.role} {data.name} created with username {username}",
    )

    db.commit()
    db.refresh(employee)

    result = serialize_user(employee)
    result["default_password"] = DEFAULT_EMPLOYEE_PASSWORD

    return result


@app.delete("/employees/{employee_code}")
def delete_employee(employee_code: str, db: Session = Depends(get_db)):
    employee = db.query(User).filter(User.employee_code == employee_code).first()

    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    if employee.role == "SUPER_ADMIN":
        raise HTTPException(status_code=400, detail="Cannot delete Super Admin")

    db.delete(employee)
    db.commit()

    return {"message": "Employee deleted successfully"}


# =========================================================
# LOANS - CUSTOMER
# =========================================================

@app.post("/loans/apply")
def apply_loan(data: LoanApplyInput, db: Session = Depends(get_db)):
    customer = db.query(User).filter(
        User.customer_code == data.customer_code,
        User.role == "CUSTOMER",
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    branch = db.query(Branch).filter(
        Branch.branch_code == data.branch_code
    ).first()

    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    loan = Loan(
        loan_code=generate_code(db, Loan, "LN", "loan_code"),
        customer_code=customer.customer_code,
        customer_username=customer.username,
        customer_name=customer.name,
        customer_phone=customer.phone,
        branch_code=branch.branch_code,
        branch_name=branch.branch_name,
        loan_type=data.loan_type,
        loan_amount=data.loan_amount,
        purpose=data.purpose,
        status="Submitted",
        assigned_loan_officer_code=None,
        assigned_loan_officer_name=None,
        assigned_risk_officer_code=None,
        assigned_risk_officer_name=None,
        verified_by=None,
        verified_by_name=None,
        risk_reviewed_by=None,
        risk_reviewed_by_name=None,
        approved_by=None,
        approved_by_name=None,
        created_at=datetime.utcnow(),
    )

    db.add(loan)

    create_audit(
        db=db,
        action="Loan Applied",
        loan_code=loan.loan_code,
        performed_by=customer.customer_code,
        performed_by_name=customer.name,
        role="CUSTOMER",
        details=f"{customer.name} applied for {data.loan_type} loan",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


@app.get("/loans/customer/{customer_code}")
def get_customer_loans(customer_code: str, db: Session = Depends(get_db)):
    loans = (
        db.query(Loan)
        .filter(Loan.customer_code == customer_code)
        .order_by(Loan.created_at.desc())
        .all()
    )

    return [serialize_loan(loan, db) for loan in loans]


# =========================================================
# LOAN OFFICER
# =========================================================

@app.get("/loans/loan-officer/{employee_code}")
def get_loan_officer_queue(employee_code: str, db: Session = Depends(get_db)):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "LOAN_OFFICER",
        User.status == "Active",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Loan officer not found")

    loans = (
        db.query(Loan)
        .filter(
            Loan.branch_code == officer.branch_code,
            Loan.status.in_(["Submitted", "Verified"]),
            or_(
                Loan.assigned_loan_officer_code == None,
                Loan.assigned_loan_officer_code == officer.employee_code,
            )
        )
        .order_by(Loan.created_at.desc())
        .all()
    )

    return [serialize_loan(loan, db) for loan in loans]


@app.get("/loans/loan-officer/{employee_code}/summary")
def get_loan_officer_summary(employee_code: str, db: Session = Depends(get_db)):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "LOAN_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Loan officer not found")

    branch_loans = db.query(Loan).filter(
        Loan.branch_code == officer.branch_code,
        Loan.status.in_(["Submitted", "Verified"]),
    ).all()

    available = len([loan for loan in branch_loans if not loan.assigned_loan_officer_code])
    taken_by_me = len([
        loan for loan in branch_loans
        if loan.assigned_loan_officer_code == officer.employee_code
    ])
    branch_taken = len([
        loan for loan in branch_loans
        if loan.assigned_loan_officer_code
    ])
    verified = len([
        loan for loan in branch_loans
        if loan.status == "Verified"
    ])

    return {
        "available": available,
        "taken_by_me": taken_by_me,
        "branch_taken": branch_taken,
        "verified": verified,
        "chart": [
            {"name": "Available", "value": available},
            {"name": "Taken by me", "value": taken_by_me},
            {"name": "Branch taken", "value": branch_taken},
            {"name": "Verified", "value": verified},
        ]
    }


@app.put("/loans/{loan_code}/claim-loan-officer/{employee_code}")
def claim_loan_officer_task(
    loan_code: str,
    employee_code: str,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "LOAN_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Loan officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.branch_code != officer.branch_code:
        raise HTTPException(status_code=403, detail="Cannot claim another branch loan")

    if loan.assigned_loan_officer_code and loan.assigned_loan_officer_code != officer.employee_code:
        raise HTTPException(status_code=400, detail="Loan already claimed by another officer")

    loan.assigned_loan_officer_code = officer.employee_code
    loan.assigned_loan_officer_name = officer.name

    create_audit(
        db=db,
        action="Loan Claimed",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} claimed loan {loan.loan_code}",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


@app.put("/loans/{loan_code}/verify/{employee_code}")
def verify_loan(
    loan_code: str,
    employee_code: str,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "LOAN_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Loan officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.assigned_loan_officer_code != officer.employee_code:
        raise HTTPException(status_code=403, detail="You must claim this loan first")

    if loan.status != "Submitted":
        raise HTTPException(status_code=400, detail="Only submitted loans can be verified")

    loan.status = "Verified"
    loan.verified_by = officer.employee_code
    loan.verified_by_name = officer.name
    loan.verified_at = datetime.utcnow()

    create_audit(
        db=db,
        action="Loan Verified",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} verified loan {loan.loan_code}",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


@app.put("/loans/{loan_code}/forward-to-risk/{employee_code}")
def forward_to_risk(
    loan_code: str,
    employee_code: str,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "LOAN_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Loan officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.assigned_loan_officer_code != officer.employee_code:
        raise HTTPException(status_code=403, detail="You must claim this loan first")

    if loan.status != "Verified":
        raise HTTPException(status_code=400, detail="Only verified loans can be forwarded to risk")

    loan.status = "Risk Pending"

    create_audit(
        db=db,
        action="Forwarded to Risk",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} forwarded loan {loan.loan_code} to risk review",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


# =========================================================
# RISK OFFICER
# =========================================================

@app.get("/loans/risk-officer/{employee_code}")
def get_risk_officer_queue(employee_code: str, db: Session = Depends(get_db)):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "RISK_OFFICER",
        User.status == "Active",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Risk officer not found")

    loans = (
        db.query(Loan)
        .filter(
            Loan.branch_code == officer.branch_code,
            Loan.status.in_(["Risk Pending", "Risk Completed"]),
            or_(
                Loan.assigned_risk_officer_code == None,
                Loan.assigned_risk_officer_code == officer.employee_code,
            )
        )
        .order_by(Loan.created_at.desc())
        .all()
    )

    return [serialize_loan(loan, db) for loan in loans]


@app.get("/loans/risk-officer/{employee_code}/summary")
def get_risk_officer_summary(employee_code: str, db: Session = Depends(get_db)):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "RISK_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Risk officer not found")

    branch_loans = db.query(Loan).filter(
        Loan.branch_code == officer.branch_code,
        Loan.status.in_(["Risk Pending", "Risk Completed"]),
    ).all()

    available = len([loan for loan in branch_loans if not loan.assigned_risk_officer_code])
    taken_by_me = len([
        loan for loan in branch_loans
        if loan.assigned_risk_officer_code == officer.employee_code
    ])
    branch_taken = len([
        loan for loan in branch_loans
        if loan.assigned_risk_officer_code
    ])
    completed = len([
        loan for loan in branch_loans
        if loan.status == "Risk Completed"
    ])

    return {
        "available": available,
        "taken_by_me": taken_by_me,
        "branch_taken": branch_taken,
        "completed": completed,
        "chart": [
            {"name": "Available", "value": available},
            {"name": "Taken by me", "value": taken_by_me},
            {"name": "Branch taken", "value": branch_taken},
            {"name": "Completed", "value": completed},
        ]
    }


@app.put("/loans/{loan_code}/claim-risk-officer/{employee_code}")
def claim_risk_officer_task(
    loan_code: str,
    employee_code: str,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "RISK_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Risk officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.branch_code != officer.branch_code:
        raise HTTPException(status_code=403, detail="Cannot claim another branch loan")

    if loan.assigned_risk_officer_code and loan.assigned_risk_officer_code != officer.employee_code:
        raise HTTPException(status_code=400, detail="Risk review already claimed by another officer")

    loan.assigned_risk_officer_code = officer.employee_code
    loan.assigned_risk_officer_name = officer.name

    create_audit(
        db=db,
        action="Risk Review Claimed",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} claimed risk review for loan {loan.loan_code}",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


@app.post("/loans/{loan_code}/predict-risk/{employee_code}")
def predict_risk(
    loan_code: str,
    employee_code: str,
    data: RiskPredictionInput,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "RISK_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Risk officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.assigned_risk_officer_code != officer.employee_code:
        raise HTTPException(status_code=403, detail="You must claim this risk review first")

    if loan.status != "Risk Pending":
        raise HTTPException(status_code=400, detail="Only risk pending loans can be predicted")

    result = calculate_risk(data)

    report = RiskReport(
        loan_code=loan.loan_code,
        prediction_status=result["prediction_status"],
        approved_probability=result["approved_probability"],
        rejected_probability=result["rejected_probability"],
        suggested_status=result["suggested_status"],
        total_assets_value=result["total_assets_value"],
        loan_to_income_ratio=result["loan_to_income_ratio"],
        loan_to_assets_ratio=result["loan_to_assets_ratio"],
        asset_to_income_ratio=result["asset_to_income_ratio"],
        risk_score=result["risk_score"],
        risk_level=result["risk_level"],
        risk_reasons=result["risk_reasons"],
        created_by=officer.employee_code,
        created_by_name=officer.name,
        created_at=datetime.utcnow(),
    )

    db.add(report)

    loan.status = "Risk Completed"
    loan.risk_reviewed_by = officer.employee_code
    loan.risk_reviewed_by_name = officer.name
    loan.risk_reviewed_at = datetime.utcnow()

    create_audit(
        db=db,
        action="Risk Report Generated",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} generated risk report for loan {loan.loan_code}",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


@app.put("/loans/{loan_code}/forward-to-manager/{employee_code}")
def forward_to_manager(
    loan_code: str,
    employee_code: str,
    db: Session = Depends(get_db)
):
    officer = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "RISK_OFFICER",
    ).first()

    if not officer:
        raise HTTPException(status_code=404, detail="Risk officer not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.assigned_risk_officer_code != officer.employee_code:
        raise HTTPException(status_code=403, detail="You must claim this risk review first")

    if loan.status != "Risk Completed":
        raise HTTPException(status_code=400, detail="Only completed risk reports can be forwarded")

    loan.status = "Manager Review"

    create_audit(
        db=db,
        action="Forwarded to Manager",
        loan_code=loan.loan_code,
        performed_by=officer.employee_code,
        performed_by_name=officer.name,
        role=officer.role,
        details=f"{officer.name} forwarded loan {loan.loan_code} to manager",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


# =========================================================
# MANAGER
# =========================================================

@app.get("/loans/manager/{employee_code}")
def get_manager_loans(employee_code: str, db: Session = Depends(get_db)):
    manager = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "BANK_MANAGER",
        User.status == "Active",
    ).first()

    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    loans = (
        db.query(Loan)
        .filter(
            Loan.branch_code == manager.branch_code,
            Loan.status == "Manager Review",
        )
        .order_by(Loan.created_at.desc())
        .all()
    )

    return [serialize_loan(loan, db) for loan in loans]


@app.put("/loans/{loan_code}/manager-decision/{employee_code}")
def manager_decision(
    loan_code: str,
    employee_code: str,
    data: ManagerDecision,
    db: Session = Depends(get_db)
):
    manager = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "BANK_MANAGER",
        User.status == "Active",
    ).first()

    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    loan = db.query(Loan).filter(Loan.loan_code == loan_code).first()

    if not loan:
        raise HTTPException(status_code=404, detail="Loan not found")

    if loan.branch_code != manager.branch_code:
        raise HTTPException(
            status_code=403,
            detail="You cannot decide another branch loan"
        )

    decision = data.decision.strip().lower()
    reason = (data.reason or "").strip()

    if len(reason) < 10:
        raise HTTPException(
            status_code=400,
            detail="Decision justification is required and must be at least 10 characters"
        )

    approve_values = ["approve", "approved", "accept", "accepted"]
    reject_values = ["reject", "rejected", "decline", "declined"]
    manual_review_values = ["manual_review", "manual review", "review"]

    if decision in approve_values:
        loan.status = "Approved"
    elif decision in reject_values:
        loan.status = "Rejected"
    elif decision in manual_review_values:
        loan.status = "Manual Review"
    else:
        raise HTTPException(
            status_code=400,
            detail="Decision must be approve, reject, or manual review"
        )

    loan.approved_by = manager.employee_code
    loan.approved_by_name = manager.name
    loan.approved_at = datetime.utcnow()
    loan.manager_decision_reason = reason

    create_audit(
        db=db,
        action=f"Loan {loan.status}",
        loan_code=loan.loan_code,
        performed_by=manager.employee_code,
        performed_by_name=manager.name,
        role=manager.role,
        details=f"{manager.name} marked loan {loan.loan_code} as {loan.status}. Reason: {reason}",
    )

    db.commit()
    db.refresh(loan)

    return serialize_loan(loan, db)


# =========================================================
# DASHBOARDS
# =========================================================

@app.get("/dashboard/manager/{employee_code}")
def get_manager_dashboard(employee_code: str, db: Session = Depends(get_db)):
    manager = db.query(User).filter(
        User.employee_code == employee_code,
        User.role == "BANK_MANAGER",
        User.status == "Active",
    ).first()

    if not manager:
        raise HTTPException(status_code=404, detail="Manager not found")

    branch_loans = db.query(Loan).filter(
        Loan.branch_code == manager.branch_code
    ).all()

    branch_employees = db.query(User).filter(
        User.branch_code == manager.branch_code,
        User.role != "CUSTOMER",
    ).all()

    branch_customers = db.query(User).filter(
        User.branch_code == manager.branch_code,
        User.role == "CUSTOMER",
    ).all()

    return {
        "manager": serialize_user(manager),
        "branch_code": manager.branch_code,
        "branch_name": manager.branch_name,
        "total_loans": len(branch_loans),
        "active_customers": len(branch_customers),
        "employees": len(branch_employees),
        "submitted": len([loan for loan in branch_loans if loan.status == "Submitted"]),
        "verified": len([loan for loan in branch_loans if loan.status == "Verified"]),
        "risk_pending": len([loan for loan in branch_loans if loan.status == "Risk Pending"]),
        "risk_completed": len([loan for loan in branch_loans if loan.status == "Risk Completed"]),
        "manager_review": len([loan for loan in branch_loans if loan.status == "Manager Review"]),
        "approved": len([loan for loan in branch_loans if loan.status == "Approved"]),
        "rejected": len([loan for loan in branch_loans if loan.status == "Rejected"]),
        "chart": get_status_chart(branch_loans),
    }


@app.get("/dashboard/admin")
def get_admin_dashboard(
    viewer_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    branches_query = db.query(Branch)
    users = db.query(User).all()
    loans = db.query(Loan).all()

    viewer = None

    if viewer_code:
        viewer = db.query(User).filter(
            or_(
                User.employee_code == viewer_code,
                User.user_code == viewer_code,
                User.bank_id == viewer_code,
            )
        ).first()

        if not viewer:
            raise HTTPException(status_code=404, detail="Viewer not found")

        if viewer.role == "ADMIN" and viewer.branch_code and viewer.branch_name != "All Branches":
            branches_query = branches_query.filter(
                Branch.branch_code == viewer.branch_code
            )

    branches = branches_query.all()
    branch_codes = [branch.branch_code for branch in branches]

    branch_summary = []

    for branch in branches:
        branch_users = [
            user for user in users
            if user.branch_code == branch.branch_code
        ]

        branch_customers = [
            user for user in branch_users
            if user.role == "CUSTOMER"
        ]

        branch_employees = [
            user for user in branch_users
            if user.role != "CUSTOMER"
        ]

        branch_loans = [
            loan for loan in loans
            if loan.branch_code == branch.branch_code
        ]

        approved_loans = [
            loan for loan in branch_loans
            if loan.status == "Approved"
        ]

        rejected_loans = [
            loan for loan in branch_loans
            if loan.status == "Rejected"
        ]

        pending_loans = [
            loan for loan in branch_loans
            if loan.status not in ["Approved", "Rejected"]
        ]

        branch_summary.append({
            "branch_code": branch.branch_code,
            "branch_name": branch.branch_name,
            "city": branch.city,
            "state": branch.state,
            "employees": len(branch_employees),
            "customers": len(branch_customers),
            "loans": len(branch_loans),
            "approved": len(approved_loans),
            "rejected": len(rejected_loans),
            "pending": len(pending_loans),
            "approved_loans": len(approved_loans),
            "rejected_loans": len(rejected_loans),
            "pending_loans": len(pending_loans),
        })

    filtered_users = [
        user for user in users
        if user.branch_code in branch_codes
    ]

    filtered_loans = [
        loan for loan in loans
        if loan.branch_code in branch_codes
    ]

    return {
        "viewer": serialize_user(viewer) if viewer else None,
        "total_branches": len(branches),
        "total_employees": len([
            user for user in filtered_users
            if user.role != "CUSTOMER"
        ]),
        "total_customers": len([
            user for user in filtered_users
            if user.role == "CUSTOMER"
        ]),
        "total_loans": len(filtered_loans),
        "approved": len([
            loan for loan in filtered_loans
            if loan.status == "Approved"
        ]),
        "rejected": len([
            loan for loan in filtered_loans
            if loan.status == "Rejected"
        ]),
        "pending": len([
            loan for loan in filtered_loans
            if loan.status not in ["Approved", "Rejected"]
        ]),
        "branch_summary": branch_summary,
        "branches": branch_summary
    }

@app.get("/dashboard/super-admin")
def get_super_admin_dashboard(db: Session = Depends(get_db)):
    branches = db.query(Branch).all()
    employees = db.query(User).filter(User.role != "CUSTOMER").all()
    customers = db.query(User).filter(User.role == "CUSTOMER").all()
    loans = db.query(Loan).all()
    reports = db.query(RiskReport).all()

    branch_performance = []

    for branch in branches:
        branch_loans = [loan for loan in loans if loan.branch_code == branch.branch_code]
        branch_customers = [customer for customer in customers if customer.branch_code == branch.branch_code]

        approved_count = len([loan for loan in branch_loans if loan.status == "Approved"])
        rejected_count = len([loan for loan in branch_loans if loan.status == "Rejected"])

        approval_rate = 0

        if len(branch_loans) > 0:
            approval_rate = round((approved_count / len(branch_loans)) * 100, 2)

        branch_performance.append({
            "branch_code": branch.branch_code,
            "branch_name": branch.branch_name,
            "customers": len(branch_customers),
            "loans": len(branch_loans),
            "approved": approved_count,
            "rejected": rejected_count,
            "approval_rate": approval_rate,
        })

    role_distribution = []

    for role_name in ["ADMIN", "BANK_MANAGER", "LOAN_OFFICER", "RISK_OFFICER"]:
        role_distribution.append({
            "role": role_name.replace("_", " "),
            "count": len([employee for employee in employees if employee.role == role_name])
        })

    return {
        "total_branches": len(branches),
        "total_employees": len(employees),
        "total_customers": len(customers),
        "total_loans": len(loans),
        "total_risk_reports": len(reports),
        "approved_loans": len([loan for loan in loans if loan.status == "Approved"]),
        "rejected_loans": len([loan for loan in loans if loan.status == "Rejected"]),
        "branch_performance": branch_performance,
        "role_distribution": role_distribution,
    }


# =========================================================
# RISK REPORTS
# =========================================================

@app.get("/risk-reports")
def get_all_risk_reports(
    branch_code: Optional[str] = None,
    employee_code: Optional[str] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(RiskReport).join(
        Loan,
        RiskReport.loan_code == Loan.loan_code
    )

    if branch_code:
        query = query.filter(Loan.branch_code == branch_code)

    if employee_code and role == "RISK_OFFICER":
        query = query.filter(RiskReport.created_by == employee_code)

    reports = query.order_by(RiskReport.created_at.desc()).all()

    result = []

    for report in reports:
        loan = db.query(Loan).filter(Loan.loan_code == report.loan_code).first()

        result.append({
            "id": report.id,
            "loan_code": report.loan_code,
            "customer_name": loan.customer_name if loan else "Not available",
            "customer_code": loan.customer_code if loan else "Not available",
            "customer_username": loan.customer_username if loan else "Not available",
            "branch_code": loan.branch_code if loan else None,
            "branch_name": loan.branch_name if loan else "Not available",
            "loan_type": loan.loan_type if loan else "Not available",
            "loan_amount": loan.loan_amount if loan else 0,
            "loan_status": loan.status if loan else "Not available",
            "prediction_status": report.prediction_status,
            "approved_probability": report.approved_probability,
            "rejected_probability": report.rejected_probability,
            "suggested_status": report.suggested_status,
            "total_assets_value": report.total_assets_value,
            "loan_to_income_ratio": report.loan_to_income_ratio,
            "loan_to_assets_ratio": report.loan_to_assets_ratio,
            "asset_to_income_ratio": report.asset_to_income_ratio,
            "risk_score": report.risk_score,
            "risk_level": report.risk_level,
            "risk_reasons": report.risk_reasons,
            "created_by": report.created_by,
            "created_by_name": report.created_by_name,
            "created_at": safe_datetime(report.created_at),
        })

    return result


# =========================================================
# AUDIT LOGS
# =========================================================

@app.get("/audit-logs")
def get_audit_logs(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).all()

    return [
        {
            "id": log.id,
            "action": log.action,
            "loan_code": log.loan_code,
            "performed_by": log.performed_by,
            "performed_by_name": log.performed_by_name,
            "role": log.role,
            "details": log.details,
            "created_at": safe_datetime(log.created_at),
        }
        for log in logs
    ]