import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthCard from "../components/auth/AuthCard";
import Input from "../ui/Input";
import Button from "../ui/Button";
import { saveToken } from "../services/token";
import { FaArrowLeft } from "react-icons/fa";
import "./auth/Login.css"; // Reusing the refined Login styles
import { backendURL } from "./Home";

export default function CandidateLogin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${backendURL}/auth/candidate-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        saveToken(data.token);
        localStorage.setItem("userRole", "scheduled_candidate");
        localStorage.setItem("candidateData", JSON.stringify(data.candidate));
        navigate("/dashboard");
      } else {
        setError(data.error || "Invalid credentials provided.");
      }
    } catch (err) {
      setError("Connection failed. Please check your internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <AuthCard
        title="Scheduled Interview"
        subtitle="Access your assigned session using recruiter credentials"
      >
        <button className="back-link-btn" onClick={() => navigate("/login")} type="button">
          <FaArrowLeft /> Back to login options
        </button>

        <form className="auth-form-container" onSubmit={handleSubmit}>
          {error && <div className="auth-error-message">{error}</div>}

          <Input
            label="Username"
            type="text"
            placeholder="e.g. candidate_123"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <Button type="submit" className="w-100 py-3 mt-2" disabled={loading}>
            {loading ? "Verifying..." : "Enter Session"}
          </Button>

          <div className="auth-footer mt-4">
            <small>Don't have credentials? Please contact your hiring manager.</small>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}