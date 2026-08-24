"use client";
import { useEffect, useState } from "react";
import type { StaticImageData } from "next/image";
import characterIcon from "@/assets/icons/sprite-types/character.svg";
import buildingIcon from "@/assets/icons/sprite-types/building.svg";
import itemIcon from "@/assets/icons/sprite-types/item.svg";
import otherIcon from "@/assets/icons/sprite-types/other.svg";
import terrainIcon from "@/assets/icons/sprite-types/terrain.svg";
import { SpriteType, SpriteTypePlaceholders } from "../constants";
import { Dropdown } from "../Components/dropdown";
import { FileUploadArea, SelectedFiles } from "../Components/file-upload";
import { GenerateButton } from "../Components/generate-button";
import { GeneratedSpritePreview } from "../Components/generated-sprite";
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
  const [prompt, setPrompt] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generatedSpriteUrl, setGeneratedSpriteUrl] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (generatedSpriteUrl) {
        URL.revokeObjectURL(generatedSpriteUrl);
      }
    },
    [generatedSpriteUrl],
  );

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
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "Could not generate a sprite.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={styles.generator}>
      <section className={styles.controls}>
        <div className={styles.header}>
          <h2>Image Generator</h2>
        </div>
        {user ? (
          <p className={styles.signedInAs}>
            Signed in as {user.name ?? user.email ?? "Google user"}
          </p>
        ) : (
          <p className={styles.authHint}>
            Sign in with Google from the top bar to enable generation.
          </p>
        )}
        <Dropdown
          label="Sprite Type"
          value={spriteType}
          onChange={setSpriteType}
          options={Object.values(SpriteType)}
          icons={spriteTypeIcons}
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
      <aside className={styles.previewColumn}>
        {generatedSpriteUrl ? (
          <GeneratedSpritePreview
            imageUrl={generatedSpriteUrl}
            onClear={() => setGeneratedSpriteUrl(null)}
          />
        ) : (
          <p className={styles.previewEmpty}>Your generated sprite will appear here.</p>
        )}
      </aside>
    </div>
  );
};

export default ImageGenerator;
