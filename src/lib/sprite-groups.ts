import { SpriteType } from '@/app/constants';
import type { StoredSprite } from './sprite-storage';

export type SpriteGroup = {
  sprites: StoredSprite[];
  spriteType: string;
};

const spriteTypeOrder = Object.values(SpriteType);

export const groupStoredSpritesByType = (sprites: StoredSprite[]): SpriteGroup[] => {
  const spritesByType = new Map<string, StoredSprite[]>();

  sprites.forEach((sprite) => {
    const group = spritesByType.get(sprite.spriteType);

    if (group) {
      group.push(sprite);
      return;
    }

    spritesByType.set(sprite.spriteType, [sprite]);
  });

  return [...spritesByType]
    .sort(([firstType], [secondType]) => {
      const firstIndex = spriteTypeOrder.indexOf(firstType as SpriteType);
      const secondIndex = spriteTypeOrder.indexOf(secondType as SpriteType);
      const firstOrder = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
      const secondOrder = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;

      return firstOrder - secondOrder || firstType.localeCompare(secondType);
    })
    .map(([spriteType, groupedSprites]) => ({
      spriteType,
      sprites: groupedSprites,
    }));
};
