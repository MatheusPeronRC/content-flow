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

export type ContentItem = {
  id: string;

  inspirationId?: string;

  idea: string;

  format: string | null;
  objective: string | null;

  status: ContentStatus;
  plannedDate?: string | null;
  script: ContentScript;

  createdAt: string;
  updatedAt: string;
};