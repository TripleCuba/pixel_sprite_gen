'use client';

import Dialog from '../../shared/Dialog';
import Input from '../../shared/Input';
import Typography from '../../shared/Typography';

import { useId, useState } from 'react';

type SpriteNameDialogProps = {
  initialTitle: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (title: string) => void;
  spriteType: string;
};

const SpriteNameDialog = ({ initialTitle, isSaving, onClose, onSave, spriteType }: SpriteNameDialogProps) => {
  const [title, setTitle] = useState(initialTitle);
  const titleId = useId();
  const inputId = useId();
  const helpId = useId();

  return (
    <Dialog
      ariaDescribedBy={helpId}
      ariaLabelledBy={titleId}
      backdropLabel="Close rename sprite dialog"
      body={
        <>
          <Typography
            variant="label"
            color="foreground"
            display="block"
            htmlFor={inputId}
            margin="0 0 7px"
            size="small"
          >
            Sprite name
          </Typography>
          <Input
            id={inputId}
            value={title}
            maxLength={120}
            helpText={`Leave it empty to use “${spriteType}” instead.`}
            helpTextId={helpId}
            placeholder={spriteType}
            disabled={isSaving}
            onFocus={(event) => event.currentTarget.select()}
            onChange={(event) => setTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                onSave(title);
              }
            }}
          />
        </>
      }
      bodyVariant="content"
      closeDisabled={isSaving}
      eyebrow="Saved sprite"
      header="Name this sprite"
      headerId={titleId}
      onClose={onClose}
      primaryButton={{
        disabled: isSaving,
        label: isSaving ? 'Saving...' : 'Save name',
        onPress: () => onSave(title),
      }}
      secondaryButton={{
        disabled: isSaving,
        label: 'Cancel',
        onPress: onClose,
      }}
    />
  );
};

export default SpriteNameDialog;
