import { LoginScreen } from './Components/login-screen';
import { TopBar } from './Components/top-bar';
import styles from './page.module.css';
import { auth } from '@/auth';
import { isEmailAllowed } from '@/lib/allowed-emails';
import { isAuthConfigured } from '@/lib/auth-config';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

type HomeProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const authConfigured = isAuthConfigured();
  const session = authConfigured ? await auth() : null;
  const { error } = await searchParams;
  const isAccessDenied =
    error === 'AccessDenied' ||
    Boolean(session?.user && !isEmailAllowed(session.user.email));

  if (session?.user && isEmailAllowed(session.user.email)) {
    redirect('/generator');
  }

  return (
    <div className={styles.page}>
      <TopBar isAuthConfigured={authConfigured} user={session?.user ?? null} />
      <main className={styles.loginMain}>
        <LoginScreen
          isAccessDenied={isAccessDenied}
          isAuthConfigured={authConfigured}
        />
      </main>
    </div>
  );
}
