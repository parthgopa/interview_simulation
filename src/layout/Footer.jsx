import { Link } from "react-router-dom";
import "./Footer.css";
import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { FaTwitter, FaLinkedinIn, FaGithub } from "react-icons/fa";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-section">
      <div className="container">
        <div className="row gy-5">
          {/* Column 1: Brand & Contact */}
          <div className="col-lg-4 col-md-12">
            <div className="footer-brand mb-4">
              <img src="/oneweblogo.png" alt="InterviewAI Logo" className="footer-logo-img" />
            </div>
            <p className="footer-tagline">
              Master your next career move with AI-powered interview simulations and real-time feedback.
            </p>
            <div className="footer-contact mt-4">
              <a href="mailto:support@interviewai.com" className="contact-link">
                <HiOutlineMail className="contact-icon" /> support@interviewai.com
              </a>
              <a href="tel:+1234567890" className="contact-link">
                <HiOutlinePhone className="contact-icon" /> +1 (555) 123-4567
              </a>
            </div>
          </div>

          {/* Column 2: Product Links */}
          <div className="col-6 col-lg-2 offset-lg-1">
            <h5 className="footer-heading">Product</h5>
            <ul className="footer-links">
              <li><Link to="/features">Features</Link></li>
              <li><Link to="/how-it-works">How It Works</Link></li>
              <li><Link to="/pricing">Pricing</Link></li>
              <li><Link to="/faq">FAQ</Link></li>
            </ul>
          </div>

          {/* Column 3: Company Links */}
          <div className="col-6 col-lg-2">
            <h5 className="footer-heading">Company</h5>
            <ul className="footer-links">
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>

          {/* Column 4: Social & Legal */}
          <div className="col-lg-3 col-md-12">
            <h5 className="footer-heading">Follow Us</h5>
            <div className="social-links mt-3 mb-4">
              <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter">
                <FaTwitter />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn">
                <FaLinkedinIn />
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
                <FaGithub />
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom Bar */}
        <div className="footer-bottom">
          <div className="row align-items-center">
            <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
              <p className="mb-0 copyright-text">
                © {currentYear} InterviewAI. All rights reserved.
              </p>
            </div>
            <div className="col-md-6">
              <ul className="footer-legal-links justify-content-center justify-content-md-end mb-0">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/terms">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}