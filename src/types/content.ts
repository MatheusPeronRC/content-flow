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
};

export type ContentItem = {
  id: string;

  // Mantido para compatibilidade com conteúdos já salvos.
  inspirationId?: string;

  // Snapshot da referência no momento em que o conteúdo é criado.
  // Assim o link continua disponível mesmo se a inspiração for apagada depois.
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
