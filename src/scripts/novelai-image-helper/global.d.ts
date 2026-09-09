import type { ImageBlock } from './domain/block';

declare global {
  const NovelAIImageHelper: {
    analyzeMessage(messageId: number, generate?: boolean): Promise<ImageBlock[]>;
    generateBlock(messageId: number, blockId: string): boolean;
    getBlock(messageId: number, blockId: string): ImageBlock | undefined;
  };
}

export {};
