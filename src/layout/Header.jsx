import { NavLink, useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import { removeToken, getToken } from "../services/token";
import "./Header.css";

export default function Header() {
  const navigate = useNavigate();
  const token = getToken();

  return (
    <nav className="navbar navbar-expand-lg sticky-top main-navbar">
      <div className="container">
        {/* Logo Image */}
        <div
          className="navbar-brand logo-container"
          onClick={() => navigate("/")}
          role="button"
        >
          <img 
            src="/oneweblogo.png" 
            alt="InterviewAI Logo" 
            className="img-fluid brand-logo-img" 
          />
        </div>

        {/* Mobile Toggle */}
        <button
          className="navbar-toggler custom-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Nav Content */}
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav mx-auto mb-2 mb-lg-0 nav-link-gap">
            <li className="nav-item">
              <NavLink to="/" end className="nav-link-custom">
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/features" className="nav-link-custom">
                Features
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/pricing" className="nav-link-custom">
                Pricing
              </NavLink>
            </li>
            {/* <li className="nav-item">
              <NavLink to="/how-it-works" className="nav-link-custom">
                How It Works
              </NavLink>
            </li> */}
          </ul>

          {/* Actions */}
          <div className="d-flex align-items-center gap-3 nav-actions">
            {token ? (
              <Button
                variant="secondary"
                className="btn-sm px-4"
                onClick={() => {
                  removeToken();
                  navigate("/login");
                }}
              >
                Logout
              </Button>
            ) : (
              <>
                <div 
                  className="login-link" 
                  onClick={() => navigate("/login")}
                  role="button"
                >
                  Login
                </div>
                <Button 
                  className="btn-sm px-4 shadow-sm"
                  onClick={() => navigate("/signup")}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}