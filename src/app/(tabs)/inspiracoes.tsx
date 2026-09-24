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
import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

import { getInspirations } from "../../services/inspirationStorage";

import { Inspiration } from "../../types/inspiration";
import { ProductionEffort } from "../../types/productionEffort";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const categoryFilters = [
  "Todas",
  "Hook",
  "Tema",
  "Roteiro",
  "Formato",
  "Edição",
  "CTA",
];

type EffortFilter = "all" | ProductionEffort;

const effortFilters: Array<{
  value: EffortFilter;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "all", label: "Todos" },
  { value: "quick", label: "Rápidos", icon: "flash-outline" },
  { value: "medium", label: "Médios", icon: "time-outline" },
  { value: "demanding", label: "Demorados", icon: "layers-outline" },
];

export default function InspirationsScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedEffort, setSelectedEffort] = useState<EffortFilter>("all");
  const [search, setSearch] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(true);

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

      void load();

      return () => {
        active = false;
      };
    }, []),
  );

  const filteredInspirations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return inspirations.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas" || item.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      const matchesEffort =
        selectedEffort === "all" || item.productionEffort === selectedEffort;

      if (!matchesEffort) {
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
  }, [inspirations, selectedCategory, selectedEffort, search]);

  const hasActiveFilters =
    selectedCategory !== "Todas" || selectedEffort !== "all";

  function openInspiration(inspiration: Inspiration) {
    router.push(`/inspiracao/${inspiration.id}` as any);
  }

  function createFromInspiration(inspiration: Inspiration) {
    router.push({
      pathname: "/conteudo/adaptar",
      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  function clearFilters() {
    setSelectedCategory("Todas");
    setSelectedEffort("all");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Inspirações</Text>

            <Text style={styles.subtitle}>
              Encontre referências e transforme em conteúdos com a sua
              identidade.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.saveButton}
            activeOpacity={0.86}
            onPress={() => router.push("/inspiracao/nova" as any)}
          >
            <Ionicons name="add" size={18} color={colors.surface} />

            <Text style={styles.saveButtonText}>Salvar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Ionicons
              name="search-outline"
              size={19}
              color={colors.textSecondary}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar inspirações..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />

            {search.length > 0 ? (
              <TouchableOpacity
                style={styles.clearSearch}
                activeOpacity={0.8}
                onPress={() => setSearch("")}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              (filtersVisible || hasActiveFilters) && styles.filterButtonActive,
            ]}
            activeOpacity={0.82}
            onPress={() => setFiltersVisible((current) => !current)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={
                filtersVisible || hasActiveFilters
                  ? colors.terracotta
                  : colors.text
              }
            />
          </TouchableOpacity>
        </View>

        {filtersVisible && inspirations.length > 0 ? (
          <View style={styles.filtersPanel}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersLabel}>CATEGORIA</Text>

              {hasActiveFilters ? (
                <TouchableOpacity activeOpacity={0.8} onPress={clearFilters}>
                  <Text style={styles.clearFiltersText}>Limpar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryFilters}
            >
              {categoryFilters.map((filter) => {
                const selected = selectedCategory === filter;

                return (
                  <TouchableOpacity
                    key={filter}
                    style={[
                      styles.categoryFilter,
                      selected && styles.categoryFilterSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(filter)}
                  >
                    <Text
                      style={[
                        styles.categoryFilterText,
                        selected && styles.categoryFilterTextSelected,
                      ]}
                    >
                      {filter}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={styles.effortLabel}>ESFORÇO</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.effortFilters}
            >
              {effortFilters.map((filter) => {
                const selected = selectedEffort === filter.value;

                return (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.effortFilter,
                      selected && styles.effortFilterSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedEffort(filter.value)}
                  >
                    {filter.icon ? (
                      <Ionicons
                        name={filter.icon}
                        size={14}
                        color={
                          selected ? colors.terracotta : colors.textSecondary
                        }
                      />
                    ) : null}

                    <Text
                      style={[
                        styles.effortFilterText,
                        selected && styles.effortFilterTextSelected,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={styles.libraryHeader}>
          <Text style={styles.libraryTitle}>Sua biblioteca</Text>

          {inspirations.length > 0 ? (
            <Text style={styles.libraryCount}>
              {filteredInspirations.length}{" "}
              {filteredInspirations.length === 1 ? "referência" : "referências"}
            </Text>
          ) : null}
        </View>

        {inspirations.length === 0 ? (
          <EmptyState />
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.filterEmpty}>
            <View style={styles.filterEmptyIcon}>
              <Ionicons
                name="search-outline"
                size={22}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.filterEmptyTitle}>Nada por aqui.</Text>

            <Text style={styles.filterEmptyText}>
              Tente outro filtro ou termo de busca.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
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

function InspirationCard({
  inspiration,
  onOpen,
  onCreate,
}: {
  inspiration: Inspiration;
  onOpen: () => void;
  onCreate: () => void;
}) {
  const title =
    inspiration.note?.trim() ||
    inspiration.mediaTitle?.trim() ||
    `Referência do ${inspiration.source}`;

  return (
    <View style={styles.gridItem}>
      <TouchableOpacity
        style={styles.cardVisual}
        activeOpacity={0.88}
        onPress={onOpen}
      >
        <InspirationThumbnail
          thumbnailUrl={inspiration.thumbnailUrl}
          source={inspiration.source}
          variant="wide"
          style={styles.thumbnail}
          showSourceBadge={false}
        />

        <View style={styles.platformBadge}>
          <PlatformIcon source={inspiration.source} size={16} />
        </View>

        <TouchableOpacity
          style={styles.quickAction}
          activeOpacity={0.82}
          onPress={(event) => {
            event.stopPropagation();
            onCreate();
          }}
        >
          <Ionicons name="sparkles-outline" size={16} color={colors.surface} />
        </TouchableOpacity>

        <View style={styles.effortOverlay}>
          <ProductionEffortBadge effort={inspiration.productionEffort} />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cardBody}
        activeOpacity={0.86}
        onPress={onOpen}
      >
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {inspiration.category ?? inspiration.source}
            {" · "}
            {formatRelativeDate(inspiration.createdAt)}
          </Text>

          <Ionicons
            name="ellipsis-vertical"
            size={16}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="images-outline" size={26} color={colors.terracotta} />
      </View>

      <Text style={styles.emptyTitle}>Comece seu acervo criativo.</Text>

      <Text style={styles.emptyText}>
        Salve referências para encontrá-las visualmente depois.
      </Text>

      <TouchableOpacity
        style={styles.emptyButton}
        activeOpacity={0.85}
        onPress={() => router.push("/inspiracao/nova" as any)}
      >
        <Ionicons name="add" size={18} color={colors.surface} />

        <Text style={styles.emptyButtonText}>Salvar primeira referência</Text>
      </TouchableOpacity>
    </View>
  );
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

  return created
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "");
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
    paddingTop: 20,
    paddingBottom: 19,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  title: {
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  subtitle: {
    maxWidth: 285,
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  saveButton: {
    minHeight: 42,
    marginTop: 2,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  saveButtonText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchField: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13,
    lineHeight: 19,
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

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  filtersPanel: {
    marginTop: 12,
  },

  filtersHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  filtersLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  clearFiltersText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  categoryFilters: {
    gap: 7,
    paddingBottom: 16,
  },

  categoryFilter: {
    minHeight: 35,
    paddingHorizontal: 13,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryFilterSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  categoryFilterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  categoryFilterTextSelected: {
    color: colors.surface,
  },

  effortLabel: {
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  effortFilters: {
    gap: 7,
    paddingBottom: 3,
  },

  effortFilter: {
    minHeight: 35,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  effortFilterSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  effortFilterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  effortFilterTextSelected: {
    color: colors.terracotta,
  },

  libraryHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },

  libraryTitle: {
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  libraryCount: {
    paddingBottom: 2,
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 18,
  },

  gridItem: {
    width: "48.3%",
  },

  cardVisual: {
    position: "relative",
    width: "100%",
    aspectRatio: 1.05,
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    aspectRatio: undefined,
    borderRadius: 17,
  },

  platformBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },

  quickAction: {
    position: "absolute",
    right: 9,
    top: 9,
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(31,28,26,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  effortOverlay: {
    position: "absolute",
    left: 9,
    bottom: 9,
  },

  cardBody: {
    paddingTop: 8,
  },

  cardTitle: {
    minHeight: 36,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  cardFooter: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  cardMeta: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  emptyState: {
    minHeight: 320,
    paddingTop: 48,
    alignItems: "center",
  },

  emptyIcon: {
    width: 62,
    height: 62,
    marginBottom: 16,
    borderRadius: 19,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 280,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  emptyButton: {
    minHeight: 46,
    marginTop: 18,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  emptyButtonText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  filterEmpty: {
    minHeight: 230,
    paddingTop: 44,
    alignItems: "center",
  },

  filterEmptyIcon: {
    width: 50,
    height: 50,
    marginBottom: 13,
    borderRadius: 16,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  filterEmptyTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  filterEmptyText: {
    maxWidth: 270,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
