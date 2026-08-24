import { signInWithGoogle } from "@/app/actions/auth";
import styles from "./LoginScreen.module.css";

type LoginScreenProps = {
  isAuthConfigured: boolean;
};

const LoginScreen = ({ isAuthConfigured }: LoginScreenProps) => (
  <section className={styles.card} aria-labelledby="login-title">
    <span className={styles.kicker}>Pixel Sprite Generator</span>
    <h1 id="login-title">Create consistent game sprites.</h1>
    <p className={styles.description}>
      Describe your idea, add references, and generate a game-ready pixel sprite.
    </p>
    <ul className={styles.features}>
      <li>Pixel-snapped, transparent PNG exports</li>
      <li>Reference images for a consistent style</li>
      <li>Your generation access stays protected</li>
    </ul>
    {isAuthConfigured ? (
      <form action={signInWithGoogle}>
        <button className={styles.googleButton} type="submit">
          <span aria-hidden="true" className={styles.googleMark}>G</span>
          Continue with Google
        </button>
      </form>
    ) : (
      <p className={styles.setupNotice} role="status">
        Google sign-in needs the OAuth values in <code>.env.local</code> before
        it can be enabled.
      </p>
    )}
  </section>
);

export default LoginScreen;
