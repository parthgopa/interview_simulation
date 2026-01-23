import { useState, useEffect } from "react";
import "./Overview.css";
import { HiOutlineCalendarDays, HiOutlineChartBar, HiOutlineClipboardDocumentCheck, HiOutlineTrophy, HiOutlineClock, HiOutlineCommandLine } from "react-icons/hi2";
import Button from "../../../ui/Button";
import Card from "../../../ui/Card";
import { useNavigate } from "react-router-dom";
import { getToken } from "../../../services/token";

export default function Overview() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [lastInterview, setLastInterview] = useState(null);

  const [resultsScore, setResultsScore] = useState([]);
  const [bestScore, setBestScore] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchScheduledInterviews(), fetchResults()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const fetchScheduledInterviews = async () => {
    try {
      const token = getToken();
      const res = await fetch("${backendURL}/candidate/all-interviews", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        // console.log(data)
        setInterviews(data.scheduledInterviews.length || []);
        // console.log(data.scheduledInterviews.length)

        // IF interview is completed then add it to completedInterviews, and get completedAt
        let completedInterviews = [];
        for (let interview of data.scheduledInterviews) {
          if (interview.completed) {
            completedInterviews.push(interview.completedAt);
          }
        }
        // console.log(completedInterviews)

        // get the earlies date from completedInterviews and save difference from current date
        let lastInterview = completedInterviews.sort((a, b) => new Date(a) - new Date(b))[0];
        let diff = new Date() - new Date(lastInterview);
        let days = Math.floor(diff / (1000 * 60 * 60 * 24));
        let hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        // let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        // let seconds = Math.floor((diff % (1000 * 60)) / 1000);
        // console.log(days)
        if (days === 0) {
          setLastInterview(hours + " hours ago");
        } else {
          setLastInterview(days + " days ago");
        }
        console.log(lastInterview)

        // console.log(data)
        // localStorage.setItem("scheduledInterviews", JSON.stringify(data.scheduledInterviews || []));
      }
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error);
    }
  };

  const fetchResults = async () => {
    try {
      const token = getToken();
      const res = await fetch("${backendURL}/candidate/interview-results", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data)

        // For each result , do average of score and best score
        let averageScore = 0;
        let bestScore = 0;
        for (let result of data.results) {
          averageScore += result.score;
          if (result.score > bestScore) {
            bestScore = result.score;
          }
        }
        averageScore = averageScore / data.results.length;
        console.log(averageScore)
        setResultsScore(averageScore);
        setBestScore(bestScore);
      }
    } catch (error) {
      console.error("Error fetching results:", error);
    }
  };


  if (loading) {
    return (
      <div className="reports">
        <h2>Interview Results</h2>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="candidate-overview fade-in">
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="dashboard-title mb-1">Performance Overview</h2>
          <p className="text-muted small">Track your progress and preparation levels</p>
        </div>
        <div className="date-indicator d-none d-md-block">
          <HiOutlineCalendarDays className="me-2" />
          Analytics for Jan 2026
        </div>
      </div>

      {/* Stats Achievement Grid */}
      <div className="row g-4 mb-5">
        {[
          { label: "Interviews Taken", val: interviews, icon: <HiOutlineChartBar />, color: "var(--info)" },
          { label: "Average Score", val: resultsScore, icon: <HiOutlineClipboardDocumentCheck />, color: "var(--accent-primary)" },
          { label: "Best Score", val: bestScore, icon: <HiOutlineTrophy />, color: "var(--success)" },
          { label: "Last Session", val: lastInterview, icon: <HiOutlineClock />, color: "var(--warning)" },
        ].map((item, i) => (
          <div className="col-xl-3 col-md-6" key={i}>
            <Card className="stat-achievement-card">
              <div
                className="stat-icon-box"
                style={{ color: item.color, backgroundColor: `${item.color}15` }}
              >
                {item.icon}
              </div>
              <div className="stat-text-group">
                <h3>{item.val}</h3>
                <p>{item.label}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* <div className="row g-4">
        {/* Recent Activity Section 
        <div className="col-lg-8">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="section-indicator-dot"></div>
            <h3 className="section-heading-sm">Recent Performance Activity</h3>
          </div>
          <Card className="activity-placeholder-card">
            <div className="empty-state-content">
              <div className="empty-icon-circle">
                <HiOutlineCommandLine />
              </div>
              <h4>No recent sessions found</h4>
              <p className="text-muted">You haven't taken any interviews in the last 7 days. Ready to practice?</p>
              <button className="btn-ui btn-ui-primary px-4 mt-2" onClick={() => navigate("/dashboard/practice")}>
                Start Practice Session
              </button>
            </div>
          </Card>
        </div>

        {/* Improvement Tips Sidebar 
        <div className="col-lg-4">
          <div className="d-flex align-items-center gap-2 mb-3">
            <div className="section-indicator-dot"></div>
            <h3 className="section-heading-sm">AI Suggestions</h3>
          </div>
          <Card className="tips-card">
            <ul className="tips-list">
              <li>
                <span className="tip-bullet">1</span>
                <div>
                  <p className="fw-bold mb-0">Audio Quality</p>
                  <p className="small text-muted">Test your microphone before the next HR session.</p>
                </div>
              </li>
              <li>
                <span className="tip-bullet">2</span>
                <div>
                  <p className="fw-bold mb-0">Technical Prep</p>
                  <p className="small text-muted">Based on your goals, try a "System Design" mock.</p>
                </div>
              </li>
            </ul>
          </Card>
        </div> 
      </div>*/}
    </div>
  );
}
