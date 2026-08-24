"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import type { StoredSprite } from "@/lib/sprite-storage";
import { AlertDialog } from "../alert-dialog";
import { LoadingIndicator } from "../loading-indicator";
import styles from "./SpriteHistorySidebar.module.css";

type SpriteHistorySidebarProps = {
  onDelete: (sprite: StoredSprite) => void;
  onSelect: (sprite: StoredSprite) => void;
  refreshKey: number;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));

const SpriteHistorySidebar = ({
  onDelete,
  onSelect,
  refreshKey,
}: SpriteHistorySidebarProps) => {
  const [sprites, setSprites] = useState<StoredSprite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [spriteToDelete, setSpriteToDelete] = useState<StoredSprite | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSprites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sprites", { signal: controller.signal });
        const payload = (await response.json()) as {
          error?: string;
          sprites?: StoredSprite[];
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load saved sprites.");
        }

        setSprites(payload.sprites ?? []);
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === "AbortError") {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load saved sprites.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadSprites();

    return () => controller.abort();
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!spriteToDelete || deletingId) {
      return;
    }

    const sprite = spriteToDelete;
    setDeletingId(sprite.id);
    setError(null);

    try {
      const response = await fetch("/api/sprites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spriteId: sprite.id }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Could not delete the saved sprite.");
      }

      setSprites((currentSprites) =>
        currentSprites.filter(({ id }) => id !== sprite.id),
      );
      onDelete(sprite);
      setSpriteToDelete(null);
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the saved sprite.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <aside className={styles.sidebar} aria-label="Created sprites">
      <div className={styles.header}>
        <h2>Created</h2>
        <span>{sprites.length}</span>
      </div>
      {isLoading ? <LoadingIndicator compact label="Loading sprites..." /> : null}
      {error ? <p className={styles.error}>{error}</p> : null}
      {!isLoading && !error && sprites.length === 0 ? (
        <p className={styles.status}>Your saved sprites will appear here.</p>
      ) : null}
      <div className={styles.list}>
        {sprites.map((sprite) => (
          <div key={sprite.id} className={styles.sprite}>
            <button
              type="button"
              className={styles.spriteSelect}
              onClick={() => onSelect(sprite)}
            >
              <img src={sprite.imageUrl} alt={`${sprite.spriteType} sprite`} />
              <span>
                <strong>{sprite.spriteType}</strong>
                <small>{formatDate(sprite.createdAt)}</small>
              </span>
            </button>
            <button
              type="button"
              className={styles.deleteButton}
              aria-label={`Delete ${sprite.spriteType} sprite`}
              disabled={deletingId === sprite.id}
              onClick={() => setSpriteToDelete(sprite)}
            >
              <Trash2 aria-hidden="true" size={14} />
            </button>
          </div>
        ))}
      </div>
      {spriteToDelete ? (
        <AlertDialog
          title="Delete saved sprite?"
          description="This permanently removes the image from your library and releases its storage space. This cannot be undone."
          confirmLabel="Delete sprite"
          isConfirming={deletingId === spriteToDelete.id}
          onClose={() => setSpriteToDelete(null)}
          onConfirm={() => void handleDelete()}
        />
      ) : null}
    </aside>
  );
};

export default SpriteHistorySidebar;
