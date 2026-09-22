import { useEffect, useMemo, useState } from "react";

import {
    Image,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";

import { colors, fonts, radius } from "../constants/theme";

import PlatformIcon, { getPlatformMeta } from "./PlatformIcon";

type ThumbnailVariant = "library" | "preview" | "compact" | "wide";

type InspirationThumbnailProps = {
  thumbnailUrl?: string | null;
  source: string;
  variant?: ThumbnailVariant;
  style?: StyleProp<ViewStyle>;
  showSourceBadge?: boolean;
};

export default function InspirationThumbnail({
  thumbnailUrl,
  source,
  variant = "library",
  style,
  showSourceBadge = true,
}: InspirationThumbnailProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [thumbnailUrl]);

  const meta = useMemo(() => getPlatformMeta(source), [source]);

  const showImage = Boolean(thumbnailUrl) && !imageFailed;

  const markSize = variant === "wide" ? 34 : variant === "compact" ? 24 : 28;

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        {
          backgroundColor: colors.surfaceSoft,
        },
        style,
      ]}
    >
      {showImage ? (
        <Image
          source={{
            uri: thumbnailUrl!,
          }}
          style={styles.image}
          resizeMode="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View style={styles.fallback}>
          <View
            style={[
              styles.fallbackMark,
              variant === "wide" && styles.fallbackMarkWide,
            ]}
          >
            <PlatformIcon source={source} size={markSize} />
          </View>

          {variant !== "compact" && (
            <Text
              style={[
                styles.fallbackText,
                {
                  color: meta.brandColor,
                },
              ]}
              numberOfLines={1}
            >
              {source}
            </Text>
          )}
        </View>
      )}

      {showSourceBadge && showImage && (
        <View style={styles.sourceBadge}>
          <PlatformIcon source={source} size={13} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(37,34,32,0.05)",
  },

  library: {
    width: 92,
    height: 116,
  },

  preview: {
    width: 96,
    height: 120,
  },

  compact: {
    width: 72,
    height: 86,
    borderRadius: 14,
  },

  wide: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
  },

  image: {
    width: "100%",
    height: "100%",
  },

  fallback: {
    flex: 1,
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackMarkWide: {
    width: 58,
    height: 58,
    borderRadius: 18,
  },

  fallbackText: {
    marginTop: 8,
    maxWidth: "100%",
    fontSize: 10,
    fontFamily: fonts.semibold,
    textAlign: "center",
  },

  sourceBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: "rgba(255,253,252,0.94)",
    borderWidth: 1,
    borderColor: "rgba(37,34,32,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
});
