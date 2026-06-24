import api from "./axios";

/* AUTH */

export const loginUser = (data) => {
  return api.post("/auth/login", data);
};

export const registerCustomer = (data) => {
  return api.post("/auth/register-customer", data);
};

export const changePassword = (data) => {
  return api.put("/auth/change-password", data);
};

export const sendPasswordCode = (data) => {
  return api.post("/auth/send-password-code", data);
};

export const verifyPasswordCode = (data) => {
  return api.post("/auth/verify-password-code", data);
};

export const resetPasswordWithCode = (data) => {
  return api.post("/auth/reset-password-with-code", data);
};

export const getProfile = (userCode) => {
  return api.get(`/profile/${userCode}`);
};

/* DASHBOARDS */

export const getManagerDashboard = (employeeCode) => {
  return api.get(`/dashboard/manager/${employeeCode}`);
};

export const getAdminDashboard = (viewerCode = null) => {
  if (viewerCode) {
    return api.get("/dashboard/admin", {
      params: {
        viewer_code: viewerCode
      }
    });
  }

  return api.get("/dashboard/admin");
};

export const getSuperAdminDashboard = () => {
  return api.get("/dashboard/super-admin");
};

/* BRANCHES */

export const getBranches = () => {
  return api.get("/branches");
};

export const createBranch = (data) => {
  return api.post("/branches", data);
};

export const deleteBranch = (branchCode) => {
  return api.delete(`/branches/${branchCode}`);
};

/* EMPLOYEES */

export const getEmployees = (viewerCode = null) => {
  if (viewerCode) {
    return api.get("/employees", {
      params: {
        viewer_code: viewerCode
      }
    });
  }

  return api.get("/employees");
};

export const createEmployee = (data) => {
  return api.post("/employees", data);
};

export const deleteEmployee = (employeeCode) => {
  return api.delete(`/employees/${employeeCode}`);
};

/* CUSTOMER LOANS */

export const applyLoan = (data) => {
  return api.post("/loans/apply", data);
};

export const getCustomerLoans = (customerCode) => {
  return api.get(`/loans/customer/${customerCode}`);
};

/* LOAN OFFICER */

export const getLoanOfficerTasks = (employeeCode) => {
  return api.get(`/loans/loan-officer/${employeeCode}`);
};

export const getLoanOfficerSummary = (employeeCode) => {
  return api.get(`/loans/loan-officer/${employeeCode}/summary`);
};

export const claimLoanOfficerTask = (loanCode, employeeCode) => {
  return api.put(`/loans/${loanCode}/claim-loan-officer/${employeeCode}`);
};

export const verifyLoan = (loanCode, employeeCode) => {
  return api.put(`/loans/${loanCode}/verify/${employeeCode}`);
};

export const forwardToRisk = (loanCode, employeeCode) => {
  return api.put(`/loans/${loanCode}/forward-to-risk/${employeeCode}`);
};

/* RISK OFFICER */

export const getRiskTasks = (employeeCode) => {
  return api.get(`/loans/risk-officer/${employeeCode}`);
};

export const getRiskOfficerSummary = (employeeCode) => {
  return api.get(`/loans/risk-officer/${employeeCode}/summary`);
};

export const claimRiskOfficerTask = (loanCode, employeeCode) => {
  return api.put(`/loans/${loanCode}/claim-risk-officer/${employeeCode}`);
};

export const predictRisk = (loanCode, employeeCode, data) => {
  return api.post(`/loans/${loanCode}/predict-risk/${employeeCode}`, data);
};

export const forwardToManager = (loanCode, employeeCode) => {
  return api.put(`/loans/${loanCode}/forward-to-manager/${employeeCode}`);
};

/* MANAGER */

export const getManagerLoans = (employeeCode) => {
  return api.get(`/loans/manager/${employeeCode}`);
};

export const managerDecision = (loanCode, employeeCode, data) => {
  return api.put(`/loans/${loanCode}/manager-decision/${employeeCode}`, data);
};

/* REPORTS */

export const getRiskReports = (params = {}) => {
  return api.get("/risk-reports", { params });
};

export const getAuditLogs = () => {
  return api.get("/audit-logs");
};