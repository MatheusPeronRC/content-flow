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

import { colors, radius, shadows, spacing } from "../../constants/theme";

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
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Inspirações</Text>

            <Text style={styles.subtitle}>
              Seu acervo criativo. Guarde o que acende uma ideia.
            </Text>
          </View>

          <View style={styles.headerMark}>
            <Ionicons name="bulb-outline" size={21} color={colors.rose} />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveReference}
          activeOpacity={0.86}
          onPress={() => router.push("/inspiracao/nova")}
        >
          <View style={styles.saveReferenceMark}>
            <Ionicons name="add" size={22} color={colors.surface} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.saveReferenceTitle}>Salvar referência</Text>

            <Text style={styles.saveReferenceText}>
              Reel, TikTok, vídeo, post ou qualquer ideia que vale guardar.
            </Text>
          </View>

          <Ionicons name="arrow-forward" size={18} color={colors.terracotta} />
        </TouchableOpacity>

        {inspirations.length > 0 && (
          <>
            <View style={styles.libraryHeader}>
              <View>
                <Text style={styles.libraryTitle}>Biblioteca</Text>

                <Text style={styles.librarySubtitle}>
                  Tudo que você guardou para usar depois.
                </Text>
              </View>

              <View style={styles.countPill}>
                <Text style={styles.countText}>
                  {inspirations.length}{" "}
                  {inspirations.length === 1 ? "salva" : "salvas"}
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
                    activeOpacity={0.8}
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
            <View style={styles.emptyFilterMark}>
              <Ionicons
                name="filter-outline"
                size={21}
                color={colors.textMuted}
              />
            </View>

            <Text style={styles.emptyFilterTitle}>Nada por aqui ainda</Text>

            <Text style={styles.emptyFilterText}>
              Você não tem nenhuma referência em {selectedFilter}.
            </Text>

            <TouchableOpacity onPress={() => setSelectedFilter("Todas")}>
              <Text style={styles.showAll}>Ver toda a biblioteca</Text>
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
  const accent = getCategoryColor(inspiration.category);

  const hasNote = inspiration.note.trim().length > 0;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onOpen}>
      <View
        style={[
          styles.accentBar,

          {
            backgroundColor: accent.foreground,
          },
        ]}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.sourceMark,

                {
                  backgroundColor: accent.background,
                },
              ]}
            >
              <Ionicons
                name={getSourceIcon(inspiration.source)}
                size={16}
                color={accent.foreground}
              />
            </View>

            <Text
              style={[
                styles.category,

                {
                  color: accent.foreground,
                },
              ]}
            >
              {inspiration.category?.toUpperCase() ?? "INSPIRAÇÃO"}
            </Text>

            <View style={styles.metaDot} />

            <Text style={styles.source}>{inspiration.source}</Text>
          </View>

          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
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

        <View style={styles.cardDivider} />

        <TouchableOpacity
          style={styles.createAction}
          activeOpacity={0.8}
          onPress={(event) => {
            event.stopPropagation();

            onCreate();
          }}
        >
          <View style={styles.createActionLeft}>
            <View style={styles.sparkleMark}>
              <Ionicons name="sparkles" size={15} color={colors.terracotta} />
            </View>

            <View>
              <Text style={styles.createEyebrow}>TRANSFORMAR</Text>

              <Text style={styles.createText}>Criar minha versão</Text>
            </View>
          </View>

          <Ionicons name="arrow-forward" size={17} color={colors.terracotta} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyArt}>
        <View style={styles.emptyArtBack} />

        <View style={styles.emptyArtFront}>
          <Ionicons name="bookmark-outline" size={28} color={colors.rose} />
        </View>

        <View style={styles.emptySpark}>
          <Ionicons name="sparkles" size={16} color={colors.terracotta} />
        </View>
      </View>

      <Text style={styles.emptyTitle}>Comece seu acervo criativo.</Text>

      <Text style={styles.emptyText}>
        Encontrou algo que despertou uma ideia? Guarde aqui agora e transforme
        depois.
      </Text>

      <TouchableOpacity
        style={styles.emptyButton}
        activeOpacity={0.85}
        onPress={() => router.push("/inspiracao/nova")}
      >
        <Ionicons name="add" size={19} color={colors.surface} />

        <Text style={styles.emptyButtonText}>Salvar primeira referência</Text>
      </TouchableOpacity>
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

    paddingBottom: 135,
  },

  header: {
    paddingTop: spacing.lg,

    paddingBottom: spacing.xl,

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  title: {
    fontSize: 32,

    lineHeight: 37,

    letterSpacing: -0.9,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    maxWidth: 285,

    marginTop: 6,

    fontSize: 13,

    lineHeight: 19,

    color: colors.textSecondary,
  },

  headerMark: {
    width: 42,
    height: 42,

    marginTop: 3,

    borderRadius: 14,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  saveReference: {
    minHeight: 80,

    padding: spacing.md,

    marginBottom: 34,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.xl,

    backgroundColor: colors.terracottaLight,
  },

  saveReferenceMark: {
    width: 44,
    height: 44,

    marginRight: spacing.md,

    borderRadius: 15,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",
  },

  saveReferenceTitle: {
    fontSize: 15,

    fontWeight: "700",

    color: colors.text,
  },

  saveReferenceText: {
    maxWidth: 245,

    marginTop: 3,

    paddingRight: spacing.sm,

    fontSize: 10,

    lineHeight: 15,

    color: colors.textSecondary,
  },

  libraryHeader: {
    marginBottom: spacing.md,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",
  },

  libraryTitle: {
    fontSize: 22,

    letterSpacing: -0.5,

    fontWeight: "700",

    color: colors.text,
  },

  librarySubtitle: {
    marginTop: 3,

    fontSize: 11,

    color: colors.textSecondary,
  },

  countPill: {
    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,
  },

  countText: {
    fontSize: 9,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  filters: {
    gap: 8,

    paddingBottom: spacing.lg,
  },

  filter: {
    paddingHorizontal: 15,

    paddingVertical: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  filterSelected: {
    backgroundColor: colors.text,

    borderColor: colors.text,
  },

  filterText: {
    fontSize: 11,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.surface,
  },

  list: {
    gap: 14,
  },

  card: {
    position: "relative",

    overflow: "hidden",

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  accentBar: {
    position: "absolute",

    left: 0,
    top: 0,
    bottom: 0,

    width: 4,
  },

  cardBody: {
    paddingTop: 16,

    paddingRight: 16,

    paddingBottom: 12,

    paddingLeft: 19,
  },

  cardHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: spacing.sm,
  },

  cardMeta: {
    flex: 1,

    minWidth: 0,

    flexDirection: "row",

    alignItems: "center",
  },

  sourceMark: {
    width: 28,
    height: 28,

    marginRight: 9,

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",
  },

  category: {
    fontSize: 8,

    fontWeight: "800",

    letterSpacing: 0.7,
  },

  metaDot: {
    width: 3,
    height: 3,

    marginHorizontal: 6,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  source: {
    fontSize: 9,

    color: colors.textMuted,
  },

  cardTitle: {
    marginTop: 14,

    maxWidth: 310,

    fontSize: 17,

    lineHeight: 23,

    letterSpacing: -0.2,

    fontWeight: "700",

    color: colors.text,
  },

  cardFallback: {
    marginTop: 14,

    fontSize: 16,

    lineHeight: 22,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  cardUrl: {
    marginTop: 7,

    fontSize: 10,

    color: colors.textMuted,
  },

  cardDivider: {
    height: 1,

    marginTop: 16,

    backgroundColor: colors.divider,
  },

  createAction: {
    minHeight: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  createActionLeft: {
    flexDirection: "row",

    alignItems: "center",
  },

  sparkleMark: {
    width: 32,
    height: 32,

    marginRight: 10,

    borderRadius: 11,

    backgroundColor: colors.terracottaLight,

    alignItems: "center",

    justifyContent: "center",
  },

  createEyebrow: {
    fontSize: 7,

    letterSpacing: 0.8,

    fontWeight: "800",

    color: colors.textMuted,
  },

  createText: {
    marginTop: 2,

    fontSize: 12,

    fontWeight: "700",

    color: colors.terracotta,
  },

  emptyState: {
    alignItems: "center",

    paddingHorizontal: spacing.lg,

    paddingTop: 45,
  },

  emptyArt: {
    width: 90,
    height: 86,

    position: "relative",

    marginBottom: spacing.lg,
  },

  emptyArtBack: {
    position: "absolute",

    width: 57,
    height: 69,

    left: 10,
    top: 2,

    borderRadius: 18,

    backgroundColor: colors.terracottaLight,

    transform: [
      {
        rotate: "-8deg",
      },
    ],
  },

  emptyArtFront: {
    position: "absolute",

    width: 58,
    height: 69,

    right: 6,
    bottom: 2,

    borderRadius: 18,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",

    transform: [
      {
        rotate: "5deg",
      },
    ],
  },

  emptySpark: {
    position: "absolute",

    width: 30,
    height: 30,

    right: 0,
    top: 0,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  emptyTitle: {
    fontSize: 22,

    lineHeight: 28,

    letterSpacing: -0.5,

    fontWeight: "700",

    textAlign: "center",

    color: colors.text,
  },

  emptyText: {
    maxWidth: 290,

    marginTop: 8,

    fontSize: 13,

    lineHeight: 19,

    textAlign: "center",

    color: colors.textSecondary,
  },

  emptyButton: {
    minHeight: 50,

    marginTop: 24,

    paddingHorizontal: 20,

    borderRadius: 16,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    backgroundColor: colors.terracotta,
  },

  emptyButtonText: {
    fontSize: 13,

    fontWeight: "700",

    color: colors.surface,
  },

  emptyFilter: {
    alignItems: "center",

    paddingTop: 45,

    paddingHorizontal: spacing.lg,
  },

  emptyFilterMark: {
    width: 48,
    height: 48,

    borderRadius: 16,

    marginBottom: spacing.md,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyFilterTitle: {
    fontSize: 18,

    fontWeight: "700",

    color: colors.text,
  },

  emptyFilterText: {
    marginTop: 5,

    fontSize: 12,

    color: colors.textSecondary,
  },

  showAll: {
    marginTop: spacing.md,

    fontSize: 12,

    fontWeight: "700",

    color: colors.terracotta,
  },
});
