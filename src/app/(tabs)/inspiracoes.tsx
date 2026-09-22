import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getInspirations } from "../../services/inspirationStorage";

import { Inspiration } from "../../types/inspiration";

import {
    colors,
    radius,
    shadows,
    spacing,
    typography,
} from "../../constants/theme";

const filters = [
  "Todas",
  "Hook",
  "Tema",
  "Edição",
  "Formato",
  "Roteiro",
  "CTA",
];

export default function InspiracoesScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  const [loading, setLoading] = useState(true);

  const [selectedFilter, setSelectedFilter] = useState("Todas");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadInspirations() {
        try {
          setLoading(true);

          const data = await getInspirations();

          if (active) {
            setInspirations(data);
          }
        } catch (error) {
          console.error("Erro ao carregar inspirações:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      loadInspirations();

      return () => {
        active = false;
      };
    }, []),
  );

  const filteredInspirations =
    selectedFilter === "Todas"
      ? inspirations
      : inspirations.filter(
          (inspiration) => inspiration.category === selectedFilter,
        );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inspirações</Text>

            <Text style={styles.subtitle}>
              Tudo que você salvou para criar depois.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/inspiracao/nova")}
          >
            <Ionicons name="add" size={24} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const selected = selectedFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[styles.filter, selected && styles.filterActive]}
                onPress={() => setSelectedFilter(filter)}
              >
                <Text
                  style={[
                    styles.filterText,

                    selected && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.sectionTitle}>Salvos recentemente</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.rose} />

            <Text style={styles.loadingText}>Carregando inspirações...</Text>
          </View>
        ) : inspirations.length === 0 ? (
          <EmptyState />
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.noResults}>
            <View style={styles.noResultsIcon}>
              <Ionicons name="filter-outline" size={25} color={colors.rose} />
            </View>

            <Text style={styles.noResultsTitle}>Nada nesta categoria</Text>

            <Text style={styles.noResultsText}>
              Tente outro filtro ou salve uma nova inspiração.
            </Text>
          </View>
        ) : (
          filteredInspirations.map((inspiration) => (
            <InspirationCard key={inspiration.id} inspiration={inspiration} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type InspirationCardProps = {
  inspiration: Inspiration;
};

function InspirationCard({ inspiration }: InspirationCardProps) {
  const categoryColor = getCategoryColor(inspiration.category);

  const hasNote = inspiration.note.trim().length > 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        router.push({
          pathname: "/inspiracao/[id]",

          params: {
            id: inspiration.id,
          },
        })
      }
    >
      <View
        style={[
          styles.preview,
          {
            backgroundColor: categoryColor.background,
          },
        ]}
      >
        <Ionicons
          name={
            inspiration.source === "TikTok"
              ? "musical-note-outline"
              : inspiration.source === "Instagram"
                ? "logo-instagram"
                : inspiration.source === "YouTube"
                  ? "logo-youtube"
                  : "link-outline"
          }
          size={27}
          color={categoryColor.foreground}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text
            style={[
              styles.category,
              {
                color: categoryColor.foreground,
              },
            ]}
          >
            {inspiration.category?.toUpperCase() ?? "INSPIRAÇÃO"}
          </Text>

          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
        </View>

        <Text
          style={hasNote ? styles.inspirationText : styles.inspirationFallback}
          numberOfLines={3}
        >
          {hasNote ? inspiration.note : `Referência do ${inspiration.source}`}
        </Text>

        <View style={styles.sourceRow}>
          <View style={styles.sourceBadge}>
            <Ionicons
              name={
                inspiration.source === "Instagram"
                  ? "logo-instagram"
                  : inspiration.source === "TikTok"
                    ? "musical-note-outline"
                    : "link-outline"
              }
              size={12}
              color={colors.textSecondary}
            />

            <Text style={styles.source}>{inspiration.source}</Text>
          </View>
        </View>

        <Text style={styles.cardUrl} numberOfLines={1}>
          {inspiration.url}
        </Text>

        <TouchableOpacity
          style={styles.createButton}
          onPress={(event) => {
            event.stopPropagation();

            router.push({
              pathname: "/conteudo/criar",

              params: {
                inspirationId: inspiration.id,
              },
            });
          }}
        >
          <View style={styles.createButtonIcon}>
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={colors.terracotta}
            />
          </View>

          <Text style={styles.createButtonText}>Criar minha versão</Text>

          <Ionicons name="arrow-forward" size={14} color={colors.terracotta} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bulb-outline" size={30} color={colors.rose} />
      </View>

      <Text style={styles.emptyTitle}>Nenhuma inspiração ainda</Text>

      <Text style={styles.emptyDescription}>
        Salve uma referência para começar sua biblioteca de ideias.
      </Text>

      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push("/inspiracao/nova")}
      >
        <Ionicons name="add" size={18} color={colors.surface} />

        <Text style={styles.emptyButtonText}>Salvar inspiração</Text>
      </TouchableOpacity>
    </View>
  );
}

function getCategoryColor(category: string | null) {
  switch (category) {
    case "Hook":
      return {
        background: colors.terracottaLight,

        foreground: colors.terracotta,
      };

    case "Tema":
      return {
        background: colors.roseLight,

        foreground: colors.rose,
      };

    case "Edição":
      return {
        background: colors.lavenderLight,

        foreground: colors.lavender,
      };

    case "Formato":
      return {
        background: colors.blueLight,

        foreground: colors.blue,
      };

    case "Roteiro":
      return {
        background: colors.amberLight,

        foreground: colors.amber,
      };

    case "CTA":
      return {
        background: colors.sageLight,

        foreground: colors.sage,
      };

    default:
      return {
        background: colors.primaryLight,

        foreground: colors.primary,
      };
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.background,
  },

  content: {
    padding: spacing.lg,

    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",

    justifyContent: "space-between",

    alignItems: "center",

    marginBottom: spacing.lg,
  },

  title: {
    fontSize: typography.title,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    fontSize: typography.body,

    color: colors.textSecondary,

    marginTop: spacing.xs,
  },

  addButton: {
    width: 44,
    height: 44,

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,

    alignItems: "center",
    justifyContent: "center",

    ...shadows.card,
  },

  filters: {
    gap: spacing.sm,

    paddingRight: spacing.lg,

    marginBottom: spacing.xl,
  },

  filter: {
    paddingHorizontal: spacing.md,

    paddingVertical: spacing.sm,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceSoft,

    borderWidth: 1,

    borderColor: colors.border,
  },

  filterActive: {
    backgroundColor: colors.rose,

    borderColor: colors.rose,
  },

  filterText: {
    fontSize: typography.caption,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  filterTextActive: {
    color: colors.surface,
  },

  sectionTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,

    marginBottom: spacing.md,
  },

  loadingContainer: {
    paddingVertical: spacing.xxl,

    alignItems: "center",

    gap: spacing.sm,
  },

  loadingText: {
    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  card: {
    flexDirection: "row",

    backgroundColor: colors.surface,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.md,

    marginBottom: spacing.md,

    ...shadows.card,
  },

  preview: {
    width: 62,
    height: 82,

    borderRadius: radius.md,

    alignItems: "center",
    justifyContent: "center",

    marginRight: spacing.md,
  },

  cardContent: {
    flex: 1,
    minWidth: 0,
  },

  cardTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 6,
  },

  category: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 0.6,
  },

  inspirationText: {
    fontSize: 15,

    lineHeight: 21,

    fontWeight: "600",

    color: colors.text,
  },

  inspirationFallback: {
    fontSize: 15,

    lineHeight: 21,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  sourceRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: spacing.sm,
  },

  sourceBadge: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceSoft,
  },

  source: {
    fontSize: typography.tiny,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  cardUrl: {
    marginTop: 6,

    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  createButton: {
    minHeight: 38,

    marginTop: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    gap: 6,

    paddingHorizontal: 10,

    paddingVertical: 7,

    borderRadius: radius.round,

    backgroundColor: colors.terracottaLight,
  },

  createButtonIcon: {
    alignItems: "center",

    justifyContent: "center",
  },

  createButtonText: {
    fontSize: 11,

    fontWeight: "700",

    color: colors.terracotta,
  },

  emptyState: {
    backgroundColor: colors.roseLight,

    borderRadius: radius.xl,

    borderWidth: 1,

    borderColor: colors.border,

    padding: spacing.xl,

    alignItems: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  emptyDescription: {
    textAlign: "center",

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,

    marginTop: spacing.sm,
  },

  emptyButton: {
    height: 46,

    paddingHorizontal: spacing.lg,

    marginTop: spacing.lg,

    borderRadius: radius.md,

    backgroundColor: colors.terracotta,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,
  },

  emptyButtonText: {
    color: colors.surface,

    fontSize: typography.body,

    fontWeight: "700",
  },

  noResults: {
    alignItems: "center",

    backgroundColor: colors.roseLight,

    borderWidth: 1,

    borderColor: colors.border,

    borderRadius: radius.lg,

    padding: spacing.xl,
  },

  noResultsIcon: {
    width: 48,
    height: 48,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",
    justifyContent: "center",
  },

  noResultsTitle: {
    marginTop: spacing.sm,

    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  noResultsText: {
    marginTop: 4,

    maxWidth: 240,

    textAlign: "center",

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },
});
