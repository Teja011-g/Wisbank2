from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    user_code = Column(String, unique=True, index=True)
    name = Column(String, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    role = Column(String, nullable=False)

    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)

    employee_code = Column(String, unique=True, nullable=True, index=True)
    customer_code = Column(String, unique=True, nullable=True, index=True)
    bank_id = Column(String, unique=True, nullable=True, index=True)

    branch_code = Column(String, nullable=True, index=True)
    branch_name = Column(String, nullable=True)

    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    date_of_birth = Column(String, nullable=True)

    status = Column(String, default="Active")
    must_change_password = Column(String, default="No")

    # Admin permissions controlled by Super Admin
    can_create_branch = Column(String, default="No")
    can_manage_employees = Column(String, default="Yes")
    can_view_branch_tasks = Column(String, default="Yes")
    can_edit_employees = Column(String, default="No")
    can_delete_employees = Column(String, default="No")

    created_by = Column(String, nullable=True)
    created_by_role = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


class Branch(Base):
    __tablename__ = "branches"

    id = Column(Integer, primary_key=True, index=True)

    branch_code = Column(String, unique=True, index=True, nullable=False)
    branch_name = Column(String, unique=True, nullable=False)

    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    phone = Column(String, nullable=True)

    created_at = Column(DateTime, nullable=True)


class Loan(Base):
    __tablename__ = "loans"

    id = Column(Integer, primary_key=True, index=True)

    loan_code = Column(String, unique=True, index=True, nullable=False)

    customer_code = Column(String, index=True, nullable=False)
    customer_username = Column(String, nullable=True)
    customer_name = Column(String, nullable=False)
    customer_phone = Column(String, nullable=True)

    branch_code = Column(String, index=True, nullable=False)
    branch_name = Column(String, nullable=False)

    loan_type = Column(String, nullable=False)
    loan_amount = Column(Float, nullable=False)
    purpose = Column(Text, nullable=True)

    status = Column(String, default="Submitted")

    assigned_loan_officer_code = Column(String, nullable=True)
    assigned_loan_officer_name = Column(String, nullable=True)

    assigned_risk_officer_code = Column(String, nullable=True)
    assigned_risk_officer_name = Column(String, nullable=True)

    verified_by = Column(String, nullable=True)
    verified_by_name = Column(String, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    risk_reviewed_by = Column(String, nullable=True)
    risk_reviewed_by_name = Column(String, nullable=True)
    risk_reviewed_at = Column(DateTime, nullable=True)

    approved_by = Column(String, nullable=True)
    approved_by_name = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    manager_decision_reason = Column(Text, nullable=True)

    created_at = Column(DateTime, nullable=True)


class RiskReport(Base):
    __tablename__ = "risk_reports"

    id = Column(Integer, primary_key=True, index=True)

    loan_code = Column(String, index=True, nullable=False)

    prediction_status = Column(String, nullable=True)
    approved_probability = Column(Float, nullable=True)
    rejected_probability = Column(Float, nullable=True)
    suggested_status = Column(String, nullable=True)

    total_assets_value = Column(Float, nullable=True)
    loan_to_income_ratio = Column(Float, nullable=True)
    loan_to_assets_ratio = Column(Float, nullable=True)
    asset_to_income_ratio = Column(Float, nullable=True)

    risk_score = Column(Float, nullable=True)
    risk_level = Column(String, nullable=True)
    risk_reasons = Column(Text, nullable=True)

    created_by = Column(String, nullable=True)
    created_by_name = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    action = Column(String, nullable=False)
    loan_code = Column(String, nullable=True)

    performed_by = Column(String, nullable=True)
    performed_by_name = Column(String, nullable=True)
    role = Column(String, nullable=True)

    details = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=True)


class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, index=True, nullable=False)
    code = Column(String, nullable=False)

    is_used = Column(String, default="No")
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=True)
