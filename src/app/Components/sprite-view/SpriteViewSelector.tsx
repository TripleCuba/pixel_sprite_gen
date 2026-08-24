"use client";

import Image, { type StaticImageData } from "next/image";
import threeQuarterImage from "@/assets/images/views/three-quarter.png";
import sideImage from "@/assets/images/views/side.png";
import frontImage from "@/assets/images/views/front.png";
import topDownImage from "@/assets/images/views/top-down.png";
import isometricImage from "@/assets/images/views/isometric.png";
import {
  SpriteView,
} from "@/app/constants";
import styles from "./SpriteViewSelector.module.css";

type SpriteViewSelectorProps = {
  onChange: (view: SpriteView) => void;
  value: SpriteView;
};

const viewImages: Record<SpriteView, StaticImageData> = {
  [SpriteView.threeQuarter]: threeQuarterImage,
  [SpriteView.side]: sideImage,
  [SpriteView.front]: frontImage,
  [SpriteView.topDown]: topDownImage,
  [SpriteView.isometric]: isometricImage,
};

const SpriteViewSelector = ({ onChange, value }: SpriteViewSelectorProps) => (
  <fieldset className={styles.selector}>
    <legend>View</legend>
    <div className={styles.options}>
      {Object.values(SpriteView).map((view) => (
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
            src={viewImages[view]}
            alt=""
            aria-hidden="true"
            unoptimized
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
