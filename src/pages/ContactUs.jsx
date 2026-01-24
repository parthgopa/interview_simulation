import { useEffect } from "react";
import Section from "../ui/Section";
import "./ContactUs.css";
import { HiOutlineMail, HiOutlinePhone } from "react-icons/hi";
import { IoLocationOutline } from "react-icons/io5";

export default function ContactUs() {
  return (
    <Section title="Get In Touch" className="contact-section">
      <div className="container">
        <div className="row gy-5 justify-content-center">
          {/* Contact Information */}
          <div className="col-lg-6 col-md-10">
            <div className="contact-info">
              <p className="contact-description mb-5">
                We'd love to hear from you. Reach out to us for any inquiries or support.
              </p>

              <div className="contact-item mb-4">
                <div className="contact-icon-box me-3">
                  <IoLocationOutline className="contact-icon" />
                </div>
                <div>
                  <h6 className="contact-heading mb-1">Address</h6>
                  <p className="contact-text">Alkapuri, Vadodara, Gujarat 390007</p>
                </div>
              </div>

              <div className="contact-item mb-4">
                <div className="contact-icon-box me-3">
                  <HiOutlineMail className="contact-icon" />
                </div>
                <div>
                  <h6 className="contact-heading mb-1">Email Us</h6>
                  <p className="contact-text">
                    <a href="mailto:business@onewebmart.com" className="contact-link">business@onewebmart.com</a>
                  </p>
                  <p className="contact-text">
                    <a href="mailto:onewebmartsolution@gmail.com" className="contact-link">onewebmartsolution@gmail.com</a>
                  </p>
                </div>
              </div>

              <div className="contact-item">
                <div className="contact-icon-box me-3">
                  <HiOutlinePhone className="contact-icon" />
                </div>
                <div>
                  <h6 className="contact-heading mb-1">Call Us</h6>
                  <p className="contact-text">
                    <a href="tel:+919033806717" className="contact-link">+91-9033806717</a>
                  </p>
                  <p className="contact-text">
                    <a href="tel:+919408307302" className="contact-link">+91-9408307302</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
