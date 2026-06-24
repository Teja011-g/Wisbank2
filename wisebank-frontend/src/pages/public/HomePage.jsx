import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Landmark,
  ArrowRight,
  ShieldCheck,
  UsersRound,
  Building2,
  X,
  ClipboardList,
  FileSearch,
  BadgeCheck,
  BarChart3
} from "lucide-react";

import Login from "../auth/Login";

function HomePage() {
  const [showLogin, setShowLogin] = useState(false);

  function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  return (
    <div className="public-home-page">
      <header className="public-navbar">
        <Link to="/" className="public-brand">
          <span>
            <Landmark size={24} />
          </span>
          WiseBank
        </Link>

        <nav className="public-nav-menu">
          <button type="button" onClick={() => scrollToSection("about")}>
            About
          </button>

          <button type="button" onClick={() => scrollToSection("workflow")}>
            Workflow
          </button>

          <button type="button" onClick={() => scrollToSection("roles")}>
            Roles
          </button>
        </nav>

        <div className="public-nav-actions">
          <button
            type="button"
            className="classic-link-btn"
            onClick={() => setShowLogin(true)}
          >
            Login
          </button>

          <Link to="/register" className="public-primary-link">
            Open Account
          </Link>
        </div>
      </header>

      <main className="public-hero">
        <section className="public-hero-content">
          <p className="page-eyebrow">Digital Loan Management</p>

          <h1>
            Smart banking workflow for customers, officers and managers.
          </h1>

          <p>
            Apply for loans, verify applications, review risk, and approve
            decisions through one secure WiseBank system.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowLogin(true)}
            >
              Login to WiseBank
              <ArrowRight size={18} />
            </button>

            <Link to="/register" className="secondary-outline-link">
              Register as Customer
            </Link>
          </div>
        </section>

        <section className="public-hero-card">
          <div className="hero-card-top">
            <div>
              <span>WiseBank Flow</span>
              <h3>Loan Application Journey</h3>
            </div>

            <ShieldCheck size={30} />
          </div>

          <div className="hero-flow-list">
            <div>
              <strong>Customer</strong>
              <p>Applies loan from selected branch</p>
            </div>

            <div>
              <strong>Loan Officer</strong>
              <p>Verifies application details</p>
            </div>

            <div>
              <strong>Risk Officer</strong>
              <p>Generates risk report</p>
            </div>

            <div>
              <strong>Manager</strong>
              <p>Approves or rejects loan</p>
            </div>
          </div>
        </section>
      </main>

      <section className="public-feature-grid">
        <div>
          <Building2 size={24} />
          <h3>Branch Based</h3>
          <p>Customers and staff are mapped to branches.</p>
        </div>

        <div>
          <UsersRound size={24} />
          <h3>Role Based</h3>
          <p>Each role sees only its required workflow.</p>
        </div>

        <div>
          <ShieldCheck size={24} />
          <h3>Secure Access</h3>
          <p>Password change and email verification supported.</p>
        </div>
      </section>

      <section id="about" className="public-info-section">
        <div className="public-section-heading">
          <p className="page-eyebrow">About WiseBank</p>
          <h2>One system for complete loan processing</h2>
          <p>
            WiseBank is a role-based banking application where every user has a
            clear responsibility. Customers apply for loans, officers process
            them, and managers make the final decision.
          </p>
        </div>

        <div className="about-grid">
          <div className="about-card">
            <Landmark size={28} />
            <h3>Digital Banking Flow</h3>
            <p>
              Instead of manual paper movement, each loan moves through a clear
              digital pipeline.
            </p>
          </div>

          <div className="about-card">
            <FileSearch size={28} />
            <h3>Transparent Tracking</h3>
            <p>
              Customers can check status while internal staff can see who handled
              each step.
            </p>
          </div>

          <div className="about-card">
            <BarChart3 size={28} />
            <h3>Reports and Insights</h3>
            <p>
              Risk reports, branch dashboards, and approval data help upper
              officers monitor work.
            </p>
          </div>
        </div>
      </section>

      <section id="workflow" className="public-info-section workflow-section">
        <div className="public-section-heading">
          <p className="page-eyebrow">Workflow</p>
          <h2>How a loan moves in WiseBank</h2>
          <p>
            The loan does not directly get approved. It moves step by step
            through officers and manager review.
          </p>
        </div>

        <div className="workflow-timeline">
          <div className="workflow-step">
            <span>01</span>
            <ClipboardList size={24} />
            <h3>Customer Applies</h3>
            <p>Customer registers, selects branch, and applies for loan.</p>
          </div>

          <div className="workflow-step">
            <span>02</span>
            <BadgeCheck size={24} />
            <h3>Loan Officer Verifies</h3>
            <p>Loan officer claims the application and verifies details.</p>
          </div>

          <div className="workflow-step">
            <span>03</span>
            <ShieldCheck size={24} />
            <h3>Risk Officer Reviews</h3>
            <p>Risk officer enters CIBIL/assets and generates risk report.</p>
          </div>

          <div className="workflow-step">
            <span>04</span>
            <Landmark size={24} />
            <h3>Manager Decides</h3>
            <p>Manager checks report and approves or rejects the loan.</p>
          </div>
        </div>
      </section>

      <section id="roles" className="public-info-section">
        <div className="public-section-heading">
          <p className="page-eyebrow">Roles</p>
          <h2>Each role has a separate dashboard</h2>
          <p>
            WiseBank uses role-based access so users only see pages and actions
            related to their work.
          </p>
        </div>

        <div className="role-grid">
          <div>
            <h3>Customer</h3>
            <p>Register, apply loan, and track loan status.</p>
          </div>

          <div>
            <h3>Loan Officer</h3>
            <p>Claim branch applications, verify, and forward to risk.</p>
          </div>

          <div>
            <h3>Risk Officer</h3>
            <p>Generate risk report and forward completed review to manager.</p>
          </div>

          <div>
            <h3>Manager</h3>
            <p>View branch loans and approve or reject final applications.</p>
          </div>

          <div>
            <h3>Admin</h3>
            <p>Create branches, employees, and view operation dashboards.</p>
          </div>

          <div>
            <h3>Super Admin</h3>
            <p>Monitor entire system and manage admin users.</p>
          </div>
        </div>
      </section>

      {showLogin && (
        <div className="home-login-overlay">
          <div className="home-login-modal">
            <button
              type="button"
              className="home-login-close"
              onClick={() => setShowLogin(false)}
            >
              <X size={18} />
            </button>

            <Login />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;