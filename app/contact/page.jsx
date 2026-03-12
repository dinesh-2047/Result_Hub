import { SiteShell } from '@/components/site/site-shell';
import { ContactForm } from '@/components/site/contact-form';

export default function ContactPage() {
  return (
    <SiteShell>
      <main className="site-shell section">
        <div className="contact-page-grid">
          <section className="surface contact-page-card">
            <h1 className="page-title">Get in Touch</h1>
            <p className="page-intro">Have a question about results, your account, or portal access? We're here to help.</p>
            <ul className="simple-list">
              <li>Result queries &amp; discrepancies</li>
              <li>Account &amp; password issues</li>
              <li>General enquiries</li>
            </ul>
          </section>
          <ContactForm />
        </div>
      </main>
    </SiteShell>
  );
}