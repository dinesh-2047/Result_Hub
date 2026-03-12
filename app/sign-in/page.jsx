import { SiteShell } from '@/components/site/site-shell';
import { SignInForm } from '@/components/site/sign-in-form';

export default function SignInPage() {
  return (
    <SiteShell>
      <main className="site-shell section">
        <SignInForm />
      </main>
    </SiteShell>
  );
}