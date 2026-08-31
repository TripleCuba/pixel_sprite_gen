'use client';

import Button from '../Components/shared/Button';
import IconButton from '../Components/shared/IconButton';
import Typography from '../Components/shared/Typography';

/* eslint-disable @next/next/no-img-element */

import { ChevronDown, ChevronRight, Download, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { iconSizeTokens } from '../Components/shared/tokens';
import type { StoredSprite } from '@/lib/sprite-storage';
import { groupStoredSpritesByType } from '@/lib/sprite-groups';
import { AlertDialog } from '../Components/alert-dialog';
import { AssetNameDialog } from '../Components/asset-name-dialog';
import { LoadingIndicator } from '../Components/loading-indicator';
import styles from './AssetLibrary.module.css';

const PAGE_SIZE = 48;

type SpritePageResponse = {
  error?: string;
  hasMore?: boolean;
  sprites?: StoredSprite[];
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

const fetchSpritePage = async (offset: number, signal?: AbortSignal) => {
  const response = await fetch(`/api/sprites?offset=${offset}&limit=${PAGE_SIZE}`, { signal });
  const payload = (await response.json()) as SpritePageResponse;

  if (!response.ok) {
    throw new Error(payload.error ?? 'Could not load saved sprites.');
  }

  return {
    hasMore: Boolean(payload.hasMore),
    sprites: payload.sprites ?? [],
  };
};

type GroupSelectionControlProps = {
  disabled: boolean;
  selectedCount: number;
  spriteType: string;
  totalCount: number;
  onChange: (isSelected: boolean) => void;
};

const GroupSelectionControl = ({
  disabled,
  selectedCount,
  spriteType,
  totalCount,
  onChange,
}: GroupSelectionControlProps) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isPartiallySelected = selectedCount > 0 && selectedCount < totalCount;

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isPartiallySelected;
    }
  }, [isPartiallySelected]);

  return (
    <Typography variant="label" className={styles.groupSelectionControl}>
      <input
        ref={checkboxRef}
        type="checkbox"
        aria-label={`Select all ${spriteType} assets`}
        aria-checked={isPartiallySelected ? 'mixed' : selectedCount === totalCount}
        checked={selectedCount === totalCount}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      Select all
    </Typography>
  );
};

const AssetLibrary = () => {
  const [sprites, setSprites] = useState<StoredSprite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [spriteToRename, setSpriteToRename] = useState<StoredSprite | null>(null);
  const [selectedSpriteIds, setSelectedSpriteIds] = useState<Set<string>>(new Set());
  const [collapsedSpriteTypes, setCollapsedSpriteTypes] = useState<Set<string>>(new Set());
  const spriteGroups = useMemo(() => groupStoredSpritesByType(sprites), [sprites]);

  const loadMoreSprites = async () => {
    setError(null);
    setIsLoadingMore(true);

    try {
      const page = await fetchSpritePage(sprites.length);
      setSprites((currentSprites) => [...currentSprites, ...page.sprites]);
      setHasMore(page.hasMore);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load saved sprites.');
    } finally {
      setIsLoadingMore(false);
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

  const toggleGroupSelection = (groupSprites: StoredSprite[], isSelected: boolean) => {
    setSelectedSpriteIds((currentSelection) => {
      const nextSelection = new Set(currentSelection);

      groupSprites.forEach(({ id }) => {
        if (isSelected) {
          nextSelection.add(id);
        } else {
          nextSelection.delete(id);
        }
      });

      return nextSelection;
    });
  };

  const toggleGroupCollapse = (spriteType: string) => {
    setCollapsedSpriteTypes((currentCollapsedTypes) => {
      const nextCollapsedTypes = new Set(currentCollapsedTypes);

      if (nextCollapsedTypes.has(spriteType)) {
        nextCollapsedTypes.delete(spriteType);
      } else {
        nextCollapsedTypes.add(spriteType);
      }

      return nextCollapsedTypes;
    });
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
      setSelectedSpriteIds(new Set(payload.failedSpriteIds ?? []));
      setIsBulkDeleteDialogOpen(false);

      if (payload.failedSpriteIds?.length) {
        setError(
          `${payload.failedSpriteIds.length} selected asset${payload.failedSpriteIds.length === 1 ? ' could' : 's could'} not be deleted.`,
        );
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the selected sprites.');
    } finally {
      setIsBulkDeleting(false);
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
          setSelectedSpriteIds(new Set());
        }
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Could not load saved sprites.');
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
          <Typography variant="p" color="accent" lineHeight={1.5} margin="0 0 6px" size="small">
            Asset library
          </Typography>
          <Typography variant="h1" id="assets-heading">
            All created assets
          </Typography>
          <Typography variant="p" color="primary-light" lineHeight={1.5} margin="9px 0 0" size="small">
            Browse every sprite you have generated.
          </Typography>
        </div>
        <Link className={styles.backLink} href="/generator">
          Back to generator
        </Link>
      </header>

      {sprites.length ? (
        <div className={styles.selectionToolbar}>
          <Typography variant="label" className={styles.selectAllControl}>
            <input
              type="checkbox"
              aria-label="Select all loaded assets"
              checked={selectedSpriteIds.size === sprites.length}
              disabled={isBulkDeleting || isBulkDownloading}
              onChange={toggleSelectAll}
            />
            Select all loaded
          </Typography>
          {selectedSpriteIds.size ? (
            <div className={styles.bulkActions}>
              <Typography variant="span">{selectedSpriteIds.size} selected</Typography>
              <Button
                disabled={isBulkDeleting || isBulkDownloading}
                icon={<Download size={iconSizeTokens.small} />}
                label={isBulkDownloading ? 'Downloading...' : 'Download'}
                onPress={() => void handleBulkDownload()}
                size="small"
              />
              <Button
                disabled={isBulkDeleting || isBulkDownloading}
                icon={<Trash2 size={iconSizeTokens.small} />}
                label="Delete"
                onPress={() => setIsBulkDeleteDialogOpen(true)}
                size="small"
                variant="danger"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {isLoading ? <LoadingIndicator label="Loading assets..." /> : null}
      {error ? (
        <Typography variant="p" color="danger" margin={0} size="small">
          {error}
        </Typography>
      ) : null}
      {!isLoading && !error && sprites.length === 0 ? (
        <Typography variant="p" color="primary-light" lineHeight={1.5} margin={0} size="small">
          Your generated assets will appear here.
        </Typography>
      ) : null}
      <div className={styles.groups}>
        {spriteGroups.map(({ spriteType, sprites: groupedSprites }, groupIndex) => (
          <section key={spriteType} className={styles.group}>
            <div className={styles.groupHeader}>
              <Typography variant="h2" id={`asset-group-${groupIndex}`}>
                {spriteType}
              </Typography>
              <div className={styles.groupControls}>
                <GroupSelectionControl
                  disabled={isBulkDeleting || isBulkDownloading}
                  selectedCount={groupedSprites.filter(({ id }) => selectedSpriteIds.has(id)).length}
                  spriteType={spriteType}
                  totalCount={groupedSprites.length}
                  onChange={(isSelected) => toggleGroupSelection(groupedSprites, isSelected)}
                />
                <Typography variant="span" className={styles.groupCount}>
                  {groupedSprites.length}
                </Typography>
                <IconButton
                  aria-controls={`asset-group-content-${groupIndex}`}
                  aria-expanded={!collapsedSpriteTypes.has(spriteType)}
                  aria-label={`${collapsedSpriteTypes.has(spriteType) ? 'Expand' : 'Collapse'} ${spriteType} assets`}
                  icon={collapsedSpriteTypes.has(spriteType) ? <ChevronRight size={iconSizeTokens.small} /> : <ChevronDown size={iconSizeTokens.small} />}
                  label={collapsedSpriteTypes.has(spriteType) ? 'Expand' : 'Collapse'}
                  onPress={() => toggleGroupCollapse(spriteType)}
                  variant="unstyled"
                />
              </div>
            </div>
            {!collapsedSpriteTypes.has(spriteType) ? (
              <div
                id={`asset-group-content-${groupIndex}`}
                className={styles.grid}
                aria-labelledby={`asset-group-${groupIndex}`}
              >
                {groupedSprites.map((sprite) => (
                  <article key={sprite.id} className={styles.asset}>
                    <Typography variant="label" className={styles.selectionControl}>
                      <input
                        type="checkbox"
                        aria-label={`Select ${sprite.title ?? sprite.spriteType} sprite`}
                        checked={selectedSpriteIds.has(sprite.id)}
                        disabled={isBulkDeleting || isBulkDownloading}
                        onChange={(event) => toggleSpriteSelection(sprite.id, event.target.checked)}
                      />
                    </Typography>
                    <img src={sprite.imageUrl} alt={`${sprite.title ?? sprite.spriteType} sprite`} />
                    <div className={styles.assetDetails}>
                      <Typography variant="h3">{sprite.title ?? sprite.spriteType}</Typography>
                      <Typography variant="p" color="accent" margin="-4px 0 0" size="xs" transform="uppercase">
                        Sprite type: {sprite.spriteType}
                      </Typography>
                      <div className={styles.assetMeta}>
                        <Typography variant="p">{formatDate(sprite.createdAt)}</Typography>
                        <div className={styles.assetActions}>
                          <IconButton
                            aria-label={`Rename ${sprite.title ?? sprite.spriteType} sprite`}
                            disabled={renamingId === sprite.id}
                            icon={<Pencil size={iconSizeTokens.small} />}
                            onPress={() => setSpriteToRename(sprite)}
                            title={`Rename ${sprite.title ?? sprite.spriteType}`}
                            variant="unstyled"
                          />
                          <Button
                            aria-label={`Download ${sprite.title ?? sprite.spriteType} sprite`}
                            href={`/api/sprites/${sprite.id}/download`}
                            download={`${sprite.title ?? sprite.spriteType}.png`}
                            icon={<Download size={iconSizeTokens.small} />}
                            label=""
                            title={`Download ${sprite.title ?? sprite.spriteType}`}
                            variant="unstyled"
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ))}
      </div>
      {hasMore ? (
        <Button
          disabled={isLoadingMore}
          label={isLoadingMore ? 'Loading...' : 'Load more assets'}
          onPress={() => void loadMoreSprites()}
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
      {isBulkDeleteDialogOpen ? (
        <AlertDialog
          title={`Delete ${selectedSpriteIds.size} selected asset${selectedSpriteIds.size === 1 ? '' : 's'}?`}
          description="This permanently removes the selected images from your library and releases their storage space. This cannot be undone."
          confirmLabel={`Delete ${selectedSpriteIds.size} asset${selectedSpriteIds.size === 1 ? '' : 's'}`}
          isConfirming={isBulkDeleting}
          onClose={() => setIsBulkDeleteDialogOpen(false)}
          onConfirm={() => void handleBulkDelete()}
        />
      ) : null}
    </section>
  );
};

export default AssetLibrary;
