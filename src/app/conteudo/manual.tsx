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

import {
  ProductionEffortSelector,
  getProductionEffortLabel,
} from "../../components/ProductionEffortSelector";
import { saveContent } from "../../services/contentStorage";
import { ContentItem } from "../../types/content";
import { ProductionEffort } from "../../types/productionEffort";

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
  const [productionEffort, setProductionEffort] =
    useState<ProductionEffort | null>(null);
  const [saving, setSaving] = useState(false);

  const canContinue = idea.trim().length > 0 && productionEffort !== null;
  const ideaCount = idea.length;

  const selectedSummary = useMemo(() => {
    const items: string[] = [];

    if (format) {
      items.push(format);
    }

    if (objective) {
      items.push(objective);
    }

    if (productionEffort) {
      items.push(getProductionEffortLabel(productionEffort));
    }

    return items;
  }, [format, objective, productionEffort]);

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
        productionEffort,
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

          <View style={styles.intro}>
            <View style={styles.introLabelRow}>
              <View style={styles.introMark}>
                <Ionicons
                  name="pencil-outline"
                  size={16}
                  color={colors.terracotta}
                />
              </View>

              <Text style={styles.introEyebrow}>NOVA IDEIA</Text>
            </View>

            <Text style={styles.introTitle}>
              Comece pela ideia.{"\n"}O resto a gente organiza.
            </Text>

            <Text style={styles.introDescription}>
              Você não precisa ter um roteiro pronto. Escreva o que quer
              comunicar e refine aos poucos.
            </Text>
          </View>

          <View style={styles.primaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.ideaIcon]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={colors.lavender}
                />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Qual é a sua ideia?</Text>

                <Text style={styles.sectionSubtitle}>
                  Escreva como você explicaria isso para alguém.
                </Text>
              </View>

              <View style={styles.counterPill}>
                <Text style={styles.counterText}>{ideaCount}/500</Text>
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

            <View style={styles.helperRow}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color={colors.textMuted}
              />

              <Text style={styles.helperText}>
                Uma frase simples já é suficiente para começar.
              </Text>
            </View>
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={colors.terracotta}
                />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  Quanto esforço vai exigir?
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Isso ajuda o ContentFlow a encontrar ideias que cabem no tempo
                  que você tem.
                </Text>
              </View>
            </View>

            <ProductionEffortSelector
              value={productionEffort}
              onChange={setProductionEffort}
            />
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.formatIconHeader]}>
                <Ionicons name="apps-outline" size={20} color={colors.blue} />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Como isso vai aparecer?</Text>

                <Text style={styles.sectionSubtitle}>
                  Opcional — você pode decidir o formato depois.
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

                    <View style={styles.formatContent}>
                      <Text
                        style={[
                          styles.formatTitle,
                          selected && styles.formatTitleSelected,
                        ]}
                      >
                        {item.value}
                      </Text>

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
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.surface}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.objectiveIconHeader]}>
                <Ionicons name="flag-outline" size={20} color={colors.amber} />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  O que esse conteúdo precisa fazer?
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Opcional — escolha a intenção principal.
                </Text>
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

                    <Text
                      style={[
                        styles.objectiveText,
                        selected && styles.objectiveTextSelected,
                      ]}
                    >
                      {item.value}
                    </Text>

                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.actionsSection}>
            <Text style={styles.actionsEyebrow}>PRÓXIMO PASSO</Text>

            <Text style={styles.actionsTitle}>Sua ideia já pode avançar.</Text>

            <Text style={styles.actionsDescription}>
              Abra o editor de roteiro agora ou salve a ideia para continuar
              depois.
            </Text>

            {selectedSummary.length > 0 ? (
              <View style={styles.summaryRow}>
                {selectedSummary.map((item) => (
                  <View key={item} style={styles.summaryPill}>
                    <Text style={styles.summaryText} numberOfLines={1}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                !canContinue && styles.primaryButtonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!canContinue || saving}
              onPress={() => createContent("script")}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={colors.surface}
                />
              )}

              <Text
                style={[
                  styles.primaryButtonText,
                  !canContinue && styles.disabledText,
                ]}
              >
                {saving ? "Criando..." : "Montar meu roteiro"}
              </Text>

              {!saving ? (
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={canContinue ? colors.surface : colors.textMuted}
                />
              ) : null}
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
                color={canContinue ? colors.textSecondary : colors.textMuted}
              />

              <Text
                style={[
                  styles.secondaryButtonText,
                  !canContinue && styles.disabledText,
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

  intro: {
    paddingTop: 19,
    paddingBottom: 23,
  },

  introLabelRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  introMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  introEyebrow: {
    fontSize: 11,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  introTitle: {
    maxWidth: 345,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  introDescription: {
    maxWidth: 345,
    marginTop: 9,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  primaryCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  secondaryCard: {
    marginTop: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  sectionHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  ideaIcon: {
    backgroundColor: colors.lavenderLight,
  },

  formatIconHeader: {
    backgroundColor: colors.blueLight,
  },

  objectiveIconHeader: {
    backgroundColor: colors.amberLight,
  },

  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  counterPill: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  counterText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  ideaInput: {
    minHeight: 165,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  helperRow: {
    marginTop: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  formatCard: {
    width: "48.5%",
    minHeight: 92,
    padding: 11,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  formatCardSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  formatIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  formatContent: {
    flex: 1,
    minWidth: 0,
  },

  formatTitle: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formatTitleSelected: {
    color: colors.terracotta,
  },

  formatDescription: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
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
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  objectiveList: {
    gap: 8,
  },

  objectiveCard: {
    minHeight: 56,
    paddingHorizontal: 11,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  objectiveCardSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
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

  objectiveTextSelected: {
    color: colors.terracotta,
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
    borderColor: colors.terracotta,
  },

  radioDot: {
    width: 10,
    height: 10,
    borderRadius: radius.round,
    backgroundColor: colors.terracotta,
  },

  actionsSection: {
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  actionsEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  actionsTitle: {
    maxWidth: 325,
    marginTop: 6,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  actionsDescription: {
    maxWidth: 330,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  summaryRow: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  summaryPill: {
    maxWidth: "100%",
    minHeight: 29,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  primaryButton: {
    minHeight: 58,
    marginTop: 17,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    ...shadows.soft,
  },

  primaryButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  primaryButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    textAlign: "center",
    color: colors.surface,
  },

  secondaryButton: {
    minHeight: 50,
    marginTop: 9,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  secondaryButtonDisabled: {
    opacity: 0.45,
  },

  secondaryButtonText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  disabledText: {
    color: colors.textMuted,
  },
});
