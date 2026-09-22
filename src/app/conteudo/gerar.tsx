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
import PlatformIcon, { getPlatformMeta } from "../../components/PlatformIcon";

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

    loadReference();

    return () => {
      active = false;
    };
  }, [inspirationId]);

  const script = useMemo(
    () => generateMockScript(referenceIdea, format, variation),
    [referenceIdea, format, variation],
  );

  const platformMeta = useMemo(
    () => getPlatformMeta(inspiration?.source ?? "Outro"),
    [inspiration?.source],
  );

  async function createContent(status: "roteiro" | "gravar") {
    const now = new Date().toISOString();

    let reference: ContentReference | undefined;

    if (inspirationId) {
      const savedInspiration = await getInspirationById(inspirationId);

      if (savedInspiration) {
        reference = {
          inspirationId: savedInspiration.id,
          url: savedInspiration.url,
          source: savedInspiration.source,
          category: savedInspiration.category,
          note: savedInspiration.note,
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
    await createContent("gravar");

    router.replace("/");
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

          <Text style={styles.headerTitle}>Sua versão</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.resultIntro}>
          <View style={styles.resultTop}>
            <View style={styles.stepRow}>
              <View style={styles.stepDone}>
                <Ionicons name="checkmark" size={16} color={colors.surface} />
              </View>

              <Text style={styles.stepText}>Versão criada</Text>
            </View>

            <View style={styles.versionControl}>
              <Text style={styles.versionLabel}>V{variation + 1}</Text>

              <TouchableOpacity
                style={styles.versionRefresh}
                activeOpacity={0.8}
                onPress={handleGenerateAgain}
              >
                <Ionicons name="refresh" size={15} color={colors.terracotta} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.resultTitle}>
            Sua primeira versão está pronta.
          </Text>

          <Text style={styles.resultDescription}>
            Agora você pode usar como está, ajustar o texto ou experimentar
            outra direção.
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
              <Ionicons name="sparkles" size={20} color={colors.terracotta} />
            </View>
          )}

          <View style={styles.ideaContent}>
            <View style={styles.ideaMeta}>
              <Text style={styles.ideaLabel}>SUA IDEIA</Text>

              <View style={styles.formatPill}>
                <Text style={styles.formatText}>{format}</Text>
              </View>
            </View>

            <Text style={styles.ideaTitle} numberOfLines={3}>
              {script.title}
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

        <View style={styles.scriptHeading}>
          <View>
            <Text style={styles.scriptEyebrow}>ROTEIRO</Text>

            <Text style={styles.scriptTitle}>
              Uma estrutura para partir daqui
            </Text>
          </View>

          <View style={styles.scriptCount}>
            <Ionicons
              name="document-text-outline"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={styles.scriptCountText}>
              {script.points.length + 2} blocos
            </Text>
          </View>
        </View>

        <View style={styles.document}>
          <ScriptBlock
            icon="flash-outline"
            label="HOOK"
            hint="Como começar"
            color={colors.terracotta}
          >
            <Text style={styles.hookText}>{script.hook}</Text>
          </ScriptBlock>

          <View style={styles.documentDivider} />

          <ScriptBlock
            icon="list-outline"
            label="DESENVOLVIMENTO"
            hint="O que falar"
            color={colors.amber}
          >
            <View style={styles.points}>
              {script.points.map((point, index) => (
                <View key={`${point}-${index}`} style={styles.point}>
                  <Text style={styles.pointNumber}>
                    {String(index + 1).padStart(2, "0")}
                  </Text>

                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </ScriptBlock>

          <View style={styles.documentDivider} />

          <ScriptBlock
            icon="megaphone-outline"
            label="CTA"
            hint="Como terminar"
            color={colors.sage}
          >
            <Text style={styles.ctaText}>{script.cta}</Text>
          </ScriptBlock>
        </View>

        <View style={styles.actions}>
          <Text style={styles.actionsLabel}>O QUE VOCÊ QUER FAZER?</Text>

          <TouchableOpacity
            style={styles.useButton}
            activeOpacity={0.86}
            onPress={handleUseScript}
          >
            <View style={styles.useButtonMark}>
              <Ionicons name="checkmark" size={17} color={colors.terracotta} />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.useButtonText}>Usar este roteiro</Text>

              <Text style={styles.useButtonHint}>Seguir para produção</Text>
            </View>

            <Ionicons name="arrow-forward" size={18} color={colors.surface} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.editButton}
            activeOpacity={0.82}
            onPress={handleEditScript}
          >
            <View style={styles.secondaryActionIcon}>
              <Ionicons name="create-outline" size={17} color={colors.text} />
            </View>

            <View
              style={{
                flex: 1,
              }}
            >
              <Text style={styles.editButtonText}>Editar antes de usar</Text>

              <Text style={styles.editButtonHint}>
                Abrir no editor de roteiro
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={17}
              color={colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.regenerateButton}
            activeOpacity={0.8}
            onPress={handleGenerateAgain}
          >
            <Ionicons
              name="refresh-outline"
              size={16}
              color={colors.terracotta}
            />

            <Text style={styles.regenerateButtonText}>Gerar outra versão</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.mockWarning}>
          <Ionicons name="flask-outline" size={15} color={colors.textMuted} />

          <Text style={styles.mockWarningText}>
            Esta geração ainda é simulada. A IA real será conectada depois que
            validarmos esta experiência.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type ScriptBlockProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  color: string;
  children: React.ReactNode;
};

function ScriptBlock({ icon, label, hint, color, children }: ScriptBlockProps) {
  return (
    <View style={styles.scriptBlock}>
      <View style={styles.blockHeader}>
        <View style={styles.blockTitleRow}>
          <View
            style={[
              styles.blockDot,
              {
                backgroundColor: color,
              },
            ]}
          />

          <Text style={[styles.blockLabel, { color }]}>{label}</Text>
        </View>

        <View style={styles.blockHintRow}>
          <Ionicons name={icon} size={14} color={colors.textMuted} />

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
    backgroundColor: colors.sage,
    alignItems: "center",
    justifyContent: "center",
  },

  stepText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  versionControl: {
    minHeight: 34,
    paddingLeft: 10,
    paddingRight: 5,
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

  versionRefresh: {
    width: 25,
    height: 25,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
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
    maxWidth: 325,
    marginTop: 8,
    fontSize: 13,
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
    fontSize: 9,
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
    fontSize: 10,
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
    fontSize: 10,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
  },

  blockHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  blockHint: {
    fontSize: 9,
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
    fontSize: 9,
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
    fontSize: 10,
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
    fontSize: 10,
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
    fontSize: 10,
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

  mockWarning: {
    marginTop: 17,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  mockWarningText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
});
