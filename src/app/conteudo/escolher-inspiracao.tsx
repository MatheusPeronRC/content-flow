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

const categories = [
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

export default function EscolherInspiracaoScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todas");
  const [selectedEffort, setSelectedEffort] = useState<EffortFilter>("all");
  const [filtersVisible, setFiltersVisible] = useState(false);

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

      return [
        item.note,
        item.mediaTitle,
        item.authorName,
        item.source,
        item.category,
        item.url,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [inspirations, search, selectedCategory, selectedEffort]);

  const hasActiveFilters =
    selectedCategory !== "Todas" || selectedEffort !== "all";

  function chooseInspiration(inspiration: Inspiration) {
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
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>
              CRIAR A PARTIR DE REFERÊNCIA
            </Text>

            <Text style={styles.headerTitle}>Escolher inspiração</Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>
            Qual ideia você quer transformar?
          </Text>

          <Text style={styles.introText}>
            Escolha uma referência salva. Na próxima etapa você decide o que
            vale aproveitar dela.
          </Text>
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
              placeholder="Buscar na sua biblioteca..."
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
              <Text style={styles.filterLabel}>CATEGORIA</Text>

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
              {categories.map((item) => {
                const selected = selectedCategory === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryFilter,
                      selected && styles.categoryFilterSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedCategory(item)}
                  >
                    <Text
                      style={[
                        styles.categoryFilterText,
                        selected && styles.categoryFilterTextSelected,
                      ]}
                    >
                      {item}
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

        <View style={styles.resultHeader}>
          <View>
            <Text style={styles.resultTitle}>Sua biblioteca</Text>

            <Text style={styles.resultSubtitle}>
              {filteredInspirations.length === 0
                ? "Nenhuma referência encontrada."
                : filteredInspirations.length === 1
                  ? "1 inspiração disponível."
                  : `${filteredInspirations.length} inspirações disponíveis.`}
            </Text>
          </View>

          <Text style={styles.resultCount}>{filteredInspirations.length}</Text>
        </View>

        {inspirations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="bookmark-outline"
                size={25}
                color={colors.terracotta}
              />
            </View>

            <Text style={styles.emptyTitle}>Sua biblioteca está vazia.</Text>

            <Text style={styles.emptyText}>
              Salve uma inspiração primeiro para transformá-la em conteúdo.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.85}
              onPress={() => router.push("/inspiracao/nova" as any)}
            >
              <Ionicons name="add" size={18} color={colors.surface} />

              <Text style={styles.emptyButtonText}>Salvar inspiração</Text>
            </TouchableOpacity>
          </View>
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.filterEmpty}>
            <View style={styles.filterEmptyIcon}>
              <Ionicons
                name="search-outline"
                size={22}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.filterEmptyTitle}>Nada com esses filtros.</Text>

            <Text style={styles.filterEmptyText}>
              Tente outra categoria, esforço ou termo de busca.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredInspirations.map((inspiration) => (
              <InspirationChoiceCard
                key={inspiration.id}
                inspiration={inspiration}
                onPress={() => chooseInspiration(inspiration)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InspirationChoiceCard({
  inspiration,
  onPress,
}: {
  inspiration: Inspiration;
  onPress: () => void;
}) {
  const title =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.87}
      onPress={onPress}
    >
      <View style={styles.cardVisual}>
        <InspirationThumbnail
          thumbnailUrl={inspiration.thumbnailUrl}
          source={inspiration.source}
          variant="wide"
          style={styles.thumbnail}
          showSourceBadge={false}
        />

        <View style={styles.platformBadge}>
          <PlatformIcon source={inspiration.source} size={15} />
        </View>

        <View style={styles.effortBadge}>
          <ProductionEffortBadge effort={inspiration.productionEffort} />
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.cardMeta} numberOfLines={1}>
          {inspiration.category ?? inspiration.authorName ?? inspiration.source}
        </Text>

        <View style={styles.chooseRow}>
          <Text style={styles.chooseText}>Usar esta ideia</Text>

          <View style={styles.chooseIcon}>
            <Ionicons
              name="arrow-forward"
              size={15}
              color={colors.terracotta}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 52,
  },

  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  headerSpace: {
    width: 40,
    height: 40,
  },

  intro: {
    paddingTop: 10,
    paddingBottom: 18,
  },

  introTitle: {
    maxWidth: 340,
    fontSize: 27,
    lineHeight: 34,
    letterSpacing: -0.7,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  introText: {
    maxWidth: 335,
    marginTop: 6,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
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
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
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

  filterLabel: {
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
    paddingBottom: 15,
  },

  categoryFilter: {
    minHeight: 35,
    paddingHorizontal: 12,
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
    paddingHorizontal: 11,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  effortFilterSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
  },

  effortFilterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  effortFilterTextSelected: {
    color: colors.terracotta,
  },

  resultHeader: {
    marginTop: 26,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 10,
  },

  resultTitle: {
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  resultSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  resultCount: {
    paddingBottom: 2,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },

  card: {
    width: "48.3%",
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  cardVisual: {
    position: "relative",
    width: "100%",
    aspectRatio: 1.12,
    overflow: "hidden",
    backgroundColor: colors.surfaceMuted,
  },

  thumbnail: {
    width: "100%",
    height: "100%",
    aspectRatio: undefined,
    borderRadius: 0,
  },

  platformBadge: {
    position: "absolute",
    left: 9,
    top: 9,
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.94)",
    alignItems: "center",
    justifyContent: "center",
  },

  effortBadge: {
    position: "absolute",
    left: 9,
    bottom: 9,
  },

  cardBody: {
    padding: 10,
  },

  cardTitle: {
    minHeight: 36,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  cardMeta: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  chooseRow: {
    marginTop: 9,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  chooseText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  chooseIcon: {
    width: 26,
    height: 26,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyState: {
    minHeight: 300,
    paddingTop: 46,
    alignItems: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    marginBottom: 15,
    borderRadius: 18,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
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
    minHeight: 220,
    paddingTop: 42,
    alignItems: "center",
  },

  filterEmptyIcon: {
    width: 50,
    height: 50,
    marginBottom: 12,
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
    maxWidth: 280,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
