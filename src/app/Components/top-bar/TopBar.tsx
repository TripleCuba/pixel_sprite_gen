import Button from '../shared/Button';
import Typography from '../shared/Typography';
import { signInWithGoogle, signOutUser } from '@/app/actions/auth';
import logo from '@/assets/images/spriteforge-logo-topbar.png';
import Image from 'next/image';
import Link from 'next/link';
import { CreditBalance } from '../credit-balance';
import styles from './TopBar.module.css';

type TopBarProps = {
  isAuthConfigured: boolean;
  user: {
    email?: string | null;
    name?: string | null;
  } | null;
};

const TopBar = ({ isAuthConfigured, user }: TopBarProps) => (
  <header className={styles.bar}>
    <div className={styles.content}>
      <Link className={styles.brand} href="/" aria-label="SpriteForge home">
        <Typography variant="span" aria-hidden="true" className={styles.brandMarkFrame}>
          <Image alt="" className={styles.brandMark} priority src={logo} />
        </Typography>
        <Typography variant="span" className={styles.brandText}>
          <Typography variant="span" className={styles.spriteText}>
            Sprite
          </Typography>
          <Typography variant="span" className={styles.forgeText}>
            Forge
          </Typography>
        </Typography>
      </Link>
      <div className={styles.account}>
        {user ? (
          <>
            <Typography variant="span" className={styles.userName}>
              {user.name ?? user.email ?? 'Google user'}
            </Typography>
            <CreditBalance />
            <Link className={styles.plansLink} href="/billing">
              Plans
            </Link>
            <form action={signOutUser}>
              <Button className={styles.secondaryButton} label="Sign out" type="submit" variant="secondary" />
            </form>
          </>
        ) : isAuthConfigured ? (
          <form action={signInWithGoogle}>
            <Button className={styles.signInButton} label="Sign in with Google" type="submit" />
          </form>
        ) : (
          <Typography variant="span" className={styles.setupState}>
            Sign-in setup required
          </Typography>
        )}
      </div>
    </div>
  </header>
);

export default TopBar;
