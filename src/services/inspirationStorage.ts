import AsyncStorage from "@react-native-async-storage/async-storage";

import { Inspiration } from "../types/inspiration";

const STORAGE_KEY = "@contentflow:inspirations";

export async function getInspirations(): Promise<Inspiration[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

export async function saveInspiration(
  inspiration: Inspiration
): Promise<void> {
  const inspirations = await getInspirations();

  const updatedInspirations = [
    inspiration,
    ...inspirations,
  ];

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedInspirations)
  );
}