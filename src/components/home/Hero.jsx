import "./Hero.css";
import Button from "../../ui/Button";

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-10 text-center">
            
            <div className="hero-badge fade-in">
              <span className="badge-custom">Next-Gen Interview Prep</span>
            </div>

            <h1 className="hero-title">
              Ace Your Interviews with <span className="text-gradient">AI Precision</span>
            </h1>

            <p className="hero-description mx-auto">
              Master the art of the interview. Our AI simulates real-world 
              scenarios with industry-specific questions, real-time voice 
              analysis, and comprehensive integrity checks to get you hire-ready.
            </p>

            <div className="hero-actions d-flex flex-column flex-sm-row justify-content-center gap-3">
              <Button className="btn-brand-primary">Start Free Interview</Button>
              <Button variant="secondary" className="btn-brand-outline">
                View All Features
              </Button>
            </div>

            <div className="hero-trust-text mt-4">
              <span>Trusted by 10k+ candidates</span>
              <span className="dot-separator">•</span>
              <span>Free to get started</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative background blur */}
      <div className="hero-glow"></div>
    </section>
  );
}