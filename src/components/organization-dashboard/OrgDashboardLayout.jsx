import { Outlet } from "react-router-dom";
import OrgSidebar from "./OrgSidebar";
import OrgTopbar from "./OrgTopbar";
import "./OrgDashboardLayout.css";

export default function OrgDashboardLayout({ children }) {
  return (
    <div className="org-dashboard-layout">
      <OrgSidebar />
      <div className="org-dashboard-main">
        <OrgTopbar />
        <div className="org-dashboard-content">
          {children}
        </div>
      </div>
    </div>
  );
}
