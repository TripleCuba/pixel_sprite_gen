import { signInWithGoogle, signOutUser } from "@/app/actions/auth";
import Link from "next/link";
import { CreditBalance } from "../credit-balance";
import styles from "./TopBar.module.css";

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
      <Link className={styles.brand} href="/" aria-label="Pixel Sprite Generator home">
        <span aria-hidden="true" className={styles.brandMark} />
        <span>Pixel Sprite Generator</span>
      </Link>
      <div className={styles.account}>
        {user ? (
          <>
            <span className={styles.userName}>
              {user.name ?? user.email ?? "Google user"}
            </span>
            <CreditBalance />
            <Link className={styles.plansLink} href="/billing">
              Plans
            </Link>
            <form action={signOutUser}>
              <button className={styles.secondaryButton} type="submit">
                Sign out
              </button>
            </form>
          </>
        ) : isAuthConfigured ? (
          <form action={signInWithGoogle}>
            <button className={styles.signInButton} type="submit">
              Sign in with Google
            </button>
          </form>
        ) : (
          <span className={styles.setupState}>Sign-in setup required</span>
        )}
      </div>
    </div>
  </header>
);

export default TopBar;
