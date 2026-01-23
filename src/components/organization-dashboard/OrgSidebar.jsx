import { NavLink, useNavigate } from "react-router-dom";
import "./OrgSidebar.css";
import { 
  HiOutlineChartBar, 
  HiOutlineCalendar, 
  HiOutlineClipboardDocumentList, 
  HiOutlineUsers, 
  HiOutlineCog6Tooth,
  HiOutlineArrowLeftOnRectangle 
} from "react-icons/hi2"; // Switched to Hi2 for modern look

export default function OrgSidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("interview_ai_token");
    navigate("/login");
  };

  return (
    <aside className="org-sidebar">
      <div className="org-sidebar-header">
        <img src="/oneweblogo.png" alt="Logo" className="sidebar-logo" />
      </div>
      
      <div className="sidebar-nav-container">
        <nav className="org-sidebar-nav">
          <NavLink to="/organization/dashboard" className="org-nav-item" end>
            <HiOutlineChartBar className="org-nav-icon" />
            <span>Overview</span>
          </NavLink>

          <NavLink to="/organization/dashboard/schedule-interview" className="org-nav-item">
            <HiOutlineCalendar className="org-nav-icon" />
            <span>Schedule</span>
          </NavLink>

          <NavLink to="/organization/dashboard/interviews" className="org-nav-item">
            <HiOutlineClipboardDocumentList className="org-nav-icon" />
            <span>All Interviews</span>
          </NavLink>

          <NavLink to="/organization/dashboard/candidates" className="org-nav-item">
            <HiOutlineUsers className="org-nav-icon" />
            <span>Candidates</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <NavLink to="/organization/dashboard/settings" className="org-nav-item">
            <HiOutlineCog6Tooth className="org-nav-icon" />
            <span>Settings</span>
          </NavLink>
          <button className="org-nav-item logout-btn" onClick={handleLogout}>
            <HiOutlineArrowLeftOnRectangle className="org-nav-icon" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}