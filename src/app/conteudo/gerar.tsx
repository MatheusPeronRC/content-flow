import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { saveContent } from "../../services/contentStorage";
import { getInspirationById } from "../../services/inspirationStorage";

import { ContentItem, ContentReference } from "../../types/content";

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

  const script = useMemo(
    () => generateMockScript(referenceIdea, format, variation),
    [referenceIdea, format, variation],
  );

  async function createContent(status: "roteiro" | "gravar") {
    const now = new Date().toISOString();

    let reference: ContentReference | undefined;

    if (inspirationId) {
      const inspiration = await getInspirationById(inspirationId);

      if (inspiration) {
        reference = {
          inspirationId: inspiration.id,
          url: inspiration.url,
          source: inspiration.source,
          category: inspiration.category,
          note: inspiration.note,
          thumbnailUrl: inspiration.thumbnailUrl ?? null,
          mediaTitle: inspiration.mediaTitle ?? null,
          authorName: inspiration.authorName ?? null,
          metadataUpdatedAt: inspiration.metadataUpdatedAt ?? null,
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
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sua versão</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <View style={styles.aiLabel}>
            <View style={styles.aiSpark}>
              <Ionicons name="sparkles" size={13} color={colors.terracotta} />
            </View>

            <Text style={styles.aiLabelText}>CONTENTFLOW</Text>
          </View>

          <Text style={styles.title}>
            Sua ideia já começou{"\n"}a ganhar forma.
          </Text>

          <Text style={styles.description}>
            Use como ponto de partida. Você pode seguir assim, editar ou
            experimentar outra versão.
          </Text>
        </View>

        <View style={styles.ideaCard}>
          <View style={styles.ideaTop}>
            <Text style={styles.ideaLabel}>IDEIA</Text>

            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>{format}</Text>
            </View>
          </View>

          <Text style={styles.ideaTitle}>{script.title}</Text>
        </View>

        <View style={styles.scriptHeader}>
          <View>
            <Text style={styles.scriptTitle}>Roteiro</Text>

            <Text style={styles.scriptSubtitle}>
              Uma estrutura simples para você partir daqui.
            </Text>
          </View>

          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>V{variation + 1}</Text>
          </View>
        </View>

        <View style={styles.scriptSurface}>
          <View style={styles.hook}>
            <View style={styles.sectionMeta}>
              <View
                style={[
                  styles.sectionMark,
                  { backgroundColor: colors.terracottaLight },
                ]}
              >
                <Ionicons
                  name="flash-outline"
                  size={17}
                  color={colors.terracotta}
                />
              </View>

              <View>
                <Text
                  style={[styles.sectionEyebrow, { color: colors.terracotta }]}
                >
                  HOOK
                </Text>

                <Text style={styles.sectionHint}>Como começar</Text>
              </View>
            </View>

            <Text style={styles.hookText}>{script.hook}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.development}>
            <View style={styles.sectionMeta}>
              <View
                style={[
                  styles.sectionMark,
                  { backgroundColor: colors.amberLight },
                ]}
              >
                <Ionicons name="list-outline" size={17} color={colors.amber} />
              </View>

              <View>
                <Text style={[styles.sectionEyebrow, { color: colors.amber }]}>
                  DESENVOLVIMENTO
                </Text>

                <Text style={styles.sectionHint}>O que falar</Text>
              </View>
            </View>

            <View style={styles.points}>
              {script.points.map((point, index) => (
                <View key={index} style={styles.point}>
                  <View style={styles.pointNumber}>
                    <Text style={styles.pointNumberText}>
                      {String(index + 1).padStart(2, "0")}
                    </Text>
                  </View>

                  {index < script.points.length - 1 && (
                    <View style={styles.pointLine} />
                  )}

                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.cta}>
            <View style={styles.sectionMeta}>
              <View
                style={[
                  styles.sectionMark,
                  { backgroundColor: colors.sageLight },
                ]}
              >
                <Ionicons
                  name="megaphone-outline"
                  size={17}
                  color={colors.sage}
                />
              </View>

              <View>
                <Text style={[styles.sectionEyebrow, { color: colors.sage }]}>
                  CTA
                </Text>

                <Text style={styles.sectionHint}>Como terminar</Text>
              </View>
            </View>

            <Text style={styles.ctaText}>{script.cta}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.useButton}
          activeOpacity={0.86}
          onPress={handleUseScript}
        >
          <View style={styles.useButtonMark}>
            <Ionicons name="checkmark" size={17} color={colors.terracotta} />
          </View>

          <Text style={styles.useButtonText}>Usar este roteiro</Text>

          <Ionicons name="arrow-forward" size={18} color={colors.surface} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.8}
          onPress={handleEditScript}
        >
          <Ionicons name="create-outline" size={17} color={colors.text} />

          <Text style={styles.editButtonText}>Editar antes de usar</Text>
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

        <View style={styles.mockWarning}>
          <View style={styles.mockWarningMark}>
            <Ionicons name="flask-outline" size={15} color={colors.textMuted} />
          </View>

          <Text style={styles.mockWarningText}>
            Esta geração ainda é simulada. A IA real será conectada depois que
            validarmos esta experiência.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    height: 68,
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
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  headerSpace: {
    width: 40,
  },
  intro: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  aiLabel: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  aiSpark: {
    width: 25,
    height: 25,
    borderRadius: 9,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },
  aiLabelText: {
    fontSize: 10,
    letterSpacing: 1.1,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },
  title: {
    maxWidth: 340,
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  description: {
    maxWidth: 335,
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  ideaCard: {
    marginBottom: 30,
    padding: 17,
    borderRadius: 20,
    backgroundColor: colors.terracottaLight,
  },
  ideaTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ideaLabel: {
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },
  formatBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
  },
  formatText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  ideaTitle: {
    marginTop: 12,
    maxWidth: 315,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.3,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  scriptHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  scriptTitle: {
    fontSize: 24,
    lineHeight: 31,
    letterSpacing: -0.5,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  scriptSubtitle: {
    marginTop: 5,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  versionBadge: {
    minWidth: 32,
    height: 27,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  versionText: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  scriptSurface: {
    marginBottom: 24,
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  hook: {
    padding: 20,
  },
  development: {
    padding: 20,
  },
  cta: {
    padding: 20,
  },
  sectionMeta: {
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  sectionMark: {
    width: 34,
    height: 34,
    marginRight: 10,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 0.9,
    fontFamily: fonts.bold,
  },
  sectionHint: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  hookText: {
    fontSize: 20,
    lineHeight: 31,
    letterSpacing: -0.25,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  divider: {
    height: 1,
    marginHorizontal: 18,
    backgroundColor: colors.divider,
  },
  points: {
    gap: 16,
  },
  point: {
    minHeight: 40,
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pointNumber: {
    width: 27,
    height: 27,
    borderRadius: radius.round,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  pointNumberText: {
    fontSize: 9,
    fontFamily: fonts.bold,
    color: colors.amber,
  },
  pointLine: {
    position: "absolute",
    left: 13,
    top: 27,
    bottom: -17,
    width: 1,
    backgroundColor: colors.divider,
  },
  pointText: {
    flex: 1,
    paddingTop: 2,
    marginLeft: 12,
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
  useButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
  },
  useButtonMark: {
    width: 33,
    height: 33,
    marginRight: 11,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  useButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.surface,
  },
  editButton: {
    minHeight: 49,
    marginTop: 9,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  editButtonText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  regenerateButton: {
    minHeight: 43,
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  regenerateButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },
  mockWarning: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
  },
  mockWarningMark: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  mockWarningText: {
    flex: 1,
    paddingTop: 2,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
});
