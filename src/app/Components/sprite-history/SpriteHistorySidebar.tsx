'use client';

import Typography from '../shared/Typography';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { StoredSprite } from '@/lib/sprite-storage';
import { groupStoredSpritesByType } from '@/lib/sprite-groups';
import { AlertDialog } from '../alert-dialog';
import { AssetNameDialog } from '../asset-name-dialog';
import { LoadingIndicator } from '../loading-indicator';
import styles from './SpriteHistorySidebar.module.css';

type SpriteHistorySidebarProps = {
  isCollapsed: boolean;
  onDelete: (sprite: StoredSprite) => void;
  onCollapsedChange: (isCollapsed: boolean) => void;
  onSelect: (sprite: StoredSprite) => void;
  refreshKey: number;
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [selectedSpriteIds, setSelectedSpriteIds] = useState<Set<string>>(new Set());
  const [spriteToDelete, setSpriteToDelete] = useState<StoredSprite | null>(null);
  const [spriteToRename, setSpriteToRename] = useState<StoredSprite | null>(null);
  const spriteGroups = useMemo(() => groupStoredSpritesByType(sprites), [sprites]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSprites = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/sprites?limit=10', {
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          error?: string;
          sprites?: StoredSprite[];
          total?: number;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? 'Could not load saved sprites.');
        }

        setSprites(payload.sprites ?? []);
        setTotalSprites(payload.total ?? payload.sprites?.length ?? 0);
        setSelectedSpriteIds(
          (currentSelection) =>
            new Set([...currentSelection].filter((id) => (payload.sprites ?? []).some((sprite) => sprite.id === id))),
        );
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : 'Could not load saved sprites.');
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
      const response = await fetch('/api/sprites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spriteId: sprite.id }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Could not delete the saved sprite.');
      }

      setSprites((currentSprites) => currentSprites.filter(({ id }) => id !== sprite.id));
      setTotalSprites((currentTotal) => Math.max(currentTotal - 1, 0));
      setSelectedSpriteIds((currentSelection) => {
        const nextSelection = new Set(currentSelection);
        nextSelection.delete(sprite.id);
        return nextSelection;
      });
      onDelete(sprite);
      setSpriteToDelete(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the saved sprite.');
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
    setSelectedSpriteIds(selectedSpriteIds.size === sprites.length ? new Set() : new Set(sprites.map(({ id }) => id)));
  };

  const handleBulkDelete = async () => {
    const selectedSprites = sprites.filter(({ id }) => selectedSpriteIds.has(id));

    if (selectedSprites.length === 0 || isBulkDeleting) {
      return;
    }

    setIsBulkDeleting(true);
    setError(null);

    try {
      const response = await fetch('/api/sprites', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spriteIds: selectedSprites.map(({ id }) => id),
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        deletedSpriteIds?: string[];
        error?: string;
        failedSpriteIds?: string[];
      } | null;

      if (!response.ok || !payload?.deletedSpriteIds) {
        throw new Error(payload?.error ?? 'Could not delete the selected sprites.');
      }

      const deletedSpriteIds = new Set(payload.deletedSpriteIds);
      setSprites((currentSprites) => currentSprites.filter(({ id }) => !deletedSpriteIds.has(id)));
      setTotalSprites((currentTotal) => Math.max(currentTotal - deletedSpriteIds.size, 0));
      selectedSprites.filter(({ id }) => deletedSpriteIds.has(id)).forEach(onDelete);
      setSelectedSpriteIds(new Set(payload.failedSpriteIds ?? []));
      setIsBulkDeleteDialogOpen(false);

      if (payload.failedSpriteIds?.length) {
        setError(
          `${payload.failedSpriteIds.length} selected sprite${payload.failedSpriteIds.length === 1 ? ' could' : 's could'} not be deleted.`,
        );
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the selected sprites.');
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
      const response = await fetch('/api/sprites/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spriteIds: selectedSprites.map(({ id }) => id),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error ?? 'Could not download the selected sprites.');
      }

      const objectUrl = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = 'sprites.zip';
      link.hidden = true;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Could not download the selected sprites.');
    } finally {
      setIsBulkDownloading(false);
    }
  };

  const handleRename = async (sprite: StoredSprite, title: string) => {
    setRenamingId(sprite.id);
    setError(null);

    try {
      const response = await fetch('/api/sprites', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spriteId: sprite.id, title }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        sprite?: { title: string | null };
      } | null;

      if (!response.ok || !payload?.sprite) {
        throw new Error(payload?.error ?? 'Could not rename the saved sprite.');
      }

      setSprites((currentSprites) =>
        currentSprites.map((currentSprite) =>
          currentSprite.id === sprite.id ? { ...currentSprite, title: payload.sprite!.title } : currentSprite,
        ),
      );
      setSpriteToRename(null);
    } catch (renameError) {
      setError(renameError instanceof Error ? renameError.message : 'Could not rename the saved sprite.');
    } finally {
      setRenamingId(null);
    }
  };

  const selectedCount = selectedSpriteIds.size;

  if (isCollapsed) {
    return (
      <aside className={`${styles.sidebar} ${styles.sidebarCollapsed}`} aria-label="Created sprites">
        <button
          type="button"
          className={styles.collapseButton}
          aria-label="Expand created sprites sidebar"
          onClick={() => onCollapsedChange(false)}
          title="Expand created sprites"
        >
          <ChevronRight aria-hidden="true" size={18} />
        </button>
      </aside>
    );
  }

  return (
    <aside className={styles.sidebar} aria-label="Created sprites">
      <div className={styles.header}>
        <Typography variant="h2">Created</Typography>
        <button
          type="button"
          className={styles.collapseButton}
          aria-label="Collapse created sprites sidebar"
          onClick={() => onCollapsedChange(true)}
          title="Collapse created sprites"
        >
          <ChevronLeft aria-hidden="true" size={16} />
        </button>
      </div>
      <div className={styles.subheader}>
        <div className={styles.headerActions}>
          {sprites.length ? (
            <Typography variant="label" className={styles.selectAllControl}>
              <input
                type="checkbox"
                aria-label="Select all created sprites"
                checked={selectedCount === sprites.length}
                disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
                onChange={toggleSelectAll}
              />
            </Typography>
          ) : (
            <Typography variant="span" aria-hidden="true" className={styles.selectAllPlaceholder} />
          )}
          <Typography variant="p" className={styles.showing}>
            Showing {sprites.length} of {totalSprites}
          </Typography>
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
              {isBulkDownloading ? 'Downloading...' : `Download ${selectedCount}`}
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
        {error ? (
          <Typography variant="p" color="danger" lineHeight={1.5} margin={0} size="small">
            {error}
          </Typography>
        ) : null}
        {!isLoading && !error && sprites.length === 0 ? (
          <Typography variant="p" color="primary-light" lineHeight={1.5} margin={0} size="small">
            Your saved sprites will appear here.
          </Typography>
        ) : null}
        <div className={styles.groups}>
          {spriteGroups.map(({ spriteType, sprites: groupedSprites }, groupIndex) => (
            <section key={spriteType} className={styles.group} aria-labelledby={`sidebar-group-${groupIndex}`}>
              <div className={styles.groupHeader}>
                <Typography variant="h3" id={`sidebar-group-${groupIndex}`}>
                  {spriteType}
                </Typography>
                <Typography variant="span">{groupedSprites.length}</Typography>
              </div>
              <div className={styles.list}>
                {groupedSprites.map((sprite) => (
                  <div key={sprite.id} className={styles.sprite}>
                    <button
                      type="button"
                      className={styles.spriteOpen}
                      aria-label={`Open ${sprite.title ?? sprite.spriteType} sprite`}
                      onClick={() => onSelect(sprite)}
                    />
                    <div className={styles.selectionControl}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${sprite.spriteType} sprite`}
                        checked={selectedSpriteIds.has(sprite.id)}
                        disabled={Boolean(deletingId) || isBulkDeleting || isBulkDownloading}
                        onChange={(event) => toggleSpriteSelection(sprite.id, event.target.checked)}
                      />
                    </div>
                    <div className={styles.spriteContent}>
                      <button type="button" className={styles.spritePreview} onClick={() => onSelect(sprite)}>
                        <img src={sprite.imageUrl} alt={`${sprite.title ?? sprite.spriteType} sprite`} />
                      </button>
                      <div className={styles.spriteDetails}>
                        <button type="button" className={styles.spriteSelect} onClick={() => onSelect(sprite)}>
                          <Typography variant="strong">{sprite.title ?? sprite.spriteType}</Typography>
                        </button>
                        <Typography variant="p" className={styles.spriteType}>
                          Sprite type: {sprite.spriteType}
                        </Typography>
                        <div className={styles.spriteMeta}>
                          <Typography variant="small">{formatDate(sprite.createdAt)}</Typography>
                          <div className={styles.spriteActions}>
                            <a
                              className={styles.downloadButton}
                              href={`/api/sprites/${sprite.id}/download`}
                              aria-label={`Download ${sprite.title ?? sprite.spriteType} sprite`}
                              title={`Download ${sprite.title ?? sprite.spriteType}`}
                              download={`${sprite.title ?? sprite.spriteType}.png`}
                            >
                              <Download aria-hidden="true" size={14} />
                            </a>
                            <button
                              type="button"
                              className={styles.renameButton}
                              aria-label={`Rename ${sprite.title ?? sprite.spriteType} sprite`}
                              disabled={
                                Boolean(deletingId) || isBulkDeleting || isBulkDownloading || renamingId === sprite.id
                              }
                              onClick={() => setSpriteToRename(sprite)}
                              title={`Rename ${sprite.title ?? sprite.spriteType}`}
                            >
                              <Pencil aria-hidden="true" size={13} />
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
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
          title={`Delete ${selectedCount} saved sprite${selectedCount === 1 ? '' : 's'}?`}
          description="This permanently removes the selected images from your library and releases their storage space. This cannot be undone."
          confirmLabel={`Delete ${selectedCount} sprite${selectedCount === 1 ? '' : 's'}`}
          isConfirming={isBulkDeleting}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          onConfirm={() => void handleBulkDelete()}
        />
      ) : null}
      {spriteToRename ? (
        <AssetNameDialog
          initialTitle={spriteToRename.title ?? ''}
          isSaving={renamingId === spriteToRename.id}
          spriteType={spriteToRename.spriteType}
          onClose={() => setSpriteToRename(null)}
          onSave={(title) => void handleRename(spriteToRename, title)}
        />
      ) : null}
    </aside>
  );
};

export default SpriteHistorySidebar;
