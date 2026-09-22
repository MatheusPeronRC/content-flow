import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getInspirationById } from "../../services/inspirationStorage";
import { Inspiration } from "../../types/inspiration";

import {
    colors,
    radius,
    shadows,
    spacing,
    typography,
} from "../../constants/theme";

export default function CriarConteudoScreen() {
  const { inspirationId } = useLocalSearchParams<{
    inspirationId?: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(Boolean(inspirationId));

  useEffect(() => {
    async function loadInspiration() {
      if (!inspirationId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getInspirationById(inspirationId);

        setInspiration(data);
      } finally {
        setLoading(false);
      }
    }

    loadInspiration();
  }, [inspirationId]);

  function handleAdapt() {
    if (!inspiration) {
      return;
    }

    router.push({
      pathname: "/conteudo/adaptar",
      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  function handleManual() {
    router.push({
      pathname: "/conteudo/manual",
      params: inspirationId
        ? {
            inspirationId,
          }
        : {},
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Preparando sua referência...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={23} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Criar conteúdo</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.eyebrow}>NOVO CONTEÚDO</Text>

          <Text style={styles.title}>
            {inspiration
              ? "O que você quer fazer com essa inspiração?"
              : "Como você quer criar seu conteúdo?"}
          </Text>

          <Text style={styles.description}>
            {inspiration
              ? "Use a referência como ponto de partida sem precisar começar do zero."
              : "Você pode montar seu conteúdo manualmente e organizar o roteiro depois."}
          </Text>
        </View>

        {inspiration && (
          <View style={styles.referenceCard}>
            <View style={styles.referenceIcon}>
              <Ionicons name="bulb-outline" size={21} color={colors.primary} />
            </View>

            <View style={styles.referenceContent}>
              <Text style={styles.referenceLabel}>SUA REFERÊNCIA</Text>

              <Text numberOfLines={1} style={styles.referenceUrl}>
                {inspiration.url}
              </Text>

              {inspiration.note ? (
                <Text numberOfLines={2} style={styles.referenceNote}>
                  {inspiration.note}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        {inspiration && (
          <TouchableOpacity
            style={styles.primaryOption}
            activeOpacity={0.85}
            onPress={handleAdapt}
          >
            <View style={styles.primaryOptionIcon}>
              <Ionicons name="sparkles" size={23} color={colors.primary} />
            </View>

            <View style={styles.optionContent}>
              <View style={styles.recommendedRow}>
                <Text style={styles.primaryOptionTitle}>Adaptar para mim</Text>

                <View style={styles.recommendedBadge}>
                  <Text style={styles.recommendedText}>RECOMENDADO</Text>
                </View>
              </View>

              <Text style={styles.primaryOptionDescription}>
                Transforme essa referência em uma versão própria e mais fácil de
                produzir.
              </Text>
            </View>

            <Ionicons name="arrow-forward" size={20} color={colors.surface} />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.secondaryOption}
          activeOpacity={0.8}
          onPress={handleManual}
        >
          <View style={styles.secondaryOptionIcon}>
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </View>

          <View style={styles.optionContent}>
            <Text style={styles.secondaryOptionTitle}>Criar manualmente</Text>

            <Text style={styles.secondaryOptionDescription}>
              Já sei o que quero falar e prefiro montar minha ideia e roteiro.
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>

        {inspiration && (
          <View style={styles.tip}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={colors.primary}
            />

            <Text style={styles.tipText}>
              A ideia é usar a referência como inspiração, não reproduzir o
              conteúdo original palavra por palavra.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },

  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  closeButton: {
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

  intro: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  eyebrow: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  referenceCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },

  referenceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  referenceContent: {
    flex: 1,
  },

  referenceLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    color: colors.primary,
  },

  referenceUrl: {
    marginTop: 3,
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
  },

  referenceNote: {
    marginTop: 4,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  primaryOption: {
    minHeight: 116,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.card,
  },

  primaryOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  optionContent: {
    flex: 1,
  },

  recommendedRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  primaryOptionTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.surface,
  },

  primaryOptionDescription: {
    marginTop: 6,
    fontSize: typography.caption,
    lineHeight: 18,
    color: "#D7E3DE",
    paddingRight: spacing.sm,
  },

  recommendedBadge: {
    backgroundColor: "#41695E",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.round,
  },

  recommendedText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.6,
    color: colors.surface,
  },

  secondaryOption: {
    minHeight: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  secondaryOptionIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  secondaryOptionTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  secondaryOptionDescription: {
    marginTop: 4,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
    paddingRight: spacing.sm,
  },

  tip: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },

  tipText: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.textMuted,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
  },
});
