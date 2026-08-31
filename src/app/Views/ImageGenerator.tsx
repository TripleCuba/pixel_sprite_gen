'use client';

import Typography from '../Components/shared/Typography';
import { useEffect, useState } from 'react';
import type { StaticImageData } from 'next/image';
import characterIcon from '@/assets/icons/sprite-types/character.svg';
import buildingIcon from '@/assets/icons/sprite-types/building.svg';
import itemIcon from '@/assets/icons/sprite-types/item.svg';
import otherIcon from '@/assets/icons/sprite-types/other.svg';
import terrainIcon from '@/assets/icons/sprite-types/terrain.svg';
import { SpriteType, SpriteTypeDefaultView, SpriteTypePlaceholders, SpriteTypeViews, SpriteView } from '../constants';
import { Dropdown } from '../Components/dropdown';
import { FileUploadArea, SelectedFiles } from '../Components/file-upload';
import Button from '../Components/shared/Button';
import { iconSizeTokens } from '../Components/shared/tokens';
import { Sparkles } from 'lucide-react';
import { GenerationQuality } from '../Components/generation-quality';
import { GeneratedSpritePreview } from '../Components/generated-sprite';
import { LoadingIndicator } from '../Components/loading-indicator';
import { SpriteHistorySidebar } from '../Components/sprite-history';
import { SpriteViewSelector } from '../Components/sprite-view';
import { CREDIT_CHANGE_EVENT } from '../Components/credit-balance/CreditBalance';
import type { StoredSprite } from '@/lib/sprite-storage';
import {
  SpriteGenerationQuality,
  type SpriteGenerationQuality as SpriteGenerationQualityValue,
} from '@/lib/sprite-quality';
import { TextField } from '../Components/text-field';
import styles from './ImageGenerator.module.css';

const spriteTypeIcons: Record<SpriteType, StaticImageData> = {
  [SpriteType.character]: characterIcon,
  [SpriteType.building]: buildingIcon,
  [SpriteType.item]: itemIcon,
  [SpriteType.terrain]: terrainIcon,
  [SpriteType.other]: otherIcon,
};

type ImageGeneratorProps = {
  user: {
    email?: string | null;
    name?: string | null;
  } | null;
};

type GenerationProgress = {
  description: string;
  label: string;
  progress: number;
};

type GenerationEvent =
  | { type: 'progress'; progress: GenerationProgress }
  | { type: 'complete'; image: string; spriteId: string }
  | { type: 'error'; message: string };

const imageFromBase64 = (image: string) => {
  const binary = atob(image);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: 'image/png' });
};

const ImageGenerator = ({ user }: ImageGeneratorProps) => {
  const [spriteType, setSpriteType] = useState<SpriteType>(SpriteType.character);
  const [spriteView, setSpriteView] = useState<SpriteView>(SpriteTypeDefaultView[SpriteType.character]);
  const [quality, setQuality] = useState<SpriteGenerationQualityValue>(SpriteGenerationQuality.low);
  const [assetTitle, setAssetTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(null);
  const [generatedSpriteDownloadUrl, setGeneratedSpriteDownloadUrl] = useState<string | null>(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(
    () => () => {
      if (generatedSpriteUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(generatedSpriteUrl);
      }
    },
    [generatedSpriteUrl],
  );

  const handleSpriteTypeChange = (nextSpriteType: SpriteType) => {
    setSpriteType(nextSpriteType);
    setSpriteView(SpriteTypeDefaultView[nextSpriteType]);
  };

  const removeReferenceFile = (fileToRemove: File) => {
    setReferenceFiles((files) => files.filter((file) => file !== fileToRemove));
  };

  const handleGenerate = async () => {
    if (!user || !prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({
      label: 'Preparing your request...',
      description: 'Checking your prompt and generation availability.',
      progress: 5,
    });

    const formData = new FormData();
    formData.set('spriteType', spriteType);
    formData.set('view', spriteView);
    formData.set('quality', quality);
    formData.set('title', assetTitle);
    formData.set('prompt', prompt);
    referenceFiles.forEach((file) => formData.append('references', file));

    try {
      const response = await fetch('/api/sprites/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Could not generate a sprite.');
      }

      if (!response.body) {
        throw new Error('The generation service returned an empty response.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = '';
      let completedGeneration: Extract<GenerationEvent, { type: 'complete' }> | undefined;

      const handleEvent = (line: string) => {
        if (!line) {
          return;
        }

        const event = JSON.parse(line) as GenerationEvent;
        if (event.type === 'progress') {
          setGenerationProgress(event.progress);
          return;
        }

        if (event.type === 'error') {
          throw new Error(event.message);
        }

        completedGeneration = event;
      };

      while (true) {
        const { done, value } = await reader.read();
        pending += decoder.decode(value ?? new Uint8Array(), { stream: !done });

        const lines = pending.split('\n');
        pending = lines.pop() ?? '';
        lines.forEach(handleEvent);

        if (done) {
          break;
        }
      }

      handleEvent(pending);

      if (!completedGeneration) {
        throw new Error('The generation service finished without an image.');
      }

      const { image, spriteId } = completedGeneration as Extract<GenerationEvent, { type: 'complete' }>;
      const sprite = imageFromBase64(image);
      setGeneratedSpriteUrl(URL.createObjectURL(sprite));
      setGeneratedSpriteDownloadUrl(`/api/sprites/${spriteId}/download`);
      setHistoryVersion((version) => version + 1);
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'Could not generate a sprite.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
      window.dispatchEvent(new Event(CREDIT_CHANGE_EVENT));
    }
  };

  return (
    <div className={`${styles.workspace} ${isSidebarCollapsed ? styles.workspaceWithCollapsedSidebar : ''}`}>
      <SpriteHistorySidebar
        isCollapsed={isSidebarCollapsed}
        refreshKey={historyVersion}
        onCollapsedChange={setIsSidebarCollapsed}
        onSelect={(sprite: StoredSprite) => {
          setGeneratedSpriteUrl(sprite.imageUrl);
          setGeneratedSpriteDownloadUrl(`/api/sprites/${sprite.id}/download`);
        }}
        onDelete={(deletedSprite) => {
          if (generatedSpriteUrl === deletedSprite.imageUrl) {
            setGeneratedSpriteUrl(null);
            setGeneratedSpriteDownloadUrl(null);
          }
        }}
      />
      <div className={`${styles.generator} ${generatedSpriteUrl ? styles.generatorWithPreview : ''}`}>
        <section className={styles.controls}>
          <div className={styles.header}>
            <Typography variant="h2">Image Generator</Typography>
          </div>
          <Dropdown
            label="Sprite Type"
            value={spriteType}
            onChange={handleSpriteTypeChange}
            options={Object.values(SpriteType)}
            icons={spriteTypeIcons}
          />
          <SpriteViewSelector
            availableViews={SpriteTypeViews[spriteType]}
            value={spriteView}
            spriteType={spriteType}
            onChange={setSpriteView}
          />
          <GenerationQuality
            disabled={isGenerating}
            refreshKey={historyVersion}
            value={quality}
            onChange={setQuality}
          />
          <TextField
            label="Asset title (optional)"
            value={assetTitle}
            onChange={setAssetTitle}
            placeholder="e.g. Forest ranger"
            maxLength={120}
          />
          <TextField
            label="Describe your sprite"
            value={prompt}
            onChange={setPrompt}
            placeholder={SpriteTypePlaceholders[spriteType]}
            multiline
          />
          <FileUploadArea
            label="Reference files"
            onFilesChange={setReferenceFiles}
            accept="image/png,image/jpeg,image/webp"
            maxFiles={4}
          />
          <SelectedFiles files={referenceFiles} onRemove={removeReferenceFile} />
          <Button
            disabled={!user || prompt.trim().length === 0 || isGenerating}
            icon={<Sparkles size={iconSizeTokens.large} />}
            label={isGenerating ? 'Generating...' : 'Generate Sprite'}
            onPress={handleGenerate}
          />
          {generationError ? (
            <Typography variant="p" color="danger" margin="12px 0 0" role="alert">
              {generationError}
            </Typography>
          ) : null}
        </section>
        {generatedSpriteUrl ? (
          <aside className={styles.previewColumn}>
            <GeneratedSpritePreview
              imageUrl={generatedSpriteUrl}
              downloadUrl={generatedSpriteDownloadUrl ?? undefined}
              onClear={() => {
                setGeneratedSpriteUrl(null);
                setGeneratedSpriteDownloadUrl(null);
              }}
            />
          </aside>
        ) : null}
        {isGenerating ? (
          <div className={styles.generatingOverlay} aria-label="Generating sprite">
            <LoadingIndicator
              label={generationProgress?.label ?? 'Preparing your request...'}
              description={generationProgress?.description}
              progress={generationProgress?.progress}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImageGenerator;
