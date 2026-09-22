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

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>SEU ROTEIRO</Text>

            <Text
              style={[
                styles.title,

                isLongIdea && styles.titleLong,

                isVeryLongIdea && styles.titleVeryLong,
              ]}
            >
              {content.idea}
            </Text>

            <View style={styles.heroMeta}>
              {content.format && (
                <View style={styles.formatBadge}>
                  <Text style={styles.formatText}>{content.format}</Text>
                </View>
              )}

              <Text style={styles.flexibilityText}>Monte do seu jeito</Text>
            </View>

            <Text style={styles.description}>
              Use esta estrutura como apoio, não como regra. Escreva do jeito
              que você realmente falaria.
            </Text>
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

          <View style={styles.developmentSection}>
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
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
            />

            <Text style={styles.optionalNoteText}>
              Hook e CTA são opcionais. Use apenas o que fizer sentido para este
              conteúdo.
            </Text>
          </View>

          {canAdvance ? (
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.8}
                disabled={saving}
                onPress={() => saveScript(false)}
              >
                <Ionicons
                  name="bookmark-outline"
                  size={17}
                  color={colors.text}
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
            <View style={styles.actions}>
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
    <View style={styles.scriptCard}>
      <View style={styles.sectionIdentity}>
        <View
          style={[
            styles.sectionMark,
            {
              backgroundColor: background,
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

  hero: {
    paddingTop: 20,

    paddingBottom: 28,
  },

  eyebrow: {
    marginBottom: 10,

    fontSize: 10,

    letterSpacing: 1.1,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  title: {
    maxWidth: 340,

    fontSize: 30,

    lineHeight: 37,

    letterSpacing: -0.9,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  titleLong: {
    fontSize: 22,

    lineHeight: 32,

    letterSpacing: -0.3,

    fontFamily: fonts.semibold,
  },

  titleVeryLong: {
    fontSize: 18,

    lineHeight: 29,

    letterSpacing: 0,

    fontFamily: fonts.regular,
  },

  heroMeta: {
    marginTop: 12,

    flexDirection: "row",

    alignItems: "center",

    gap: 9,
  },

  formatBadge: {
    paddingHorizontal: 10,

    paddingVertical: 6,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,
  },

  formatText: {
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.amber,
  },

  flexibilityText: {
    fontSize: 12,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  description: {
    maxWidth: 340,

    marginTop: 14,

    fontSize: 14,

    lineHeight: 22,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  scriptCard: {
    marginBottom: 16,

    padding: 20,

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  sectionIdentity: {
    flexDirection: "row",

    alignItems: "center",
  },

  sectionMark: {
    width: 40,
    height: 40,

    marginRight: 11,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  sectionLabel: {
    fontSize: 11,

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

    marginTop: 17,

    padding: 17,

    borderRadius: 18,

    backgroundColor: colors.surfaceSoft,

    fontSize: 17,

    lineHeight: 27,

    fontFamily: fonts.medium,

    color: colors.text,
  },

  mediumInput: {
    minHeight: 125,

    marginTop: 17,

    padding: 17,

    borderRadius: 18,

    backgroundColor: colors.surfaceSoft,

    fontSize: 16,

    lineHeight: 25,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  developmentSection: {
    marginBottom: 16,

    padding: 20,

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  developmentTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,
  },

  stepsCount: {
    paddingHorizontal: 9,

    paddingVertical: 5,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,
  },

  stepsCountText: {
    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.amber,
  },

  developmentDescription: {
    marginTop: 15,

    marginBottom: 16,

    fontSize: 13,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  points: {
    gap: 12,
  },

  pointCard: {
    padding: 15,

    borderRadius: 18,

    backgroundColor: colors.surfaceSoft,

    borderWidth: 1,

    borderColor: colors.divider,
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
    width: 30,
    height: 30,

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

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  pointInput: {
    minHeight: 104,

    marginTop: 12,

    padding: 0,

    fontSize: 16,

    lineHeight: 25,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  addPointButton: {
    minHeight: 70,

    marginTop: 12,

    paddingHorizontal: 12,

    borderRadius: 17,

    borderWidth: 1,

    borderStyle: "dashed",

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",
  },

  addPointMark: {
    width: 34,
    height: 34,

    marginRight: 10,

    borderRadius: 11,

    backgroundColor: colors.amberLight,

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
    marginTop: 2,

    marginBottom: 22,

    paddingHorizontal: 4,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 7,
  },

  optionalNoteText: {
    flex: 1,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  actions: {
    marginTop: 2,
  },

  secondaryButton: {
    minHeight: 52,

    marginBottom: 9,

    borderRadius: 16,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  secondaryButtonText: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.text,
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
