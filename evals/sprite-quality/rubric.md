# Sprite quality rubric

Score every generated candidate as **pass** or **fail** for each check. A case
passes only when all required checks pass. The selected camera view is a hard
requirement: a visually attractive sprite in the wrong view still fails.

| Check           | Pass condition                                                                               |
| --------------- | -------------------------------------------------------------------------------------------- |
| Subject         | Exactly one readable main asset; no collage or duplicate variants.                           |
| Camera view     | Clearly matches the case's selected front, side, three-quarter, top-down, or isometric view. |
| Composition     | Complete silhouette fits within the safety margin and is neither cropped nor too small.      |
| Background      | No green remnants, floor, horizon, scene, border, or backdrop.                               |
| Export          | 256×256 transparent PNG with fixed safe padding and pixel-snapped edges.                     |
| Pixel-art style | Deliberate pixel clusters, crisp edges, and a restrained palette.                            |
| Cleanliness     | No text, UI, logo, watermark, frame, or label.                                               |
| Prompt fit      | The main subject, key material, and requested equipment or features are recognisable.        |

## Recording results

For each run, store the source image and a `result.json` file under:

```text
evals/sprite-quality/results/<prompt-version>/<case-id>/<run-number>/
```

The result should contain the date, model, selected quality, pass/fail result,
per-check scores, reviewer notes, and retry count. Never overwrite a previous
run; evaluation history is what makes prompt changes comparable.
