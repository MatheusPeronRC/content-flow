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

import InspirationThumbnail from "../../components/InspirationThumbnail";

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

export default function EscolherInspiracaoScreen() {
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

  function chooseInspiration(inspiration: Inspiration) {
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
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Escolher inspiração</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.heroPanel}>
          <View style={styles.heroBubbleOne} />

          <View style={styles.heroBubbleTwo} />

          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={13} color={colors.rose} />

              <Text style={styles.heroBadgeText}>SUA BIBLIOTECA</Text>
            </View>

            <View style={styles.heroMark}>
              <Ionicons name="images" size={20} color={colors.surface} />
            </View>
          </View>

          <Text style={styles.title}>
            Qual referência você quer transformar?
          </Text>

          <Text style={styles.description}>
            Escolha algo que você salvou. Depois você decide o que quer
            aproveitar dela.
          </Text>
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
                  style={[styles.filter, selected && styles.filterSelected]}
                  activeOpacity={0.8}
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

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>Escolha uma referência</Text>

            <Text style={styles.listSubtitle}>
              {filteredInspirations.length === 0
                ? "Nada encontrado nesse filtro."
                : filteredInspirations.length === 1
                  ? "1 inspiração disponível."
                  : `${filteredInspirations.length} inspirações disponíveis.`}
            </Text>
          </View>

          {inspirations.length > 0 && (
            <View style={styles.countPill}>
              <Text style={styles.countText}>
                {filteredInspirations.length}
              </Text>
            </View>
          )}
        </View>

        {inspirations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMark}>
              <Ionicons name="bookmark-outline" size={25} color={colors.rose} />
            </View>

            <Text style={styles.emptyTitle}>
              Você ainda não salvou referências.
            </Text>

            <Text style={styles.emptyText}>
              Salve uma inspiração primeiro e volte aqui para transformá-la.
            </Text>

            <TouchableOpacity
              style={styles.emptyButton}
              activeOpacity={0.85}
              onPress={() => router.push("/inspiracao/nova")}
            >
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={colors.surface}
              />

              <Text style={styles.emptyButtonText}>Salvar inspiração</Text>
            </TouchableOpacity>
          </View>
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.filterEmpty}>
            <Text style={styles.filterEmptyTitle}>
              Nenhuma inspiração aqui.
            </Text>

            <Text style={styles.filterEmptyText}>Tente outra categoria.</Text>
          </View>
        ) : (
          <View style={styles.list}>
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

type InspirationChoiceCardProps = {
  inspiration: Inspiration;
  onPress: () => void;
};

function InspirationChoiceCard({
  inspiration,
  onPress,
}: InspirationChoiceCardProps) {
  const accent = getCategoryColor(inspiration.category);

  const title =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  const secondary =
    inspiration.note?.trim() && inspiration.note.trim() !== title
      ? inspiration.note.trim()
      : inspiration.authorName?.trim() || cleanUrl(inspiration.url);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          borderColor: accent.background,
        },
      ]}
      activeOpacity={0.87}
      onPress={onPress}
    >
      <View
        style={[
          styles.cardAccent,
          {
            backgroundColor: accent.foreground,
          },
        ]}
      />

      <InspirationThumbnail
        thumbnailUrl={inspiration.thumbnailUrl}
        source={inspiration.source}
        variant="compact"
        style={styles.thumbnail}
      />

      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.categoryPill,
              {
                backgroundColor: accent.background,
              },
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                {
                  color: accent.foreground,
                },
              ]}
              numberOfLines={1}
            >
              {inspiration.category ?? "Inspiração"}
            </Text>
          </View>

          <View style={styles.sourcePill}>
            <Ionicons
              name={getSourceIcon(inspiration.source)}
              size={11}
              color={colors.textSecondary}
            />

            <Text style={styles.sourceText} numberOfLines={1}>
              {inspiration.source}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {title}
        </Text>

        <Text style={styles.cardSecondary} numberOfLines={1}>
          {secondary}
        </Text>
      </View>

      <View
        style={[
          styles.chooseButton,
          {
            backgroundColor: accent.background,
          },
        ]}
      >
        <Ionicons name="arrow-forward" size={17} color={accent.foreground} />
      </View>
    </TouchableOpacity>
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

    case "Kwai":
      return "play-outline";

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

    paddingBottom: 50,
  },

  header: {
    height: 70,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  backButton: {
    width: 42,
    height: 42,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  headerTitle: {
    fontSize: 18,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  headerSpace: {
    width: 42,
  },

  heroPanel: {
    position: "relative",

    overflow: "hidden",

    marginTop: 12,

    marginBottom: 18,

    padding: 18,

    borderRadius: 25,

    backgroundColor: colors.roseLight,

    borderWidth: 1,

    borderColor: "rgba(207, 130, 149, 0.14)",

    ...shadows.soft,
  },

  heroBubbleOne: {
    position: "absolute",

    width: 102,
    height: 102,

    top: -40,
    right: -28,

    borderRadius: 51,

    backgroundColor: "rgba(225, 116, 85, 0.12)",
  },

  heroBubbleTwo: {
    position: "absolute",

    width: 70,
    height: 70,

    left: -24,
    bottom: -24,

    borderRadius: 35,

    backgroundColor: "rgba(142, 127, 194, 0.11)",
  },

  heroTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  heroBadge: {
    minHeight: 29,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: "rgba(255, 253, 252, 0.78)",

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  heroBadgeText: {
    fontSize: 9,

    letterSpacing: 0.75,

    fontFamily: fonts.bold,

    color: colors.rose,
  },

  heroMark: {
    width: 40,
    height: 40,

    borderRadius: 13,

    backgroundColor: colors.rose,

    alignItems: "center",

    justifyContent: "center",
  },

  title: {
    maxWidth: 310,

    marginTop: 14,

    fontSize: 27,

    lineHeight: 34,

    letterSpacing: -0.7,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  description: {
    maxWidth: 320,

    marginTop: 8,

    fontSize: 13,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  filters: {
    gap: 8,

    paddingVertical: 3,

    paddingBottom: 19,
  },

  filter: {
    minHeight: 38,

    paddingHorizontal: 15,

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

  listHeader: {
    marginBottom: 13,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",
  },

  listTitle: {
    fontSize: 21,

    lineHeight: 27,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  listSubtitle: {
    marginTop: 3,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  countPill: {
    minWidth: 34,

    height: 34,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  countText: {
    fontSize: 11,

    fontFamily: fonts.bold,

    color: colors.rose,
  },

  list: {
    gap: 10,
  },

  card: {
    minHeight: 112,

    position: "relative",

    overflow: "hidden",

    padding: 12,

    paddingLeft: 15,

    borderRadius: 20,

    borderWidth: 1,

    backgroundColor: colors.surface,

    flexDirection: "row",

    alignItems: "center",

    ...shadows.soft,
  },

  cardAccent: {
    position: "absolute",

    left: 0,
    top: 12,
    bottom: 12,

    width: 4,

    borderRadius: radius.round,
  },

  thumbnail: {
    width: 72,
    height: 88,

    borderRadius: 14,
  },

  cardContent: {
    flex: 1,

    minWidth: 0,

    marginLeft: 12,
  },

  cardMeta: {
    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  categoryPill: {
    minHeight: 23,

    maxWidth: 90,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  categoryText: {
    fontSize: 9,

    fontFamily: fonts.bold,
  },

  sourcePill: {
    minHeight: 23,

    maxWidth: 92,

    paddingHorizontal: 7,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    flexDirection: "row",

    alignItems: "center",

    gap: 4,
  },

  sourceText: {
    flexShrink: 1,

    fontSize: 9,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  cardTitle: {
    marginTop: 7,

    fontSize: 15,

    lineHeight: 21,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  cardSecondary: {
    marginTop: 5,

    paddingRight: 4,

    fontSize: 11,

    lineHeight: 16,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  chooseButton: {
    width: 36,
    height: 36,

    marginLeft: 8,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyState: {
    minHeight: 330,

    paddingTop: 42,

    alignItems: "center",
  },

  emptyMark: {
    width: 58,
    height: 58,

    marginBottom: 16,

    borderRadius: 18,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyTitle: {
    maxWidth: 290,

    fontSize: 19,

    lineHeight: 26,

    fontFamily: fonts.bold,

    color: colors.text,

    textAlign: "center",
  },

  emptyText: {
    maxWidth: 285,

    marginTop: 7,

    fontSize: 13,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,

    textAlign: "center",
  },

  emptyButton: {
    minHeight: 48,

    marginTop: 20,

    paddingHorizontal: 16,

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

    paddingTop: 34,

    alignItems: "center",
  },

  filterEmptyTitle: {
    fontSize: 18,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  filterEmptyText: {
    marginTop: 5,

    fontSize: 13,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },
});
