import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  RefreshCcw,
  Search,
  AlertCircle,
  FileText,
  UserRound,
  Activity
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { getRiskReports } from "../../api/wisebankApi";

function ManagerRiskReports() {
  const { currentUser } = useAuth();

  const [reports, setReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const response = await getRiskReports({
        branch_code: currentUser?.branch_code
      });

      setReports(response.data || []);
    } catch (error) {
      setError(getReadableError(error));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = useMemo(() => {
    const search = searchTerm.toLowerCase();

    return reports.filter((report) => {
      return (
        String(report.loan_code || "").toLowerCase().includes(search) ||
        String(report.risk_level || "").toLowerCase().includes(search) ||
        String(report.prediction_status || "").toLowerCase().includes(search) ||
        String(report.created_by_name || "").toLowerCase().includes(search)
      );
    });
  }, [reports, searchTerm]);

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">Manager</p>
          <h1>Risk Reports</h1>
          <p>
            Risk reports generated for {currentUser?.branch_name}. Manager can
            use these reports before final decision.
          </p>
        </div>

        <button className="secondary-btn" onClick={loadReports}>
          <RefreshCcw size={18} />
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="auth-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="dashboard-card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search loan code, risk level, officer"
            />
          </div>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="section-title">
          <ShieldCheck size={20} />
          <h3>Branch Risk Reports</h3>
        </div>

        {loading && <p className="muted-text">Loading reports...</p>}

        {!loading && filteredReports.length === 0 && (
          <div className="empty-state">
            <FileText size={38} />
            <h3>No risk reports found</h3>
            <p>Risk Officer must generate report first.</p>
          </div>
        )}

        {!loading && filteredReports.length > 0 && (
          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Loan</th>
                  <th>Prediction</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                  <th>Approved %</th>
                  <th>Rejected %</th>
                  <th>Risk Officer</th>
                </tr>
              </thead>

              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id || report.loan_code}>
                    <td>
                      <strong>{report.loan_code}</strong>
                    </td>

                    <td>{report.prediction_status || "-"}</td>

                    <td>
                      <span className="status-badge status-risk">
                        {report.risk_level || "-"}
                      </span>
                    </td>

                    <td>
                      <Activity size={15} /> {report.risk_score ?? "-"}
                    </td>

                    <td>{report.approved_probability ?? "-"}%</td>

                    <td>{report.rejected_probability ?? "-"}%</td>

                    <td>
                      <UserRound size={15} />{" "}
                      {report.created_by_name || "Risk Officer"}
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

export default ManagerRiskReports;