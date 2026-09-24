import { Ionicons } from "@expo/vector-icons";
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

import { colors, fonts, radius } from "../constants/theme";
import { ProductionEffort } from "../types/productionEffort";

export const productionEffortOptions: Array<{
  value: ProductionEffort;
  label: string;
  shortDescription: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "quick",
    label: "Rápido",
    shortDescription: "Dá para fazer com pouco tempo",
    icon: "flash-outline",
  },
  {
    value: "medium",
    label: "Médio",
    shortDescription: "Exige alguma preparação",
    icon: "time-outline",
  },
  {
    value: "demanding",
    label: "Demorado",
    shortDescription: "Precisa de mais tempo e atenção",
    icon: "layers-outline",
  },
];

export function getProductionEffortMeta(
  effort?: ProductionEffort | null,
) {
  return (
    productionEffortOptions.find((item) => item.value === effort) ?? null
  );
}

export function getProductionEffortLabel(
  effort?: ProductionEffort | null,
) {
  return getProductionEffortMeta(effort)?.label ?? "Não definido";
}

type SelectorProps = {
  value: ProductionEffort | null;
  onChange: (value: ProductionEffort) => void;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ProductionEffortSelector({
  value,
  onChange,
  compact = false,
  style,
}: SelectorProps) {
  return (
    <View style={[styles.selector, compact && styles.selectorCompact, style]}>
      {productionEffortOptions.map((item) => {
        const selected = value === item.value;

        return (
          <TouchableOpacity
            key={item.value}
            style={[
              styles.option,
              compact && styles.optionCompact,
              selected && styles.optionSelected,
            ]}
            activeOpacity={0.82}
            onPress={() => onChange(item.value)}
          >
            <View
              style={[
                styles.iconWrap,
                compact && styles.iconWrapCompact,
                selected && styles.iconWrapSelected,
              ]}
            >
              <Ionicons
                name={item.icon}
                size={compact ? 16 : 18}
                color={selected ? colors.terracotta : colors.textSecondary}
              />
            </View>

            <View style={styles.optionText}>
              <Text
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  selected && styles.labelSelected,
                ]}
              >
                {item.label}
              </Text>

              {!compact ? (
                <Text style={styles.description} numberOfLines={2}>
                  {item.shortDescription}
                </Text>
              ) : null}
            </View>

            {!compact ? (
              <View
                style={[
                  styles.selectionCircle,
                  selected && styles.selectionCircleSelected,
                ]}
              >
                {selected ? (
                  <Ionicons name="checkmark" size={12} color={colors.surface} />
                ) : null}
              </View>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function ProductionEffortBadge({
  effort,
  subtle = false,
}: {
  effort?: ProductionEffort | null;
  subtle?: boolean;
}) {
  const meta = getProductionEffortMeta(effort);

  if (!meta) {
    return null;
  }

  return (
    <View style={[styles.badge, subtle && styles.badgeSubtle]}>
      <Ionicons
        name={meta.icon}
        size={12}
        color={effort === "quick" ? colors.terracotta : colors.textSecondary}
      />

      <Text
        style={[
          styles.badgeText,
          effort === "quick" && styles.badgeTextQuick,
        ]}
      >
        {meta.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
    gap: 8,
  },

  selectorCompact: {
    flexDirection: "row",
    gap: 7,
  },

  option: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    flexDirection: "row",
    alignItems: "center",
  },

  optionCompact: {
    flex: 1,
    minWidth: 0,
    minHeight: 54,
    paddingHorizontal: 8,
    paddingVertical: 8,
    justifyContent: "center",
  },

  optionSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
  },

  iconWrap: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  iconWrapCompact: {
    width: 30,
    height: 30,
    marginRight: 6,
    borderRadius: 10,
  },

  iconWrapSelected: {
    backgroundColor: colors.surface,
  },

  optionText: {
    flex: 1,
    minWidth: 0,
  },

  label: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  labelCompact: {
    fontSize: 12,
    lineHeight: 17,
  },

  labelSelected: {
    color: colors.terracotta,
  },

  description: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  selectionCircle: {
    width: 20,
    height: 20,
    marginLeft: 8,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracotta,
  },

  badge: {
    alignSelf: "flex-start",
    minHeight: 26,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  badgeSubtle: {
    minHeight: 24,
    paddingHorizontal: 8,
    backgroundColor: colors.background,
  },

  badgeText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  badgeTextQuick: {
    color: colors.terracotta,
  },
});
