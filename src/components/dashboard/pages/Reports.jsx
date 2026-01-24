import { useState, useEffect } from "react";
import { getToken } from "../../../services/token";
import { FaCheckCircle, FaExclamationTriangle, FaChartBar, FaComments, FaCode, FaTrophy } from "react-icons/fa";
import "./Reports.css";
import { backendURL } from "../../../pages/Home";

export default function Reports() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${backendURL}/candidate/interview-results`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "error";
  };

  const getRatingColor = (rating) => {
    const ratings = {
      "Excellent": "success",
      "Good": "info",
      "Average": "warning",
      "Poor": "error"
    };
    return ratings[rating] || "secondary";
  };

  if (loading) {
    return (
      <div className="reports">
        <h2>Interview Results</h2>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your results...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="reports">
        <h2>Interview Results</h2>
        <div className="card empty-state-card">
          <FaExclamationTriangle className="empty-icon" />
          <h3>No Results Available</h3>
          <p className="empty-state">
            Your interview results will appear here once they are published by the organization.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports">
      <h2>Interview Results</h2>
      <p className="subtitle">View your published interview performance and feedback</p>

      <div className="results-list">
        {results.map((result) => (
          <div key={result._id} className="result-card card">
            <div className="result-header">
              <div>
                <h3>{result.position}</h3>
                <p className="result-meta">{result.interviewType} • {new Date(result.completed_at).toLocaleDateString()}</p>
              </div>
              <div className={`score-badge score-${getScoreColor(result.score)}`}>
                <span className="score-number">{result.score}</span>
                <span className="score-label">/100</span>
              </div>
            </div>

            <div className="result-metrics">
              <div className="metric-item">
                <FaComments className="metric-icon" />
                <div>
                  <span className="metric-label">Communication</span>
                  <span className={`metric-value badge-${getRatingColor(result.communication)}`}>
                    {result.communication}
                  </span>
                </div>
              </div>
              <div className="metric-item">
                <FaCode className="metric-icon" />
                <div>
                  <span className="metric-label">Technical Depth</span>
                  <span className={`metric-value badge-${getRatingColor(result.technical_depth)}`}>
                    {result.technical_depth}
                  </span>
                </div>
              </div>
            </div>

            <button 
              className="btn-view-details"
              onClick={() => setSelectedResult(selectedResult === result._id ? null : result._id)}
            >
              {selectedResult === result._id ? "Hide Details" : "View Details"}
            </button>

            {selectedResult === result._id && (
              <div className="result-details">
                <div className="feedback-section">
                  <div className="feedback-column strengths">
                    <h4><FaCheckCircle /> Strengths</h4>
                    <ul>
                      {result.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="feedback-column improvements">
                    <h4><FaChartBar /> Areas for Improvement</h4>
                    <ul>
                      {result.improvements.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {result.qa_pairs && result.qa_pairs.length > 0 && (
                  <div className="qa-section" style={{ maxHeight: '400px', overflowY: 'scroll', paddingRight: '10px' }}>
                    <h4>Interview Transcript</h4>
                    {result.qa_pairs.map((qa, idx) => (
                      
                      <div key={idx} className="qa-pair">
                        <div className="qa-question">
                          <strong>Q{idx + 1}:</strong> {qa.question}
                        </div>
                        {qa.answer && (
                          <div className="qa-answer">
                            <strong>A:</strong> {qa.answer}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
