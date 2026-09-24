import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../components/InspirationThumbnail";
import PlatformIcon from "../../components/PlatformIcon";
import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

import { saveContent } from "../../services/contentStorage";
import { getInspirationById } from "../../services/inspirationStorage";

import { ContentItem, ContentReference } from "../../types/content";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

type GeneratedScript = {
  title: string;
  hook: string;
  points: string[];
  cta: string;
};

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

  const [variation, setVariation] = useState(0);
  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

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

  const script = useMemo(
    () => generateMockScript(referenceIdea, format, variation),
    [referenceIdea, format, variation],
  );

  async function createContent(status: "roteiro" | "gravar") {
    const now = new Date().toISOString();

    let reference: ContentReference | undefined;

    let inheritedProductionEffort = inspiration?.productionEffort ?? null;

    if (inspirationId) {
      const savedInspiration = await getInspirationById(inspirationId);

      if (savedInspiration) {
        inheritedProductionEffort =
          savedInspiration.productionEffort ?? inheritedProductionEffort;

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
    }

    const content: ContentItem = {
      id: Date.now().toString(),
      inspirationId: inspirationId || undefined,
      reference,
      idea: script.title,
      format,
      objective: null,
      productionEffort: inheritedProductionEffort,
      status,
      script: {
        hook: script.hook,
        points: script.points,
        cta: script.cta,
      },
      createdAt: now,
      updatedAt: now,
    };

    await saveContent(content);

    return content;
  }

  async function handleUseScript() {
    const content = await createContent("gravar");

    router.replace({
      pathname: "/conteudo/[id]",
      params: {
        id: content.id,
      },
    });
  }

  async function handleEditScript() {
    const content = await createContent("roteiro");

    router.replace({
      pathname: "/conteudo/roteiro",
      params: {
        contentId: content.id,
      },
    });
  }

  function handleGenerateAgain() {
    setVariation((current) => (current === 2 ? 0 : current + 1));
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

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SUA VERSÃO</Text>

            <Text style={styles.headerTitle}>Uma primeira estrutura</Text>
          </View>

          <TouchableOpacity
            style={styles.versionButton}
            activeOpacity={0.8}
            onPress={handleGenerateAgain}
          >
            <Text style={styles.versionText}>V{variation + 1}</Text>

            <Ionicons
              name="refresh-outline"
              size={14}
              color={colors.terracotta}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.resultIntro}>
          <View style={styles.doneMark}>
            <Ionicons name="checkmark" size={16} color={colors.surface} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.resultTitle}>
              Sua primeira versão está pronta.
            </Text>

            <Text style={styles.resultText}>
              Use como ponto de partida. Você pode seguir, editar ou
              experimentar outra versão.
            </Text>
          </View>
        </View>

        <View style={styles.ideaCard}>
          {inspiration ? (
            <InspirationThumbnail
              thumbnailUrl={inspiration.thumbnailUrl}
              source={inspiration.source}
              variant="compact"
              style={styles.ideaThumbnail}
              showSourceBadge={false}
            />
          ) : (
            <View style={styles.ideaFallback}>
              <Ionicons
                name="sparkles-outline"
                size={21}
                color={colors.terracotta}
              />
            </View>
          )}

          <View style={styles.ideaMain}>
            <View style={styles.ideaMeta}>
              <View style={styles.formatPill}>
                <Text style={styles.formatText}>{format}</Text>
              </View>

              {inspiration ? (
                <ProductionEffortBadge
                  effort={inspiration.productionEffort}
                  subtle
                />
              ) : null}
            </View>

            <Text style={styles.ideaTitle} numberOfLines={3}>
              {script.title}
            </Text>

            {inspiration ? (
              <View style={styles.originRow}>
                <PlatformIcon source={inspiration.source} size={12} />

                <Text style={styles.originText}>
                  Inspirado em {inspiration.source}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.scriptHeader}>
          <View>
            <Text style={styles.scriptLabel}>ROTEIRO</Text>

            <Text style={styles.scriptTitle}>Estrutura sugerida</Text>
          </View>

          <Text style={styles.blockCount}>
            {script.points.length + 2} blocos
          </Text>
        </View>

        <View style={styles.document}>
          <ScriptBlock icon="flash-outline" label="HOOK" hint="Como começar">
            <Text style={styles.hookText}>{script.hook}</Text>
          </ScriptBlock>

          <View style={styles.divider} />

          <ScriptBlock
            icon="list-outline"
            label="DESENVOLVIMENTO"
            hint="O que falar"
          >
            <View style={styles.points}>
              {script.points.map((point, index) => (
                <View key={`${index}-${point}`} style={styles.point}>
                  <Text style={styles.pointNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>

                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </ScriptBlock>

          <View style={styles.divider} />

          <ScriptBlock
            icon="megaphone-outline"
            label="CTA"
            hint="Como terminar"
          >
            <Text style={styles.ctaText}>{script.cta}</Text>
          </ScriptBlock>
        </View>

        <View style={styles.actionsHeader}>
          <Text style={styles.actionsTitle}>O que você quer fazer?</Text>

          <Text style={styles.actionsSubtitle}>Nada aqui é definitivo.</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryAction}
          activeOpacity={0.86}
          onPress={handleUseScript}
        >
          <View style={styles.primaryActionIcon}>
            <Ionicons name="checkmark" size={17} color={colors.terracotta} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.primaryActionTitle}>Usar este roteiro</Text>

            <Text style={styles.primaryActionHint}>Seguir para produção</Text>
          </View>

          <Ionicons name="arrow-forward" size={18} color={colors.surface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryAction}
          activeOpacity={0.82}
          onPress={handleEditScript}
        >
          <View style={styles.secondaryActionIcon}>
            <Ionicons name="create-outline" size={17} color={colors.text} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.secondaryActionTitle}>
              Editar antes de usar
            </Text>

            <Text style={styles.secondaryActionHint}>
              Abrir no editor de roteiro
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={17} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.regenerateAction}
          activeOpacity={0.8}
          onPress={handleGenerateAgain}
        >
          <Ionicons
            name="refresh-outline"
            size={16}
            color={colors.terracotta}
          />

          <Text style={styles.regenerateText}>Gerar outra versão</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ScriptBlock({
  icon,
  label,
  hint,
  children,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.scriptBlock}>
      <View style={styles.blockHeader}>
        <View style={styles.blockIcon}>
          <Ionicons name={icon} size={16} color={colors.textSecondary} />
        </View>

        <View>
          <Text style={styles.blockLabel}>{label}</Text>

          <Text style={styles.blockHint}>{hint}</Text>
        </View>
      </View>

      <View style={styles.blockContent}>{children}</View>
    </View>
  );
}

function generateMockScript(
  referenceIdea: string,
  format: string,
  variation: number,
): GeneratedScript {
  const subject = referenceIdea.trim() || "o tema dessa referência";

  const variations: GeneratedScript[] = [
    {
      title: shorten(subject),
      hook: "Tem uma coisa nesse assunto que muita gente entende errado — e isso pode estar mudando completamente a forma como você enxerga o tema.",
      points: [
        `Comece explicando de forma simples a ideia principal: ${shorten(
          subject,
        )}.`,
        "Mostre qual é o erro, dúvida ou interpretação mais comum sobre esse assunto.",
        "Feche explicando o que a pessoa deveria entender ou fazer de forma diferente a partir disso.",
      ],
      cta: "Salve este conteúdo para lembrar disso quando precisar.",
    },
    {
      title: shorten(subject),
      hook: "Se você já ouviu isso e ficou em dúvida, presta atenção porque a explicação é mais simples do que parece.",
      points: [
        `Apresente o contexto da referência: ${shorten(subject)}.`,
        "Explique por que essa ideia chama atenção e qual parte merece ser analisada com mais cuidado.",
        "Dê uma conclusão prática e fácil de aplicar para o seu público.",
      ],
      cta: "Compartilhe com alguém que também precisa entender isso.",
    },
    {
      title: shorten(subject),
      hook: "Antes de repetir isso por aí, tem um detalhe importante que quase ninguém explica.",
      points: [
        `Mostre rapidamente qual é a afirmação ou ideia central: ${shorten(
          subject,
        )}.`,
        "Quebre o assunto em uma explicação curta, direta e sem termos complicados.",
        "Finalize mostrando como essa informação muda a forma de enxergar o problema.",
      ],
      cta: "Se esse conteúdo te ajudou, salva para consultar depois.",
    },
  ];

  return variations[variation % variations.length];
}

function shorten(text: string) {
  const clean = text.replace(/\s+/g, " ").trim();

  if (clean.length <= 60) {
    return clean;
  }

  return `${clean.slice(0, 57)}...`;
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
    minHeight: 78,
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
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  versionButton: {
    minHeight: 37,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  versionText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  resultIntro: {
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  doneMark: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },

  resultTitle: {
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  resultText: {
    maxWidth: 310,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  ideaCard: {
    minHeight: 101,
    marginTop: 8,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  ideaThumbnail: {
    width: 70,
    height: 80,
    borderRadius: 13,
  },

  ideaFallback: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  ideaMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  ideaMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  formatPill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  formatText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  ideaTitle: {
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  originRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  originText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  scriptHeader: {
    marginTop: 26,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },

  scriptLabel: {
    fontSize: 9,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  scriptTitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  blockCount: {
    paddingBottom: 2,
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  document: {
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  scriptBlock: {
    paddingVertical: 17,
  },

  blockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  blockIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  blockLabel: {
    fontSize: 10,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  blockHint: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  blockContent: {
    marginTop: 12,
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  hookText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  points: {
    gap: 12,
  },

  point: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 11,
  },

  pointNumber: {
    width: 24,
    fontSize: 10,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  pointText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  ctaText: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  actionsHeader: {
    marginTop: 26,
    marginBottom: 10,
  },

  actionsTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  actionsSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  primaryAction: {
    minHeight: 59,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...shadows.soft,
  },

  primaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryActionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  primaryActionHint: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.78)",
  },

  secondaryAction: {
    minHeight: 59,
    marginTop: 8,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  secondaryActionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryActionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  secondaryActionHint: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  regenerateAction: {
    minHeight: 44,
    marginTop: 7,
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  regenerateText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  mockNote: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  mockText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
});
