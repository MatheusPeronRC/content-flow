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

import {
    colors,
    radius,
    shadows,
    spacing,
    typography,
} from "../../constants/theme";

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

    const content = {
      id: Date.now().toString(),

      inspirationId: inspirationId || undefined,

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
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Sua versão</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <View style={styles.aiLabel}>
            <Ionicons name="sparkles" size={14} color={colors.primary} />

            <Text style={styles.aiLabelText}>SIMULAÇÃO DO CONTENTFLOW</Text>
          </View>

          <Text style={styles.title}>Aqui está uma versão para você.</Text>

          <Text style={styles.description}>
            Use como ponto de partida. Você pode usar, editar ou pedir outra
            versão.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>IDEIA</Text>

          <Text style={styles.summaryTitle}>{script.title}</Text>

          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>{format}</Text>
          </View>
        </View>

        <View style={styles.scriptCard}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="flash-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionLabel}>HOOK</Text>

                <Text style={styles.sectionHint}>Como começar</Text>
              </View>
            </View>

            <Text style={styles.hookText}>{script.hook}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="list-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionLabel}>DESENVOLVIMENTO</Text>

                <Text style={styles.sectionHint}>O que falar</Text>
              </View>
            </View>

            <View style={styles.points}>
              {script.points.map((point, index) => (
                <View key={index} style={styles.point}>
                  <View style={styles.pointNumber}>
                    <Text style={styles.pointNumberText}>{index + 1}</Text>
                  </View>

                  <Text style={styles.pointText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="megaphone-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionLabel}>CTA</Text>

                <Text style={styles.sectionHint}>Como terminar</Text>
              </View>
            </View>

            <Text style={styles.ctaText}>{script.cta}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.useButton}
          activeOpacity={0.85}
          onPress={handleUseScript}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={21}
            color={colors.surface}
          />

          <Text style={styles.useButtonText}>Usar este roteiro</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.editButton} onPress={handleEditScript}>
          <Ionicons name="create-outline" size={18} color={colors.primary} />

          <Text style={styles.editButtonText}>Editar antes de usar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.regenerateButton}
          onPress={handleGenerateAgain}
        >
          <Ionicons
            name="refresh-outline"
            size={18}
            color={colors.textSecondary}
          />

          <Text style={styles.regenerateButtonText}>Gerar outra versão</Text>
        </TouchableOpacity>

        <View style={styles.mockWarning}>
          <Ionicons name="flask-outline" size={17} color={colors.textMuted} />

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
      title: `Minha versão sobre: ${shorten(subject)}`,

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
      title: `O que você precisa saber sobre ${shorten(subject)}`,

      hook: "Se você já ouviu isso e ficou em dúvida, presta atenção porque a explicação é mais simples do que parece.",

      points: [
        `Apresente o contexto da referência: ${shorten(subject)}.`,

        "Explique por que essa ideia chama atenção e qual parte merece ser analisada com mais cuidado.",

        "Dê uma conclusão prática e fácil de aplicar para o seu público.",
      ],

      cta: "Compartilhe com alguém que também precisa entender isso.",
    },

    {
      title: `Antes de acreditar nisso, entenda ${shorten(subject)}`,

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
    paddingBottom: spacing.xxl,
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

  aiLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: spacing.sm,
  },

  aiLabelText: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
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

  summaryCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  summaryLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
  },

  summaryTitle: {
    marginTop: 5,
    fontSize: typography.subheading,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },

  formatBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.round,
  },

  formatText: {
    fontSize: typography.tiny,
    fontWeight: "700",
    color: colors.primary,
  },

  scriptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    ...shadows.card,
  },

  section: {
    padding: spacing.lg,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  sectionLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: colors.primary,
  },

  sectionHint: {
    marginTop: 1,
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  hookText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "700",
    color: colors.text,
  },

  divider: {
    height: 1,
    backgroundColor: colors.border,
  },

  points: {
    gap: spacing.md,
  },

  point: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pointNumber: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },

  pointNumberText: {
    fontSize: typography.caption,
    fontWeight: "800",
    color: colors.primary,
  },

  pointText: {
    flex: 1,
    paddingTop: 3,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  ctaText: {
    fontSize: typography.subheading,
    lineHeight: 23,
    fontWeight: "600",
    color: colors.text,
  },

  useButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  useButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  editButton: {
    height: 50,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  editButtonText: {
    color: colors.primary,
    fontSize: typography.body,
    fontWeight: "700",
  },

  regenerateButton: {
    height: 46,
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  regenerateButtonText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  mockWarning: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  mockWarningText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 16,
    color: colors.textMuted,
  },
});
