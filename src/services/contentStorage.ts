import { supabase } from "../lib/supabase";
import {
  ContentItem,
  ContentReference,
  ContentScript,
  ContentStatus,
} from "../types/content";

type ContentRow = {
  id: string;
  user_id: string;
  inspiration_id: string | null;
  reference: unknown;
  idea: string;
  format: string | null;
  objective: string | null;
  status: ContentStatus;
  planned_date: string | null;
  script: unknown;
  created_at: string;
  updated_at: string;
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

function normalizeScript(value: unknown): ContentScript {
  if (!value || typeof value !== "object") {
    return {
      hook: "",
      points: [],
      cta: "",
    };
  }

  const candidate = value as Partial<ContentScript>;

  return {
    hook: typeof candidate.hook === "string" ? candidate.hook : "",
    points: Array.isArray(candidate.points)
      ? candidate.points.filter(
          (point): point is string => typeof point === "string",
        )
      : [],
    cta: typeof candidate.cta === "string" ? candidate.cta : "",
  };
}

function normalizeReference(value: unknown): ContentReference | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const candidate = value as Partial<ContentReference>;

  if (
    typeof candidate.inspirationId !== "string" ||
    typeof candidate.url !== "string" ||
    typeof candidate.source !== "string" ||
    typeof candidate.note !== "string"
  ) {
    return undefined;
  }

  return {
    inspirationId: candidate.inspirationId,
    url: candidate.url,
    source: candidate.source,
    category:
      typeof candidate.category === "string" || candidate.category === null
        ? candidate.category
        : null,
    note: candidate.note,
    thumbnailUrl:
      typeof candidate.thumbnailUrl === "string" ||
      candidate.thumbnailUrl === null
        ? candidate.thumbnailUrl
        : null,
    mediaTitle:
      typeof candidate.mediaTitle === "string" ||
      candidate.mediaTitle === null
        ? candidate.mediaTitle
        : null,
    authorName:
      typeof candidate.authorName === "string" ||
      candidate.authorName === null
        ? candidate.authorName
        : null,
    metadataUpdatedAt:
      typeof candidate.metadataUpdatedAt === "string" ||
      candidate.metadataUpdatedAt === null
        ? candidate.metadataUpdatedAt
        : null,
  };
}

function mapRowToContent(row: ContentRow): ContentItem {
  return {
    id: row.id,
    inspirationId: row.inspiration_id ?? undefined,
    reference: normalizeReference(row.reference),
    idea: row.idea,
    format: row.format,
    objective: row.objective,
    status: row.status,
    plannedDate: row.planned_date,
    script: normalizeScript(row.script),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getContents(): Promise<ContentItem[]> {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("contents")
      .select(
        "id, user_id, inspiration_id, reference, idea, format, objective, status, planned_date, script, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) =>
      mapRowToContent({
        id: row.id,
        user_id: row.user_id,
        inspiration_id: row.inspiration_id,
        reference: row.reference,
        idea: row.idea,
        format: row.format,
        objective: row.objective,
        status: row.status as ContentStatus,
        planned_date: row.planned_date,
        script: row.script,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );
  } catch (error) {
    console.error("Erro ao carregar conteúdos:", error);
    return [];
  }
}

export async function getContentById(
  id: string,
): Promise<ContentItem | null> {
  try {
    const userId = await getAuthenticatedUserId();

    const { data, error } = await supabase
      .from("contents")
      .select(
        "id, user_id, inspiration_id, reference, idea, format, objective, status, planned_date, script, created_at, updated_at",
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

    return mapRowToContent({
      id: data.id,
      user_id: data.user_id,
      inspiration_id: data.inspiration_id,
      reference: data.reference,
      idea: data.idea,
      format: data.format,
      objective: data.objective,
      status: data.status as ContentStatus,
      planned_date: data.planned_date,
      script: data.script,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });
  } catch (error) {
    console.error("Erro ao carregar conteúdo:", error);
    return null;
  }
}

export async function saveContent(
  content: ContentItem,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase.from("contents").insert({
    id: content.id,
    user_id: userId,
    inspiration_id: content.inspirationId ?? null,
    reference: content.reference ?? null,
    idea: content.idea,
    format: content.format,
    objective: content.objective,
    status: content.status,
    planned_date: content.plannedDate ?? null,
    script: content.script,
    created_at: content.createdAt,
    updated_at: content.updatedAt,
  });

  if (error) {
    throw error;
  }
}

export async function updateContent(
  id: string,
  updates: Partial<ContentItem>,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const payload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.inspirationId !== undefined) {
    payload.inspiration_id = updates.inspirationId ?? null;
  }

  if (updates.reference !== undefined) {
    payload.reference = updates.reference ?? null;
  }

  if (updates.idea !== undefined) {
    payload.idea = updates.idea;
  }

  if (updates.format !== undefined) {
    payload.format = updates.format;
  }

  if (updates.objective !== undefined) {
    payload.objective = updates.objective;
  }

  if (updates.status !== undefined) {
    payload.status = updates.status;
  }

  if (updates.plannedDate !== undefined) {
    payload.planned_date = updates.plannedDate;
  }

  if (updates.script !== undefined) {
    payload.script = updates.script;
  }

  const { error } = await supabase
    .from("contents")
    .update(payload)
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw error;
  }
}

export async function deleteContent(
  id: string,
): Promise<void> {
  const userId = await getAuthenticatedUserId();

  const { error } = await supabase
    .from("contents")
    .delete()
    .eq("user_id", userId)
    .eq("id", id);

  if (error) {
    throw error;
  }
}
