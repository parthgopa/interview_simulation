import { useState, useEffect } from "react";
import { getToken } from "../../services/token";
import Card from "../../ui/Card";
import { HiOutlineClipboardDocumentList } from "react-icons/hi2";
import "../../components/organization-dashboard/pages/OrgInterviews.css";
import { backendURL } from "../../pages/Home";

export default function AdminInterviews() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/admin/interviews`, {
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

  const getStatusBadge = (status) => {
    const statusMap = {
      true: "badge-ui-success",
      false: "badge-ui-warning",
      cancelled: "badge-ui-error",
      in_progress: "badge-ui-info"
    };
    return statusMap[status] || "badge-ui-secondary";
  };

  if (loading) {
    return (
      <div className="org-interviews-container">
        <h2>Interviews</h2>
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="org-interviews-container fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="dashboard-title mb-1">All Interviews</h2>
          <p className="text-muted small">View all scheduled interviews across all organizations</p>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="text-center py-5">
          <div className="empty-state">
            <HiOutlineClipboardDocumentList className="display-1 text-muted opacity-25 mb-3" />
            <h4 className="text-muted">No interviews scheduled yet</h4>
            <p className="text-muted small">Interviews will appear here once organizations schedule them.</p>
          </div>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden border-light shadow-sm">
          <div className="table-responsive">
            <table className="table custom-dashboard-table mb-0">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Organization</th>
                  <th>Position</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Tokens</th>
                  <th>Scheduled</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center gap-3">
                        <div className="avatar-placeholder">
                          {interview.candidateName?.charAt(0) || "C"}
                        </div>
                        <div>
                          <div className="fw-bold text-primary-dark">{interview.candidateName}</div>
                          <div className="text-muted small">{interview.candidateEmail}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge-ui badge-ui-info">{interview.organizationName}</span>
                    </td>
                    <td className="text-secondary-dark">{interview.position}</td>
                    <td>
                      <span className="badge-ui badge-ui-secondary">
                        {interview.interviewType || "—"}
                      </span>
                    </td>
                    <td>
                      
                      <span className={`badge-ui ${getStatusBadge(interview.completed)}`}>
                        {interview.completed === true ? "Completed" : "Scheduled"}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {interview.tokens || "—"}
                    </td>
                    <td className="text-muted small">
                      {interview.createdAt ? new Date(interview.createdAt).toLocaleDateString() : "—"}
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
