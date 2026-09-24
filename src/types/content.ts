import { ProductionEffort } from "./productionEffort";

export type ContentStatus =
  | "ideia"
  | "roteiro"
  | "gravar"
  | "editar"
  | "pronto"
  | "publicado";

export type ContentScript = {
  hook: string;
  points: string[];
  cta: string;
};

export type ContentReference = {
  inspirationId: string;
  url: string;
  source: string;
  category: string | null;
  note: string;
  productionEffort?: ProductionEffort | null;
  thumbnailUrl?: string | null;
  mediaTitle?: string | null;
  authorName?: string | null;
  metadataUpdatedAt?: string | null;
};

export type ContentItem = {
  id: string;
  inspirationId?: string;
  reference?: ContentReference;
  idea: string;
  format: string | null;
  objective: string | null;
  productionEffort?: ProductionEffort | null;
  status: ContentStatus;
  plannedDate?: string | null;
  script: ContentScript;
  createdAt: string;
  updatedAt: string;
};
