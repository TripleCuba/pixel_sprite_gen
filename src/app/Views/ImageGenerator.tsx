"use client";
import { useState } from "react";
import type { StaticImageData } from "next/image";
import characterIcon from "@/assets/icons/sprite-types/character.svg";
import buildingIcon from "@/assets/icons/sprite-types/building.svg";
import itemIcon from "@/assets/icons/sprite-types/item.svg";
import otherIcon from "@/assets/icons/sprite-types/other.svg";
import terrainIcon from "@/assets/icons/sprite-types/terrain.svg";
import { Colors, SpriteType, SpriteTypePlaceholders } from "../constants";
import { Dropdown } from "../Components/dropdown";
import { FileUploadArea, SelectedFiles } from "../Components/file-upload";
import { GenerateButton } from "../Components/generate-button";
import { TextField } from "../Components/text-field";

const spriteTypeIcons: Record<SpriteType, StaticImageData> = {
  [SpriteType.character]: characterIcon,
  [SpriteType.building]: buildingIcon,
  [SpriteType.item]: itemIcon,
  [SpriteType.terrain]: terrainIcon,
  [SpriteType.other]: otherIcon,
};

const ImageGenerator = () => {
  const [spriteType, setSpriteType] = useState<SpriteType>(
    SpriteType.character,
  );
  const [prompt, setPrompt] = useState("");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  const removeReferenceFile = (fileToRemove: File) => {
    setReferenceFiles((files) => files.filter((file) => file !== fileToRemove));
  };
  return (
    <div
      style={{
        backgroundColor: Colors.surface,
        margin: "40px",
        padding: "24px",
        width: "50%",
        borderRadius: "8px",
        gap: "12px",
      }}
    >
      <h2>Image Generator</h2>
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
      />
      <SelectedFiles files={referenceFiles} onRemove={removeReferenceFile} />
      <GenerateButton disabled={prompt.trim().length === 0}>
        Generate Sprite
      </GenerateButton>
    </div>
  );
};

export default ImageGenerator;
