import { Ionicons } from "@expo/vector-icons";

import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
    colors,
    radius,
    shadows,
    spacing,
    typography,
} from "../constants/theme";

type TaskCardProps = {
  action: string;
  title: string;
  type: string;

  icon: keyof typeof Ionicons.glyphMap;

  iconBackground: string;
  iconColor?: string;

  completed?: boolean;

  onPress?: () => void;
};

export function TaskCard({
  action,
  title,
  type,
  icon,
  iconBackground,
  iconColor = colors.primary,
  completed = false,
  onPress,
}: TaskCardProps) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.action}>{action}</Text>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.typeContainer}>
          <Text style={styles.type}>{type}</Text>
        </View>
      </View>

      <View style={[styles.check, completed && styles.checkCompleted]}>
        {completed && (
          <Ionicons name="checkmark" size={15} color={colors.surface} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: colors.surface,

    padding: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1,
    borderColor: colors.border,

    marginBottom: 10,

    ...shadows.card,
  },

  iconContainer: {
    width: 48,
    height: 48,

    borderRadius: radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: spacing.md,
  },

  content: {
    flex: 1,
  },

  action: {
    fontSize: typography.caption,
    fontWeight: "700",

    color: colors.textSecondary,

    marginBottom: 3,
  },

  title: {
    fontSize: 15,
    lineHeight: 20,

    fontWeight: "600",

    color: colors.text,
  },

  typeContainer: {
    alignSelf: "flex-start",

    backgroundColor: colors.surfaceSoft,

    paddingHorizontal: 8,
    paddingVertical: 3,

    borderRadius: radius.round,

    marginTop: 7,
  },

  type: {
    fontSize: typography.tiny,
    fontWeight: "600",

    color: colors.textSecondary,
  },

  check: {
    width: 24,
    height: 24,

    borderRadius: radius.round,

    borderWidth: 1.5,
    borderColor: colors.border,

    alignItems: "center",
    justifyContent: "center",

    marginLeft: spacing.sm,
  },

  checkCompleted: {
    backgroundColor: colors.sage,

    borderColor: colors.sage,
  },
});
