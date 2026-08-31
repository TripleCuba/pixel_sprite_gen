'use client';

import Button from '../shared/Button';
import Typography from '../shared/Typography';

/* eslint-disable @next/next/no-img-element */

import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { iconSizeTokens } from '../shared/tokens';
import styles from './GeneratedSpritePreview.module.css';
import SpritePreviewDialog from './SpritePreviewDialog';

type GeneratedSpritePreviewProps = {
  downloadUrl?: string;
  imageUrl: string;
  onClear: () => void;
};

const GeneratedSpritePreview = ({ downloadUrl, imageUrl, onClear }: GeneratedSpritePreviewProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <section className={styles.preview} aria-label="Generated sprite preview">
      <Typography variant="h2" color="foreground" margin={0} size="medium">
        Generated sprite
      </Typography>
      <button
        type="button"
        className={styles.canvas}
        aria-label="Open generated sprite preview"
        onClick={() => setIsPreviewOpen(true)}
      >
        <img src={imageUrl} alt="Generated pixel sprite" className={styles.image} />
      </button>
      <div className={styles.actions}>
        <Button
          href={downloadUrl ?? imageUrl}
          download="sprite.png"
          icon={<Download size={iconSizeTokens.small} />}
          label="Download"
          variant="secondary"
        />
        <Button icon={<Trash2 size={iconSizeTokens.small} />} label="Clear" onPress={onClear} variant="danger" />
      </div>
      {isPreviewOpen ? <SpritePreviewDialog imageUrl={imageUrl} onClose={() => setIsPreviewOpen(false)} /> : null}
    </section>
  );
};

export default GeneratedSpritePreview;
