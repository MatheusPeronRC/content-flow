export type MediaSource =
  | "Instagram"
  | "TikTok"
  | "YouTube"
  | "Kwai"
  | "Outro";

export type MediaMetadata = {
  source: MediaSource;
  thumbnailUrl: string | null;
  mediaTitle: string | null;
  authorName: string | null;
  metadataUpdatedAt: string;
};

type OEmbedResponse = {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
};

const REQUEST_TIMEOUT_MS = 5500;

export function detectMediaSource(
  rawUrl: string,
): MediaSource {
  const url = rawUrl
    .trim()
    .toLowerCase();

  if (
    url.includes("instagram.com")
  ) {
    return "Instagram";
  }

  if (
    url.includes("tiktok.com")
  ) {
    return "TikTok";
  }

  if (
    url.includes("youtube.com") ||
    url.includes("youtu.be")
  ) {
    return "YouTube";
  }

  if (
    url.includes("kwai.com") ||
    url.includes("kw.ai") ||
    url.includes("kuaishou.com")
  ) {
    return "Kwai";
  }

  return "Outro";
}

export function normalizeMediaUrl(
  rawUrl: string,
) {
  const trimmed =
    rawUrl.trim();

  if (!trimmed) {
    return "";
  }

  if (
    /^https?:\/\//i.test(
      trimmed,
    )
  ) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export async function getMediaMetadata(
  rawUrl: string,
): Promise<MediaMetadata> {
  const url =
    normalizeMediaUrl(rawUrl);

  const source =
    detectMediaSource(url);

  const fallback =
    createFallback(source);

  if (!url) {
    return fallback;
  }

  try {
    switch (source) {
      case "YouTube":
        return await getYouTubeMetadata(
          url,
        );

      case "TikTok":
        return await getTikTokMetadata(
          url,
        );

      // Nesta primeira versão não fazemos scraping de Instagram/Kwai.
      // Mantemos um fallback consistente e depois movemos essa resolução
      // para backend quando conectarmos Supabase/Edge Functions.
      case "Instagram":
      case "Kwai":
      case "Outro":
      default:
        return fallback;
    }
  } catch (error) {
    console.warn(
      "Não foi possível obter metadados da referência:",
      error,
    );

    return fallback;
  }
}

async function getYouTubeMetadata(
  url: string,
): Promise<MediaMetadata> {
  const videoId =
    extractYouTubeVideoId(url);

  const directThumbnail =
    videoId
      ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      : null;

  try {
    const response =
      await fetchJsonWithTimeout<OEmbedResponse>(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(
          url,
        )}&format=json`,
      );

    return {
      source: "YouTube",
      thumbnailUrl:
        response.thumbnail_url ??
        directThumbnail,
      mediaTitle:
        response.title ?? null,
      authorName:
        response.author_name ??
        null,
      metadataUpdatedAt:
        new Date().toISOString(),
    };
  } catch {
    return {
      source: "YouTube",
      thumbnailUrl:
        directThumbnail,
      mediaTitle: null,
      authorName: null,
      metadataUpdatedAt:
        new Date().toISOString(),
    };
  }
}

async function getTikTokMetadata(
  url: string,
): Promise<MediaMetadata> {
  const response =
    await fetchJsonWithTimeout<OEmbedResponse>(
      `https://www.tiktok.com/oembed?url=${encodeURIComponent(
        url,
      )}`,
    );

  return {
    source: "TikTok",
    thumbnailUrl:
      response.thumbnail_url ??
      null,
    mediaTitle:
      response.title ?? null,
    authorName:
      response.author_name ??
      null,
    metadataUpdatedAt:
      new Date().toISOString(),
  };
}

function createFallback(
  source: MediaSource,
): MediaMetadata {
  return {
    source,
    thumbnailUrl: null,
    mediaTitle: null,
    authorName: null,
    metadataUpdatedAt:
      new Date().toISOString(),
  };
}

function extractYouTubeVideoId(
  rawUrl: string,
) {
  try {
    const url =
      new URL(
        normalizeMediaUrl(
          rawUrl,
        ),
      );

    const hostname =
      url.hostname
        .replace(/^www\./, "")
        .toLowerCase();

    if (
      hostname ===
        "youtu.be" ||
      hostname.endsWith(
        ".youtu.be",
      )
    ) {
      return (
        url.pathname
          .split("/")
          .filter(Boolean)[0] ??
        null
      );
    }

    if (
      hostname.includes(
        "youtube.com",
      )
    ) {
      const queryId =
        url.searchParams.get(
          "v",
        );

      if (queryId) {
        return queryId;
      }

      const parts =
        url.pathname
          .split("/")
          .filter(Boolean);

      const knownPrefixes = [
        "shorts",
        "embed",
        "live",
      ];

      if (
        parts.length >= 2 &&
        knownPrefixes.includes(
          parts[0],
        )
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

async function fetchJsonWithTimeout<T>(
  url: string,
): Promise<T> {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(() => {
      controller.abort();
    }, REQUEST_TIMEOUT_MS);

  try {
    const response =
      await fetch(url, {
        signal:
          controller.signal,
        headers: {
          Accept:
            "application/json",
        },
      });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`,
      );
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
