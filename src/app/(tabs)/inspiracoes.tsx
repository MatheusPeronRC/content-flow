import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../components/InspirationThumbnail";
import PlatformIcon from "../../components/PlatformIcon";

import { getInspirations } from "../../services/inspirationStorage";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

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

  const [search, setSearch] = useState("");

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
    const query = search.trim().toLowerCase();

    return inspirations.filter((item) => {
      const matchesFilter =
        selectedFilter === "Todas" || item.category === selectedFilter;

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        item.note,
        item.mediaTitle,
        item.authorName,
        item.source,
        item.category,
        item.url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [inspirations, selectedFilter, search]);

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

            <Text style={styles.subtitle}>Suas referências, sempre à mão.</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => router.push("/inspiracao/nova")}
          >
            <Ionicons
              name="bookmark-outline"
              size={17}
              color={colors.terracotta}
            />

            <Text style={styles.addButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchField}>
          <Ionicons
            name="search-outline"
            size={18}
            color={colors.textSecondary}
          />

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar inspirações..."
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
          />

          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearch("")}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {inspirations.length > 0 && (
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
        )}

        <View style={styles.libraryHeader}>
          <Text style={styles.libraryTitle}>Biblioteca</Text>

          {inspirations.length > 0 && (
            <Text style={styles.libraryCount}>
              {inspirations.length}{" "}
              {inspirations.length === 1 ? "salva" : "salvas"}
            </Text>
          )}
        </View>

        {inspirations.length === 0 ? (
          <EmptyState />
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.filterEmpty}>
            <Text style={styles.filterEmptyTitle}>Nada por aqui.</Text>

            <Text style={styles.filterEmptyText}>
              Tente outro filtro ou termo de busca.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredInspirations.map((inspiration) => (
              <InspirationGridCard
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

type InspirationGridCardProps = {
  inspiration: Inspiration;
  onOpen: () => void;
  onCreate: () => void;
};

function InspirationGridCard({
  inspiration,
  onOpen,
  onCreate,
}: InspirationGridCardProps) {
  const accent = getCategoryColor(inspiration.category);

  const overlayTitle =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  const cardCaption =
    inspiration.note?.trim() || inspiration.category || inspiration.source;

  return (
    <View style={styles.gridItem}>
      <TouchableOpacity
        style={styles.visualCard}
        activeOpacity={0.88}
        onPress={onOpen}
      >
        <InspirationThumbnail
          thumbnailUrl={inspiration.thumbnailUrl}
          source={inspiration.source}
          variant="wide"
          style={styles.gridThumbnail}
          showSourceBadge={false}
        />

        <View style={styles.overlayShade} />

        <View style={styles.overlayTop}>
          <View
            style={[
              styles.categoryBadge,
              {
                backgroundColor: accent.background,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryBadgeText,
                {
                  color: accent.foreground,
                },
              ]}
              numberOfLines={1}
            >
              {inspiration.category ?? inspiration.source}
            </Text>
          </View>

          <View style={styles.sourceBadge}>
            <PlatformIcon source={inspiration.source} size={14} />
          </View>
        </View>

        <View style={styles.overlayBottom}>
          <Text style={styles.overlayTitle} numberOfLines={3}>
            {overlayTitle}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.quickCreate}
          activeOpacity={0.82}
          onPress={(event) => {
            event.stopPropagation();
            onCreate();
          }}
        >
          <Ionicons name="sparkles" size={16} color={colors.terracotta} />
        </TouchableOpacity>
      </TouchableOpacity>

      <View style={styles.cardFooter}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardCaption} numberOfLines={1}>
            {cardCaption}
          </Text>

          <Text style={styles.cardMeta} numberOfLines={1}>
            {inspiration.source}
            {" · "}
            {formatRelativeDate(inspiration.createdAt)}
          </Text>
        </View>

        <TouchableOpacity style={styles.moreButton} onPress={onOpen}>
          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyArt}>
        <Ionicons name="images-outline" size={30} color={colors.rose} />
      </View>

      <Text style={styles.emptyTitle}>Comece seu acervo criativo.</Text>

      <Text style={styles.emptyText}>
        Salve referências para encontrá-las visualmente depois.
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

function formatRelativeDate(isoDate: string) {
  const created = new Date(isoDate);

  const today = new Date();

  const createdDay = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  );

  const todayDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const diffMs = todayDay.getTime() - createdDay.getTime();

  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  if (diffDays === 0) {
    return "Hoje";
  }

  if (diffDays === 1) {
    return "Há 1 dia";
  }

  if (diffDays < 30) {
    return `Há ${diffDays} dias`;
  }

  return created.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },

  header: {
    paddingTop: spacing.lg,
    paddingBottom: 18,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  title: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  subtitle: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  addButton: {
    minHeight: 42,
    marginTop: 2,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    borderWidth: 1,
    borderColor: "rgba(225, 116, 85, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  addButtonText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  searchField: {
    minHeight: 46,
    marginBottom: 13,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  clearSearch: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  filters: {
    gap: 8,
    paddingBottom: 22,
  },

  filter: {
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },

  filterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.surface,
  },

  libraryHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  libraryTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  libraryCount: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 22,
  },

  gridItem: {
    width: "48.3%",
  },

  visualCard: {
    width: "100%",
    aspectRatio: 0.8,
    position: "relative",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.surface,
    ...shadows.card,
  },

  gridThumbnail: {
    width: "100%",
    height: "100%",
    aspectRatio: undefined,
    borderRadius: 18,
  },

  overlayShade: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(24, 20, 18, 0.13)",
  },

  overlayTop: {
    position: "absolute",
    left: 9,
    right: 9,
    top: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  categoryBadge: {
    maxWidth: "72%",
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryBadgeText: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: fonts.bold,
  },

  sourceBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(31, 28, 26, 0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  overlayBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 11,
    paddingTop: 32,
    paddingBottom: 14,
    backgroundColor: "rgba(25, 21, 19, 0.48)",
  },

  overlayTitle: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  quickCreate: {
    position: "absolute",
    right: 9,
    bottom: 9,
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },

  cardFooter: {
    minHeight: 54,
    paddingTop: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  cardCaption: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  cardMeta: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  moreButton: {
    width: 30,
    height: 32,
    marginTop: 1,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    minHeight: 330,
    paddingTop: 48,
    alignItems: "center",
  },

  emptyArt: {
    width: 72,
    height: 72,
    marginBottom: 20,
    borderRadius: 22,
    backgroundColor: colors.roseLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 20,
    lineHeight: 27,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 280,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  emptyButton: {
    minHeight: 48,
    marginTop: 21,
    paddingHorizontal: 17,
    borderRadius: 15,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  emptyButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  filterEmpty: {
    minHeight: 180,
    paddingTop: 35,
    alignItems: "center",
  },

  filterEmptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  filterEmptyText: {
    maxWidth: 270,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
