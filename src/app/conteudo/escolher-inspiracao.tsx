import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";

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
  "Roteiro",
  "Formato",
  "Edição",
  "CTA",
];

export default function ChooseInspirationScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  const [selectedFilter, setSelectedFilter] = useState("Todas");

  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
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

  function handleSelect(inspiration: Inspiration) {
    router.push({
      pathname: "/conteudo/adaptar",

      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.rose} />

          <Text style={styles.loadingText}>Carregando suas inspirações...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Escolher inspiração</Text>

        <View style={styles.headerSpace} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.intro}>
          <View style={styles.introIcon}>
            <Ionicons name="sparkles-outline" size={24} color={colors.rose} />
          </View>

          <Text style={styles.title}>
            Qual referência você quer transformar?
          </Text>

          <Text style={styles.description}>
            Escolha uma inspiração salva. Depois você decide o que quer
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

        {inspirations.length === 0 ? (
          <EmptyInspirations />
        ) : filteredInspirations.length === 0 ? (
          <View style={styles.emptyFilter}>
            <Ionicons
              name="filter-outline"
              size={24}
              color={colors.textMuted}
            />

            <Text style={styles.emptyFilterTitle}>
              Nenhuma inspiração nessa categoria
            </Text>

            <TouchableOpacity onPress={() => setSelectedFilter("Todas")}>
              <Text style={styles.showAllText}>Mostrar todas</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inspirationList}>
            {filteredInspirations.map((inspiration) => (
              <InspirationOption
                key={inspiration.id}
                inspiration={inspiration}
                onPress={() => handleSelect(inspiration)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type InspirationOptionProps = {
  inspiration: Inspiration;

  onPress: () => void;
};

function InspirationOption({ inspiration, onPress }: InspirationOptionProps) {
  const color = getCategoryColor(inspiration.category);

  const hasNote = inspiration.note.trim().length > 0;

  return (
    <TouchableOpacity
      style={styles.inspirationCard}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View
        style={[
          styles.cardIcon,

          {
            backgroundColor: color.background,
          },
        ]}
      >
        <Ionicons
          name={getSourceIcon(inspiration.source)}
          size={23}
          color={color.foreground}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text
            style={[
              styles.category,

              {
                color: color.foreground,
              },
            ]}
          >
            {inspiration.category?.toUpperCase() ?? "INSPIRAÇÃO"}
          </Text>

          <Text style={styles.source}>{inspiration.source}</Text>
        </View>

        <Text style={styles.cardTitle} numberOfLines={3}>
          {hasNote ? inspiration.note : `Referência do ${inspiration.source}`}
        </Text>

        <Text style={styles.cardUrl} numberOfLines={1}>
          {cleanUrl(inspiration.url)}
        </Text>
      </View>

      <View style={styles.selectIcon}>
        <Ionicons name="arrow-forward" size={17} color={colors.rose} />
      </View>
    </TouchableOpacity>
  );
}

function EmptyInspirations() {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bookmark-outline" size={29} color={colors.rose} />
      </View>

      <Text style={styles.emptyTitle}>
        Você ainda não salvou nenhuma inspiração
      </Text>

      <Text style={styles.emptyText}>
        Salve uma referência primeiro ou comece um conteúdo do zero.
      </Text>

      <TouchableOpacity
        style={styles.saveInspirationButton}
        onPress={() => router.push("/inspiracao/nova")}
      >
        <Ionicons name="bookmark-outline" size={18} color={colors.surface} />

        <Text style={styles.saveInspirationText}>Salvar inspiração</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.startFromScratch}
        onPress={() => router.replace("/conteudo/manual")}
      >
        <Text style={styles.startFromScratchText}>Começar do zero</Text>
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

  header: {
    height: 68,

    paddingHorizontal: spacing.lg,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
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

  headerTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  headerSpace: {
    width: 40,
  },

  content: {
    paddingHorizontal: spacing.lg,

    paddingBottom: spacing.xxl,
  },

  intro: {
    paddingTop: spacing.md,

    paddingBottom: spacing.lg,
  },

  introIcon: {
    width: 48,
    height: 48,

    borderRadius: radius.md,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,
  },

  title: {
    maxWidth: 330,

    fontSize: 28,

    lineHeight: 34,

    fontWeight: "700",

    color: colors.text,
  },

  description: {
    maxWidth: 350,

    marginTop: spacing.sm,

    fontSize: typography.body,

    lineHeight: 21,

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

  inspirationList: {
    gap: spacing.sm,
  },

  inspirationCard: {
    minHeight: 104,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,

    ...shadows.card,
  },

  cardIcon: {
    width: 48,
    height: 62,

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

    gap: spacing.sm,
  },

  category: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 0.6,
  },

  source: {
    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  cardTitle: {
    marginTop: 5,

    fontSize: typography.body,

    lineHeight: 20,

    fontWeight: "600",

    color: colors.text,
  },

  cardUrl: {
    marginTop: 5,

    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  selectIcon: {
    width: 34,
    height: 34,

    marginLeft: spacing.sm,

    borderRadius: radius.round,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyContainer: {
    alignItems: "center",

    paddingHorizontal: spacing.lg,

    paddingTop: spacing.xl,
  },

  emptyIcon: {
    width: 64,
    height: 64,

    borderRadius: radius.xl,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,
  },

  emptyTitle: {
    maxWidth: 290,

    textAlign: "center",

    fontSize: typography.heading,

    lineHeight: 26,

    fontWeight: "700",

    color: colors.text,
  },

  emptyText: {
    maxWidth: 300,

    marginTop: spacing.sm,

    textAlign: "center",

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,
  },

  saveInspirationButton: {
    minWidth: 220,

    height: 50,

    marginTop: spacing.xl,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.rose,
  },

  saveInspirationText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  startFromScratch: {
    marginTop: spacing.md,

    padding: spacing.sm,
  },

  startFromScratchText: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.primary,
  },

  emptyFilter: {
    alignItems: "center",

    paddingVertical: spacing.xxl,

    gap: spacing.sm,
  },

  emptyFilterTitle: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  showAllText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.primary,
  },

  center: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
  },
});
