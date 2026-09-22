import AsyncStorage from "@react-native-async-storage/async-storage";

import { CreatorProfile } from "../types/creatorProfile";

const STORAGE_KEY = "@contentflow:creator-profile";

export async function getCreatorProfile(): Promise<CreatorProfile | null> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) {
    return null;
  }

  return JSON.parse(data);
}

export async function saveCreatorProfile(
  profile: CreatorProfile
): Promise<void> {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(profile)
  );
}

export async function updateCreatorProfile(
  updates: Partial<CreatorProfile>
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