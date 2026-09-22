import { Ionicons } from "@expo/vector-icons";
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

  const meta = useMemo(() => getSourceMeta(source), [source]);

  const showImage = Boolean(thumbnailUrl) && !imageFailed;

  return (
    <View
      style={[
        styles.base,
        styles[variant],
        {
          backgroundColor: meta.background,
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
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Ionicons
              name={meta.icon}
              size={variant === "wide" ? 30 : 23}
              color={meta.color}
            />
          </View>

          <Text
            style={[
              styles.fallbackText,
              {
                color: meta.color,
              },
            ]}
            numberOfLines={1}
          >
            {source}
          </Text>
        </View>
      )}

      {showSourceBadge && showImage && (
        <View style={styles.sourceBadge}>
          <Ionicons name={meta.icon} size={12} color={colors.surface} />
        </View>
      )}
    </View>
  );
}

function getSourceMeta(source: string): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
} {
  switch (source) {
    case "Instagram":
      return {
        icon: "logo-instagram",
        color: colors.terracotta,
        background: colors.terracottaLight,
      };

    case "TikTok":
      return {
        icon: "musical-note-outline",
        color: colors.text,
        background: colors.primaryLight,
      };

    case "YouTube":
      return {
        icon: "logo-youtube",
        color: colors.rose,
        background: colors.roseLight,
      };

    case "Kwai":
      return {
        icon: "play-outline",
        color: colors.amber,
        background: colors.amberLight,
      };

    default:
      return {
        icon: "link-outline",
        color: colors.blue,
        background: colors.blueLight,
      };
  }
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
    position: "relative",
    borderRadius: 17,
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
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  fallbackText: {
    marginTop: 8,
    maxWidth: "100%",
    fontSize: 10,
    fontFamily: fonts.bold,
    textAlign: "center",
  },

  sourceBadge: {
    position: "absolute",
    left: 7,
    bottom: 7,
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: "rgba(31, 28, 26, 0.76)",
    alignItems: "center",
    justifyContent: "center",
  },
});
