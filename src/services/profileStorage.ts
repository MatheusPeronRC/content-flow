import AsyncStorage from "@react-native-async-storage/async-storage";

import { CreatorProfile } from "../types/creatorProfile";

const STORAGE_KEY = "@contentflow:creator-profile";

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as CreatorProfile;
  } catch (error) {
    console.error("Erro ao carregar perfil:", error);

    return null;
  }
}

export async function saveCreatorProfile(
  profile: CreatorProfile,
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
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
  const profile = await getCreatorProfile();

  return profile?.onboardingCompleted === true;
}

// Útil apenas durante o desenvolvimento.
// Não vamos colocar isso na interface agora.
export async function resetCreatorProfile(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
