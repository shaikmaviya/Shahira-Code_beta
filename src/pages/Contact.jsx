import React from "react";
import "./Contact.css";

export default function ContactPage({ onBack }) {
  return (
    <section className="sec contact-page" id="content" data-reveal>
      <p className="stag">Content</p>
      <h2>Get In Touch</h2>
      <p className="ssub">Reach out to the Shahira Code team for support, feedback, or partnership ideas.</p>

      <div className="fc contact-card">
        <p><strong>Email:</strong> shaik.mav@gmail.com</p>
        <p><strong>Phone:</strong> +91 77801 13910</p>
        <p><strong>Address:</strong> Benguluru, India</p>
        <p><strong>Hours:</strong> Mon-Fri, 10:00 AM - 6:00 PM</p>
      </div>

      <div className="ctabtns contact-actions">
        <button className="bg" onClick={onBack}>Go Back</button>
      </div>
    </section>
  );
}
