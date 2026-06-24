import { useEffect, useState } from "react";
import {
  Building2,
  MapPin,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  ShieldAlert
} from "lucide-react";

import {
  getBranches,
  createBranch,
  deleteBranch
} from "../../api/wisebankApi";

import { useAuth } from "../../context/AuthContext";

function BranchManagement() {
  const { currentUser } = useAuth();

  const [branches, setBranches] = useState([]);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    branch_name: "",
    city: "",
    state: "",
    address: "",
    phone: ""
  });

  const canCreateBranch =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.can_create_branch === "Yes";

  async function loadBranches() {
    try {
      setLoading(true);
      const response = await getBranches();
      setBranches(response.data || []);
    } catch (error) {
      showToast("Unable to load branches", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });

    setTimeout(() => {
      setToast(null);
    }, 3000);
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!canCreateBranch) {
      showToast("You do not have permission to create branches", "error");
      return;
    }

    if (!formData.branch_name || !formData.city || !formData.state) {
      showToast("Please fill branch name, city and state", "error");
      return;
    }

    try {
      setCreating(true);

      await createBranch({
        branch_name: formData.branch_name.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        address: formData.address.trim() || null,
        phone: formData.phone.trim() || null,
        created_by:
          currentUser?.employee_code ||
          currentUser?.user_code ||
          currentUser?.bank_id ||
          null,
        created_by_role: currentUser?.role || null
      });

      showToast("Branch created successfully");

      setFormData({
        branch_name: "",
        city: "",
        state: "",
        address: "",
        phone: ""
      });

      await loadBranches();
    } catch (error) {
      showToast(error.response?.data?.detail || "Branch creation failed", "error");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(branchCode) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this branch?"
    );

    if (!confirmDelete) return;

    try {
      await deleteBranch(branchCode);
      showToast("Branch deleted successfully");
      loadBranches();
    } catch (error) {
      showToast(error.response?.data?.detail || "Branch delete failed", "error");
    }
  }

  const filteredBranches = branches.filter((branch) => {
    const text = `
      ${branch.branch_name}
      ${branch.branch_code}
      ${branch.city}
      ${branch.state}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div className="page-section">
      {toast && (
        <div className={`custom-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      <div className="page-header">
        <div>
          <p className="page-eyebrow">Admin Control</p>
          <h1>Branch Management</h1>
          <p>
            View WiseBank branches. Branch creation is controlled by Super Admin
            permissions.
          </p>
        </div>

        <button className="small-btn secondary" onClick={loadBranches}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="admin-work-grid">
        {canCreateBranch ? (
          <form className="admin-form-card" onSubmit={handleSubmit}>
            <div className="section-title">
              <Building2 size={20} />
              <h3>Create Branch</h3>
            </div>

            <div className="form-grid two">
              <div className="input-group full">
                <label>Branch Name</label>
                <input
                  name="branch_name"
                  value={formData.branch_name}
                  onChange={handleChange}
                  placeholder="Hyderabad Main Branch"
                />
              </div>

              <div className="input-group">
                <label>City</label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Hyderabad"
                />
              </div>

              <div className="input-group">
                <label>State</label>
                <input
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Telangana"
                />
              </div>

              <div className="input-group full">
                <label>Address Optional</label>
                <input
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Branch address"
                />
              </div>

              <div className="input-group full">
                <label>Phone Optional</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Branch phone number"
                />
              </div>
            </div>

            <div className="form-info-box">
              Branch Code will be generated automatically by backend.
              <br />
              Current Permission: <strong>Can Create Branch</strong>
            </div>

            <button className="primary-btn full-btn" type="submit" disabled={creating}>
              <Plus size={18} />
              {creating ? "Creating..." : "Create Branch"}
            </button>
          </form>
        ) : (
          <div className="admin-form-card">
            <div className="section-title">
              <ShieldAlert size={20} />
              <h3>Branch Creation Locked</h3>
            </div>

            <div className="form-info-box">
              Your Admin account can view branches, but Super Admin has not
              given permission to create new branches.
            </div>
          </div>
        )}

        <div className="admin-list-card">
          <div className="list-card-header">
            <div>
              <h3>All Branches</h3>
              <p>{filteredBranches.length} branches found</p>
            </div>

            <div className="mini-search">
              <Search size={16} />
              <input
                placeholder="Search branch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="empty-state">Loading branches...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="empty-state">No branches found</div>
          ) : (
            <div className="responsive-table-wrap">
              <table className="clean-table">
                <thead>
                  <tr>
                    <th>Branch</th>
                    <th>Code</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBranches.map((branch) => (
                    <tr key={branch.branch_code}>
                      <td>
                        <strong>{branch.branch_name}</strong>
                      </td>

                      <td>{branch.branch_code}</td>

                      <td>
                        <span className="inline-icon-text">
                          <MapPin size={14} />
                          {branch.city}, {branch.state}
                        </span>
                      </td>

                      <td>
                        <span className="status-pill active">
                          {branch.status || "Active"}
                        </span>
                      </td>

                      <td>
                        <button
                          className="icon-danger-btn"
                          onClick={() => handleDelete(branch.branch_code)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BranchManagement;
