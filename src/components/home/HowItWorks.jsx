import "./HowItWorks.css";
import Section from "../../ui/Section";
import { HiOutlineUserGroup, HiOutlineCpuChip, HiOutlineChartBar } from "react-icons/hi2";
import { useState, useEffect } from "react";

const STEPS = [
  { 
    step: "01", 
    title: "Customize Your Path", 
    desc: "Select your target job role and experience level. Our AI tailors the session to your specific career goals.",
    icon: <HiOutlineUserGroup />
  },
  { 
    step: "02", 
    title: "Interactive AI Session", 
    desc: "Engage in a live, adaptive interview. Speak naturally as our AI responds to your answers in real-time.",
    icon: <HiOutlineCpuChip />
  },
  { 
    step: "03", 
    title: "Performance Analytics", 
    desc: "Receive a comprehensive breakdown of your performance, including technical accuracy and soft skill scores.",
    icon: <HiOutlineChartBar />
  },
];

const IMAGES = [
  "/logo1.png",
  "/logo2.png",
  "/logo3.png",
  "/logo4.png",
];

export default function HowItWorks() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % IMAGES.length);
    }, 3000); // Change image every 3 seconds

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, []);

  return (
    <Section 
      title="How It Works" 
      // subtitle="Mastering your interview skills is easier than ever. Follow our simple three-step process."
      className="how-it-works-section"
    >
      <div className="row justify-content-center mt-5">
        <div className="col-lg-12">
          <div className="steps-container">
            {STEPS.map((s, index) => (
              <div className="step-item" key={s.step}>
                {/* Step Number Badge */}
                <div className="step-number-pill">{s.step}</div>
                
                {/* Visual Icon Box */}
                <div className="step-icon-box">
                  {s.icon}
                </div>

                <h4 className="step-title">{s.title}</h4>
                <p className="step-description">{s.desc}</p>
                
                {/* Connecting Line (Hidden on mobile) */}
                {index !== STEPS.length - 1 && <div className="step-connector"></div>}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Auto-scrolling Image Carousel */}
      <div className="row justify-content-center mt-5">
        <div className="col-lg-8 text-center">
          <div className="image-carousel-container">
            {IMAGES.map((img, index) => (
              <img 
                key={img}
                src={img} 
                alt={`Interview AI Feature ${index + 1}`} 
                className={`carousel-image ${index === currentImageIndex ? 'active' : 'hidden'}`} 
              />
            ))}
          </div>
          { /*scroll images */}
          
        </div>
        
      </div>
    </Section>
  );
}