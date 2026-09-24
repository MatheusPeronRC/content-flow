import { supabase } from "../lib/supabase";
import { Inspiration } from "../types/inspiration";
import { ProductionEffort } from "../types/productionEffort";

type InspirationRow = {
  id: string;
  user_id: string;
  url: string;
  source: string;
  category: string | null;
  note: string;
  production_effort: ProductionEffort | null;
  thumbnail_url: string | null;
  media_title: string | null;
  author_name: string | null;
  metadata_updated_at: string | null;
  created_at: string;
};

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  return user.id;
}

function mapRowToInspiration(row: InspirationRow): Inspiration {
  return {
    id: row.id,
    url: row.url,
    source: row.source,
    category: row.category,
    note: row.note,
    productionEffort: row.production_effort,
    thumbnailUrl: row.thumbnail_url,
    mediaTitle: row.media_title,
    authorName: row.author_name,
    metadataUpdatedAt: row.metadata_updated_at,
    createdAt: row.created_at,
  };
}

export async function getInspirations(): Promise<Inspiration[]> {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("inspirations")
      .select(
        "id, user_id, url, source, category, note, production_effort, thumbnail_url, media_title, author_name, metadata_updated_at, created_at",
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) =>
      mapRowToInspiration({
        id: row.id,
        user_id: row.user_id,
        url: row.url,
        source: row.source,
        category: row.category,
        note: row.note,
        production_effort: row.production_effort as ProductionEffort | null,
        thumbnail_url: row.thumbnail_url,
        media_title: row.media_title,
        author_name: row.author_name,
        metadata_updated_at: row.metadata_updated_at,
        created_at: row.created_at,
      }),
    );
  } catch (error) {
    console.error("Erro ao carregar inspirações:", error);
    return [];
  }
}

export async function saveInspiration(
  inspiration: Inspiration,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("inspirations").insert({
    id: inspiration.id,
    user_id: userId,
    url: inspiration.url,
    source: inspiration.source,
    category: inspiration.category,
    note: inspiration.note,
    production_effort: inspiration.productionEffort ?? null,
    thumbnail_url: inspiration.thumbnailUrl ?? null,
    media_title: inspiration.mediaTitle ?? null,
    author_name: inspiration.authorName ?? null,
    metadata_updated_at: inspiration.metadataUpdatedAt ?? null,
    created_at: inspiration.createdAt,
  });

  if (error) {
    throw error;
  }
}

export async function getInspirationById(
  id: string,
): Promise<Inspiration | null> {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("inspirations")
      .select(
        "id, user_id, url, source, category, note, production_effort, thumbnail_url, media_title, author_name, metadata_updated_at, created_at",
      )
      .eq("user_id", userId)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    return mapRowToInspiration({
      id: data.id,
      user_id: data.user_id,
      url: data.url,
      source: data.source,
      category: data.category,
      note: data.note,
      production_effort: data.production_effort as ProductionEffort | null,
      thumbnail_url: data.thumbnail_url,
      media_title: data.media_title,
      author_name: data.author_name,
      metadata_updated_at: data.metadata_updated_at,
      created_at: data.created_at,
    });
  } catch (error) {
    console.error("Erro ao carregar inspiração:", error);
    return null;
  }
}

export async function updateInspiration(
  id: string,
  updates: Partial<Inspiration>,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const payload: Record<string, unknown> = {};

  if (updates.url !== undefined) {
    payload.url = updates.url;
  }

  if (updates.source !== undefined) {
    payload.source = updates.source;
  }

  if (updates.category !== undefined) {
    payload.category = updates.category;
  }

  if (updates.note !== undefined) {
    payload.note = updates.note;
  }

  if (updates.productionEffort !== undefined) {
    payload.production_effort = updates.productionEffort;
  }

  if (updates.thumbnailUrl !== undefined) {
    payload.thumbnail_url = updates.thumbnailUrl;
  }

  if (updates.mediaTitle !== undefined) {
    payload.media_title = updates.mediaTitle;
  }

  if (updates.authorName !== undefined) {
    payload.author_name = updates.authorName;
  }

  if (updates.metadataUpdatedAt !== undefined) {
    payload.metadata_updated_at = updates.metadataUpdatedAt;
  }

  if (updates.createdAt !== undefined) {
    payload.created_at = updates.createdAt;
  }

  if (Object.keys(payload).length === 0) {
    return;
  }

  const { error } = await supabase
    .from("inspirations")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteInspiration(
  id: string,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("inspirations")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw error;
  }
}
