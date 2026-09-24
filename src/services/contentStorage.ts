import { supabase } from "../lib/supabase";
import {
  ContentItem,
  ContentReference,
  ContentScript,
  ContentStatus,
} from "../types/content";
import { ProductionEffort } from "../types/productionEffort";

type ContentRow = {
  id: string;
  user_id: string;
  inspiration_id: string | null;
  reference: unknown;
  idea: string;
  format: string | null;
  objective: string | null;
  production_effort: ProductionEffort | null;
  status: ContentStatus;
  planned_date: string | null;
  script: unknown;
  created_at: string;
  updated_at: string;
};

let cachedUserId: string | null = null;
let cachedContents: ContentItem[] | null = null;

async function getAuthenticatedUserId(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  const userId = session?.user?.id;

  if (!userId) {
    cachedUserId = null;
    cachedContents = null;

    throw new Error("Usuário não autenticado.");
  }

  return userId;
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
    productionEffort:
      candidate.productionEffort === "quick" ||
      candidate.productionEffort === "medium" ||
      candidate.productionEffort === "demanding"
        ? candidate.productionEffort
        : null,
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
    productionEffort: row.production_effort,
    status: row.status,
    plannedDate: row.planned_date,
    script: normalizeScript(row.script),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function updateCachedContent(
  userId: string,
  id: string,
  updates: Partial<ContentItem>,
  updatedAt?: string,
) {
  if (cachedUserId !== userId || cachedContents === null) {
    return;
  }

  cachedContents = cachedContents.map((content) =>
    content.id === id
      ? {
          ...content,
          ...updates,
          updatedAt: updatedAt ?? content.updatedAt,
        }
      : content,
  );
}

export function clearContentsCache() {
  cachedUserId = null;
  cachedContents = null;
}

export async function getContents(
  forceRefresh = false,
): Promise<ContentItem[]> {
  try {
    const userId = await getAuthenticatedUserId();

    if (
      !forceRefresh &&
      cachedUserId === userId &&
      cachedContents !== null
    ) {
      return cachedContents;
    }

    const { data, error } = await supabase
      .from("contents")
      .select(
        "id, user_id, inspiration_id, reference, idea, format, objective, production_effort, status, planned_date, script, created_at, updated_at",
      )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      throw error;
    }

    const mappedContents = (data ?? []).map((row) =>
      mapRowToContent({
        id: row.id,
        user_id: row.user_id,
        inspiration_id: row.inspiration_id,
        reference: row.reference,
        idea: row.idea,
        format: row.format,
        objective: row.objective,
        production_effort: row.production_effort as ProductionEffort | null,
        status: row.status as ContentStatus,
        planned_date: row.planned_date,
        script: row.script,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }),
    );

    cachedUserId = userId;
    cachedContents = mappedContents;

    return mappedContents;
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

    if (cachedUserId === userId && cachedContents !== null) {
      const cachedContent = cachedContents.find(
        (content) => content.id === id,
      );

      if (cachedContent) {
        return cachedContent;
      }
    }

    const { data, error } = await supabase
      .from("contents")
      .select(
        "id, user_id, inspiration_id, reference, idea, format, objective, production_effort, status, planned_date, script, created_at, updated_at",
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

    const content = mapRowToContent({
      id: data.id,
      user_id: data.user_id,
      inspiration_id: data.inspiration_id,
      reference: data.reference,
      idea: data.idea,
      format: data.format,
      objective: data.objective,
      production_effort: data.production_effort as ProductionEffort | null,
      status: data.status as ContentStatus,
      planned_date: data.planned_date,
      script: data.script,
      created_at: data.created_at,
      updated_at: data.updated_at,
    });

    if (cachedUserId === userId && cachedContents !== null) {
      const exists = cachedContents.some(
        (item) => item.id === content.id,
      );

      if (!exists) {
        cachedContents = [content, ...cachedContents];
      }
    }

    return content;
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
    production_effort: content.productionEffort ?? null,
    status: content.status,
    planned_date: content.plannedDate ?? null,
    script: content.script,
    created_at: content.createdAt,
    updated_at: content.updatedAt,
  });

  if (error) {
    throw error;
  }

  if (cachedUserId === userId && cachedContents !== null) {
    cachedContents = [
      content,
      ...cachedContents.filter(
        (item) => item.id !== content.id,
      ),
    ];
  }
}

export async function updateContent(
  id: string,
  updates: Partial<ContentItem>,
): Promise<void> {
  const userId = await getAuthenticatedUserId();
  const updatedAt = new Date().toISOString();

  const payload: Record<string, unknown> = {
    updated_at: updatedAt,
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

  if (updates.productionEffort !== undefined) {
    payload.production_effort = updates.productionEffort;
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

  updateCachedContent(
    userId,
    id,
    updates,
    updatedAt,
  );
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

  if (cachedUserId === userId && cachedContents !== null) {
    cachedContents = cachedContents.filter(
      (content) => content.id !== id,
    );
  }
}
