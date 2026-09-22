import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";

import {
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
  "Roteiro",
  "Formato",
  "Edição",
  "CTA",
];

export default function InspirationsScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  const [selectedFilter, setSelectedFilter] = useState("Todas");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          const data = await getInspirations();

          if (active) {
            setInspirations(data);
          }
        } catch (error) {
          console.error("Erro ao carregar inspirações:", error);
        }
      }

      load();

      return () => {
        active = false;
      };
    }, []),
  );

  const filteredInspirations = useMemo(() => {
    if (selectedFilter === "Todas") {
      return inspirations;
    }

    return inspirations.filter((item) => item.category === selectedFilter);
  }, [inspirations, selectedFilter]);

  function openInspiration(inspiration: Inspiration) {
    router.push(`/inspiracao/${inspiration.id}`);
  }

  function createFromInspiration(inspiration: Inspiration) {
    router.push({
      pathname: "/conteudo/adaptar",

      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Inspirações</Text>

            <Text style={styles.subtitle}>
              Guarde referências que podem virar seus próximos conteúdos.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="bulb-outline" size={23} color={colors.rose} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          activeOpacity={0.85}
          onPress={() => router.push("/inspiracao/nova")}
        >
          <View style={styles.saveButtonIcon}>
            <Ionicons
              name="bookmark-outline"
              size={20}
              color={colors.surface}
            />
          </View>

          <View style={styles.saveButtonContent}>
            <Text style={styles.saveButtonTitle}>Salvar inspiração</Text>

            <Text style={styles.saveButtonDescription}>
              Guarde um Reel, TikTok, vídeo ou qualquer outra referência.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={19} color={colors.surface} />
        </TouchableOpacity>

        {inspirations.length > 0 && (
          <>
            <View style={styles.libraryHeader}>
              <View>
                <Text style={styles.libraryTitle}>Sua biblioteca</Text>

                <Text style={styles.librarySubtitle}>
                  {inspirations.length === 1
                    ? "1 referência salva"
                    : `${inspirations.length} referências salvas`}
                </Text>
              </View>
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
                    style={[styles.filter, selected && styles.filterSelected]}
                    onPress={() => setSelectedFilter(filter)}
                  >
                    <Text
                      style={[
                        styles.filterText,

                        selected && styles.filterTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </>
        )}

        {inspirations.length === 0 ? (
          <EmptyState />
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.emptyFilter}>
            <View style={styles.emptyFilterIcon}>
              <Ionicons
                name="filter-outline"
                size={23}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.emptyFilterTitle}>
              Nenhuma inspiração em “{selectedFilter}”
            </Text>

            <Text style={styles.emptyFilterText}>
              Suas referências continuam salvas. Escolha outro filtro para
              encontrá-las.
            </Text>

            <TouchableOpacity onPress={() => setSelectedFilter("Todas")}>
              <Text style={styles.showAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.list}>
            {filteredInspirations.map((inspiration) => (
              <InspirationCard
                key={inspiration.id}
                inspiration={inspiration}
                onOpen={() => openInspiration(inspiration)}
                onCreate={() => createFromInspiration(inspiration)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type InspirationCardProps = {
  inspiration: Inspiration;

  onOpen: () => void;

  onCreate: () => void;
};

function InspirationCard({
  inspiration,
  onOpen,
  onCreate,
}: InspirationCardProps) {
  const categoryColor = getCategoryColor(inspiration.category);

  const hasNote = inspiration.note.trim().length > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onOpen}>
      <View style={styles.cardMain}>
        <View
          style={[
            styles.preview,

            {
              backgroundColor: categoryColor.background,
            },
          ]}
        >
          <Ionicons
            name={getSourceIcon(inspiration.source)}
            size={26}
            color={categoryColor.foreground}
          />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardMeta}>
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

            <View style={styles.metaDot} />

            <Text style={styles.source}>{inspiration.source}</Text>
          </View>

          <Text
            style={hasNote ? styles.cardTitle : styles.cardFallback}
            numberOfLines={3}
          >
            {hasNote ? inspiration.note : `Referência do ${inspiration.source}`}
          </Text>

          <Text style={styles.cardUrl} numberOfLines={1}>
            {cleanUrl(inspiration.url)}
          </Text>

          <View style={styles.openHintRow}>
            <Text style={styles.openHint}>Toque para abrir</Text>

            <Ionicons
              name="chevron-forward"
              size={12}
              color={colors.textMuted}
            />
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.createButton}
        activeOpacity={0.8}
        onPress={(event) => {
          event.stopPropagation();

          onCreate();
        }}
      >
        <View style={styles.createButtonIcon}>
          <Ionicons
            name="sparkles-outline"
            size={17}
            color={colors.terracotta}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.createButtonLabel}>TRANSFORMAR REFERÊNCIA</Text>

          <Text style={styles.createButtonText}>Criar minha versão</Text>
        </View>

        <Ionicons name="arrow-forward" size={17} color={colors.terracotta} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons name="bookmark-outline" size={30} color={colors.rose} />
      </View>

      <Text style={styles.emptyStateTitle}>Sua biblioteca está vazia</Text>

      <Text style={styles.emptyStateText}>
        Quando encontrar um conteúdo interessante, salve aqui para não perder a
        referência.
      </Text>

      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => router.push("/inspiracao/nova")}
      >
        <Ionicons name="bookmark-outline" size={18} color={colors.surface} />

        <Text style={styles.emptyStateButtonText}>
          Salvar primeira inspiração
        </Text>
      </TouchableOpacity>

      <View style={styles.emptyTip}>
        <Ionicons
          name="information-circle-outline"
          size={18}
          color={colors.blue}
        />

        <Text style={styles.emptyTipText}>
          Você não precisa organizar tudo na hora. Salve primeiro e categorize
          depois.
        </Text>
      </View>
    </View>
  );
}

function getSourceIcon(source: string): keyof typeof Ionicons.glyphMap {
  switch (source) {
    case "Instagram":
      return "logo-instagram";

    case "TikTok":
      return "musical-note-outline";

    case "YouTube":
      return "logo-youtube";

    default:
      return "link-outline";
  }
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

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,

    paddingBottom: 110,
  },

  header: {
    paddingTop: spacing.md,

    paddingBottom: spacing.xl,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  title: {
    fontSize: typography.title,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    marginTop: 4,

    maxWidth: 300,

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,
  },

  headerIcon: {
    width: 46,
    height: 46,

    borderRadius: radius.md,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButton: {
    minHeight: 82,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    marginBottom: spacing.xl,

    borderRadius: radius.xl,

    backgroundColor: colors.primary,
  },

  saveButtonIcon: {
    width: 46,
    height: 46,

    marginRight: spacing.md,

    borderRadius: radius.md,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonContent: {
    flex: 1,

    paddingRight: spacing.sm,
  },

  saveButtonTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.surface,
  },

  saveButtonDescription: {
    marginTop: 3,

    fontSize: typography.tiny,

    lineHeight: 15,

    color: "#D7E3DE",
  },

  libraryHeader: {
    marginBottom: spacing.md,
  },

  libraryTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  librarySubtitle: {
    marginTop: 3,

    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  filters: {
    gap: spacing.sm,

    paddingBottom: spacing.lg,
  },

  filter: {
    paddingHorizontal: spacing.md,

    paddingVertical: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  filterSelected: {
    backgroundColor: colors.primary,

    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.caption,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.surface,
  },

  list: {
    gap: spacing.md,
  },

  card: {
    padding: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,

    ...shadows.card,
  },

  cardMain: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  preview: {
    width: 58,
    height: 78,

    marginRight: spacing.md,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",
  },

  cardContent: {
    flex: 1,

    minWidth: 0,
  },

  cardMeta: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",
  },

  category: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 0.6,
  },

  metaDot: {
    width: 3,
    height: 3,

    marginHorizontal: 6,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  source: {
    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  cardTitle: {
    marginTop: 6,

    fontSize: 15,

    lineHeight: 21,

    fontWeight: "700",

    color: colors.text,
  },

  cardFallback: {
    marginTop: 6,

    fontSize: 15,

    lineHeight: 21,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  cardUrl: {
    marginTop: 6,

    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  openHintRow: {
    marginTop: 6,

    flexDirection: "row",

    alignItems: "center",

    gap: 2,
  },

  openHint: {
    fontSize: 9,

    color: colors.textMuted,
  },

  createButton: {
    minHeight: 54,

    marginTop: spacing.md,

    paddingHorizontal: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.md,

    backgroundColor: colors.terracottaLight,
  },

  createButtonIcon: {
    width: 34,
    height: 34,

    marginRight: spacing.sm,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  createButtonLabel: {
    fontSize: 7,

    fontWeight: "800",

    letterSpacing: 0.6,

    color: colors.textMuted,
  },

  createButtonText: {
    marginTop: 2,

    fontSize: typography.caption,

    fontWeight: "800",

    color: colors.terracotta,
  },

  emptyState: {
    alignItems: "center",

    paddingTop: spacing.xl,

    paddingHorizontal: spacing.lg,
  },

  emptyStateIcon: {
    width: 68,
    height: 68,

    marginBottom: spacing.md,

    borderRadius: radius.xl,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyStateTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    textAlign: "center",

    color: colors.text,
  },

  emptyStateText: {
    maxWidth: 310,

    marginTop: spacing.sm,

    fontSize: typography.body,

    lineHeight: 20,

    textAlign: "center",

    color: colors.textSecondary,
  },

  emptyStateButton: {
    minHeight: 50,

    marginTop: spacing.xl,

    paddingHorizontal: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.rose,
  },

  emptyStateButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  emptyTip: {
    maxWidth: 330,

    marginTop: spacing.xl,

    padding: spacing.md,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    borderRadius: radius.lg,

    backgroundColor: colors.blueLight,
  },

  emptyTipText: {
    flex: 1,

    fontSize: typography.tiny,

    lineHeight: 16,

    color: colors.textSecondary,
  },

  emptyFilter: {
    alignItems: "center",

    paddingTop: spacing.xxl,

    paddingHorizontal: spacing.lg,
  },

  emptyFilterIcon: {
    width: 54,
    height: 54,

    marginBottom: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyFilterTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    textAlign: "center",

    color: colors.text,
  },

  emptyFilterText: {
    maxWidth: 300,

    marginTop: spacing.sm,

    fontSize: typography.caption,

    lineHeight: 18,

    textAlign: "center",

    color: colors.textSecondary,
  },

  showAllText: {
    marginTop: spacing.md,

    fontSize: typography.body,

    fontWeight: "700",

    color: colors.primary,
  },
});
