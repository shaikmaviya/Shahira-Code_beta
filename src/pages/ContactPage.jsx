import React, { useState } from "react";
import "./ContactPage.css";

export default function ContactPage({ onBack }) {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) return;
    const mailto = `mailto:shaik.mavi@gmail.com?subject=Query from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
    window.location.href = mailto;
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <section className="sec contact-page" id="contact" data-reveal>
      <p className="stag">Contact</p>
      <h2>Get In Touch</h2>
      <p className="ssub">Reach out to the Shahira Code team for support, feedback, or partnership ideas.</p>

      <div className="contact-layout">

        {/* Left — Query Form */}
        <form className="contact-form-box" onSubmit={handleSubmit}>
          <h3>Send a Message</h3>

          <div className="form-group">
            <label>Your Name</label>
            <input
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Your Email</label>
            <input
              type="email"
              name="email"
              placeholder="john@example.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Message</label>
            <textarea
              name="message"
              placeholder="Write your query here..."
              rows={5}
              value={form.message}
              onChange={handleChange}
            />
          </div>

          {sent && <p className="form-success">Message opened in your mail app!</p>}

          <button type="submit" className="bg contact-submit">
            Send Message
          </button>
        </form>

        {/* Right — Contact Card */}
<div className="contact-card">
  <h3>Contact Info</h3>
  <div className="contact-info-list">

    <div className="contact-info-item">
      <div className="contact-info-icon">✉️</div>
      <div className="contact-info-text">
        <span>Email</span>
        <span>shaik.mavi@gmail.com</span>
      </div>
    </div>

    <div className="contact-info-item">
      <div className="contact-info-icon">📞</div>
      <div className="contact-info-text">
        <span>Phone</span>
        <span>+91 77801 13910</span>
      </div>
    </div>

    <div className="contact-info-item">
      <div className="contact-info-icon">📍</div>
      <div className="contact-info-text">
        <span>Address</span>
        <span>Bengaluru, India</span>
      </div>
    </div>

    <div className="contact-info-item">
      <div className="contact-info-icon">🕐</div>
      <div className="contact-info-text">
        <span>Working Hours</span>
        <span>Mon–Fri, 10:00 AM – 6:00 PM</span>
      </div>
    </div>

  </div>
</div>

      </div>

      <div className="ctabtns contact-actions">
        <button className="bg" onClick={onBack}>Go Back</button>
      </div>
    </section>
  );
}