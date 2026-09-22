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
            <PlatformLogo
              source={source}
              size={markSize}
              color={meta.brandColor}
            />
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
          <PlatformLogo source={source} size={13} color={meta.brandColor} />
        </View>
      )}
    </View>
  );
}

type PlatformLogoProps = {
  source: string;
  size: number;
  color: string;
};

function PlatformLogo({ source, size, color }: PlatformLogoProps) {
  switch (source) {
    case "Instagram":
      return <Ionicons name="logo-instagram" size={size} color={color} />;

    case "TikTok":
      return <Ionicons name="logo-tiktok" size={size} color={color} />;

    case "YouTube":
      return <Ionicons name="logo-youtube" size={size} color={color} />;

    case "Kwai":
      return <KwaiMark size={size} color={color} />;

    default:
      return <Ionicons name="link-outline" size={size} color={color} />;
  }
}

function KwaiMark({ size, color }: { size: number; color: string }) {
  const stroke = Math.max(1.6, size * 0.075);

  return (
    <View
      style={[
        styles.kwaiCanvas,
        {
          width: size,
          height: size,
        },
      ]}
    >
      <View
        style={[
          styles.kwaiBody,
          {
            width: size * 0.58,
            height: size * 0.62,
            borderWidth: stroke,
            borderColor: color,
            borderRadius: size * 0.12,
          },
        ]}
      >
        <View
          style={[
            styles.kwaiCircle,
            {
              width: size * 0.14,
              height: size * 0.14,
              borderRadius: size * 0.07,
              borderWidth: stroke,
              borderColor: color,
              top: size * 0.075,
              left: size * 0.065,
            },
          ]}
        />

        <View
          style={[
            styles.kwaiCircle,
            {
              width: size * 0.14,
              height: size * 0.14,
              borderRadius: size * 0.07,
              borderWidth: stroke,
              borderColor: color,
              top: size * 0.075,
              right: size * 0.065,
            },
          ]}
        />

        <View
          style={[
            styles.kwaiBottom,
            {
              width: size * 0.22,
              height: size * 0.14,
              borderWidth: stroke,
              borderColor: color,
              borderRadius: size * 0.045,
              bottom: size * 0.055,
              marginLeft: -(size * 0.11),
            },
          ]}
        />
      </View>
    </View>
  );
}

function getSourceMeta(source: string): {
  brandColor: string;
} {
  switch (source) {
    case "Instagram":
      return {
        brandColor: "#D94F70",
      };

    case "TikTok":
      return {
        brandColor: "#24211F",
      };

    case "YouTube":
      return {
        brandColor: "#E24C43",
      };

    case "Kwai":
      return {
        brandColor: "#E86C3F",
      };

    default:
      return {
        brandColor: colors.blue,
      };
  }
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

  kwaiCanvas: {
    alignItems: "center",
    justifyContent: "center",
  },

  kwaiBody: {
    position: "relative",
  },

  kwaiCircle: {
    position: "absolute",
  },

  kwaiBottom: {
    position: "absolute",
    left: "50%",
  },
});
