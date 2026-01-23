import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Pricing.css";
import Section from "../../ui/Section";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import { HiCheckCircle } from "react-icons/hi2";

export default function Pricing() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetch("${backendURL}/pricing-api/pricing")
            .then(res => res.json())
            .then(data => {
                setPlans(data);
                console.log(data)
                setLoading(false);
            })
            .catch(err => console.error("Error fetching pricing:", err));
    }, []);

    const handleSelection = (plan) => {
        const token = localStorage.getItem("interview_ai_token");
        if (!token) {
            navigate("/login");
        } else {
            navigate("/checkout", { state: { plan } });
        }
    };

    if (loading) return (
        <div className="text-center p-5 mt-5">
            <div className="spinner mx-auto"></div>
            <p className="mt-3 text-muted">Loading best plans for you...</p>
        </div>
    );

    return (
        <Section title="Simple, Transparent Pricing" subtitle="Select a plan to supercharge your prep." className="pricing-section">
            <div className="row g-4 align-items-center mt-4">
                {plans.map((plan) => (
                    <div className="col-lg-4 col-md-6" key={plan._id}>
                        <Card className={`pricing-card ${plan.isPopular ? 'popular' : ''}`}>
                            {plan.isPopular && <span className="popular-badge">Most Popular</span>}
                            <div className="plan-header text-center">
                                <h3 className="plan-name">{plan.name}</h3>
                                <div className="plan-price">
                                    <span className="currency">$</span>
                                    <span className="amount">{plan.price}</span>
                                    <span className="period">/mo</span>
                                </div>
                                <p className="plan-desc">{plan.description}</p>
                            </div>
                            <ul className="plan-features">
                                {plan.features.map((feat, idx) => (
                                    <li key={idx}><HiCheckCircle className="feat-icon" /> {feat}</li>
                                ))}
                            </ul>
                            <Button
                                variant={plan.variant} // Now it will correctly pass "primary", "secondary", or "dark"
                                className="w-100 py-3"
                                onClick={() => handleSelection(plan)}
                            >
                                Get Started
                            </Button>
                        </Card>
                    </div>
                ))}
            </div>
        </Section>
    );
}