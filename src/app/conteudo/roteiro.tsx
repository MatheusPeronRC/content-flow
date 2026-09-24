import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useMemo, useState } from "react";

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
import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

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
  const [startedBlank, setStartedBlank] = useState(false);

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

          const savedHook = data.script?.hook ?? "";
          const savedPoints = data.script?.points ?? [];
          const savedCta = data.script?.cta ?? "";

          setHook(savedHook);
          setPoints(savedPoints.length > 0 ? savedPoints : [""]);
          setCta(savedCta);

          setStartedBlank(
            savedHook.trim().length === 0 &&
              !savedPoints.some((point) => point.trim().length > 0) &&
              savedCta.trim().length === 0,
          );
        } catch (error) {
          console.error("Erro ao carregar roteiro:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [contentId]),
  );

  const canAdvance =
    content?.status === "ideia" || content?.status === "roteiro";

  const hasAnyScript = useMemo(
    () =>
      hook.trim().length > 0 ||
      points.some((point) => point.trim().length > 0) ||
      cta.trim().length > 0,
    [hook, points, cta],
  );

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
          <View style={styles.errorIcon}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.errorTitle}>Roteiro não encontrado</Text>

          <TouchableOpacity
            style={styles.errorButton}
            activeOpacity={0.82}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/conteudos");
              }
            }}
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
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/conteudos");
                }
              }}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={styles.headerEyebrow}>
                {startedBlank ? "SUA VERSÃO" : "EDITOR"}
              </Text>

              <Text style={styles.headerTitle}>
                {startedBlank ? "Criar roteiro" : "Editar roteiro"}
              </Text>
            </View>

            <View style={styles.blockCount}>
              <Text style={styles.blockCountText}>
                {points.length + 2} blocos
              </Text>
            </View>
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
                showSourceBadge={false}
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

            <View style={styles.contextMain}>
              <View style={styles.contextMeta}>
                {content.format ? (
                  <View style={styles.formatPill}>
                    <Text style={styles.formatText}>{content.format}</Text>
                  </View>
                ) : null}

                <ProductionEffortBadge
                  effort={content.productionEffort}
                  subtle
                />
              </View>

              <Text style={styles.contextTitle} numberOfLines={2}>
                {content.idea}
              </Text>

              {content.reference ? (
                <View style={styles.originRow}>
                  <PlatformIcon source={content.reference.source} size={12} />

                  <Text style={styles.originText}>
                    Referência: {content.reference.source}
                  </Text>

                  <Ionicons
                    name="open-outline"
                    size={12}
                    color={colors.textMuted}
                  />
                </View>
              ) : (
                <Text style={styles.originText}>Conteúdo original</Text>
              )}
            </View>
          </TouchableOpacity>

          <View style={styles.editorIntro}>
            <Text style={styles.editorTitle}>
              {startedBlank
                ? "Construa sua versão, bloco por bloco."
                : "Trabalhe bloco por bloco."}
            </Text>

            <Text style={styles.editorDescription}>
              {startedBlank
                ? "Use a referência como ponto de partida e escreva com as suas palavras. Você pode salvar e continuar depois."
                : "Ajuste o texto até ele soar como algo que você realmente diria."}
            </Text>
          </View>

          <View style={styles.document}>
            <EditorSection
              icon="flash-outline"
              label="HOOK"
              hint="A abertura do conteúdo"
            >
              <TextInput
                value={hook}
                onChangeText={setHook}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Como você quer começar? Escreva uma frase ou pergunta que prenda a atenção..."
                placeholderTextColor={colors.textMuted}
                style={styles.hookInput}
              />
            </EditorSection>

            <View style={styles.divider} />

            <View style={styles.developmentSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <View style={styles.sectionIcon}>
                    <Ionicons
                      name="list-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </View>

                  <View>
                    <Text style={styles.sectionLabel}>DESENVOLVIMENTO</Text>

                    <Text style={styles.sectionHint}>
                      Construa sua linha de raciocínio
                    </Text>
                  </View>
                </View>

                <Text style={styles.stepsCount}>
                  {points.length} {points.length === 1 ? "etapa" : "etapas"}
                </Text>
              </View>

              <View style={styles.points}>
                {points.map((point, index) => (
                  <View key={index} style={styles.pointCard}>
                    <View style={styles.pointHeader}>
                      <View style={styles.pointIdentity}>
                        <View style={styles.pointNumberWrap}>
                          <Text style={styles.pointNumber}>
                            {String(index + 1).padStart(2, "0")}
                          </Text>
                        </View>

                        <Text style={styles.pointLabel}>Etapa {index + 1}</Text>
                      </View>

                      {points.length > 1 ? (
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
                      ) : null}
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
                <Ionicons name="add" size={17} color={colors.terracotta} />

                <Text style={styles.addPointText}>Adicionar etapa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            <EditorSection
              icon="megaphone-outline"
              label="CTA"
              hint="Como você quer terminar"
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
              Hook e CTA são opcionais. Não existe um formato obrigatório: use
              apenas os blocos que ajudarem a organizar sua ideia.
            </Text>
          </View>

          <View style={styles.actions}>
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
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={hasAnyScript ? colors.surface : colors.textMuted}
                    />
                  )}

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={[
                        styles.primaryButtonTitle,
                        !hasAnyScript && styles.primaryButtonTitleDisabled,
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
                  activeOpacity={0.82}
                  disabled={saving}
                  onPress={() => saveScript(false)}
                >
                  <Ionicons
                    name="bookmark-outline"
                    size={17}
                    color={colors.textSecondary}
                  />

                  <Text style={styles.secondaryButtonText}>
                    Salvar rascunho
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
                {saving ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Ionicons name="checkmark" size={18} color={colors.surface} />
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryButtonTitle}>
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

function EditorSection({
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
    <View style={styles.editorSection}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={16} color={colors.textSecondary} />
          </View>

          <View>
            <Text style={styles.sectionLabel}>{label}</Text>

            <Text style={styles.sectionHint}>{hint}</Text>
          </View>
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
    paddingBottom: 50,
  },

  header: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  headerButton: {
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
    fontSize: 11,
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

  blockCount: {
    minHeight: 33,
    paddingHorizontal: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  blockCountText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  contextCard: {
    minHeight: 96,
    padding: 10,
    borderRadius: 17,
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
    borderRadius: 13,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  contextMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  contextMeta: {
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

  contextTitle: {
    marginTop: 6,
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
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  editorIntro: {
    paddingTop: 22,
    paddingBottom: 12,
  },

  editorTitle: {
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.55,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  editorDescription: {
    maxWidth: 320,
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  document: {
    paddingHorizontal: 15,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  editorSection: {
    paddingVertical: 17,
  },

  developmentSection: {
    paddingVertical: 17,
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

  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionLabel: {
    fontSize: 10,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionHint: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  divider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  hookInput: {
    minHeight: 116,
    marginTop: 13,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  ctaInput: {
    minHeight: 104,
    marginTop: 13,
    padding: 13,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  stepsCount: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  points: {
    marginTop: 13,
    gap: 9,
  },

  pointCard: {
    padding: 11,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },

  pointHeader: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  pointIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  pointNumberWrap: {
    minWidth: 27,
    height: 27,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  pointNumber: {
    fontSize: 11,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  pointLabel: {
    fontSize: 10,
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
    minHeight: 78,
    padding: 0,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  addPointButton: {
    minHeight: 43,
    marginTop: 10,
    borderRadius: 13,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  addPointText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  flexibilityNote: {
    marginTop: 11,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  flexibilityText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  actions: {
    marginTop: 23,
  },

  primaryButton: {
    minHeight: 59,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    ...shadows.soft,
  },

  primaryButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  primaryButtonTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  primaryButtonTitleDisabled: {
    color: colors.textMuted,
  },

  primaryButtonHint: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: "rgba(255,255,255,0.78)",
  },

  primaryButtonHintDisabled: {
    color: colors.textMuted,
  },

  secondaryButton: {
    minHeight: 48,
    marginTop: 8,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  secondaryButtonText: {
    fontSize: 11,
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
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  errorIcon: {
    width: 54,
    height: 54,
    marginBottom: 15,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  errorButton: {
    minHeight: 43,
    marginTop: 17,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },

  errorButtonText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
