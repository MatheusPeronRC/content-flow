import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { saveContent } from "../../services/contentStorage";
import { ContentItem } from "../../types/content";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const formats = [
  {
    value: "Reel",
    icon: "videocam-outline" as const,
    background: colors.terracottaLight,
    color: colors.terracotta,
    description: "Vídeo curto e direto",
  },
  {
    value: "Carrossel",
    icon: "albums-outline" as const,
    background: colors.amberLight,
    color: colors.amber,
    description: "Conteúdo em etapas",
  },
  {
    value: "Story",
    icon: "phone-portrait-outline" as const,
    background: colors.lavenderLight,
    color: colors.lavender,
    description: "Rápido e espontâneo",
  },
  {
    value: "Foto",
    icon: "image-outline" as const,
    background: colors.blueLight,
    color: colors.blue,
    description: "Imagem com legenda",
  },
];

const objectives = [
  {
    value: "Atrair clientes",
    icon: "people-outline" as const,
    background: colors.terracottaLight,
    color: colors.terracotta,
  },
  {
    value: "Gerar autoridade",
    icon: "ribbon-outline" as const,
    background: colors.amberLight,
    color: colors.amber,
  },
  {
    value: "Educar",
    icon: "school-outline" as const,
    background: colors.blueLight,
    color: colors.blue,
  },
  {
    value: "Engajar",
    icon: "chatbubbles-outline" as const,
    background: colors.roseLight,
    color: colors.rose,
  },
];

export default function ManualContentScreen() {
  const [idea, setIdea] = useState("");

  const [format, setFormat] = useState<string | null>(null);

  const [objective, setObjective] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  const canContinue = idea.trim().length > 0;

  const ideaCount = idea.length;

  const selectedSummary = useMemo(() => {
    const items: string[] = [];

    if (format) {
      items.push(format);
    }

    if (objective) {
      items.push(objective);
    }

    return items;
  }, [format, objective]);

  async function createContent(next: "idea" | "script") {
    if (!canContinue || saving) {
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const content: ContentItem = {
        id: Date.now().toString(),
        idea: idea.trim(),
        format,
        objective,
        status: next === "script" ? "roteiro" : "ideia",
        script: {
          hook: "",
          points: [],
          cta: "",
        },
        createdAt: now,
        updatedAt: now,
      };

      await saveContent(content);

      if (next === "script") {
        router.replace({
          pathname: "/conteudo/roteiro",
          params: {
            contentId: content.id,
          },
        });

        return;
      }

      router.replace({
        pathname: "/conteudo/[id]",
        params: {
          id: content.id,
        },
      });
    } catch (error) {
      console.error("Erro ao criar conteúdo manual:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
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

            <Text style={styles.headerTitle}>Começar do zero</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.heroPanel}>
            <View style={styles.heroBubbleOne} />

            <View style={styles.heroBubbleTwo} />

            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={13} color={colors.terracotta} />

                <Text style={styles.heroBadgeText}>IDEIA ORIGINAL</Text>
              </View>

              <View style={styles.heroMark}>
                <Ionicons name="pencil" size={20} color={colors.surface} />
              </View>
            </View>

            <Text style={styles.heroTitle}>
              Comece pela ideia.
              {"\n"}O resto a gente organiza.
            </Text>

            <Text style={styles.heroDescription}>
              Você não precisa ter um roteiro pronto. Escreva o que quer
              comunicar e vá refinando aos poucos.
            </Text>

            <View style={styles.heroTip}>
              <View style={styles.heroTipMark}>
                <Ionicons
                  name="bulb-outline"
                  size={17}
                  color={colors.terracotta}
                />
              </View>

              <Text style={styles.heroTipText}>
                Uma frase simples já é suficiente para começar.
              </Text>
            </View>
          </View>

          <View style={styles.ideaPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkLavender}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={colors.lavender}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowLavender}>
                  PONTO DE PARTIDA
                </Text>

                <Text style={styles.sectionTitle}>Qual é a sua ideia?</Text>

                <Text style={styles.sectionSubtitle}>
                  Escreva como você explicaria para alguém.
                </Text>
              </View>

              <View style={styles.countPill}>
                <Text style={styles.countText}>{ideaCount}/500</Text>
              </View>
            </View>

            <TextInput
              value={idea}
              onChangeText={setIdea}
              multiline
              maxLength={500}
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Ex.: Quero explicar por que pular o café da manhã nem sempre ajuda quem quer emagrecer..."
              placeholderTextColor={colors.textMuted}
              style={styles.ideaInput}
            />
          </View>

          <View style={styles.formatPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkBlue}>
                <Ionicons name="apps-outline" size={19} color={colors.blue} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowBlue}>FORMATO</Text>

                <Text style={styles.sectionTitle}>Como isso vai aparecer?</Text>

                <Text style={styles.sectionSubtitle}>
                  Opcional. Você pode decidir depois.
                </Text>
              </View>
            </View>

            <View style={styles.formatGrid}>
              {formats.map((item) => {
                const selected = format === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.formatCard,
                      selected && styles.formatCardSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setFormat(selected ? null : item.value)}
                  >
                    <View
                      style={[
                        styles.formatIcon,
                        {
                          backgroundColor: item.background,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={20} color={item.color} />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text style={styles.formatTitle}>{item.value}</Text>

                      <Text style={styles.formatDescription}>
                        {item.description}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.selectionCircle,
                        selected && styles.selectionCircleSelected,
                      ]}
                    >
                      {selected && (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.surface}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.objectivePanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkAmber}>
                <Ionicons name="flag-outline" size={19} color={colors.amber} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowAmber}>INTENÇÃO</Text>

                <Text style={styles.sectionTitle}>
                  O que esse conteúdo precisa fazer?
                </Text>

                <Text style={styles.sectionSubtitle}>Também é opcional.</Text>
              </View>
            </View>

            <View style={styles.objectiveList}>
              {objectives.map((item) => {
                const selected = objective === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.objectiveCard,
                      selected && styles.objectiveCardSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setObjective(selected ? null : item.value)}
                  >
                    <View
                      style={[
                        styles.objectiveIcon,
                        {
                          backgroundColor: item.background,
                        },
                      ]}
                    >
                      <Ionicons name={item.icon} size={18} color={item.color} />
                    </View>

                    <Text style={styles.objectiveText}>{item.value}</Text>

                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected && <View style={styles.radioDot} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.finishPanel}>
            <View style={styles.finishBubble} />

            <View style={styles.finishBadge}>
              <Ionicons
                name="git-branch-outline"
                size={14}
                color={colors.terracotta}
              />

              <Text style={styles.finishBadgeText}>PRÓXIMO PASSO</Text>
            </View>

            <Text style={styles.finishTitle}>
              Sua ideia já tem um ponto de partida.
            </Text>

            <Text style={styles.finishText}>
              Você pode guardar agora e continuar depois, ou abrir o editor de
              roteiro.
            </Text>

            {selectedSummary.length > 0 && (
              <View style={styles.summaryRow}>
                {selectedSummary.map((item) => (
                  <View key={item} style={styles.summaryPill}>
                    <Text style={styles.summaryText} numberOfLines={1}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !canContinue && styles.buttonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!canContinue || saving}
              onPress={() => createContent("script")}
            >
              <View style={styles.primaryMark}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.terracotta} />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={18}
                    color={canContinue ? colors.terracotta : colors.textMuted}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.primaryButtonText,
                    !canContinue && styles.buttonTextDisabled,
                  ]}
                >
                  Montar meu roteiro
                </Text>

                <Text
                  style={[
                    styles.primaryButtonHint,
                    !canContinue && styles.buttonHintDisabled,
                  ]}
                >
                  Continuar no editor
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={canContinue ? colors.surface : colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                !canContinue && styles.secondaryButtonDisabled,
              ]}
              activeOpacity={0.82}
              disabled={!canContinue || saving}
              onPress={() => createContent("idea")}
            >
              <Ionicons
                name="bookmark-outline"
                size={17}
                color={canContinue ? colors.surface : colors.textMuted}
              />

              <Text
                style={[
                  styles.secondaryButtonText,
                  !canContinue && styles.buttonTextDisabled,
                ]}
              >
                Salvar como ideia
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 54,
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
    marginTop: 14,
    marginBottom: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.terracottaLight,
    borderWidth: 1,
    borderColor: "rgba(225,116,85,0.15)",
    ...shadows.card,
  },

  heroBubbleOne: {
    position: "absolute",
    width: 126,
    height: 126,
    top: -48,
    right: -36,
    borderRadius: 63,
    backgroundColor: "rgba(142,127,194,0.13)",
  },

  heroBubbleTwo: {
    position: "absolute",
    width: 84,
    height: 84,
    left: -28,
    bottom: 22,
    borderRadius: 42,
    backgroundColor: "rgba(121,165,184,0.12)",
  },

  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroBadge: {
    minHeight: 30,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,253,252,0.8)",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  heroBadgeText: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  heroMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },

  heroTitle: {
    maxWidth: 330,
    marginTop: 16,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.85,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  heroDescription: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  heroTip: {
    minHeight: 56,
    marginTop: 16,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,253,252,0.75)",
    flexDirection: "row",
    alignItems: "center",
  },

  heroTipMark: {
    width: 34,
    height: 34,
    marginRight: 9,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  ideaPanel: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.lavenderLight,
    borderWidth: 1,
    borderColor: "rgba(142,127,194,0.14)",
    ...shadows.soft,
  },

  formatPanel: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.blueLight,
    borderWidth: 1,
    borderColor: "rgba(121,165,184,0.14)",
    ...shadows.soft,
  },

  objectivePanel: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: "rgba(201,154,69,0.14)",
    ...shadows.soft,
  },

  sectionHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionMarkLavender: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionMarkBlue: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionMarkAmber: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionEyebrowLavender: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.lavender,
  },

  sectionEyebrowBlue: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.blue,
  },

  sectionEyebrowAmber: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.amber,
  },

  sectionTitle: {
    marginTop: 2,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  countPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  countText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  ideaInput: {
    minHeight: 160,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  formatCard: {
    width: "48.5%",
    minHeight: 90,
    padding: 11,
    borderRadius: 17,
    backgroundColor: "rgba(255,253,252,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  formatCardSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.surface,
  },

  formatIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  formatTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formatDescription: {
    marginTop: 2,
    fontSize: 9,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  selectionCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleSelected: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },

  objectiveList: {
    gap: 8,
  },

  objectiveCard: {
    minHeight: 56,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: "rgba(255,253,252,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
  },

  objectiveCardSelected: {
    borderColor: colors.amber,
    backgroundColor: colors.surface,
  },

  objectiveIcon: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  objectiveText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: colors.amber,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.amber,
  },

  finishPanel: {
    position: "relative",
    overflow: "hidden",
    padding: 17,
    borderRadius: 24,
    backgroundColor: colors.primary,
    ...shadows.hero,
  },

  finishBubble: {
    position: "absolute",
    width: 118,
    height: 118,
    top: -48,
    right: -30,
    borderRadius: 59,
    backgroundColor: "rgba(225,116,85,0.18)",
  },

  finishBadge: {
    alignSelf: "flex-start",
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,253,252,0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  finishBadgeText: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  finishTitle: {
    maxWidth: 300,
    marginTop: 13,
    fontSize: 21,
    lineHeight: 28,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  finishText: {
    maxWidth: 305,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.68)",
  },

  summaryRow: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },

  summaryPill: {
    maxWidth: "100%",
    minHeight: 27,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,253,252,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },

  summaryText: {
    fontSize: 9,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },

  primaryButton: {
    minHeight: 62,
    marginTop: 14,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  primaryMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  primaryButtonHint: {
    marginTop: 1,
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.72)",
  },

  secondaryButton: {
    minHeight: 48,
    marginTop: 8,
    borderRadius: 15,
    backgroundColor: "rgba(255,253,252,0.09)",
    borderWidth: 1,
    borderColor: "rgba(255,253,252,0.11)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },

  buttonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  secondaryButtonDisabled: {
    opacity: 0.38,
  },

  buttonTextDisabled: {
    color: colors.textMuted,
  },

  buttonHintDisabled: {
    color: colors.textMuted,
  },
});
