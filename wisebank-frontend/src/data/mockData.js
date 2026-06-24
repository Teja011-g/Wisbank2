export const branchesData = [
  {
    id: "BR-001",
    branchName: "Hyderabad Main Branch",
    branchCode: "HYD001",
    city: "Hyderabad",
    state: "Telangana",
    manager: "Arjun Reddy",
    employees: 24,
    status: "Active"
  },
  {
    id: "BR-002",
    branchName: "Kukatpally Branch",
    branchCode: "KPHB002",
    city: "Hyderabad",
    state: "Telangana",
    manager: "Meera Sharma",
    employees: 18,
    status: "Active"
  },
  {
    id: "BR-003",
    branchName: "Gachibowli Branch",
    branchCode: "GCB003",
    city: "Hyderabad",
    state: "Telangana",
    manager: "Vikram Rao",
    employees: 21,
    status: "Active"
  }
];

export const employeesData = [
  {
    id: "EMP-001",
    name: "Arjun Reddy",
    email: "arjun@wisebank.com",
    role: "BANK_MANAGER",
    branch: "Hyderabad Main Branch",
    status: "Active"
  },
  {
    id: "EMP-002",
    name: "Sneha Rao",
    email: "sneha@wisebank.com",
    role: "LOAN_OFFICER",
    branch: "Hyderabad Main Branch",
    status: "Active"
  },
  {
    id: "EMP-003",
    name: "Vikram Kumar",
    email: "vikram@wisebank.com",
    role: "RISK_OFFICER",
    branch: "Kukatpally Branch",
    status: "Active"
  }
];

export const loanApplicationsData = [
  {
    id: "LN-1001",
    customer: "Rahul Sharma",
    loanType: "Personal Loan",
    amount: 500000,
    branch: "Hyderabad Main Branch",
    status: "Submitted"
  },
  {
    id: "LN-1002",
    customer: "Ananya Reddy",
    loanType: "Education Loan",
    amount: 850000,
    branch: "Hyderabad Main Branch",
    status: "Submitted"
  },
  {
    id: "LN-1003",
    customer: "Kiran Kumar",
    loanType: "Business Loan",
    amount: 1200000,
    branch: "Kukatpally Branch",
    status: "Documents Required"
  }
];

export const riskApplicationsData = [
  {
    id: "LN-1001",
    customer: "Rahul Sharma",
    amount: 500000,
    loanType: "Personal Loan",
    status: "Risk Pending"
  },
  {
    id: "LN-1002",
    customer: "Ananya Reddy",
    amount: 850000,
    loanType: "Education Loan",
    status: "Risk Pending"
  },
  {
    id: "LN-1003",
    customer: "Kiran Kumar",
    amount: 1200000,
    loanType: "Business Loan",
    status: "Risk Pending"
  }
];

export const managerLoansData = [
  {
    id: "LN-1001",
    customer: "Rahul Sharma",
    amount: "₹5,00,000",
    loanType: "Personal Loan",
    predictionStatus: "Approved",
    approvedProbability: 86.4,
    rejectedProbability: 13.6,
    riskLevel: "Low",
    riskScore: 20,
    suggestedStatus: "Low Risk - Recommended for Manager Approval",
    riskReasons: [],
    status: "Manager Review"
  },
  {
    id: "LN-1002",
    customer: "Ananya Reddy",
    amount: "₹8,50,000",
    loanType: "Education Loan",
    predictionStatus: "Approved",
    approvedProbability: 62.1,
    rejectedProbability: 37.9,
    riskLevel: "Medium",
    riskScore: 45,
    suggestedStatus: "Manual Review Required",
    riskReasons: ["Loan amount is high compared to annual income"],
    status: "Manager Review"
  },
  {
    id: "LN-1003",
    customer: "Kiran Kumar",
    amount: "₹12,00,000",
    loanType: "Business Loan",
    predictionStatus: "Rejected",
    approvedProbability: 34.8,
    rejectedProbability: 65.2,
    riskLevel: "High",
    riskScore: 78,
    suggestedStatus: "High Risk - Risk Officer Review Required",
    riskReasons: [
      "Low CIBIL score",
      "Loan amount is high compared to annual income",
      "Long loan term increases repayment risk"
    ],
    status: "Manager Review"
  }
];

export const riskReportsData = [
  {
    loanId: "LN-1001",
    customer: "Rahul Sharma",
    riskLevel: "Low Risk",
    approvalChance: "86%",
    riskScore: "20/100",
    status: "Forwarded to Manager"
  },
  {
    loanId: "LN-1002",
    customer: "Ananya Reddy",
    riskLevel: "Medium Risk",
    approvalChance: "62%",
    riskScore: "45/100",
    status: "Manual Review"
  },
  {
    loanId: "LN-1003",
    customer: "Kiran Kumar",
    riskLevel: "High Risk",
    approvalChance: "34%",
    riskScore: "78/100",
    status: "Manager Review Required"
  }
];
export const adminsData = [
  {
    id: "ADM-001",
    name: "Rohit Verma",
    email: "rohit@wisebank.com",
    region: "Hyderabad Region",
    branchAccess: "All Hyderabad Branches",
    status: "Active"
  },
  {
    id: "ADM-002",
    name: "Priya Nair",
    email: "priya@wisebank.com",
    region: "Telangana Region",
    branchAccess: "Selected Branches",
    status: "Active"
  },
  {
    id: "ADM-003",
    name: "Sandeep Kumar",
    email: "sandeep@wisebank.com",
    region: "South Zone",
    branchAccess: "Regional Branches",
    status: "Active"
  }
];