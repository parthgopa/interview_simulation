import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../../components/auth/AuthCard";
import Input from "../../ui/Input";
import Button from "../../ui/Button";
import { signupUser } from "../../services/authApi";
import "./Signup.css";
import { FaArrowLeft, FaUser, FaBuilding } from "react-icons/fa";

export default function Signup() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [candidateForm, setCandidateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [organizationForm, setOrganizationForm] = useState({
    organizationName: "",
    contactPersonName: "",
    email: "",
    password: "",
    phone: "",
    industry: "",
    companySize: "",
    website: "",
  });
  const [error, setError] = useState("");

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signupUser({ ...candidateForm, role: "candidate" });
    if (res.error) { setError(res.error); return; }
    navigate("/login");
  };

  const handleOrganizationSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signupUser({ ...organizationForm, role: "organization" });
    if (res.error) { setError(res.error); return; }
    navigate("/login");
  };

  // Step 1: Role Selection
  if (!selectedRole) {
    return (
      <div className="auth-page-wrapper">
        <AuthCard
          title="Create Account"
          subtitle="Choose how you want to use the platform"
        >
          <div className="role-selection-grid">
            <button className="role-tile" onClick={() => setSelectedRole("candidate")}>
              <div className="role-tile-icon"><FaUser /></div>
              <div className="role-tile-content">
                <h4>Candidate</h4>
                <p>Improve your interview skills with AI</p>
              </div>
            </button>

            <button className="role-tile" onClick={() => setSelectedRole("organization")}>
              <div className="role-tile-icon"><FaBuilding /></div>
              <div className="role-tile-content">
                <h4>Organization</h4>
                <p>Hire faster with automated screening</p>
              </div>
            </button>
          </div>
          <div className="auth-footer text-center mt-4">
            Already have an account? <a href="/login" className="brand-link">Sign in</a>
          </div>
        </AuthCard>
      </div>
    );
  }

  // Step 2: Form Rendering
  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title={selectedRole === "candidate" ? "Join as a Candidate" : "Register Organization"}
        subtitle="Fill in your details to get started"
        className={selectedRole === "organization" ? "auth-card-wide" : ""}
      >
        <button className="back-link-btn" onClick={() => setSelectedRole(null)} type="button">
          <FaArrowLeft /> Back to selection
        </button>

        {selectedRole === "candidate" ? (
          /* CANDIDATE FORM */
          <form className="auth-form-container" onSubmit={handleCandidateSubmit}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={candidateForm.name}
              onChange={(e) => setCandidateForm({ ...candidateForm, name: e.target.value })}
              required
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="john@example.com"
              value={candidateForm.email}
              onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={candidateForm.phone}
              onChange={(e) => setCandidateForm({ ...candidateForm, phone: e.target.value })}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min. 8 characters"
              value={candidateForm.password}
              onChange={(e) => setCandidateForm({ ...candidateForm, password: e.target.value })}
              required
            />
            
            {error && <div className="auth-error-message">{error}</div>}
            
            <Button type="submit" className="w-100 py-3 mt-2">Create Free Account</Button>
          </form>
        ) : (
          /* ORGANIZATION FORM - Grid Layout */
          <form className="auth-form-container" onSubmit={handleOrganizationSubmit}>
            <div className="row g-3">
              <div className="col-md-6">
                <Input
                  label="Organization Name"
                  placeholder="Company Inc."
                  value={organizationForm.organizationName}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, organizationName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Contact Person"
                  placeholder="HR Manager Name"
                  value={organizationForm.contactPersonName}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, contactPersonName: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="hr@company.com"
                  value={organizationForm.email}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Company phone"
                  value={organizationForm.phone}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <Input
                  label="Industry"
                  placeholder="e.g. Technology"
                  value={organizationForm.industry}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, industry: e.target.value })}
                  required
                />
              </div>
              <div className="col-md-6">
                <div className="input-group-ui">
                  <label className="label-ui">Company Size</label>
                  <select
                    className="input-ui select-ui"
                    value={organizationForm.companySize}
                    onChange={(e) => setOrganizationForm({ ...organizationForm, companySize: e.target.value })}
                    required
                  >
                    <option value="">Select size</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>
              </div>
              <div className="col-12">
                <Input
                  label="Website (Optional)"
                  type="url"
                  placeholder="https://company.com"
                  value={organizationForm.website}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, website: e.target.value })}
                />
              </div>
              <div className="col-12">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Set account password"
                  value={organizationForm.password}
                  onChange={(e) => setOrganizationForm({ ...organizationForm, password: e.target.value })}
                  required
                />
              </div>
            </div>

            {error && <div className="auth-error-message mt-2">{error}</div>}
            
            <Button type="submit" className="w-100 py-3 mt-4">Register Organization</Button>
          </form>
        )}

        <div className="auth-footer mt-4">
          Already have an account? <a href="/login" className="brand-link">Sign in</a>
        </div>
      </AuthCard>
    </div>
  );
}