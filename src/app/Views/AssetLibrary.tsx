"use client";

/* eslint-disable @next/next/no-img-element */

import { Download } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { StoredSprite } from "@/lib/sprite-storage";
import { LoadingIndicator } from "../Components/loading-indicator";
import styles from "./AssetLibrary.module.css";

const PAGE_SIZE = 48;

type SpritePageResponse = {
  error?: string;
  hasMore?: boolean;
  sprites?: StoredSprite[];
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));

const fetchSpritePage = async (offset: number, signal?: AbortSignal) => {
  const response = await fetch(
    `/api/sprites?offset=${offset}&limit=${PAGE_SIZE}`,
    { signal },
  );
  const payload = (await response.json()) as SpritePageResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? "Could not load saved sprites.");
  }

  return {
    hasMore: Boolean(payload.hasMore),
    sprites: payload.sprites ?? [],
  };
};

const AssetLibrary = () => {
  const [sprites, setSprites] = useState<StoredSprite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const loadMoreSprites = async () => {
    setError(null);
    setIsLoadingMore(true);

    try {
      const page = await fetchSpritePage(sprites.length);
      setSprites((currentSprites) => [...currentSprites, ...page.sprites]);
      setHasMore(page.hasMore);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load saved sprites.",
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const loadInitialSprites = async () => {
      try {
        const page = await fetchSpritePage(0, controller.signal);

        if (!controller.signal.aborted) {
          setSprites(page.sprites);
          setHasMore(page.hasMore);
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not load saved sprites.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadInitialSprites();

    return () => controller.abort();
  }, []);

  return (
    <section className={styles.library} aria-labelledby="assets-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Asset library</p>
          <h1 id="assets-heading">All created assets</h1>
          <p className={styles.description}>
            Browse every sprite you have generated.
          </p>
        </div>
        <Link className={styles.backLink} href="/generator">
          Back to generator
        </Link>
      </header>

      {isLoading ? <LoadingIndicator label="Loading assets..." /> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!isLoading && !error && sprites.length === 0 ? (
        <p className={styles.empty}>Your generated assets will appear here.</p>
      ) : null}
      <div className={styles.grid}>
        {sprites.map((sprite) => (
          <article key={sprite.id} className={styles.asset}>
            <img
              src={sprite.imageUrl}
              alt={`${sprite.title ?? sprite.spriteType} sprite`}
            />
            <div className={styles.assetDetails}>
              <div>
                <h2>{sprite.title ?? sprite.spriteType}</h2>
                <p>
                  {sprite.title ? `${sprite.spriteType} · ` : ""}
                  {formatDate(sprite.createdAt)}
                </p>
              </div>
              <a
                className={styles.download}
                href={`/api/sprites/${sprite.id}/download`}
                download={`${sprite.title ?? sprite.spriteType}.png`}
              >
                <Download aria-hidden="true" size={16} />
                <span className={styles.downloadLabel}>Download</span>
              </a>
            </div>
          </article>
        ))}
      </div>
      {hasMore ? (
        <button
          type="button"
          className={styles.loadMore}
          disabled={isLoadingMore}
          onClick={() => void loadMoreSprites()}
        >
          {isLoadingMore ? "Loading..." : "Load more assets"}
        </button>
      ) : null}
    </section>
  );
};

export default AssetLibrary;
