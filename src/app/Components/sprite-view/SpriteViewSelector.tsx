"use client";

import Image from "next/image";
import {
  SpriteType,
  SpriteView,
} from "@/app/constants";
import styles from "./SpriteViewSelector.module.css";

type SpriteViewSelectorProps = {
  availableViews: readonly SpriteView[];
  onChange: (view: SpriteView) => void;
  spriteType: SpriteType;
  value: SpriteView;
};

const typeSlugs: Record<SpriteType, string> = {
  [SpriteType.character]: "character",
  [SpriteType.building]: "building",
  [SpriteType.item]: "item",
  [SpriteType.terrain]: "terrain",
  [SpriteType.other]: "other",
};

const viewSlugs: Record<SpriteView, string> = {
  [SpriteView.threeQuarter]: "three-quarter",
  [SpriteView.side]: "side",
  [SpriteView.front]: "front",
  [SpriteView.topDown]: "top-down",
  [SpriteView.isometric]: "isometric",
};

const SpriteViewSelector = ({
  availableViews,
  onChange,
  spriteType,
  value,
}: SpriteViewSelectorProps) => (
  <fieldset className={styles.selector}>
    <legend>Camera view</legend>
    <div className={styles.options}>
      {availableViews.map((view) => (
        <button
          key={view}
          type="button"
          className={`${styles.option} ${
            value === view ? styles.optionSelected : ""
          }`}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
        >
          <Image
            className={styles.example}
            src={`/sprite-previews/${typeSlugs[spriteType]}-${viewSlugs[view]}.png`}
            alt=""
            aria-hidden="true"
            unoptimized
            width={256}
            height={256}
          />
          <span>
            <strong>{view}</strong>
          </span>
        </button>
      ))}
    </div>
  </fieldset>
);

export default SpriteViewSelector;
