export type Inspiration = {
  id: string;
  url: string;
  source: string;
  category: string | null;
  note: string;

  // Metadados visuais da referência.
  // São opcionais para manter compatibilidade com inspirações já salvas.
  thumbnailUrl?: string | null;
  mediaTitle?: string | null;
  authorName?: string | null;
  metadataUpdatedAt?: string | null;

  createdAt: string;
};
