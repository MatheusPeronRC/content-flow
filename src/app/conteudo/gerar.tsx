import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../components/InspirationThumbnail";
import PlatformIcon, { getPlatformMeta } from "../../components/PlatformIcon";

import { saveContent } from "../../services/contentStorage";

import { getInspirationById } from "../../services/inspirationStorage";

import { ContentItem, ContentReference } from "../../types/content";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

export default function GerarConteudoScreen() {
  const {
    inspirationId,
    referenceIdea = "",
    format = "Reel",
  } = useLocalSearchParams<{
    inspirationId?: string;
    referenceIdea?: string;
    format?: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadReference() {
      if (!inspirationId) {
        return;
      }

      try {
        const data = await getInspirationById(inspirationId);

        if (active) {
          setInspiration(data);
        }
      } catch (error) {
        console.error("Erro ao carregar referência da versão:", error);
      }
    }

    void loadReference();

    return () => {
      active = false;
    };
  }, [inspirationId]);

  const platformMeta = useMemo(
    () => getPlatformMeta(inspiration?.source ?? "Outro"),
    [inspiration?.source],
  );

  const startingIdea = useMemo(
    () => getStartingIdea(referenceIdea, inspiration),
    [referenceIdea, inspiration],
  );

  async function handleStartScript() {
    if (creating) {
      return;
    }

    try {
      setCreating(true);

      const now = new Date().toISOString();
      let savedInspiration = inspiration;

      if (inspirationId) {
        const latestInspiration = await getInspirationById(inspirationId);

        if (latestInspiration) {
          savedInspiration = latestInspiration;
        }
      }

      let reference: ContentReference | undefined;

      if (savedInspiration) {
        reference = {
          inspirationId: savedInspiration.id,
          url: savedInspiration.url,
          source: savedInspiration.source,
          category: savedInspiration.category,
          note: savedInspiration.note,
          productionEffort: savedInspiration.productionEffort ?? null,
          thumbnailUrl: savedInspiration.thumbnailUrl ?? null,
          mediaTitle: savedInspiration.mediaTitle ?? null,
          authorName: savedInspiration.authorName ?? null,
          metadataUpdatedAt: savedInspiration.metadataUpdatedAt ?? null,
        };
      }

      const content: ContentItem = {
        id: Date.now().toString(),
        inspirationId: inspirationId || undefined,
        reference,
        idea: getStartingIdea(referenceIdea, savedInspiration),
        format,
        objective: null,
        productionEffort: savedInspiration?.productionEffort ?? null,
        status: "roteiro",
        script: {
          hook: "",
          points: [],
          cta: "",
        },
        createdAt: now,
        updatedAt: now,
      };

      await saveContent(content);

      router.replace({
        pathname: "/conteudo/roteiro",
        params: {
          contentId: content.id,
        },
      });
    } catch (error) {
      console.error("Erro ao iniciar roteiro:", error);
    } finally {
      setCreating(false);
    }
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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/");
              }
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sua versão</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.resultIntro}>
          <View style={styles.stepRow}>
            <View style={styles.stepDone}>
              <Text style={styles.stepNumber}>2</Text>
            </View>

            <Text style={styles.stepText}>Sua versão</Text>
          </View>

          <Text style={styles.resultTitle}>
            Agora transforme a referência em algo seu.
          </Text>

          <Text style={styles.resultDescription}>
            O ContentFlow organiza a estrutura. A ideia, o jeito de explicar e
            as palavras continuam sendo suas.
          </Text>
        </View>

        <View style={styles.ideaSummary}>
          {inspiration ? (
            <InspirationThumbnail
              thumbnailUrl={inspiration.thumbnailUrl}
              source={inspiration.source}
              variant="compact"
              style={styles.ideaThumbnail}
            />
          ) : (
            <View style={styles.ideaFallback}>
              <Ionicons
                name="bulb-outline"
                size={21}
                color={colors.terracotta}
              />
            </View>
          )}

          <View style={styles.ideaContent}>
            <View style={styles.ideaMeta}>
              <Text style={styles.ideaLabel}>SEU PONTO DE PARTIDA</Text>

              <View style={styles.formatPill}>
                <Text style={styles.formatText}>{format}</Text>
              </View>
            </View>

            <Text style={styles.ideaTitle} numberOfLines={3}>
              {startingIdea}
            </Text>

            {inspiration ? (
              <View style={styles.originRow}>
                <PlatformIcon source={inspiration.source} size={12} />

                <Text
                  style={[
                    styles.originText,
                    {
                      color: platformMeta.brandColor,
                    },
                  ]}
                >
                  Inspirado em {inspiration.source}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.guideHeading}>
          <Text style={styles.guideEyebrow}>SEU ROTEIRO</Text>

          <Text style={styles.guideTitle}>Construa em três partes.</Text>

          <Text style={styles.guideDescription}>
            Você não precisa escrever tudo de uma vez. Use cada bloco como uma
            pergunta para organizar o que quer dizer.
          </Text>
        </View>

        <View style={styles.guideCard}>
          <GuideItem
            icon="flash-outline"
            label="HOOK"
            title="Como você quer começar?"
            description="Pense na frase, pergunta ou situação que faria seu público parar para prestar atenção."
            color={colors.terracotta}
          />

          <View style={styles.guideDivider} />

          <GuideItem
            icon="list-outline"
            label="DESENVOLVIMENTO"
            title="O que precisa ser explicado?"
            description="Quebre sua ideia em pontos simples e coloque-os na ordem em que você falaria."
            color={colors.amber}
          />

          <View style={styles.guideDivider} />

          <GuideItem
            icon="megaphone-outline"
            label="CTA"
            title="Como você quer terminar?"
            description="Se fizer sentido, escolha uma ação: salvar, comentar, compartilhar, clicar ou entrar em contato."
            color={colors.sage}
          />
        </View>

        <View style={styles.manualNote}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors.textMuted}
          />

          <Text style={styles.manualNoteText}>
            Hook e CTA são opcionais. O importante é transformar a referência em
            um conteúdo que pareça seu.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.startButton, creating && styles.startButtonDisabled]}
          activeOpacity={0.86}
          disabled={creating}
          onPress={handleStartScript}
        >
          <View style={styles.startButtonIcon}>
            {creating ? (
              <ActivityIndicator size="small" color={colors.terracotta} />
            ) : (
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.terracotta}
              />
            )}
          </View>

          <View style={styles.startButtonCopy}>
            <Text style={styles.startButtonTitle}>
              {creating ? "Preparando roteiro..." : "Começar meu roteiro"}
            </Text>

            <Text style={styles.startButtonHint}>
              Abrir o editor com uma estrutura em branco
            </Text>
          </View>

          {!creating ? (
            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          ) : null}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function GuideItem({
  icon,
  label,
  title,
  description,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <View style={styles.guideItem}>
      <View style={styles.guideItemTop}>
        <View style={[styles.guideIcon, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={17} color={color} />
        </View>

        <Text style={[styles.guideLabel, { color }]}>{label}</Text>
      </View>

      <Text style={styles.guideItemTitle}>{title}</Text>

      <Text style={styles.guideItemDescription}>{description}</Text>
    </View>
  );
}

function getStartingIdea(
  referenceIdea: string,
  inspiration: Inspiration | null,
) {
  const candidates = [
    referenceIdea,
    inspiration?.note,
    inspiration?.mediaTitle,
  ];

  const selected =
    candidates.find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    ) ?? "Novo conteúdo";

  return shorten(selected);
}

function shorten(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= 80) {
    return clean;
  }

  return `${clean.slice(0, 77)}...`;
}

const styles = StyleSheet.create({
  guideHeading: {
    marginBottom: 12,
  },

  guideEyebrow: {
    fontSize: 11,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  guideTitle: {
    marginTop: 3,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  guideDescription: {
    maxWidth: 340,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  guideCard: {
    paddingHorizontal: 16,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  guideItem: {
    paddingVertical: 17,
  },

  guideItemTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  guideIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  guideLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
  },

  guideItemTitle: {
    marginTop: 10,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  guideItemDescription: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  guideDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  manualNote: {
    marginTop: 12,
    paddingHorizontal: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  manualNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  startButton: {
    minHeight: 64,
    marginTop: 24,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  startButtonDisabled: {
    opacity: 0.68,
  },

  startButtonIcon: {
    width: 37,
    height: 37,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  startButtonCopy: {
    flex: 1,
    minWidth: 0,
  },

  startButtonTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  startButtonHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.78)",
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 48,
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

  resultIntro: {
    marginTop: 18,
    marginBottom: 18,
  },

  resultTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  stepDone: {
    width: 30,
    height: 30,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  stepNumber: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  stepText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  versionControl: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  versionLabel: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  resultTitle: {
    maxWidth: 335,
    marginTop: 14,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  resultDescription: {
    maxWidth: 335,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  ideaSummary: {
    minHeight: 108,
    marginBottom: 24,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  ideaThumbnail: {
    width: 68,
    height: 84,
    borderRadius: 13,
  },

  ideaFallback: {
    width: 68,
    height: 68,
    borderRadius: 15,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  ideaContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  ideaMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  ideaLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  formatPill: {
    minHeight: 25,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  formatText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  ideaTitle: {
    marginTop: 7,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  originRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  originText: {
    fontSize: 11,
    fontFamily: fonts.medium,
  },

  scriptHeading: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  scriptEyebrow: {
    fontSize: 13,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  scriptTitle: {
    maxWidth: 260,
    marginTop: 3,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  scriptCount: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  scriptCountText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  document: {
    paddingHorizontal: 17,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  scriptBlock: {
    paddingVertical: 18,
  },

  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  blockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  blockDot: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
  },

  blockLabel: {
    fontSize: 11,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
  },

  blockHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  blockHint: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  blockContent: {
    marginTop: 13,
  },

  hookText: {
    fontSize: 19,
    lineHeight: 29,
    letterSpacing: -0.2,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  documentDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  points: {
    gap: 14,
  },

  point: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pointNumber: {
    width: 28,
    paddingTop: 2,
    fontSize: 11,
    letterSpacing: 0.4,
    fontFamily: fonts.bold,
    color: colors.amber,
  },

  pointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  ctaText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  actions: {
    marginTop: 26,
  },

  actionsLabel: {
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  useButton: {
    minHeight: 62,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  useButtonMark: {
    width: 35,
    height: 35,
    marginRight: 10,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  useButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  useButtonHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.72)",
  },

  editButton: {
    minHeight: 62,
    marginTop: 9,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  secondaryActionIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  editButtonText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editButtonHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  regenerateButton: {
    minHeight: 44,
    marginTop: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  regenerateButtonText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },
});
