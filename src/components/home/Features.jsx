import "./Features.css";
import Card from "../../ui/Card";
import Section from "../../ui/Section";
import { 
  HiOutlineVideoCamera, 
  HiOutlineSparkles, 
  HiOutlineClipboardCheck, 
  HiOutlineDocumentText, 
  HiOutlineClock, 
  HiOutlineGlobeAlt, 
  HiOutlineShieldCheck, 
  HiOutlineShare 
} from "react-icons/hi";

const FEATURES = [
  { 
    title: "AI-Powered Video Interviews", 
    desc: "Experience realistic interview simulations with our advanced AI video technology.",
    icon: <HiOutlineVideoCamera /> 
  },
  { 
    title: "Smart AI Evaluation", 
    desc: "Receive instant, deep-dive analysis on your performance, tone, and technical accuracy.",
    icon: <HiOutlineSparkles /> 
  },
  { 
    title: "Auto Interview Generation", 
    desc: "Generate custom interview sets tailored to specific job roles and seniority levels instantly.",
    icon: <HiOutlineClipboardCheck /> 
  },
  { 
    title: "AI-Powered Resume Analysis", 
    desc: "Let our AI scan your resume to create personalized questions that interviewers will likely ask.",
    icon: <HiOutlineDocumentText /> 
  },
  { 
    title: "Time & Cost Efficient", 
    desc: "Save weeks of prep time and expensive coaching fees with 24/7 available AI mock sessions.",
    icon: <HiOutlineClock /> 
  },
  { 
    title: "All Industries Support", 
    desc: "From Tech and Finance to Healthcare and Creative arts, we cover every professional sector.",
    icon: <HiOutlineGlobeAlt /> 
  },
  { 
    title: "Secure & Trustworthy", 
    desc: "Your data is encrypted and private. We ensure a safe environment for your professional growth.",
    icon: <HiOutlineShieldCheck /> 
  },
  { 
    title: "Sharing & Feedback", 
    desc: "Easily share your interview recordings and AI reports with mentors for additional insights.",
    icon: <HiOutlineShare /> 
  }
];

export default function Features() {
  return (
    <Section 
      title="Advanced Features" 
      className="features-section bg-secondary-light"
    >
      <div className="row g-4 mt-2">
        {FEATURES.map((f, i) => (
          <div className="col-md-6 col-lg-3" key={i}>
            <Card hover className="h-100 feature-card">
              <div className="feature-icon-wrapper">
                {f.icon}
              </div>
              <h5 className="feature-title">{f.title}</h5>
              <p className="feature-desc">{f.desc}</p>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}