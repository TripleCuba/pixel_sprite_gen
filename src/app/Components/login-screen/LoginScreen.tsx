import Button from '../shared/Button';
import Typography from '../shared/Typography';
import { signInWithGoogle } from '@/app/actions/auth';
import styles from './LoginScreen.module.css';

type LoginScreenProps = {
  isAccessDenied: boolean;
  isAuthConfigured: boolean;
};

const PixelStar = () => (
  <svg aria-hidden="true" className={styles.featureIcon} viewBox="0 0 20 20">
    <path d="M8 1h4v4h4v4h3v3h-4v4h-3v3H8v-3H5v-4H1V9h3V5h4z" fill="#9b5b20" />
    <path d="M8 0h4v4h4v4h3v3h-4v4h-3v3H8v-3H5v-4H1V8h3V4h4z" fill="#f6b841" />
    <path d="M8 4h4v4h4v3h-4v4H8v-4H4V8h4z" fill="#ffdd72" />
    <path d="M8 4h4v4H8z" fill="#fff2af" />
  </svg>
);

const LoginScreen = ({ isAccessDenied, isAuthConfigured }: LoginScreenProps) => (
  <section className={styles.hero} aria-labelledby="login-title">
    <div className={styles.copy}>
      <Typography variant="span" className={styles.kicker}>
        <Typography variant="span" aria-hidden="true" className={styles.kickerSpark}>
          ✦
        </Typography>
        A creative home for pixel artists
      </Typography>
      <Typography variant="h1" id="login-title">
        Forge assets with <Typography variant="span">intent.</Typography>
      </Typography>
      <Typography variant="p" className={styles.description}>
        Shape game-ready pixel art with focused controls, useful references, and clean transparent exports.
      </Typography>
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
          <Typography variant="p" className={styles.accessDenied} role="alert">
            This Google account is not approved. Sign out above, then use an allowlisted account.
          </Typography>
        ) : isAuthConfigured ? (
          <form action={signInWithGoogle}>
            <Button
              type="submit"
              icon={
                <Typography variant="span" className={styles.googleMark}>
                  G
                </Typography>
              }
              label="Enter the forge with Google"
              className={styles.googleButtonWrapper}
            />
          </form>
        ) : (
          <Typography variant="p" className={styles.setupNotice} role="status">
            Google sign-in needs the OAuth and <Typography variant="code">ALLOWED_EMAILS</Typography> values in
            <Typography variant="code">.env.local</Typography> before it can be enabled.
          </Typography>
        )}
        <Typography variant="span" className={styles.note}>
          Your workspace is invite-only.
        </Typography>
      </div>
    </div>
    <aside className={styles.workflowPreview} aria-labelledby="workflow-title">
      <div className={styles.workflowPanel}>
        <div className={styles.previewHeading}>
          <Typography variant="span" id="workflow-title">
            Forge workflow
          </Typography>
          <Typography variant="span">01—03</Typography>
        </div>
        <ol className={styles.workflowSteps}>
          <li>
            <Typography variant="span" className={styles.stepNumber}>
              01
            </Typography>
            <Typography variant="span" aria-hidden="true" className={`${styles.stepGlyph} ${styles.promptGlyph}`} />
            <div>
              <Typography variant="h2">Describe</Typography>
              <Typography variant="p">Start with a clear creative direction.</Typography>
            </div>
          </li>
          <li>
            <Typography variant="span" className={styles.stepNumber}>
              02
            </Typography>
            <Typography variant="span" aria-hidden="true" className={`${styles.stepGlyph} ${styles.viewGlyph}`} />
            <div>
              <Typography variant="h2">Direct</Typography>
              <Typography variant="p">Choose the view and reference style.</Typography>
            </div>
          </li>
          <li>
            <Typography variant="span" className={styles.stepNumber}>
              03
            </Typography>
            <Typography variant="span" aria-hidden="true" className={`${styles.stepGlyph} ${styles.exportGlyph}`} />
            <div>
              <Typography variant="h2">Export</Typography>
              <Typography variant="p">Get a transparent, game-ready PNG.</Typography>
            </div>
          </li>
        </ol>
        <div className={styles.previewFooter}>
          <Typography variant="span" aria-hidden="true">
            ✦
          </Typography>
          From prompt to pixel
        </div>
      </div>
    </aside>
  </section>
);

export default LoginScreen;
