import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState, type ReactNode } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import PlatformIcon from "../../components/PlatformIcon";

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

  async function handleOpenReference() {
    const url = content?.reference?.url;

    if (!url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        return;
      }

      await Linking.openURL(url);
    } catch (error) {
      console.error("Erro ao abrir referência:", error);
    }
  }

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
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Editar roteiro</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.editorIntro}>
            <View style={styles.editorTop}>
              <View style={styles.editorStep}>
                <View style={styles.editorStepNumber}>
                  {content.reference ? (
                    <Text style={styles.editorStepNumberText}>3</Text>
                  ) : (
                    <Ionicons
                      name="create-outline"
                      size={16}
                      color={colors.amber}
                    />
                  )}
                </View>

                <Text style={styles.editorStepText}>
                  {content.reference
                    ? "Ajustar o roteiro"
                    : "Construir o roteiro"}
                </Text>
              </View>

              <View style={styles.blockCount}>
                <Ionicons
                  name="document-text-outline"
                  size={14}
                  color={colors.textMuted}
                />

                <Text style={styles.blockCountText}>
                  {points.length + 2} blocos
                </Text>
              </View>
            </View>

            <Text style={styles.editorTitle}>Trabalhe bloco por bloco.</Text>

            <Text style={styles.editorDescription}>
              Ajuste o texto até ele soar como algo que você realmente diria.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.contextCard}
            activeOpacity={content.reference ? 0.84 : 1}
            disabled={!content.reference}
            onPress={handleOpenReference}
          >
            {content.reference ? (
              <InspirationThumbnail
                thumbnailUrl={content.reference.thumbnailUrl}
                source={content.reference.source}
                variant="compact"
                style={styles.contextThumbnail}
              />
            ) : (
              <View style={styles.contextFallback}>
                <Ionicons
                  name="bulb-outline"
                  size={21}
                  color={colors.terracotta}
                />
              </View>
            )}

            <View style={styles.contextContent}>
              <View style={styles.contextMeta}>
                <Text style={styles.contextLabel}>CONTEÚDO</Text>

                {content.format ? (
                  <View style={styles.formatPill}>
                    <Text style={styles.formatText}>{content.format}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.contextTitle} numberOfLines={3}>
                {content.idea}
              </Text>

              {content.reference ? (
                <View style={styles.originRow}>
                  <PlatformIcon source={content.reference.source} size={12} />

                  <Text style={styles.originText}>
                    Referência: {content.reference.source}
                  </Text>

                  <Text style={styles.originOpenText}>Abrir original</Text>

                  <Ionicons
                    name="open-outline"
                    size={13}
                    color={colors.textMuted}
                  />
                </View>
              ) : (
                <Text style={styles.originText}>Conteúdo original</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.editorDocument}>
            <EditorSection
              icon="flash-outline"
              label="HOOK"
              hint="A abertura do conteúdo"
              accent={colors.terracotta}
            >
              <TextInput
                value={hook}
                onChangeText={setHook}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Como você quer começar? Escreva uma frase, pergunta ou ideia que prenda a atenção..."
                placeholderTextColor={colors.textMuted}
                style={styles.hookInput}
              />
            </EditorSection>

            <View style={styles.sectionDivider} />

            <View style={styles.developmentSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View
                    style={[
                      styles.sectionAccent,
                      {
                        backgroundColor: colors.amber,
                      },
                    ]}
                  />

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

                <Text style={styles.stepsCount}>
                  {points.length} {points.length === 1 ? "etapa" : "etapas"}
                </Text>
              </View>

              <Text style={styles.developmentHelp}>
                Cada etapa pode ser um argumento, exemplo, explicação ou
                lembrete.
              </Text>

              <View style={styles.points}>
                {points.map((point, index) => (
                  <View key={index} style={styles.pointCard}>
                    <View style={styles.pointHeader}>
                      <View style={styles.pointIdentity}>
                        <Text style={styles.pointNumber}>
                          {String(index + 1).padStart(2, "0")}
                        </Text>

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
                            size={15}
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
                <View style={styles.addPointIcon}>
                  <Ionicons name="add" size={17} color={colors.amber} />
                </View>

                <Text style={styles.addPointText}>Adicionar etapa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sectionDivider} />

            <EditorSection
              icon="megaphone-outline"
              label="CTA"
              hint="Como você quer terminar"
              accent={colors.sage}
            >
              <TextInput
                value={cta}
                onChangeText={setCta}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Quer pedir para salvar, comentar, compartilhar ou fazer alguma outra ação?"
                placeholderTextColor={colors.textMuted}
                style={styles.ctaInput}
              />
            </EditorSection>
          </View>

          <View style={styles.flexibilityNote}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
            />

            <Text style={styles.flexibilityText}>
              Hook e CTA são opcionais. Use apenas o que fizer sentido para este
              conteúdo.
            </Text>
          </View>

          <View style={styles.actions}>
            <Text style={styles.actionsLabel}>
              {canAdvance ? "FINALIZAR E CONTINUAR" : "SALVAR ALTERAÇÕES"}
            </Text>

            {canAdvance ? (
              <>
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
                    {saving ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.terracotta}
                      />
                    ) : (
                      <Ionicons
                        name="checkmark"
                        size={17}
                        color={
                          hasAnyScript ? colors.terracotta : colors.textMuted
                        }
                      />
                    )}
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={[
                        styles.primaryButtonText,
                        !hasAnyScript && styles.primaryButtonTextDisabled,
                      ]}
                    >
                      Roteiro pronto
                    </Text>

                    <Text
                      style={[
                        styles.primaryButtonHint,
                        !hasAnyScript && styles.primaryButtonHintDisabled,
                      ]}
                    >
                      Salvar e seguir para produção
                    </Text>
                  </View>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={hasAnyScript ? colors.surface : colors.textMuted}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  activeOpacity={0.8}
                  disabled={saving}
                  onPress={() => saveScript(false)}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.secondaryButtonText}>
                    Salvar sem avançar
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.86}
                disabled={saving}
                onPress={() => saveScript(false)}
              >
                <View style={styles.primaryButtonMark}>
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.terracotta} />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={17}
                      color={colors.terracotta}
                    />
                  )}
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.primaryButtonText}>
                    Salvar alterações
                  </Text>

                  <Text style={styles.primaryButtonHint}>
                    Atualizar este roteiro
                  </Text>
                </View>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.surface}
                />
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type EditorSectionProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  accent: string;
  children: ReactNode;
};

function EditorSection({
  icon,
  label,
  hint,
  accent,
  children,
}: EditorSectionProps) {
  return (
    <View style={styles.editorSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View
            style={[
              styles.sectionAccent,
              {
                backgroundColor: accent,
              },
            ]}
          />

          <View>
            <Text
              style={[
                styles.sectionLabel,
                {
                  color: accent,
                },
              ]}
            >
              {label}
            </Text>

            <Text style={styles.sectionHint}>{hint}</Text>
          </View>
        </View>

        <Ionicons name={icon} size={17} color={colors.textMuted} />
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
    paddingBottom: 48,
  },

  header: {
    height: 70,
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
    width: 42,
  },

  editorIntro: {
    marginTop: 18,
    marginBottom: 17,
  },

  editorTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editorStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  editorStepNumber: {
    width: 30,
    height: 30,
    borderRadius: radius.round,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
  },

  editorStepNumberText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.amber,
  },

  editorStepText: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  blockCount: {
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

  blockCountText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  editorTitle: {
    maxWidth: 330,
    marginTop: 13,
    fontSize: 30,
    lineHeight: 37,
    letterSpacing: -0.85,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  editorDescription: {
    maxWidth: 325,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  contextCard: {
    minHeight: 98,
    marginBottom: 18,
    padding: 11,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  contextThumbnail: {
    width: 62,
    height: 76,
    borderRadius: 12,
  },

  contextFallback: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  contextContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  contextMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  contextLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textMuted,
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

  contextTitle: {
    marginTop: 6,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  originRow: {
    marginTop: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  originText: {
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  originOpenText: {
    marginLeft: 3,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  editorDocument: {
    paddingHorizontal: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  editorSection: {
    paddingVertical: 18,
  },

  developmentSection: {
    paddingVertical: 18,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  sectionAccent: {
    width: 4,
    height: 33,
    borderRadius: radius.round,
  },

  sectionLabel: {
    fontSize: 11,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
  },

  sectionHint: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  hookInput: {
    minHeight: 120,
    marginTop: 14,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    fontSize: 17,
    lineHeight: 27,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  ctaInput: {
    minHeight: 105,
    marginTop: 14,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.divider,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  stepsCount: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textMuted,
  },

  developmentHelp: {
    marginTop: 11,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  points: {
    marginTop: 13,
    gap: 9,
  },

  pointCard: {
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  pointHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pointIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pointNumber: {
    fontSize: 11,
    letterSpacing: 0.4,
    fontFamily: fonts.bold,
    color: colors.amber,
  },

  pointLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  removePoint: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  pointInput: {
    minHeight: 88,
    marginTop: 8,
    padding: 0,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  addPointButton: {
    minHeight: 48,
    marginTop: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  addPointIcon: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
  },

  addPointText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  flexibilityNote: {
    marginTop: 14,
    paddingHorizontal: 3,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  flexibilityText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
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

  primaryButton: {
    minHeight: 62,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  primaryButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  primaryButtonMark: {
    width: 35,
    height: 35,
    marginRight: 10,
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

  primaryButtonTextDisabled: {
    color: colors.textMuted,
  },

  primaryButtonHint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.72)",
  },

  primaryButtonHintDisabled: {
    color: colors.textMuted,
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

  secondaryButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 21,
    lineHeight: 28,
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
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
