import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { FaPlus, FaTimes } from "react-icons/fa";
import Button from "../../../ui/Button";
import { HiOutlineUsers } from "react-icons/hi2";
import Input from "../../../ui/Input";
import Card from "../../../ui/Card";
import "./OrgCandidates.css";

export default function OrgCandidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const token = getToken();
      const res = await fetch("${backendURL}/organization/candidates-list", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: "", text: "" });

    try {
      const token = getToken();
      const res = await fetch("${backendURL}/organization/add-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Candidate added successfully!" });
        setFormData({ name: "", email: "" });
        setShowAddForm(false);
        fetchCandidates();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to add candidate" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="org-candidates">
        <h2>Candidates</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

return (
    <div className="org-candidates-container fade-in">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">Candidate Directory</h2>
          <p className="text-muted small">Manage your talent pool and track interview history</p>
        </div>
        <Button onClick={() => setShowAddForm(true)}>
          <FaPlus className="me-2" /> Add New Candidate
        </Button>
      </div>

      {message.text && (
        <div className={`alert-ui mb-4 ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Modern Add Candidate Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <Card className="modal-content shadow-lg border-0 p-0 overflow-hidden" style={{ maxWidth: '500px' }}>
            <div className="modal-header-simple p-4 border-bottom d-flex justify-content-between align-items-center">
              <h3 className="fw-bold mb-0">Add New Candidate</h3>
              <button className="btn-close-custom" onClick={() => setShowAddForm(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleAddCandidate} className="p-4">
              <div className="mb-3">
                <Input
                  label="Full Name *"
                  placeholder="e.g. Robert Fox"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-4">
                <Input
                  label="Email Address *"
                  type="email"
                  placeholder="robert@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="d-flex gap-2">
                <Button type="submit" className="flex-grow-1" disabled={submitting}>
                  {submitting ? "Processing..." : "Register Candidate"}
                </Button>
                <Button variant="secondary" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Main Content: Table */}
      {candidates.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineUsers className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No candidates registered yet</h4>
            <p className="text-muted small">Start by adding your first candidate to the system.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Candidate Name</th>
                  <th>Email Info</th>
                  <th>Latest Position</th>
                  <th className="text-center">Interviews</th>
                  <th>Status</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((candidate, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {candidate.name.charAt(0)}
                        </div>
                        <span className="fw-bold text-primary-dark">{candidate.name}</span>
                      </div>
                    </td>
                    <td className="text-muted">{candidate.email}</td>
                    <td>
                      <span className="text-secondary-dark">{candidate.position || "—"}</span>
                    </td>
                    <td className="text-center">
                      <span className="count-pill">{candidate.interviewCount || 0}</span>
                    </td>
                    <td>
                      <span className={`badge-ui badge-ui-${candidate.status === "active" ? "success" : "info"}`}>
                        {candidate.status || "active"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button className="btn-table-action">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
