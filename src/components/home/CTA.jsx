import "./CTA.css";
import Button from "../../ui/Button";

export default function CTA() {
  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-wrapper text-center">
          <h2 className="cta-title">Ready to Land Your Dream Job?</h2>
          <p className="cta-text">
            Join thousands of candidates using AI to perfect their interview 
            technique. Start your first session in less than 60 seconds.
          </p>
          <div className="cta-buttons d-flex justify-content-center gap-3">
            <Button className="btn-light btn-lg px-5 text-black fw-bold">
              Start Free Trial
            </Button>
            <Button variant="secondary" className="btn-outline-light btn-lg px-5">
              Contact Sales
            </Button>
          </div>
          <p className="cta-footer-text mt-4">
            No credit card required • Unlimited practice for 7 days
          </p>
        </div>
      </div>
    </section>
  );
}