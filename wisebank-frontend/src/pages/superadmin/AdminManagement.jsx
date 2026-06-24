import { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Trash2,
  MapPinned,
  Building2,
  Mail,
  BadgeCheck,
  KeyRound,
  AlertCircle,
  CheckCircle,
  RefreshCcw
} from "lucide-react";

import StatCard from "../../components/common/StatCard";
import RevealSection from "../../components/common/RevealSection";

import { useAuth } from "../../context/AuthContext";

import {
  getBranches,
  getEmployees,
  createEmployee,
  deleteEmployee
} from "../../api/wisebankApi";

function AdminManagement() {
  const { currentUser } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [branches, setBranches] = useState([]);
  const [createdAdmin, setCreatedAdmin] = useState(null);

  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState("");

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [adminForm, setAdminForm] = useState({
    name: "",
    username: "",
    email: "",
    phone: "",
    branch_access_type: "ALL",
    branch_code: "",
    branch_name: "",
    can_create_branch: "No",
    can_manage_employees: "Yes",
    can_view_branch_tasks: "Yes",
    can_edit_employees: "No",
    can_delete_employees: "No"
  });

  function getReadableError(error) {
    const detail = error?.response?.data?.detail;

    if (typeof detail === "string") return detail;

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

    if (detail && typeof detail === "object") return JSON.stringify(detail);

    return error?.message || "Something went wrong.";
  }

  async function loadAdminsAndBranches() {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, branchResponse] = await Promise.all([
        getEmployees(),
        getBranches()
      ]);

      const employeeList = employeeResponse.data || [];
      const adminUsers = employeeList.filter(
        (employee) => employee.role === "ADMIN"
      );

      setAdmins(adminUsers);
      setBranches(branchResponse.data || []);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminsAndBranches();
  }, []);

  function handleChange(e) {
    const { name, value, checked, type } = e.target;

    if (name === "username") {
      setAdminForm((prev) => ({
        ...prev,
        username: value.toLowerCase().replace(/\s/g, "")
      }));
      return;
    }

    if (type === "checkbox") {
      setAdminForm((prev) => ({
        ...prev,
        [name]: checked ? "Yes" : "No"
      }));
      return;
    }

    if (name === "branch_access_type") {
      setAdminForm((prev) => ({
        ...prev,
        branch_access_type: value,
        branch_code: value === "ALL" ? "" : prev.branch_code,
        branch_name: value === "ALL" ? "" : prev.branch_name
      }));
      return;
    }

    if (name === "branch_code") {
      const selectedBranch = branches.find(
        (branch) => branch.branch_code === value
      );

      setAdminForm((prev) => ({
        ...prev,
        branch_code: selectedBranch?.branch_code || "",
        branch_name: selectedBranch?.branch_name || ""
      }));
      return;
    }

    setAdminForm((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  function validateForm() {
    if (!adminForm.name.trim()) return "Admin name is required.";
    if (!adminForm.username.trim()) return "Username is required.";
    if (!adminForm.email.trim()) {
      return "Email is required. Email is needed for password verification.";
    }

    if (adminForm.branch_access_type === "BRANCH" && !adminForm.branch_code) {
      return "Please select a branch for branch-level Admin access.";
    }

    return "";
  }

  async function addAdmin(e) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setCreatedAdmin(null);

    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);

      const payload = {
        name: adminForm.name.trim(),
        username: adminForm.username.trim().toLowerCase(),
        email: adminForm.email.trim().toLowerCase(),
        phone: adminForm.phone.trim() || null,
        role: "ADMIN",
        branch_code:
          adminForm.branch_access_type === "BRANCH"
            ? adminForm.branch_code
            : null,
        branch_name:
          adminForm.branch_access_type === "BRANCH"
            ? adminForm.branch_name
            : null,
        can_create_branch: adminForm.can_create_branch,
        can_manage_employees: adminForm.can_manage_employees,
        can_view_branch_tasks: adminForm.can_view_branch_tasks,
        can_edit_employees: adminForm.can_edit_employees,
        can_delete_employees: adminForm.can_delete_employees,
        created_by:
          currentUser?.employee_code ||
          currentUser?.user_code ||
          currentUser?.bank_id ||
          "SUPER_ADMIN",
        created_by_role: currentUser?.role || "SUPER_ADMIN"
      };

      const response = await createEmployee(payload);
      const createdUser = response.data?.user || response.data;

      if (!createdUser || createdUser.role !== "ADMIN") {
        setError("Backend did not create Admin correctly. Please check /employees API.");
        return;
      }

      setCreatedAdmin(createdUser);
      setSuccess(
        "Admin created successfully. Default password is 1234. Ask the Admin to login and change password."
      );

      setAdminForm({
        name: "",
        username: "",
        email: "",
        phone: "",
        branch_access_type: "ALL",
        branch_code: "",
        branch_name: "",
        can_create_branch: "No",
        can_manage_employees: "Yes",
        can_view_branch_tasks: "Yes",
        can_edit_employees: "No",
        can_delete_employees: "No"
      });

      await loadAdminsAndBranches();
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  async function removeAdmin(employeeCode) {
    setError("");
    setSuccess("");

    if (!employeeCode) {
      setError("Admin employee code missing.");
      return;
    }

    try {
      setDeleteLoading(employeeCode);
      await deleteEmployee(employeeCode);
      setSuccess("Admin removed successfully.");
      await loadAdminsAndBranches();
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setDeleteLoading("");
    }
  }

  const totalAdmins = admins.length;
  const branchCreationAdmins = admins.filter(
    (admin) => admin.can_create_branch === "Yes"
  ).length;
  const branchAssignedAdmins = admins.filter((admin) => admin.branch_code).length;
  const mustChangePasswordCount = admins.filter(
    (admin) => admin.must_change_password === "Yes"
  ).length;

  const selectedBranchText = useMemo(() => {
    if (adminForm.branch_access_type === "ALL") return "All Branches";
    return adminForm.branch_name || "Specific branch not selected";
  }, [adminForm.branch_access_type, adminForm.branch_name]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Super Admin</p>
          <h1 className="page-title">Admin Management</h1>
          <p className="page-description">
            Create Admin accounts, assign branch access, and control whether an
            Admin can create new branches.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadAdminsAndBranches}>
          <RefreshCcw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
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

      {createdAdmin && (
        <div className="form-info-box">
          <strong>Created Admin Login Details:</strong>
          <br />
          Username: <strong>{createdAdmin.username}</strong>
          <br />
          Bank ID: <strong>{createdAdmin.bank_id || "Check admin table"}</strong>
          <br />
          Role: <strong>{createdAdmin.role}</strong>
          <br />
          Branch Access: <strong>{createdAdmin.branch_name || "All Branches"}</strong>
          <br />
          Can Create Branch: <strong>{createdAdmin.can_create_branch}</strong>
          <br />
          Default Password: <strong>1234</strong>
        </div>
      )}

      <div className="stats-grid">
        <RevealSection>
          <StatCard title="Total Admins" value={totalAdmins} subtitle="Real admin users" icon={Users} />
        </RevealSection>

        <RevealSection>
          <StatCard title="Branch Creators" value={branchCreationAdmins} subtitle="Can create branches" icon={Building2} />
        </RevealSection>

        <RevealSection>
          <StatCard title="Branch Assigned" value={branchAssignedAdmins} subtitle="Limited to one branch" icon={MapPinned} />
        </RevealSection>

        <RevealSection>
          <StatCard title="Must Change Password" value={mustChangePasswordCount} subtitle="Using default password" icon={KeyRound} />
        </RevealSection>
      </div>

      <div className="admin-management-grid">
        <RevealSection>
          <form className="admin-form-card" onSubmit={addAdmin}>
            <div className="form-card-header">
              <UserPlus size={21} />
              <div>
                <h3>Add Admin</h3>
                <p>Create Admin login and assign permissions</p>
              </div>
            </div>

            <div className="input-grid">
              <div className="input-group">
                <label>Admin Name</label>
                <input type="text" name="name" placeholder="Enter admin name" value={adminForm.name} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>Username</label>
                <input type="text" name="username" placeholder="Example: admin_hyd" value={adminForm.username} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>Email</label>
                <input type="email" name="email" placeholder="admin@wisebank.com" value={adminForm.email} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <label>Phone Optional</label>
                <input type="text" name="phone" placeholder="Optional phone number" value={adminForm.phone} onChange={handleChange} />
              </div>

              <div className="input-group">
                <label>Branch Access</label>
                <select name="branch_access_type" value={adminForm.branch_access_type} onChange={handleChange}>
                  <option value="ALL">All Branches</option>
                  <option value="BRANCH">Specific Branch</option>
                </select>
              </div>

              {adminForm.branch_access_type === "BRANCH" && (
                <div className="input-group">
                  <label>Select Branch</label>
                  <select name="branch_code" value={adminForm.branch_code} onChange={handleChange}>
                    <option value="">Select branch</option>
                    {branches.map((branch) => (
                      <option key={branch.branch_code} value={branch.branch_code}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="form-info-box">
              <strong>Permissions</strong>
              <div className="permission-grid">
                <label>
                  <input type="checkbox" name="can_create_branch" checked={adminForm.can_create_branch === "Yes"} onChange={handleChange} />
                  Can create branches
                </label>

                <label>
                  <input type="checkbox" name="can_manage_employees" checked={adminForm.can_manage_employees === "Yes"} onChange={handleChange} />
                  Can manage employees
                </label>

                <label>
                  <input type="checkbox" name="can_view_branch_tasks" checked={adminForm.can_view_branch_tasks === "Yes"} onChange={handleChange} />
                  Can view branch tasks
                </label>

                <label>
                  <input type="checkbox" name="can_edit_employees" checked={adminForm.can_edit_employees === "Yes"} onChange={handleChange} />
                  Can edit employees
                </label>

                <label>
                  <input type="checkbox" name="can_delete_employees" checked={adminForm.can_delete_employees === "Yes"} onChange={handleChange} />
                  Can delete employees
                </label>
              </div>
            </div>

            <button className="primary-btn admin-submit-btn" type="submit" disabled={loading}>
              <UserPlus size={18} />
              {loading ? "Creating..." : "Add Admin"}
            </button>
          </form>
        </RevealSection>

        <RevealSection>
          <section className="admin-preview-card">
            <div className="form-card-header">
              <ShieldCheck size={21} />
              <div>
                <h3>Admin Preview</h3>
                <p>Details before adding admin</p>
              </div>
            </div>

            <div className="preview-list">
              <div><span>Name</span><strong>{adminForm.name || "Not entered"}</strong></div>
              <div><span>Username</span><strong>{adminForm.username || "Not entered"}</strong></div>
              <div><span>Email</span><strong>{adminForm.email || "Not entered"}</strong></div>
              <div><span>Role</span><strong>ADMIN</strong></div>
              <div><span>Branch Access</span><strong>{selectedBranchText}</strong></div>
              <div><span>Can Create Branch</span><strong>{adminForm.can_create_branch}</strong></div>
              <div><span>Default Password</span><strong>1234</strong></div>
            </div>
          </section>
        </RevealSection>
      </div>

      <RevealSection>
        <section className="table-card">
          <div className="table-header">
            <div>
              <h3>Admins</h3>
              <p>Real Admin accounts stored in backend database.</p>
            </div>
          </div>

          {loading && <div className="empty-state">Loading admins...</div>}

          {!loading && admins.length === 0 && (
            <div className="empty-state">
              <Users size={38} />
              <h3>No admins found</h3>
              <p>Create Admin users to show them here.</p>
            </div>
          )}

          {!loading && admins.length > 0 && (
            <div className="responsive-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Admin</th>
                    <th>Username</th>
                    <th>Bank ID</th>
                    <th>Email</th>
                    <th>Branch Access</th>
                    <th>Create Branch</th>
                    <th>Manage Employees</th>
                    <th>Password Status</th>
                    <th>Remove</th>
                  </tr>
                </thead>

                <tbody>
                  {admins.map((admin) => (
                    <tr key={admin.employee_code || admin.user_code}>
                      <td><strong>{admin.name}</strong><br /><span>{admin.employee_code}</span></td>
                      <td><BadgeCheck size={14} /> {admin.username || "-"}</td>
                      <td>{admin.bank_id || "-"}</td>
                      <td><Mail size={14} /> {admin.email || "-"}</td>
                      <td>{admin.branch_name || "All Branches"}</td>
                      <td>{admin.can_create_branch || "No"}</td>
                      <td>{admin.can_manage_employees || "Yes"}</td>
                      <td>{admin.must_change_password === "Yes" ? "Must Change" : "Updated"}</td>
                      <td>
                        <button className="small-btn danger" onClick={() => removeAdmin(admin.employee_code)} disabled={deleteLoading === admin.employee_code}>
                          <Trash2 size={15} />
                          {deleteLoading === admin.employee_code ? "Removing..." : "Remove"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </RevealSection>
    </div>
  );
}

export default AdminManagement;
