from pydantic import BaseModel


class LoginInput(BaseModel):
    login_id: str
    password: str
    role: str


class ChangePasswordInput(BaseModel):
    user_code: str
    old_password: str
    new_password: str


class EmployeeCreate(BaseModel):
    name: str
    email: str
    role: str
    branch_code: str | None = None
    branch_name: str | None = None
    created_by: str | None = None
    created_by_role: str | None = None


class BranchCreate(BaseModel):
    branch_name: str
    branch_code: str
    city: str
    state: str
    manager_code: str | None = None


class LoanApply(BaseModel):
    customer_code: str
    customer_name: str
    branch_code: str
    branch_name: str
    loan_type: str
    loan_amount: int
    purpose: str


class ManagerDecision(BaseModel):
    decision: str