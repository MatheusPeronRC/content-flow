import { ProductionEffort } from "./productionEffort";

export type Inspiration = {
  id: string;
  url: string;
  source: string;
  category: string | null;
  note: string;
  productionEffort?: ProductionEffort | null;
  thumbnailUrl?: string | null;
  mediaTitle?: string | null;
  authorName?: string | null;
  metadataUpdatedAt?: string | null;
  createdAt: string;
};
