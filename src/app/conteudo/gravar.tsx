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

import { getContentById, updateContent } from "../../services/contentStorage";

import { ContentItem } from "../../types/content";

import { colors, radius, spacing, typography } from "../../constants/theme";

export default function GravarScreen() {
  const { contentId } = useLocalSearchParams<{
    contentId: string;
  }>();

  const [content, setContent] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadContent() {
      if (!contentId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getContentById(contentId);
        setContent(data);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentId]);

  async function handleCompleteRecording() {
    if (!content) {
      return;
    }

    await updateContent(content.id, {
      status: "editar",
    });

    router.replace("/");
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Preparando gravação...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Conteúdo não encontrado</Text>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const validPoints = content.script.points.filter(
    (point) => point.trim().length > 0,
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={23} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerLabel}>MODO GRAVAÇÃO</Text>

            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />

              <Text style={styles.liveText}>Preparado</Text>
            </View>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.contentHeader}>
            <Text style={styles.format}>{content.format ?? "Conteúdo"}</Text>

            <Text style={styles.idea}>{content.idea}</Text>
          </View>

          <View style={styles.hookCard}>
            <View style={styles.blockHeader}>
              <View style={styles.blockIcon}>
                <Ionicons
                  name="flash-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.blockLabel}>COMECE POR AQUI</Text>
            </View>

            <Text style={styles.hook}>
              {content.script.hook ||
                "Nenhum hook definido para este conteúdo."}
            </Text>
          </View>

          <View style={styles.pointsSection}>
            <Text style={styles.sectionTitle}>Pontos principais</Text>

            <Text style={styles.sectionDescription}>
              Use como guia. Não precisa decorar palavra por palavra.
            </Text>

            <View style={styles.points}>
              {validPoints.length > 0 ? (
                validPoints.map((point, index) => (
                  <View style={styles.point} key={`${index}-${point}`}>
                    <View style={styles.pointNumber}>
                      <Text style={styles.pointNumberText}>{index + 1}</Text>
                    </View>

                    <Text style={styles.pointText}>{point}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>
                  Nenhum ponto principal foi adicionado.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.ctaCard}>
            <View style={styles.ctaHeader}>
              <Ionicons
                name="megaphone-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.ctaLabel}>FINALIZE COM O CTA</Text>
            </View>

            <Text style={styles.ctaText}>
              {content.script.cta || "Nenhum CTA definido para este conteúdo."}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.editScriptButton}
            onPress={() =>
              router.push({
                pathname: "/conteudo/roteiro",
                params: {
                  contentId: content.id,
                },
              })
            }
          >
            <Ionicons name="create-outline" size={17} color={colors.primary} />

            <Text style={styles.editScriptText}>Ajustar roteiro</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.finishButton}
            activeOpacity={0.85}
            onPress={handleCompleteRecording}
          >
            <View style={styles.finishIcon}>
              <Ionicons name="checkmark" size={19} color={colors.primary} />
            </View>

            <Text style={styles.finishText}>Concluir gravação</Text>
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            O conteúdo avançará para a etapa de edição.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  header: {
    height: 68,
    paddingHorizontal: spacing.lg,
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

  headerCenter: {
    alignItems: "center",
  },

  headerLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.1,
    color: colors.text,
  },

  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 3,
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
    backgroundColor: colors.success,
  },

  liveText: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },

  headerSpace: {
    width: 40,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  contentHeader: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  format: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
  },

  idea: {
    marginTop: spacing.sm,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    color: colors.text,
  },

  hookCard: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },

  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  blockIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  blockLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: "#D7E3DE",
  },

  hook: {
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "700",
    color: colors.surface,
  },

  pointsSection: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  sectionDescription: {
    marginTop: 4,
    marginBottom: spacing.md,
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  points: {
    gap: spacing.sm,
  },

  point: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },

  pointNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  pointNumberText: {
    fontSize: typography.caption,
    fontWeight: "800",
    color: colors.primary,
  },

  pointText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 20,
    color: colors.text,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: typography.body,
  },

  ctaCard: {
    backgroundColor: colors.inspiration,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },

  ctaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  ctaLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
  },

  ctaText: {
    marginTop: spacing.md,
    fontSize: typography.subheading,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },

  editScriptButton: {
    marginTop: spacing.lg,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.sm,
  },

  editScriptText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.primary,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },

  finishButton: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  finishIcon: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  finishText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  footerHint: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.lg,
  },

  loadingText: {
    color: colors.textSecondary,
  },

  errorTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  backText: {
    color: colors.primary,
    fontWeight: "700",
  },
});
