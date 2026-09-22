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

  // Snapshot visual da inspiração.
  // Opcional para manter compatibilidade com conteúdos antigos.
  thumbnailUrl?: string | null;
  mediaTitle?: string | null;
  authorName?: string | null;
  metadataUpdatedAt?: string | null;
};

export type ContentItem = {
  id: string;

  // Mantido para compatibilidade com conteúdos já salvos.
  inspirationId?: string;

  // Snapshot da referência no momento em que o conteúdo é criado.
  // Assim a referência continua disponível mesmo se a inspiração for apagada.
  reference?: ContentReference;

  idea: string;
  format: string | null;
  objective: string | null;
  status: ContentStatus;
  plannedDate?: string | null;
  script: ContentScript;
  createdAt: string;
  updatedAt: string;
};
