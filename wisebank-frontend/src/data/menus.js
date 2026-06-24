import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  ShieldCheck,
  ClipboardList,
  UserRound,
  BarChart3
} from "lucide-react";

const menus = {
  SUPER_ADMIN: [
    { label: "Dashboard", path: "/super-admin/dashboard", icon: LayoutDashboard },
    { label: "Branches", path: "/super-admin/branches", icon: Building2 },
    { label: "Admins", path: "/super-admin/admins", icon: Users },
    { label: "Reports", path: "/super-admin/reports", icon: BarChart3 }
  ],

  ADMIN: [
    { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Branches", path: "/admin/branches", icon: Building2 },
    { label: "Employees", path: "/admin/employees", icon: Users }
  ],

  BANK_MANAGER: [
  { label: "Dashboard", path: "/manager/dashboard", icon: LayoutDashboard },
  { label: "Loan Approvals", path: "/manager/loans", icon: FileText },
  { label: "Tasks", path: "/manager/tasks", icon: ClipboardList },
  { label: "Risk Reports", path: "/manager/risk-reports", icon: ShieldCheck }
],

  LOAN_OFFICER: [
    { label: "My Queue", path: "/loan-officer/queue", icon: ClipboardList },
    { label: "Verified Loans", path: "/loan-officer/verified", icon: ShieldCheck }
  ],

  RISK_OFFICER: [
  { label: "Risk Review", path: "/risk-officer/review", icon: ShieldCheck },
  { label: "Risk Reports", path: "/risk-officer/reports", icon: BarChart3 }
],

  CUSTOMER: [
    { label: "Apply Loan", path: "/customer/apply", icon: FileText },
    { label: "Loan Status", path: "/customer/status", icon: ClipboardList },
    { label: "Profile", path: "/customer/profile", icon: UserRound }
  ]
};

export default menus;