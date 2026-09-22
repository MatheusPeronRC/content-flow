import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, View } from "react-native";

import { colors } from "../constants/theme";

type PlatformIconProps = {
  source: string;
  size?: number;
  color?: string;
};

export type PlatformMeta = {
  brandColor: string;
  background: string;
};

export default function PlatformIcon({
  source,
  size = 18,
  color,
}: PlatformIconProps) {
  const meta = getPlatformMeta(source);
  const finalColor = color ?? meta.brandColor;

  switch (source) {
    case "Instagram":
      return <Ionicons name="logo-instagram" size={size} color={finalColor} />;

    case "TikTok":
      return <Ionicons name="logo-tiktok" size={size} color={finalColor} />;

    case "YouTube":
      return <Ionicons name="logo-youtube" size={size} color={finalColor} />;

    case "Kwai":
      return <KwaiMark size={size} color={finalColor} />;

    default:
      return <Ionicons name="link-outline" size={size} color={finalColor} />;
  }
}

export function getPlatformMeta(source: string): PlatformMeta {
  switch (source) {
    case "Instagram":
      return {
        brandColor: "#D94F70",
        background: "#FBE8EE",
      };

    case "TikTok":
      return {
        brandColor: "#24211F",
        background: "#F0EDEA",
      };

    case "YouTube":
      return {
        brandColor: "#E24C43",
        background: "#FBE9E7",
      };

    case "Kwai":
      return {
        brandColor: "#E86C3F",
        background: "#FBEADF",
      };

    default:
      return {
        brandColor: colors.blue,
        background: colors.blueLight,
      };
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

const styles = StyleSheet.create({
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
