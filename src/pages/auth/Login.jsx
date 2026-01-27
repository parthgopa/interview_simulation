import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { loginUser } from "../../services/authApi";
import { saveToken } from "../../services/token";
import "./Login.css";
import { FaArrowLeft, FaUser, FaBuilding, FaIdCard } from "react-icons/fa";

export default function Login() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const res = await loginUser({ ...form, role: selectedRole });

    if (res.error) {
      setError(res.error);
      return;
    }

    saveToken(res.token);
    sessionStorage.setItem("userRole", res.user.role);
    
    if (res.user.role === "organization") {
      sessionStorage.setItem("organizationName", res.user.organizationName || "Organization");
      navigate("/organization/dashboard");
    } else {
      sessionStorage.setItem("userName", res.user.name || "Student");
      navigate("/dashboard");
    }
  };

  // Step 1: Role Selection
  if (!selectedRole) {
    return (
      <div className="auth-page-wrapper">
        <AuthCard
          title="Welcome Back"
          subtitle="Please select your account type to continue"
        >
          <div className="role-selection-grid">
            <button className="role-tile" onClick={() => navigate("/candidate-login")}>
              <div className="role-tile-icon"><FaIdCard /></div>
              <div className="role-tile-content">
                <h4>Scheduled Interview</h4>
                <p>Use access codes from your recruiter</p>
              </div>
            </button>

            {/* <button className="role-tile" onClick={() => setSelectedRole("candidate")}>
              <div className="role-tile-icon"><FaUser /></div>
              <div className="role-tile-content">
                <h4>Candidate</h4>
                <p>Practice and improve your skills</p>
              </div>
            </button> */}

            <button className="role-tile" onClick={() => setSelectedRole("organization")}>
              <div className="role-tile-icon"><FaBuilding /></div>
              <div className="role-tile-content">
                <h4>Organization</h4>
                <p>Manage candidates and hiring</p>
              </div>
            </button>
          </div>
          <div className="auth-footer text-center mt-4">
             New to the platform? <a href="/signup" className="brand-link">Create an account</a>
          </div>
        </AuthCard>
      </div>
    );
  }

  // Step 2: Login Form
  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title={`${selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1)} Login`}
        subtitle="Secure access to your dashboard"
      >
        <button className="back-link-btn" onClick={() => setSelectedRole(null)} type="button">
          <FaArrowLeft /> Back to selection
        </button>

        <form className="auth-form-container" onSubmit={handleSubmit}>
          <Input
            label="Email Address"
            type="email"
            placeholder="name@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && (
            <div className="auth-error-message">
              {error}
            </div>
          )}

          <Button type="submit" className="w-100 py-3 mt-2">
            Sign In
          </Button>

          <div className="auth-footer mt-4">
            Don't have an account? <a href="/signup" className="brand-link">Sign up</a>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}