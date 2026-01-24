import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../../services/token";
import { FaCopy, FaEdit, FaTrash, FaEye, FaCheckCircle, FaClock, FaCalendarAlt, FaUser, FaBriefcase, FaChartLine } from "react-icons/fa";
import "./OrgInterviews.css";
import Card from "../../../ui/Card";
import { backendURL } from "../../../pages/Home";

export default function OrgInterviews() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showCredentials, setShowCredentials] = useState(null);
  const [copiedField, setCopiedField] = useState("");

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interviews`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setInterviews(data.interviews || []);
      }
    } catch (error) {
      console.error("Error fetching interviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 2000);
  };

  const handleCopyCredentials = (interview) => {
    const credentials = `Interview Credentials\n\nUsername: ${interview.username || "N/A"}\nPassword: ${interview.password || "N/A"}\nEmail: ${interview.candidateEmail || "N/A"}\n\nPlease use these credentials to login at: [Your Portal URL]`;
    copyToClipboard(credentials, `all-${interview._id}`);
  };

  const handleEdit = (interview) => {
    navigate("/organization/dashboard/schedule-interview", {
      state: { editInterview: interview }
    });
  };

  const handleDelete = async (interviewId) => {
    if (!window.confirm("Are you sure you want to delete this interview?")) {
      return;
    }
    
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/organization/interviews/${interviewId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        fetchInterviews();
      }
    } catch (error) {
      console.error("Error deleting interview:", error);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: "badge badge-info",
      completed: "badge badge-success",
      cancelled: "badge badge-error",
      pending: "badge badge-warning"
    };
    return badges[status] || "badge";
  };

  const filteredInterviews = interviews.filter(interview => {
    if (filter === "all") return true;
    return interview.status === filter;
  });

  if (loading) {
    return (
      <div className="org-interviews">
        <h2>All Interviews</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-interviews-container fade-in">
      {/* Header with Filter Controls */}
      <div className="interviews-header d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h2 className="dashboard-title mb-1">All Interviews</h2>
          <p className="text-muted small mb-0">Manage and track all candidate sessions</p>
        </div>
        
        <div className="filter-group shadow-sm">
          {["all", "scheduled", "completed"].map((type) => (
            <button
              key={type}
              className={`filter-btn ${filter === type ? "active" : ""}`}
              onClick={() => setFilter(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main Interviews Grid */}
      {filteredInterviews.length === 0 ? (
        <div className="empty-state-wrapper py-5 text-center">
          <Card className="py-5">
            <FaCalendarAlt className="empty-icon mb-3" />
            <h3>No interviews found</h3>
            <p className="text-muted">Try adjusting your filters or schedule a new session.</p>
          </Card>
        </div>
      ) : (
        <div className="interviews-grid">
          {filteredInterviews.map((interview) => (
            <Card key={interview._id} className="interview-management-card">
              {/* Status Indicator Strip */}
              <div className={`status-strip status-${interview.status || "pending"}`}></div>
              
              <div className="card-top d-flex justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <div className="candidate-avatar-circle">
                    <FaUser />
                  </div>
                  <div>
                    <h4 className="candidate-name mb-0">{interview.candidateName || "Candidate"}</h4>
                    <span className="candidate-email-text">{interview.candidateEmail}</span>
                  </div>
                </div>
                <span className={`status-pill pill-${interview.status || "pending"}`}>
                  {interview.status}
                </span>
              </div>

              <div className="interview-meta-grid my-4">
                <div className="meta-item">
                  <FaBriefcase />
                  <span>{interview.position}</span>
                </div>
                <div className="meta-item">
                  <FaClock />
                  <span>{interview.duration} Min</span>
                </div>
                <div className="meta-item">
                  <FaCalendarAlt />
                  <span>{interview.interviewType}</span>
                </div>
              </div>

              {/* Credentials Section */}
              <div className={`credentials-panel ${showCredentials === interview._id ? "open" : ""}`}>
                <div className="credential-row">
                  <label>Username</label>
                  <div className="copy-box">
                    <code>{interview.username || "N/A"}</code>
                    <button onClick={() => copyToClipboard(interview.username, `user-${interview._id}`)}>
                      {copiedField === `user-${interview._id}` ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
                <div className="credential-row mt-2">
                  <label>Password</label>
                  <div className="copy-box">
                    <code>{interview.password || "N/A"}</code>
                    <button onClick={() => copyToClipboard(interview.password, `pass-${interview._id}`)}>
                      {copiedField === `pass-${interview._id}` ? "✓" : <FaCopy />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="card-actions-footer pt-3 mt-3 border-top d-flex gap-2">
                {interview.status === "completed" ? (
                  <button 
                    className="btn-action-primary flex-grow-1"
                    onClick={() => navigate(`/organization/dashboard/interview-results/${interview._id}`)}
                  >
                    <FaChartLine /> View Results
                  </button>
                ) : (
                  <button 
                    className="btn-action-primary flex-grow-1"
                    onClick={() => setShowCredentials(showCredentials === interview._id ? null : interview._id)}
                  >
                    <FaEye /> {showCredentials === interview._id ? "Hide" : "Credentials"}
                  </button>
                )}
                <button 
                  className="btn-action-outline"
                  onClick={() => handleCopyCredentials(interview)}
                  title="Copy Invite Text"
                >
                  {copiedField === `all-${interview._id}` ? "✓" : <FaCopy />}
                </button>
                {interview.status !== "completed" && (
                  <button className="btn-action-edit" onClick={() => handleEdit(interview)}>
                    <FaEdit />
                  </button>
                )}
                <button className="btn-action-delete" onClick={() => handleDelete(interview._id)}>
                  <FaTrash />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
