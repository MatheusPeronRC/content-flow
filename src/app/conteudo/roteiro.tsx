import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";

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

import InspirationThumbnail from "../../components/InspirationThumbnail";

import { getContentById, updateContent } from "../../services/contentStorage";

import { ContentItem } from "../../types/content";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

export default function RoteiroScreen() {
  const { contentId } = useLocalSearchParams<{
    contentId?: string;
  }>();

  const [content, setContent] = useState<ContentItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [hook, setHook] = useState("");

  const [points, setPoints] = useState<string[]>([""]);

  const [cta, setCta] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!contentId) {
          if (active) {
            setLoading(false);
          }

          return;
        }

        try {
          const data = await getContentById(contentId);

          if (!active) {
            return;
          }

          if (!data) {
            setContent(null);
            return;
          }

          setContent(data);

          setHook(data.script?.hook ?? "");

          const savedPoints = data.script?.points ?? [];

          setPoints(savedPoints.length > 0 ? savedPoints : [""]);

          setCta(data.script?.cta ?? "");
        } catch (error) {
          console.error("Erro ao carregar roteiro:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [contentId]),
  );

  const canAdvance =
    content?.status === "ideia" || content?.status === "roteiro";

  const hasAnyScript = useMemo(() => {
    return (
      hook.trim().length > 0 ||
      points.some((point) => point.trim().length > 0) ||
      cta.trim().length > 0
    );
  }, [hook, points, cta]);

  function updatePoint(index: number, value: string) {
    setPoints((current) =>
      current.map((point, pointIndex) =>
        pointIndex === index ? value : point,
      ),
    );
  }

  function addPoint() {
    setPoints((current) => [...current, ""]);
  }

  function removePoint(index: number) {
    setPoints((current) => {
      if (current.length === 1) {
        return [""];
      }

      return current.filter((_, pointIndex) => pointIndex !== index);
    });
  }

  async function saveScript(advance: boolean) {
    if (!content || saving) {
      return;
    }

    if (advance && canAdvance && !hasAnyScript) {
      return;
    }

    try {
      setSaving(true);

      const normalizedPoints = points
        .map((point) => point.trim())
        .filter(Boolean);

      const shouldAdvance = advance && canAdvance;

      await updateContent(content.id, {
        script: {
          hook: hook.trim(),
          points: normalizedPoints,
          cta: cta.trim(),
        },

        ...(shouldAdvance
          ? {
              status: "gravar" as const,
            }
          : {}),
      });

      router.replace({
        pathname: "/conteudo/[id]",

        params: {
          id: content.id,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar roteiro:", error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Abrindo seu roteiro...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorMark}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.errorTitle}>Roteiro não encontrado</Text>

          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const ideaLength = content.idea.trim().length;

  const isLongIdea = ideaLength > 80;

  const isVeryLongIdea = ideaLength > 180;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Editar roteiro</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.heroPanel}>
            <View style={styles.heroBubbleOne} />

            <View style={styles.heroBubbleTwo} />

            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Ionicons
                  name="document-text-outline"
                  size={13}
                  color={colors.amber}
                />

                <Text style={styles.heroBadgeText}>EDITOR DE ROTEIRO</Text>
              </View>

              <View style={styles.heroMark}>
                <Ionicons name="create" size={20} color={colors.surface} />
              </View>
            </View>

            <View style={styles.heroContext}>
              {content.reference ? (
                <InspirationThumbnail
                  thumbnailUrl={content.reference.thumbnailUrl}
                  source={content.reference.source}
                  variant="compact"
                  style={styles.heroThumbnail}
                />
              ) : (
                <View style={styles.heroFallback}>
                  <Ionicons
                    name="bulb-outline"
                    size={22}
                    color={colors.amber}
                  />
                </View>
              )}

              <View style={styles.heroContextText}>
                <Text style={styles.heroContextLabel}>CONTEÚDO</Text>

                <Text
                  style={[
                    styles.title,

                    isLongIdea && styles.titleLong,

                    isVeryLongIdea && styles.titleVeryLong,
                  ]}
                  numberOfLines={isVeryLongIdea ? 5 : 4}
                >
                  {content.idea}
                </Text>

                <View style={styles.heroMeta}>
                  {content.format && (
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>{content.format}</Text>
                    </View>
                  )}

                  <View style={styles.flexibilityBadge}>
                    <Ionicons
                      name="options-outline"
                      size={13}
                      color={colors.textSecondary}
                    />

                    <Text style={styles.flexibilityText}>
                      Monte do seu jeito
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.heroTip}>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.amber}
              />

              <Text style={styles.description}>
                Use esta estrutura como apoio, não como regra. Escreva do jeito
                que você realmente falaria.
              </Text>
            </View>
          </View>

          <ScriptEditorCard
            icon="flash-outline"
            label="HOOK"
            hint="A abertura do conteúdo"
            color={colors.terracotta}
            background={colors.terracottaLight}
          >
            <TextInput
              value={hook}
              onChangeText={setHook}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Como você quer começar? Escreva uma frase, pergunta ou ideia que prenda a atenção..."
              placeholderTextColor={colors.textMuted}
              style={styles.largeInput}
            />
          </ScriptEditorCard>

          <View
            style={[
              styles.developmentSection,
              {
                backgroundColor: colors.amberLight,
              },
            ]}
          >
            <View style={styles.developmentTop}>
              <View style={styles.sectionIdentity}>
                <View
                  style={[
                    styles.sectionMark,

                    {
                      backgroundColor: colors.amberLight,
                    },
                  ]}
                >
                  <Ionicons
                    name="list-outline"
                    size={19}
                    color={colors.amber}
                  />
                </View>

                <View>
                  <Text
                    style={[
                      styles.sectionLabel,

                      {
                        color: colors.amber,
                      },
                    ]}
                  >
                    DESENVOLVIMENTO
                  </Text>

                  <Text style={styles.sectionHint}>
                    Construa sua linha de raciocínio
                  </Text>
                </View>
              </View>

              <View style={styles.stepsCount}>
                <Text style={styles.stepsCountText}>
                  {points.length} {points.length === 1 ? "etapa" : "etapas"}
                </Text>
              </View>
            </View>

            <Text style={styles.developmentDescription}>
              Cada etapa pode ser um argumento, exemplo, explicação ou lembrete
              do que você quer falar.
            </Text>

            <View style={styles.points}>
              {points.map((point, index) => (
                <View key={index} style={styles.pointCard}>
                  <View style={styles.pointHeader}>
                    <View style={styles.pointHeaderLeft}>
                      <View style={styles.pointNumber}>
                        <Text style={styles.pointNumberText}>
                          {String(index + 1).padStart(2, "0")}
                        </Text>
                      </View>

                      <Text style={styles.pointLabel}>Etapa {index + 1}</Text>
                    </View>

                    {points.length > 1 && (
                      <TouchableOpacity
                        style={styles.removePoint}
                        activeOpacity={0.75}
                        onPress={() => removePoint(index)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color={colors.textMuted}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  <TextInput
                    value={point}
                    onChangeText={(value) => updatePoint(index, value)}
                    multiline
                    scrollEnabled={false}
                    textAlignVertical="top"
                    placeholder="Desenvolva esta parte do conteúdo..."
                    placeholderTextColor={colors.textMuted}
                    style={styles.pointInput}
                  />
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addPointButton}
              activeOpacity={0.8}
              onPress={addPoint}
            >
              <View style={styles.addPointMark}>
                <Ionicons name="add" size={18} color={colors.amber} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.addPointTitle}>Adicionar etapa</Text>

                <Text style={styles.addPointHint}>
                  Continue desenvolvendo sua ideia.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <ScriptEditorCard
            icon="megaphone-outline"
            label="CTA"
            hint="Como você quer terminar"
            color={colors.sage}
            background={colors.sageLight}
          >
            <TextInput
              value={cta}
              onChangeText={setCta}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Quer pedir para salvar, comentar, compartilhar ou fazer alguma outra ação?"
              placeholderTextColor={colors.textMuted}
              style={styles.mediumInput}
            />
          </ScriptEditorCard>

          <View style={styles.optionalNote}>
            <View style={styles.optionalNoteMark}>
              <Ionicons
                name="sparkles-outline"
                size={16}
                color={colors.lavender}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.optionalNoteTitle}>
                Seu roteiro não precisa seguir uma fórmula.
              </Text>

              <Text style={styles.optionalNoteText}>
                Hook e CTA são opcionais. Use apenas o que fizer sentido para
                este conteúdo.
              </Text>
            </View>
          </View>

          {canAdvance ? (
            <View style={styles.actionsPanel}>
              <View style={styles.actionsHeader}>
                <View style={styles.actionsBadge}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={14}
                    color={colors.terracotta}
                  />

                  <Text style={styles.actionsBadgeText}>FINALIZAR</Text>
                </View>

                <Text style={styles.actionsTitle}>Como deseja continuar?</Text>
              </View>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                disabled={saving}
                onPress={() => saveScript(false)}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={17}
                  color={colors.surface}
                />

                <Text style={styles.secondaryButtonText}>
                  Salvar sem avançar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,

                  !hasAnyScript && styles.primaryButtonDisabled,
                ]}
                activeOpacity={0.86}
                disabled={saving || !hasAnyScript}
                onPress={() => saveScript(true)}
              >
                <View style={styles.primaryButtonMark}>
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color={hasAnyScript ? colors.terracotta : colors.textMuted}
                  />
                </View>

                <Text
                  style={[
                    styles.primaryButtonText,

                    !hasAnyScript && styles.primaryButtonTextDisabled,
                  ]}
                >
                  Roteiro pronto
                </Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={hasAnyScript ? colors.surface : colors.textMuted}
                  style={styles.primaryButtonArrow}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionsPanel}>
              <View style={styles.actionsHeader}>
                <View style={styles.actionsBadge}>
                  <Ionicons
                    name="save-outline"
                    size={14}
                    color={colors.terracotta}
                  />

                  <Text style={styles.actionsBadgeText}>ALTERAÇÕES</Text>
                </View>

                <Text style={styles.actionsTitle}>Salve sua nova versão.</Text>
              </View>
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.86}
                disabled={saving}
                onPress={() => saveScript(false)}
              >
                <View style={styles.primaryButtonMark}>
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color={colors.terracotta}
                  />
                </View>

                <Text style={styles.primaryButtonText}>Salvar alterações</Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.surface}
                  style={styles.primaryButtonArrow}
                />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ScriptEditorCardProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  color: string;
  background: string;
  children: React.ReactNode;
};

function ScriptEditorCard({
  icon,
  label,
  hint,
  color,
  background,
  children,
}: ScriptEditorCardProps) {
  return (
    <View
      style={[
        styles.scriptCard,
        {
          backgroundColor: background,
        },
      ]}
    >
      <View style={styles.sectionIdentity}>
        <View
          style={[
            styles.sectionMark,
            {
              backgroundColor: colors.surface,
            },
          ]}
        >
          <Ionicons name={icon} size={19} color={color} />
        </View>

        <View>
          <Text
            style={[
              styles.sectionLabel,
              {
                color,
              },
            ]}
          >
            {label}
          </Text>

          <Text style={styles.sectionHint}>{hint}</Text>
        </View>
      </View>

      {children}
    </View>
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
    height: 68,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  headerButton: {
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
    width: 40,
  },

  heroPanel: {
    position: "relative",

    overflow: "hidden",

    marginTop: 14,

    marginBottom: 18,

    padding: 18,

    borderRadius: 28,

    backgroundColor: colors.amberLight,

    borderWidth: 1,

    borderColor: "rgba(201, 154, 69, 0.16)",

    ...shadows.card,
  },

  heroBubbleOne: {
    position: "absolute",

    width: 126,
    height: 126,

    top: -46,
    right: -36,

    borderRadius: 63,

    backgroundColor: "rgba(225, 116, 85, 0.12)",
  },

  heroBubbleTwo: {
    position: "absolute",

    width: 84,
    height: 84,

    left: -28,
    bottom: 24,

    borderRadius: 42,

    backgroundColor: "rgba(142, 127, 194, 0.12)",
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

    backgroundColor: "rgba(255, 253, 252, 0.78)",

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  heroBadgeText: {
    fontSize: 10,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  heroMark: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.amber,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  heroContext: {
    marginTop: 17,

    padding: 12,

    borderRadius: 20,

    backgroundColor: "rgba(255, 253, 252, 0.86)",

    borderWidth: 1,

    borderColor: "rgba(255, 255, 255, 0.72)",

    flexDirection: "row",

    alignItems: "center",
  },

  heroThumbnail: {
    width: 66,
    height: 82,

    borderRadius: 14,
  },

  heroFallback: {
    width: 66,
    height: 66,

    borderRadius: 17,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  heroContextText: {
    flex: 1,

    minWidth: 0,

    marginLeft: 12,
  },

  heroContextLabel: {
    fontSize: 9,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  eyebrow: {
    display: "none",
  },

  title: {
    maxWidth: "100%",

    marginTop: 5,

    fontSize: 22,

    lineHeight: 30,

    letterSpacing: -0.4,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  titleLong: {
    fontSize: 18,

    lineHeight: 27,

    letterSpacing: -0.2,

    fontFamily: fonts.semibold,
  },

  titleVeryLong: {
    fontSize: 16,

    lineHeight: 24,

    letterSpacing: 0,

    fontFamily: fonts.regular,
  },

  heroMeta: {
    marginTop: 9,

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 7,
  },

  formatBadge: {
    minHeight: 28,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,

    alignItems: "center",

    justifyContent: "center",
  },

  formatText: {
    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.amber,
  },

  flexibilityBadge: {
    minHeight: 28,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  flexibilityText: {
    fontSize: 10,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  heroTip: {
    marginTop: 12,

    paddingHorizontal: 3,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 7,
  },

  description: {
    flex: 1,

    fontSize: 12,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  scriptCard: {
    marginBottom: 14,

    padding: 18,

    borderRadius: 22,

    borderWidth: 1,

    borderColor: "rgba(255, 255, 255, 0.72)",

    ...shadows.soft,
  },

  sectionIdentity: {
    flexDirection: "row",

    alignItems: "center",
  },

  sectionMark: {
    width: 42,
    height: 42,

    marginRight: 11,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  sectionLabel: {
    fontSize: 10,

    letterSpacing: 0.9,

    fontFamily: fonts.bold,
  },

  sectionHint: {
    marginTop: 2,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  largeInput: {
    minHeight: 145,

    marginTop: 16,

    padding: 17,

    borderRadius: 18,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: "rgba(225, 116, 85, 0.12)",

    fontSize: 17,

    lineHeight: 27,

    fontFamily: fonts.medium,

    color: colors.text,
  },

  mediumInput: {
    minHeight: 125,

    marginTop: 16,

    padding: 17,

    borderRadius: 18,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: "rgba(123, 158, 136, 0.12)",

    fontSize: 16,

    lineHeight: 25,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  developmentSection: {
    marginBottom: 14,

    padding: 18,

    borderRadius: 22,

    borderWidth: 1,

    borderColor: "rgba(201, 154, 69, 0.15)",

    ...shadows.soft,
  },

  developmentTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,
  },

  stepsCount: {
    minHeight: 29,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  stepsCountText: {
    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.amber,
  },

  developmentDescription: {
    marginTop: 14,

    marginBottom: 15,

    fontSize: 12,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  points: {
    gap: 10,
  },

  pointCard: {
    padding: 14,

    borderRadius: 18,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: "rgba(201, 154, 69, 0.12)",

    ...shadows.soft,
  },

  pointHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  pointHeaderLeft: {
    flexDirection: "row",

    alignItems: "center",

    gap: 8,
  },

  pointNumber: {
    width: 31,
    height: 31,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,

    alignItems: "center",

    justifyContent: "center",
  },

  pointNumberText: {
    fontSize: 10,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  pointLabel: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  removePoint: {
    width: 32,
    height: 32,

    borderRadius: 10,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  pointInput: {
    minHeight: 100,

    marginTop: 11,

    padding: 0,

    fontSize: 16,

    lineHeight: 25,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  addPointButton: {
    minHeight: 68,

    marginTop: 11,

    paddingHorizontal: 12,

    borderRadius: 17,

    borderWidth: 1,

    borderColor: "rgba(201, 154, 69, 0.26)",

    backgroundColor: "rgba(255, 253, 252, 0.55)",

    flexDirection: "row",

    alignItems: "center",
  },

  addPointMark: {
    width: 36,
    height: 36,

    marginRight: 10,

    borderRadius: 11,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  addPointTitle: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  addPointHint: {
    marginTop: 3,

    fontSize: 11,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  optionalNote: {
    marginTop: 3,

    marginBottom: 20,

    padding: 14,

    borderRadius: 18,

    backgroundColor: colors.lavenderLight,

    borderWidth: 1,

    borderColor: "rgba(142, 127, 194, 0.13)",

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 10,
  },

  optionalNoteMark: {
    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  optionalNoteTitle: {
    fontSize: 13,

    lineHeight: 18,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  optionalNoteText: {
    marginTop: 3,

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  actions: {
    display: "none",
  },

  actionsPanel: {
    marginTop: 4,

    padding: 16,

    borderRadius: 22,

    backgroundColor: colors.primary,

    ...shadows.hero,
  },

  actionsHeader: {
    marginBottom: 13,
  },

  actionsBadge: {
    alignSelf: "flex-start",

    minHeight: 28,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: "rgba(255, 253, 252, 0.1)",

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  actionsBadgeText: {
    fontSize: 9,

    letterSpacing: 0.75,

    fontFamily: fonts.bold,

    color: colors.terracotta,
  },

  actionsTitle: {
    marginTop: 10,

    fontSize: 18,

    lineHeight: 24,

    fontFamily: fonts.bold,

    color: colors.surface,
  },

  secondaryButton: {
    minHeight: 50,

    marginBottom: 9,

    borderRadius: 15,

    backgroundColor: "rgba(255, 253, 252, 0.1)",

    borderWidth: 1,

    borderColor: "rgba(255, 253, 252, 0.12)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  secondaryButtonText: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.surface,
  },

  primaryButton: {
    minHeight: 60,

    paddingHorizontal: 14,

    borderRadius: 18,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",

    position: "relative",
  },

  primaryButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  primaryButtonMark: {
    position: "absolute",

    left: 14,

    width: 34,
    height: 34,

    borderRadius: 11,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  primaryButtonText: {
    fontSize: 14,

    fontFamily: fonts.bold,

    color: colors.surface,

    textAlign: "center",
  },

  primaryButtonArrow: {
    position: "absolute",

    right: 16,
  },

  primaryButtonTextDisabled: {
    color: colors.textMuted,
  },

  center: {
    flex: 1,

    paddingHorizontal: 30,

    alignItems: "center",

    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,

    fontSize: 13,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  errorMark: {
    width: 54,
    height: 54,

    marginBottom: 16,

    borderRadius: 17,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 22,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  errorButton: {
    marginTop: 18,

    paddingHorizontal: 18,

    paddingVertical: 11,

    borderRadius: 14,

    backgroundColor: colors.text,
  },

  errorButtonText: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.surface,
  },
});
