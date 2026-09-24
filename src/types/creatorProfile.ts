export type CreatorObjective =
  | "clientes"
  | "autoridade"
  | "audiencia"
  | "vendas";

export type ContentFormat = "Reel" | "Carrossel" | "Story" | "Foto";

export type CreatorProfile = {
  fullName?: string;
  profession: string;
  objective: CreatorObjective;
  postsPerWeek: number;
  formats: ContentFormat[];
  avatarUri?: string | null;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
};
