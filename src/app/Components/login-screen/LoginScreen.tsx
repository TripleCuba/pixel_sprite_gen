import { signInWithGoogle } from "@/app/actions/auth";
import styles from "./LoginScreen.module.css";

type LoginScreenProps = {
  isAccessDenied: boolean;
  isAuthConfigured: boolean;
};

const PixelStar = () => (
  <svg aria-hidden="true" className={styles.featureIcon} viewBox="0 0 20 20">
    <path
      d="M8 1h4v4h4v4h3v3h-4v4h-3v3H8v-3H5v-4H1V9h3V5h4z"
      fill="#9b5b20"
    />
    <path
      d="M8 0h4v4h4v4h3v3h-4v4h-3v3H8v-3H5v-4H1V8h3V4h4z"
      fill="#f6b841"
    />
    <path d="M8 4h4v4h4v3h-4v4H8v-4H4V8h4z" fill="#ffdd72" />
    <path d="M8 4h4v4H8z" fill="#fff2af" />
  </svg>
);

const LoginScreen = ({ isAccessDenied, isAuthConfigured }: LoginScreenProps) => (
  <section className={styles.hero} aria-labelledby="login-title">
    <div className={styles.copy}>
      <span className={styles.kicker}>
        <span aria-hidden="true" className={styles.kickerSpark}>✦</span>
        A creative home for pixel artists
      </span>
      <h1 id="login-title">
        Forge assets with <span>intent.</span>
      </h1>
      <p className={styles.description}>
        Shape game-ready pixel art with focused controls, useful references, and
        clean transparent exports.
      </p>
      <ul className={styles.features}>
        <li>
          <PixelStar />
          Pixel-snapped transparent PNG exports
        </li>
        <li>
          <PixelStar />
          References for a consistent visual style
        </li>
        <li>
          <PixelStar />
          Built for characters, items, terrain, and more
        </li>
      </ul>
      <div className={styles.actionArea}>
        {isAccessDenied ? (
          <p className={styles.accessDenied} role="alert">
            This Google account is not approved. Sign out above, then use an
            allowlisted account.
          </p>
        ) : isAuthConfigured ? (
          <form action={signInWithGoogle}>
            <button className={styles.googleButton} type="submit">
              <span aria-hidden="true" className={styles.googleMark}>G</span>
              Enter the forge with Google
            </button>
          </form>
        ) : (
          <p className={styles.setupNotice} role="status">
            Google sign-in needs the OAuth and <code>ALLOWED_EMAILS</code> values in
            <code>.env.local</code> before it can be enabled.
          </p>
        )}
        <span className={styles.note}>Your workspace is invite-only.</span>
      </div>
    </div>
    <aside className={styles.workflowPreview} aria-labelledby="workflow-title">
      <div className={styles.workflowPanel}>
        <div className={styles.previewHeading}>
          <span id="workflow-title">Forge workflow</span>
          <span>01—03</span>
        </div>
        <ol className={styles.workflowSteps}>
          <li>
            <span className={styles.stepNumber}>01</span>
            <span aria-hidden="true" className={`${styles.stepGlyph} ${styles.promptGlyph}`} />
            <div>
              <h2>Describe</h2>
              <p>Start with a clear creative direction.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>02</span>
            <span aria-hidden="true" className={`${styles.stepGlyph} ${styles.viewGlyph}`} />
            <div>
              <h2>Direct</h2>
              <p>Choose the view and reference style.</p>
            </div>
          </li>
          <li>
            <span className={styles.stepNumber}>03</span>
            <span aria-hidden="true" className={`${styles.stepGlyph} ${styles.exportGlyph}`} />
            <div>
              <h2>Export</h2>
              <p>Get a transparent, game-ready PNG.</p>
            </div>
          </li>
        </ol>
        <div className={styles.previewFooter}>
          <span aria-hidden="true">✦</span>
          From prompt to pixel
        </div>
      </div>
    </aside>
  </section>
);

export default LoginScreen;
