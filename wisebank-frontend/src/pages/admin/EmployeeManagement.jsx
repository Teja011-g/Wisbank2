import { useEffect, useMemo, useState } from "react";
import {
  UsersRound,
  Plus,
  Trash2,
  RefreshCcw,
  Building2,
  Mail,
  UserRound,
  BadgeCheck,
  ShieldCheck,
  KeyRound,
  AlertCircle,
  CheckCircle
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

import {
  getBranches,
  getEmployees,
  createEmployee,
  deleteEmployee
} from "../../api/wisebankApi";

function EmployeeManagement() {
  const { currentUser } = useAuth();

  const [branches, setBranches] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(false);
  const [employeeLoading, setEmployeeLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [createdEmployee, setCreatedEmployee] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    role: "LOAN_OFFICER",
    branch_code: "",
    branch_name: ""
  });

  const roleOptions = useMemo(() => {
    const normalAdminRoles = [
      {
        label: "Bank Manager",
        value: "BANK_MANAGER"
      },
      {
        label: "Loan Officer",
        value: "LOAN_OFFICER"
      },
      {
        label: "Risk Officer",
        value: "RISK_OFFICER"
      }
    ];

    if (currentUser?.role === "SUPER_ADMIN") {
      return [
        {
          label: "Admin",
          value: "ADMIN"
        },
        ...normalAdminRoles
      ];
    }

    return normalAdminRoles;
  }, [currentUser]);

  function getReadableRole(role) {
    const roleMap = {
      SUPER_ADMIN: "Super Admin",
      ADMIN: "Admin",
      BANK_MANAGER: "Bank Manager",
      LOAN_OFFICER: "Loan Officer",
      RISK_OFFICER: "Risk Officer",
      CUSTOMER: "Customer"
    };

    return roleMap[role] || role;
  }

  function getReadableError(error) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const fieldName = Array.isArray(item.loc)
            ? item.loc.join(" → ")
            : "field";

          return `${fieldName}: ${item.msg}`;
        })
        .join(", ");
    }

    if (detail && typeof detail === "object") {
      return JSON.stringify(detail);
    }

    return error?.message || "Something went wrong.";
  }

  function getCreatedUser(data) {
    return data?.user || data || null;
  }

  function getViewerCode() {
    return (
      currentUser?.employee_code ||
      currentUser?.user_code ||
      currentUser?.bank_id ||
      null
    );
  }

  function isBranchAssignedAdmin() {
    return (
      currentUser?.role === "ADMIN" &&
      currentUser?.branch_code &&
      currentUser?.branch_name !== "All Branches"
    );
  }

  async function loadBranches() {
    try {
      const response = await getBranches();
      const allBranches = response.data || [];

      if (isBranchAssignedAdmin()) {
        const assignedBranches = allBranches.filter(
          (branch) => branch.branch_code === currentUser.branch_code
        );

        setBranches(assignedBranches);

        if (assignedBranches.length === 1) {
          setFormData((prev) => ({
            ...prev,
            branch_code: assignedBranches[0].branch_code,
            branch_name: assignedBranches[0].branch_name
          }));
        }
      } else {
        setBranches(allBranches);
      }
    } catch (error) {
      setError(getReadableError(error));
    }
  }

  async function loadEmployees() {
    try {
      setEmployeeLoading(true);
      setError("");

      const response = await getEmployees(getViewerCode());

      setEmployees(response.data || []);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setEmployeeLoading(false);
    }
  }

  async function loadInitialData() {
    setLoading(true);
    await Promise.all([loadBranches(), loadEmployees()]);
    setLoading(false);
  }

  useEffect(() => {
    loadInitialData();
  }, [currentUser]);

  function handleChange(e) {
    const { name, value } = e.target;

    if (name === "username") {
      setFormData((prev) => ({
        ...prev,
        username: value.toLowerCase().replace(/\s/g, "")
      }));
      return;
    }

    if (name === "role") {
      setFormData((prev) => ({
        ...prev,
        role: value
      }));
      return;
    }

    if (name === "branch_code") {
      const selectedBranch = branches.find(
        (branch) => branch.branch_code === value
      );

      setFormData((prev) => ({
        ...prev,
        branch_code: selectedBranch?.branch_code || "",
        branch_name: selectedBranch?.branch_name || ""
      }));

      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function validateForm() {
    if (!formData.name.trim()) {
      return "Employee name is required.";
    }

    if (!formData.username.trim()) {
      return "Username is required.";
    }

    if (!formData.email.trim()) {
      return "Email is required. Email is needed for password verification code.";
    }

    if (!formData.role) {
      return "Please select employee role.";
    }

    if (currentUser?.role !== "SUPER_ADMIN" && formData.role === "ADMIN") {
      return "Only Super Admin can create another Admin.";
    }

    if (
      ["BANK_MANAGER", "LOAN_OFFICER", "RISK_OFFICER"].includes(formData.role) &&
      !formData.branch_code
    ) {
      return "Branch is required for Bank Manager, Loan Officer and Risk Officer.";
    }

    if (isBranchAssignedAdmin() && formData.branch_code !== currentUser.branch_code) {
      return "You can create employees only for your assigned branch.";
    }

    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setCreatedEmployee(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        branch_code: formData.branch_code || null,
        branch_name: formData.branch_name || null,
        created_by: getViewerCode(),
        created_by_role: currentUser?.role || null
      };

      const response = await createEmployee(payload);
      const createdUser = getCreatedUser(response.data);

      setCreatedEmployee(createdUser);

      if (createdUser?.role !== formData.role) {
        setError(
          `Role mismatch. You selected ${formData.role}, but backend saved ${createdUser?.role}. Backend create employee route must be fixed.`
        );
      } else {
        setSuccess(
          `${getReadableRole(createdUser.role)} created successfully. Default password is 1234.`
        );
      }

      setFormData({
        name: "",
        username: "",
        email: "",
        phone: "",
        role: "LOAN_OFFICER",
        branch_code: isBranchAssignedAdmin() ? currentUser.branch_code : "",
        branch_name: isBranchAssignedAdmin() ? currentUser.branch_name : ""
      });

      await loadEmployees();
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(employeeCode) {
    setError("");
    setSuccess("");

    if (!employeeCode) {
      setError("Employee code missing.");
      return;
    }

    try {
      setDeleteLoading(employeeCode);

      await deleteEmployee(employeeCode);

      setSuccess("Employee removed successfully.");

      await loadEmployees();
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setDeleteLoading("");
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin</p>
          <h1>Employee Management</h1>
          <p>
            Admin can create Bank Manager, Loan Officer and Risk Officer. Only
            Super Admin can create Admin users.
          </p>
        </div>

        <button className="secondary-btn" onClick={loadEmployees}>
          <RefreshCcw size={18} />
          Refresh
        </button>
      </div>

      {success && (
        <div className="auth-success">
          <CheckCircle size={18} />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="auth-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {createdEmployee && (
        <div className="form-info-box">
          <strong>Created Employee Login Details:</strong>
          <br />
          Username: <strong>{createdEmployee.username}</strong>
          <br />
          Bank ID: <strong>{createdEmployee.bank_id || "Check employee table"}</strong>
          <br />
          Selected Role: <strong>{createdEmployee.role}</strong>
          <br />
          Default Password: <strong>1234</strong>
        </div>
      )}

      <div className="employee-management-grid">
        <section className="employee-form-card">
          <div className="section-title">
            <Plus size={20} />
            <h3>Create Employee</h3>
          </div>

          <form className="classic-auth-form" onSubmit={handleSubmit}>
            <div className="classic-form-grid">
              <div className="classic-field">
                <label>Employee Name</label>

                <div className="classic-input-line">
                  <UserRound size={17} />

                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Example: Ravi Kumar"
                  />
                </div>
              </div>

              <div className="classic-field">
                <label>Username</label>

                <div className="classic-input-line">
                  <BadgeCheck size={17} />

                  <input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Example: ravi_risk"
                  />
                </div>
              </div>

              <div className="classic-field">
                <label>Email</label>

                <div className="classic-input-line">
                  <Mail size={17} />

                  <input
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Example: ravi@wisebank.com"
                  />
                </div>
              </div>

              <div className="classic-field">
                <label>Phone Optional</label>

                <div className="classic-input-line">
                  <UserRound size={17} />

                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Optional phone number"
                  />
                </div>
              </div>

              <div className="classic-field">
                <label>Role</label>

                <div className="classic-input-line">
                  <ShieldCheck size={17} />

                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    {roleOptions.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="classic-field">
                <label>Branch</label>

                <div className="classic-input-line">
                  <Building2 size={17} />

                  <select
                    name="branch_code"
                    value={formData.branch_code}
                    onChange={handleChange}
                    disabled={isBranchAssignedAdmin()}
                  >
                    <option value="">Select branch</option>

                    {branches.map((branch) => (
                      <option
                        key={branch.branch_code}
                        value={branch.branch_code}
                      >
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-info-box">
              Selected Role Sent To Backend: <strong>{formData.role}</strong>
              <br />
              Risk Officer must be sent as: <strong>RISK_OFFICER</strong>
            </div>

            <button
              className="primary-btn employee-submit-btn"
              type="submit"
              disabled={loading}
            >
              <Plus size={18} />
              {loading ? "Creating..." : "Create Employee"}
            </button>
          </form>
        </section>

        <section className="employee-preview-card">
          <div className="section-title">
            <KeyRound size={20} />
            <h3>New Employee Login Flow</h3>
          </div>

          <div className="profile-info-list">
            <div>
              <BadgeCheck size={18} />
              <span>Username</span>
              <strong>{formData.username || "Not entered"}</strong>
            </div>

            <div>
              <ShieldCheck size={18} />
              <span>Role</span>
              <strong>{formData.role}</strong>
            </div>

            <div>
              <Building2 size={18} />
              <span>Branch</span>
              <strong>{formData.branch_name || "Not selected"}</strong>
            </div>

            <div>
              <KeyRound size={18} />
              <span>Default Password</span>
              <strong>1234</strong>
            </div>
          </div>

          <div className="form-info-box">
            Correct redirects:
            <br />
            <strong>LOAN_OFFICER</strong> → /loan-officer/queue
            <br />
            <strong>RISK_OFFICER</strong> → /risk-officer/review
            <br />
            <strong>BANK_MANAGER</strong> → /manager/dashboard
          </div>
        </section>
      </div>

      <section className="dashboard-card">
        <div className="section-title">
          <UsersRound size={20} />
          <h3>Employees</h3>
        </div>

        {employeeLoading && <p className="muted-text">Loading employees...</p>}

        {!employeeLoading && employees.length === 0 && (
          <div className="empty-state">
            <UsersRound size={38} />
            <h3>No employees found</h3>
            <p>Create employees to show them here.</p>
          </div>
        )}

        {!employeeLoading && employees.length > 0 && (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Username</th>
                  <th>Bank ID</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Password Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employee_code || employee.user_code}>
                    <td>
                      <strong>{employee.name}</strong>
                      <br />
                      <span>{employee.employee_code}</span>
                    </td>

                    <td>{employee.username || "-"}</td>

                    <td>{employee.bank_id || "-"}</td>

                    <td>
                      <span className="status-badge status-verified">
                        {employee.role}
                      </span>
                    </td>

                    <td>{employee.branch_name || "All Branches"}</td>

                    <td>
                      {employee.must_change_password === "Yes"
                        ? "Must Change"
                        : "Updated"}
                    </td>

                    <td>
                      <button
                        className="small-btn danger-btn"
                        onClick={() => handleDelete(employee.employee_code)}
                        disabled={deleteLoading === employee.employee_code}
                      >
                        <Trash2 size={16} />
                        {deleteLoading === employee.employee_code
                          ? "Removing..."
                          : "Remove"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default EmployeeManagement;