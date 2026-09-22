import AsyncStorage from "@react-native-async-storage/async-storage";

import { ContentItem } from "../types/content";

const STORAGE_KEY = "@contentflow:contents";

export async function getContents(): Promise<ContentItem[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);

  if (!data) {
    return [];
  }

  return JSON.parse(data);
}

export async function getContentById(
  id: string
): Promise<ContentItem | null> {
  const contents = await getContents();

  return (
    contents.find(
      (content) => content.id === id
    ) ?? null
  );
}

export async function saveContent(
  content: ContentItem
): Promise<void> {
  const contents = await getContents();

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      content,
      ...contents,
    ])
  );
}

export async function updateContent(
  id: string,
  updates: Partial<ContentItem>
): Promise<void> {
  const contents = await getContents();

  const updatedContents = contents.map((content) => {
    if (content.id !== id) {
      return content;
    }

    return {
      ...content,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
  });

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedContents)
  );
}