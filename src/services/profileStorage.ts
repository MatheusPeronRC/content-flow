import { supabase } from "../lib/supabase";
import { CreatorProfile } from "../types/creatorProfile";

type ProfileRow = {
  id: string;
  full_name: string | null;
  profession: string;
  objective: CreatorProfile["objective"];
  posts_per_week: number;
  formats: CreatorProfile["formats"];
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

let cachedProfile: CreatorProfile | null = null;
let cachedUserId: string | null = null;


async function getAuthenticatedUserId(): Promise<string | null> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Erro ao recuperar sessão:", error);
    return null;
  }

  return session?.user?.id ?? null;
}

function mapProfileRow(row: ProfileRow): CreatorProfile {
  return {
    fullName: row.full_name ?? "",
    profession: row.profession,
    objective: row.objective,
    postsPerWeek: row.posts_per_week,
    formats: row.formats ?? [],
    avatarUri: row.avatar_url,
    onboardingCompleted: row.onboarding_completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPersistableAvatarUrl(avatarUri?: string | null): string | null {
  if (!avatarUri) {
    return null;
  }

  if (avatarUri.startsWith("https://") || avatarUri.startsWith("http://")) {
    return avatarUri;
  }

  return null;
}

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      cachedProfile = null;
      cachedUserId = null;
      return null;
    }

    if (cachedUserId === userId && cachedProfile) {
      return cachedProfile;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, full_name, profession, objective, posts_per_week, formats, avatar_url, onboarding_completed, created_at, updated_at",
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      cachedProfile = null;
      cachedUserId = userId;
      return null;
    }

    const row: ProfileRow = {
      id: data.id,
      full_name: data.full_name,
      profession: data.profession,
      objective: data.objective as CreatorProfile["objective"],
      posts_per_week: data.posts_per_week,
      formats: (data.formats ?? []) as CreatorProfile["formats"],
      avatar_url: data.avatar_url,
      onboarding_completed: data.onboarding_completed,
      created_at: data.created_at,
      updated_at: data.updated_at,
    };

    const profile = mapProfileRow(row);

    cachedUserId = userId;
    cachedProfile = profile;

    return profile;
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);
    return null;
  }
}

export async function saveCreatorProfile(
  profile: CreatorProfile,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    throw new Error("Usuário não autenticado.");
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      full_name: profile.fullName?.trim() || null,
      profession: profile.profession.trim(),
      objective: profile.objective,
      posts_per_week: profile.postsPerWeek,
      formats: profile.formats,
      avatar_url: getPersistableAvatarUrl(profile.avatarUri),
      onboarding_completed: profile.onboardingCompleted,
      created_at: profile.createdAt || now,
      updated_at: now,
    },
    {
      onConflict: "id",
    },
  );

  if (error) {
    throw error;
  }

  cachedUserId = userId;
  cachedProfile = {
    ...profile,
    avatarUri: getPersistableAvatarUrl(profile.avatarUri),
  };
}

export async function updateCreatorProfile(
  updates: Partial<CreatorProfile>,
): Promise<void> {
  const current = await getCreatorProfile();

  if (!current) {
    return;
  }

  const updatedProfile: CreatorProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  await saveCreatorProfile(updatedProfile);
}

export async function hasCompletedOnboarding(): Promise<boolean> {
  const userId = await getAuthenticatedUserId();

  if (!userId) {
    return false;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Erro ao verificar onboarding:", error);
    return false;
  }

  return data?.onboarding_completed === true;
}

// Mantido para compatibilidade com o código atual.
// A exclusão do perfil remoto não faz parte deste helper.
export async function resetCreatorProfile(): Promise<void> {
  console.warn(
    "resetCreatorProfile não remove o perfil remoto do Supabase nesta versão.",
  );
}
