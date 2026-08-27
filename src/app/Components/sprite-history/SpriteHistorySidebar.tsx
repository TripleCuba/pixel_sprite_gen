"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Download, Trash2 } from "lucide-react";
import Link from "next/link";
import type { StoredSprite } from "@/lib/sprite-storage";
import { AlertDialog } from "../alert-dialog";
import { LoadingIndicator } from "../loading-indicator";
import styles from "./SpriteHistorySidebar.module.css";

type SpriteHistorySidebarProps = {
  isCollapsed: boolean;
  onDelete: (sprite: StoredSprite) => void;
  onCollapsedChange: (isCollapsed: boolean) => void;
  onSelect: (sprite: StoredSprite) => void;
  refreshKey: number;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
  }).format(new Date(value));

const SpriteHistorySidebar = ({
  isCollapsed,
  onDelete,
  onCollapsedChange,
  onSelect,
  refreshKey,
}: SpriteHistorySidebarProps) => {
  const [sprites, setSprites] = useState<StoredSprite[]>([]);
  const [totalSprites, setTotalSprites] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedSpriteIds, setSelectedSpriteIds] = useState<Set<string>>(
    new Set(),
  );
  const [spriteToDelete, setSpriteToDelete] = useState<StoredSprite | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadSprites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/sprites?limit=10", { signal: controller.signal });
        const payload = (await response.json()) as {
          error?: string;
          sprites?: StoredSprite[];
          total?: number;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Could not load saved sprites.");
        }

        setSprites(payload.sprites ?? []);
        setTotalSprites(payload.total ?? payload.sprites?.length ?? 0);
        setSelectedSpriteIds((currentSelection) =>
          new Set(
            [...currentSelection].filter((id) =>
              (payload.sprites ?? []).some((sprite) => sprite.id === id),
            ),
          ),
        );
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
      setTotalSprites((currentTotal) => Math.max(currentTotal - 1, 0));
      setSelectedSpriteIds((currentSelection) => {
        const nextSelection = new Set(currentSelection);
        nextSelection.delete(sprite.id);
        return nextSelection;
      });
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

  const toggleSpriteSelection = (spriteId: string, isSelected: boolean) => {
    setSelectedSpriteIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      if (isSelected) {
        nextSelection.add(spriteId);
      } else {
        nextSelection.delete(spriteId);
      }

      return nextSelection;
    });
  };

  const toggleSelectAll = () => {
    setSelectedSpriteIds(
      selectedSpriteIds.size === sprites.length
        ? new Set()
        : new Set(sprites.map(({ id }) => id)),
    );
  };

  const handleBulkDelete = async () => {
    const selectedSprites = sprites.filter(({ id }) => selectedSpriteIds.has(id));

    if (selectedSprites.length === 0 || isBulkDeleting) {
      return;
    }

    setIsBulkDeleting(true);
    setError(null);

    try {
      const response = await fetch("/api/sprites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spriteIds: selectedSprites.map(({ id }) => id) }),
      });
      const payload = (await response.json().catch(() => null)) as {
        deletedSpriteIds?: string[];
        error?: string;
        failedSpriteIds?: string[];
      } | null;

      if (!response.ok || !payload?.deletedSpriteIds) {
        throw new Error(payload?.error ?? "Could not delete the selected sprites.");
      }

      const deletedSpriteIds = new Set(payload.deletedSpriteIds);
      setSprites((currentSprites) =>
        currentSprites.filter(({ id }) => !deletedSpriteIds.has(id)),
      );
      setTotalSprites((currentTotal) => Math.max(currentTotal - deletedSpriteIds.size, 0));
      selectedSprites
        .filter(({ id }) => deletedSpriteIds.has(id))
        .forEach(onDelete);
      setSelectedSpriteIds(
        new Set(payload.failedSpriteIds ?? []),
      );
      setIsBulkDeleteDialogOpen(false);

      if (payload.failedSpriteIds?.length) {
        setError(
          `${payload.failedSpriteIds.length} selected sprite${payload.failedSpriteIds.length === 1 ? " could" : "s could"} not be deleted.`,
        );
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete the selected sprites.",
      );
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleBulkDownload = async () => {
    const selectedSprites = sprites.filter(({ id }) => selectedSpriteIds.has(id));

    if (selectedSprites.length === 0 || isBulkDownloading) {
      return;
    }

    setIsBulkDownloading(true);
    setError(null);

    try {
      const response = await fetch("/api/sprites/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spriteIds: selectedSprites.map(({ id }) => id) }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? "Could not download the selected sprites.");
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = "sprites.zip";
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (downloadError) {
      setError(
        downloadError instanceof Error
          ? downloadError.message
          : "Could not download the selected sprites.",
      );
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const selectedCount = selectedSpriteIds.size;

  if (isCollapsed) {
    return (
      <aside
        className={`${styles.sidebar} ${styles.sidebarCollapsed}`}
        aria-label="Created sprites"
      >
        <button
          type="button"
          className={styles.collapseButton}
          aria-label="Expand created sprites sidebar"
          title="Expand created sprites"
          onClick={() => onCollapsedChange(false)}
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar} aria-label="Created sprites">
      <div className={styles.header}>
        <h2>Created</h2>
        <button
          type="button"
          className={styles.collapseButton}
          aria-label="Collapse created sprites sidebar"
          title="Collapse created sprites"
          onClick={() => onCollapsedChange(true)}
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
      </div>
      <div className={styles.subheader}>
        <div className={styles.headerActions}>
          {sprites.length ? (
            <label className={styles.selectAllControl}>
              <input
                type="checkbox"
                aria-label="Select all created sprites"
                checked={selectedCount === sprites.length}
                disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
                onChange={toggleSelectAll}
              />
            </label>
          ) : (
            <span aria-hidden="true" className={styles.selectAllPlaceholder} />
          )}
          <p className={styles.showing}>Showing {sprites.length} of {totalSprites}</p>
        </div>
        {selectedCount ? (
          <div className={styles.bulkActions}>
            <button
              type="button"
              className={styles.bulkDownloadButton}
              disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
              onClick={() => void handleBulkDownload()}
            >
              <Download aria-hidden="true" size={14} />
              {isBulkDownloading ? "Downloading..." : `Download ${selectedCount}`}
            </button>
            <button
              type="button"
              className={styles.bulkDeleteButton}
              disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
              onClick={() => setIsBulkDeleteDialogOpen(true)}
            >
              <Trash2 aria-hidden="true" size={14} />
              Delete {selectedCount}
            </button>
          </div>
        ) : null}
      </div>
      <div className={styles.body}>
        {isLoading ? <LoadingIndicator compact label="Loading sprites..." /> : null}
        {error ? <p className={styles.error}>{error}</p> : null}
        {!isLoading && !error && sprites.length === 0 ? (
          <p className={styles.status}>Your saved sprites will appear here.</p>
        ) : null}
        <div className={styles.list}>
          {sprites.map((sprite) => (
            <div key={sprite.id} className={styles.sprite}>
              <label className={styles.selectionControl}>
                <input
                  type="checkbox"
                  aria-label={`Select ${sprite.spriteType} sprite`}
                  checked={selectedSpriteIds.has(sprite.id)}
                  disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
                  onChange={(event) =>
                    toggleSpriteSelection(sprite.id, event.target.checked)
                  }
                />
              </label>
              <button
                type="button"
                className={styles.spriteSelect}
                onClick={() => onSelect(sprite)}
              >
                <img
                  src={sprite.imageUrl}
                  alt={`${sprite.title ?? sprite.spriteType} sprite`}
                />
                <span>
                  <strong>{sprite.title ?? sprite.spriteType}</strong>
                  <small>
                    {sprite.title
                      ? `${sprite.spriteType} · ${formatDate(sprite.createdAt)}`
                      : formatDate(sprite.createdAt)}
                  </small>
                </span>
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                aria-label={`Delete ${sprite.spriteType} sprite`}
                disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
                onClick={() => setSpriteToDelete(sprite)}
              >
                <Trash2 aria-hidden="true" size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.footer}>
        <Link className={styles.viewAllLink} href="/assets">
          View all
        </Link>
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
      {isBulkDeleteDialogOpen ? (
        <AlertDialog
          title={`Delete ${selectedCount} saved sprite${selectedCount === 1 ? "" : "s"}?`}
          description="This permanently removes the selected images from your library and releases their storage space. This cannot be undone."
          confirmLabel={`Delete ${selectedCount} sprite${selectedCount === 1 ? "" : "s"}`}
          isConfirming={isBulkDeleting}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          onConfirm={() => void handleBulkDelete()}
        />
      ) : null}
    </aside>
  );
};

export default SpriteHistorySidebar;
