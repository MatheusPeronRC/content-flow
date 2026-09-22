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

export async function getInspirationById(
  id: string
): Promise<Inspiration | null> {
  const inspirations = await getInspirations();

  return (
    inspirations.find(
      (inspiration) => inspiration.id === id
    ) ?? null
  );
}
export async function updateInspiration(
  id: string,
  updates: Partial<Inspiration>
): Promise<void> {
  const inspirations = await getInspirations();

  const updatedInspirations = inspirations.map(
    (inspiration) =>
      inspiration.id === id
        ? {
            ...inspiration,
            ...updates,
          }
        : inspiration
  );

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedInspirations)
  );
}

export async function deleteInspiration(
  id: string
): Promise<void> {
  const inspirations = await getInspirations();

  const updatedInspirations =
    inspirations.filter(
      (inspiration) =>
        inspiration.id !== id
    );

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedInspirations)
  );
}