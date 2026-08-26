# Sprite quality evaluations

This folder is the stable benchmark for generation changes. It intentionally
does not run as part of the normal application build yet: generation costs money
and needs a deliberate manual or scheduled run.

```text
evals/sprite-quality/
├── cases.ts       # Stable inputs: type, view, and prompt for every case
├── rubric.md      # How to judge a result
├── README.md       # This workflow
└── results/        # Git-ignored generated artifacts and score records
```

## First baseline

1. Use every entry in `cases.ts` with **Medium** generation quality and no
   reference files.
2. Generate one result for each case, then score it using `rubric.md`.
3. Save every result under `results/baseline-v1/` using the structure in the
   rubric.
4. Record the overall pass rate and every failure reason.

After that, run the same cases whenever global prompt rules, view rules,
post-processing, or the visual reviewer changes. Add three independent runs per
case once the initial baseline is stable; that measures consistency rather than
a lucky single generation.

Do not edit existing cases after their first run. Add a new case if a new
failure mode appears.
