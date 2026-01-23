import { useState } from "react";
import "./FAQ.css";
import Section from "../../ui/Section";
import { HiOutlineChevronDown, HiOutlineChevronUp } from "react-icons/hi2";

const FAQ_DATA = [
  {
    question: "How does the AI evaluate my interview performance?",
    answer: "Our AI analyzes multiple data points including your technical accuracy, speaking pace, sentiment, and use of key industry terminology. You receive a detailed score and actionable tips for improvement after every session."
  },
  {
    question: "Which job roles and industries are supported?",
    answer: "We support a wide range of industries including Tech, Finance, Healthcare, Marketing, and Sales. Our AI can generate questions for everything from entry-level internships to executive leadership roles."
  },
  {
    question: "Is my data and video recording private?",
    answer: "Absolutely. We use industry-standard encryption to protect your data. Your recordings are only used for your personal evaluation and are never shared with third parties without your explicit consent."
  },
  {
    question: "Can I use the platform for free?",
    answer: "Yes! We offer a free tier that allows you to experience a full AI interview session. For unlimited practice and advanced analytics, we offer premium plans tailored for individuals and institutions."
  }
];

export default function FAQ() {
  const [activeIndex, setActiveIndex] = useState(null);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <Section 
      title="Frequently Asked Questions" 
    //   subtitle="Got questions? We've got answers. Everything you need to know about our AI interview platform."
      className="faq-section"
    >
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="faq-list">
            {FAQ_DATA.map((item, i) => (
              <div 
                key={i} 
                className={`faq-item ${activeIndex === i ? "active" : ""}`}
                onClick={() => toggleFAQ(i)}
              >
                <div className="faq-question">
                  <span>{item.question}</span>
                  {activeIndex === i ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}
                </div>
                <div className="faq-answer">
                  <div className="faq-answer-content">
                    {item.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}