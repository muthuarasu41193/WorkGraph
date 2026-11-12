"use client";

import { useState, type FormEvent } from "react";
import { Reveal } from "./Reveal";
import { Button } from "./ui";

/**
 * Lightweight contact band so `/#contact` and the global feedback link resolve.
 * Posts to the existing contact API when available; otherwise falls back to mailto.
 */
export function Contact() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const body = String(data.get("message") ?? "").trim();
    if (!email || !body) {
      setStatus("error");
      setMessage("Add an email and a short message.");
      return;
    }

    setStatus("sending");
    setMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name || "Website visitor",
          email,
          subject: "WorkGraph landing feedback",
          message: body,
        }),
      });
      if (!res.ok) throw new Error("contact_failed");
      setStatus("sent");
      setMessage("Sent. A person reads this form.");
      form.reset();
    } catch {
      setStatus("error");
      setMessage("Could not send through the form. Email hello@getworkgraph.com.");
    }
  }

  return (
    <Reveal
      as="section"
      className="wg-section"
      id="contact"
      aria-labelledby="contact-heading"
    >
      <div className="wg-container">
        <h2 className="wg-faq__title" id="contact-heading">
          Talk about a job search
          <span className="wg-accent-dot">.</span>
        </h2>
        <p className="wg-lead wg-faq__lead">
          Have a question or feedback? A person reads this form.
        </p>

        <form className="wg-contact" onSubmit={onSubmit} noValidate>
          <label className="wg-contact__field">
            <span>Name</span>
            <input name="name" type="text" autoComplete="name" />
          </label>
          <label className="wg-contact__field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label className="wg-contact__field">
            <span>Message</span>
            <textarea name="message" rows={4} required />
          </label>
          <div className="wg-contact__actions">
            <Button type="submit" variant="primary" disabled={status === "sending"}>
              {status === "sending" ? "Sending…" : "Send message"}
            </Button>
            <a className="wg-landing-btn wg-landing-btn--link" href="mailto:hello@getworkgraph.com">
              hello@getworkgraph.com
            </a>
          </div>
          {message ? (
            <p
              className="wg-contact__status"
              role="status"
              data-state={status}
            >
              {message}
            </p>
          ) : null}
        </form>
      </div>
    </Reveal>
  );
}
