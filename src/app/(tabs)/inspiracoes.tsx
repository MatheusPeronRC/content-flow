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

import { colors, radius, spacing, typography } from "../../constants/theme";

const filters = ["Todas", "Reels", "Hooks", "Edição", "Tema"];

export default function InspiracoesScreen() {
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}

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

        {/* FILTROS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter, index) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filter, index === 0 && styles.filterActive]}
            >
              <Text
                style={[
                  styles.filterText,
                  index === 0 && styles.filterTextActive,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* CONTEÚDO */}

        <Text style={styles.sectionTitle}>Salvos recentemente</Text>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />

            <Text style={styles.loadingText}>Carregando inspirações...</Text>
          </View>
        ) : inspirations.length === 0 ? (
          <EmptyState />
        ) : (
          inspirations.map((inspiration) => (
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
  return (
    <View style={styles.card}>
      <View style={styles.preview}>
        <Ionicons
          name={
            inspiration.source === "TikTok"
              ? "musical-note-outline"
              : "videocam-outline"
          }
          size={27}
          color={colors.primary}
        />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardTop}>
          <Text style={styles.category}>
            {inspiration.category?.toUpperCase() ?? "SEM CATEGORIA"}
          </Text>

          <Ionicons
            name="ellipsis-horizontal"
            size={18}
            color={colors.textMuted}
          />
        </View>

        <Text style={styles.cardUrl} numberOfLines={2}>
          {inspiration.url}
        </Text>

        {inspiration.note ? (
          <Text style={styles.note} numberOfLines={3}>
            {inspiration.note}
          </Text>
        ) : (
          <Text style={styles.noNote}>Sem anotação</Text>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.sourceContainer}>
            <Ionicons
              name="logo-instagram"
              size={13}
              color={colors.textMuted}
            />

            <Text style={styles.source}>{inspiration.source}</Text>
          </View>

          <TouchableOpacity style={styles.createButton}>
            <Text style={styles.createButtonText}>Criar minha versão</Text>

            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="bulb-outline" size={30} color={colors.primary} />
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
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  filterActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
  },

  preview: {
    width: 68,
    height: 90,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  cardContent: {
    flex: 1,
  },

  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  category: {
    fontSize: typography.tiny,
    fontWeight: "800",
    color: colors.primary,
  },

  cardUrl: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
    marginTop: spacing.xs,
    lineHeight: 19,
  },

  note: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 17,
  },

  noNote: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },

  sourceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  source: {
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  createButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },

  emptyState: {
    backgroundColor: colors.surface,
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
    backgroundColor: colors.primaryLight,
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
    backgroundColor: colors.primary,
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
});
