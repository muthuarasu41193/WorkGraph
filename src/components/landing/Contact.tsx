import { Reveal } from "./Reveal";

export function Contact() {
  return (
    <Reveal
      as="section"
      className="wg-section wg-contact"
      id="contact"
      aria-labelledby="contact-heading"
    >
      <div className="wg-container wg-contact__layout">
        <div>
          <p className="wg-eyebrow">Contact</p>
          <h2 id="contact-heading" className="wg-section__title">
            Talk about a job search.
          </h2>
          <p className="wg-section__lead">
            Have a question or feedback? A person reads this inbox. A reply time
            is not published.
          </p>
        </div>
        <ul className="wg-contact__mails">
          <li>
            <a href="mailto:hello@getworkgraph.com">hello@getworkgraph.com</a>
          </li>
          <li>
            <a href="mailto:support@getworkgraph.com">support@getworkgraph.com</a>
          </li>
          <li>
            <a href="mailto:contact@getworkgraph.com">contact@getworkgraph.com</a>
          </li>
        </ul>
      </div>
    </Reveal>
  );
}
