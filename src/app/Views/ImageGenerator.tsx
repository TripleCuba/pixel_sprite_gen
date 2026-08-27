"use client";
import { useEffect, useState } from "react";
import type { StaticImageData } from "next/image";
import characterIcon from "@/assets/icons/sprite-types/character.svg";
import buildingIcon from "@/assets/icons/sprite-types/building.svg";
import itemIcon from "@/assets/icons/sprite-types/item.svg";
import otherIcon from "@/assets/icons/sprite-types/other.svg";
import terrainIcon from "@/assets/icons/sprite-types/terrain.svg";
import {
  SpriteType,
  SpriteTypeDefaultView,
  SpriteTypePlaceholders,
  SpriteTypeViews,
  SpriteView,
} from "../constants";
import { Dropdown } from "../Components/dropdown";
import { FileUploadArea, SelectedFiles } from "../Components/file-upload";
import { GenerateButton } from "../Components/generate-button";
import { GenerationQuality } from "../Components/generation-quality";
import { GeneratedSpritePreview } from "../Components/generated-sprite";
import { LoadingIndicator } from "../Components/loading-indicator";
import { SpriteHistorySidebar } from "../Components/sprite-history";
import { SpriteViewSelector } from "../Components/sprite-view";
import { CREDIT_CHANGE_EVENT } from "../Components/credit-balance/CreditBalance";
import type { StoredSprite } from "@/lib/sprite-storage";
import {
  SpriteGenerationQuality,
  type SpriteGenerationQuality as SpriteGenerationQualityValue,
} from "@/lib/sprite-quality";
import { TextField } from "../Components/text-field";
import styles from "./ImageGenerator.module.css";

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

const ImageGenerator = ({ user }: ImageGeneratorProps) => {
  const [spriteType, setSpriteType] = useState<SpriteType>(
    SpriteType.character,
  );
  const [spriteView, setSpriteView] = useState<SpriteView>(
    SpriteTypeDefaultView[SpriteType.character],
  );
  const [quality, setQuality] = useState<SpriteGenerationQualityValue>(
    SpriteGenerationQuality.low,
  );
  const [prompt, setPrompt] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(
    null,
  );
  const [generatedSpriteDownloadUrl, setGeneratedSpriteDownloadUrl] = useState<
    string | null
  >(null);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);

  useEffect(
    () => () => {
      if (generatedSpriteUrl?.startsWith("blob:")) {
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

    const formData = new FormData();
    formData.set("spriteType", spriteType);
    formData.set("view", spriteView);
    formData.set("quality", quality);
    formData.set("prompt", prompt);
    referenceFiles.forEach((file) => formData.append("references", file));

    try {
      const response = await fetch("/api/sprites/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Could not generate a sprite.");
      }

      const sprite = await response.blob();
      setGeneratedSpriteUrl(URL.createObjectURL(sprite));
      const spriteId = response.headers.get("X-Sprite-Id");
      setGeneratedSpriteDownloadUrl(
        spriteId ? `/api/sprites/${spriteId}/download` : null,
      );
      setHistoryVersion((version) => version + 1);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Could not generate a sprite.",
      );
    } finally {
      setIsGenerating(false);
      window.dispatchEvent(new Event(CREDIT_CHANGE_EVENT));
    }
  };

  return (
    <div className={styles.workspace}>
      <SpriteHistorySidebar
        isCollapsed={isHistoryCollapsed}
        onCollapsedChange={setIsHistoryCollapsed}
        refreshKey={historyVersion}
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
      <div
        className={`${styles.generator} ${
          generatedSpriteUrl ? styles.generatorWithPreview : ""
        }`}
      >
        <section className={styles.controls}>
          <div className={styles.header}>
            <h2>Image Generator</h2>
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
          <SelectedFiles
            files={referenceFiles}
            onRemove={removeReferenceFile}
          />
          <GenerateButton
            disabled={!user || prompt.trim().length === 0 || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? "Generating..." : "Generate Sprite"}
          </GenerateButton>
          {generationError ? (
            <p role="alert" className={styles.error}>
              {generationError}
            </p>
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
          <div
            className={styles.generatingOverlay}
            aria-label="Generating sprite"
          >
            <LoadingIndicator
              label="Forging your sprite..."
              description="Generating, cleaning the background, and pixel-snapping the result."
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImageGenerator;
