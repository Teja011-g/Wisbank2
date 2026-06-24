from pydantic import BaseModel


class LoginInput(BaseModel):
    login_id: str
    password: str


class CustomerRegisterInput(BaseModel):
    name: str
    username: str
    password: str
    phone: str
    email: str | None = None
    date_of_birth: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    branch_code: str
    branch_name: str


class ChangePasswordInput(BaseModel):
    user_code: str
    old_password: str
    new_password: str


class EmployeeCreate(BaseModel):
    name: str
    username: str
    email: str | None = None
    phone: str | None = None
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


class LoanRiskInput(BaseModel):
    no_of_dependents: int
    education: str
    self_employed: str
    income_annum: int
    loan_amount: int
    loan_term: int
    cibil_score: int
    residential_assets_value: int
    commercial_assets_value: int
    luxury_assets_value: int
    bank_asset_value: int