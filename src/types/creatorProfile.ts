export type CreatorObjective =
  | "clientes"
  | "autoridade"
  | "audiencia"
  | "vendas";

export type ContentFormat =
  | "Reel"
  | "Carrossel"
  | "Story"
  | "Foto";

export type CreatorProfile = {
  profession: string;

  objective: CreatorObjective;

  postsPerWeek: number;

  formats: ContentFormat[];

  onboardingCompleted: boolean;

  createdAt: string;
  updatedAt: string;
};