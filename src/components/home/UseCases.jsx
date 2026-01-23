import "./UseCases.css";
import Card from "../../ui/Card";
import Section from "../../ui/Section";
import { HiOutlineAcademicCap, HiOutlineBriefcase, HiOutlineUser } from "react-icons/hi2";

const USERS = [
  {
    title: "Students",
    desc: "Bridge the gap between academics and industry. Prepare for campus placements and competitive internships with confidence.",
    icon: <HiOutlineUser />,
    color: "var(--accent-primary)"
  },
  {
    title: "Job Seekers",
    desc: "Master role-specific behavioral and technical questions. Perfect your delivery and reduce interview anxiety.",
    icon: <HiOutlineBriefcase />,
    color: "var(--accent-primary)"
  },
  {
    title: "Institutes",
    desc: "Empower your students with AI-powered mock interviews. Track progress and provide data-driven career coaching.",
    icon: <HiOutlineAcademicCap />,
    color: "var(--accent-primary)"
  },
];

export default function UseCases() {
  return (
    <Section 
      title="Tailored for Every Journey" 
      // subtitle="Whether you are starting out or leveling up, our AI adapts to your unique career needs."
      className="usecases-section"
    >
      <div className="row g-4 justify-content-center">
        {USERS.map((u, i) => (
          <div className="col-lg-4 col-md-6" key={i}>
            <Card hover className="usecase-card text-center h-100">
              <div className="usecase-icon" style={{ color: u.color, backgroundColor: `${u.color}15` }}>
                {u.icon}
              </div>
              <h4 className="mt-3 fw-bold">{u.title}</h4>
              <p className="text-secondary mb-0">{u.desc}</p>
            </Card>
          </div>
        ))}
      </div>
    </Section>
  );
}