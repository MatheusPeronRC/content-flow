import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../components/InspirationThumbnail";

import { getInspirationById } from "../../services/inspirationStorage";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story"];

export default function AdaptarConteudoScreen() {
  const { inspirationId } = useLocalSearchParams<{
    inspirationId?: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(true);

  const [referenceIdea, setReferenceIdea] = useState("");

  const [format, setFormat] = useState("Reel");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!inspirationId) {
        if (active) {
          setLoading(false);
        }

        return;
      }

      try {
        const data = await getInspirationById(inspirationId);

        if (!active) {
          return;
        }

        setInspiration(data);

        if (data?.note?.trim()) {
          setReferenceIdea(data.note.trim());
        }
      } catch (error) {
        console.error("Erro ao carregar inspiração:", error);
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
  }, [inspirationId]);

  const canContinue = referenceIdea.trim().length > 0;

  const sourceMeta = useMemo(() => {
    const source = inspiration?.source ?? "Referência";

    switch (source) {
      case "Instagram":
        return {
          icon: "logo-instagram" as const,
          color: colors.terracotta,
          background: colors.terracottaLight,
        };

      case "TikTok":
        return {
          icon: "musical-note-outline" as const,
          color: colors.text,
          background: colors.primaryLight,
        };

      case "YouTube":
        return {
          icon: "logo-youtube" as const,
          color: colors.rose,
          background: colors.roseLight,
        };

      case "Kwai":
        return {
          icon: "play-outline" as const,
          color: colors.amber,
          background: colors.amberLight,
        };

      default:
        return {
          icon: "link-outline" as const,
          color: colors.blue,
          background: colors.blueLight,
        };
    }
  }, [inspiration?.source]);

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    router.push({
      pathname: "/conteudo/gerar",
      params: {
        inspirationId,
        referenceIdea: referenceIdea.trim(),
        format,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Preparando sua referência...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorMark}>
            <Ionicons name="link-outline" size={23} color={colors.textMuted} />
          </View>

          <Text style={styles.errorTitle}>Referência não encontrada</Text>

          <Text style={styles.errorText}>
            Volte para sua biblioteca e escolha outra inspiração.
          </Text>

          <TouchableOpacity
            style={styles.backAction}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const referenceTitle =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Adaptar referência</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.magicPanel}>
          <View style={styles.magicBubbleOne} />
          <View style={styles.magicBubbleTwo} />

          <View style={styles.magicTop}>
            <View style={styles.magicBadge}>
              <Ionicons name="sparkles" size={13} color={colors.terracotta} />

              <Text style={styles.magicBadgeText}>TRANSFORMAR REFERÊNCIA</Text>
            </View>

            <View style={styles.magicMark}>
              <Ionicons name="color-wand" size={20} color={colors.surface} />
            </View>
          </View>

          <Text style={styles.title}>
            Só preciso entender{"\n"}o que te chamou atenção.
          </Text>

          <Text style={styles.description}>
            Conte do seu jeito o que vale aproveitar. O ContentFlow organiza a
            estrutura depois.
          </Text>

          <View style={styles.referenceSpotlight}>
            <InspirationThumbnail
              thumbnailUrl={inspiration.thumbnailUrl}
              source={inspiration.source}
              variant="compact"
              style={styles.referenceThumbnail}
            />

            <View style={styles.referenceContent}>
              <View style={styles.referenceMeta}>
                <View
                  style={[
                    styles.sourceBadge,
                    {
                      backgroundColor: sourceMeta.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={sourceMeta.icon}
                    size={12}
                    color={sourceMeta.color}
                  />

                  <Text
                    style={[
                      styles.sourceText,
                      {
                        color: sourceMeta.color,
                      },
                    ]}
                  >
                    {inspiration.source}
                  </Text>
                </View>

                {inspiration.category && (
                  <View style={styles.categoryMiniPill}>
                    <Text style={styles.referenceCategory}>
                      {inspiration.category}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={styles.referenceTitle} numberOfLines={3}>
                {referenceTitle}
              </Text>

              {inspiration.authorName ? (
                <Text style={styles.referenceAuthor} numberOfLines={1}>
                  {inspiration.authorName}
                </Text>
              ) : (
                <Text style={styles.referenceUrl} numberOfLines={1}>
                  {cleanUrl(inspiration.url)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.inputPanel}>
          <View style={styles.inputPanelHeader}>
            <View style={styles.inputPanelMark}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={18}
                color={colors.lavender}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.inputPanelEyebrow}>SUA LEITURA</Text>

              <Text style={styles.fieldTitle}>
                O que você quer levar dessa referência?
              </Text>
            </View>

            <View style={styles.optionalPill}>
              <Text style={styles.optional}>DO SEU JEITO</Text>
            </View>
          </View>

          <View style={styles.ideaField}>
            <TextInput
              value={referenceIdea}
              onChangeText={setReferenceIdea}
              multiline
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Ex.: gostei da abertura, do jeito de explicar, da estrutura do vídeo..."
              placeholderTextColor={colors.textMuted}
              style={styles.ideaInput}
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {referenceIdea.length}
              /500
            </Text>
          </View>

          <View style={styles.helperRow}>
            <Ionicons
              name="sparkles-outline"
              size={16}
              color={colors.terracotta}
            />

            <Text style={styles.helperText}>
              Uma frase já basta. O ContentFlow cuida da estrutura depois.
            </Text>
          </View>
        </View>

        <View style={styles.formatPanel}>
          <View style={styles.formatPanelHeader}>
            <View style={styles.formatPanelMark}>
              <Ionicons name="apps-outline" size={18} color={colors.blue} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.formatEyebrow}>FORMATO FINAL</Text>

              <Text style={styles.fieldTitle}>
                Em que formato você quer transformar?
              </Text>
            </View>
          </View>

          <View style={styles.formats}>
            {formats.map((item) => {
              const selected = format === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.formatOption,
                    selected && styles.formatOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setFormat(item)}
                >
                  <View
                    style={[
                      styles.formatIcon,
                      selected && styles.formatIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={getFormatIcon(item)}
                      size={17}
                      color={selected ? colors.surface : colors.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.formatText,
                      selected && styles.formatTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            !canContinue && styles.createButtonDisabled,
          ]}
          disabled={!canContinue}
          activeOpacity={0.86}
          onPress={handleContinue}
        >
          <View style={styles.createButtonMark}>
            <Ionicons
              name="sparkles"
              size={18}
              color={canContinue ? colors.terracotta : colors.textMuted}
            />
          </View>

          <Text
            style={[
              styles.createButtonText,
              !canContinue && styles.createButtonTextDisabled,
            ]}
          >
            Criar minha versão
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={canContinue ? colors.surface : colors.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getFormatIcon(format: string): keyof typeof Ionicons.glyphMap {
  switch (format) {
    case "Reel":
      return "videocam-outline";
    case "Carrossel":
      return "albums-outline";
    case "Story":
      return "phone-portrait-outline";
    default:
      return "document-outline";
  }
}

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
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

  magicPanel: {
    position: "relative",

    overflow: "hidden",

    marginTop: 16,

    marginBottom: 22,

    padding: 20,

    borderRadius: 28,

    backgroundColor: colors.terracottaLight,

    borderWidth: 1,

    borderColor: "rgba(225, 116, 85, 0.16)",

    ...shadows.card,
  },

  magicBubbleOne: {
    position: "absolute",

    width: 128,
    height: 128,

    top: -48,
    right: -38,

    borderRadius: 64,

    backgroundColor: "rgba(142, 127, 194, 0.15)",
  },

  magicBubbleTwo: {
    position: "absolute",

    width: 82,
    height: 82,

    left: -28,
    bottom: 42,

    borderRadius: 41,

    backgroundColor: "rgba(121, 165, 184, 0.12)",
  },

  magicTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  magicBadge: {
    minHeight: 30,

    paddingHorizontal: 10,

    borderRadius: radius.round,

    backgroundColor: "rgba(255, 253, 252, 0.8)",

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  magicBadgeText: {
    fontSize: 10,

    letterSpacing: 0.75,

    fontFamily: fonts.bold,

    color: colors.terracotta,
  },

  magicMark: {
    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  title: {
    maxWidth: 340,

    marginTop: 17,

    fontSize: 31,

    lineHeight: 39,

    letterSpacing: -0.9,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  description: {
    maxWidth: 330,

    marginTop: 10,

    fontSize: 14,

    lineHeight: 22,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  referenceSpotlight: {
    minHeight: 132,

    marginTop: 19,

    padding: 12,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: 20,

    backgroundColor: "rgba(255, 253, 252, 0.9)",

    borderWidth: 1,

    borderColor: "rgba(255, 255, 255, 0.75)",
  },

  referenceThumbnail: {
    width: 84,
    height: 108,

    borderRadius: 15,
  },

  referenceContent: {
    flex: 1,

    minWidth: 0,

    marginLeft: 13,
  },

  referenceMeta: {
    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",

    gap: 6,
  },

  sourceBadge: {
    minHeight: 25,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  sourceText: {
    fontSize: 10,

    fontFamily: fonts.semibold,
  },

  categoryMiniPill: {
    minHeight: 25,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  referenceCategory: {
    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  referenceTitle: {
    marginTop: 9,

    fontSize: 16,

    lineHeight: 22,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  referenceAuthor: {
    marginTop: 6,

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  referenceUrl: {
    marginTop: 6,

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  inputSection: {
    display: "none",
  },

  inputPanel: {
    marginBottom: 20,

    padding: 16,

    borderRadius: 22,

    backgroundColor: colors.lavenderLight,

    borderWidth: 1,

    borderColor: "rgba(142, 127, 194, 0.14)",
  },

  inputPanelHeader: {
    marginBottom: 13,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  inputPanelMark: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  inputPanelEyebrow: {
    marginBottom: 2,

    fontSize: 9,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.lavender,
  },

  fieldHeader: {
    marginBottom: 10,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 10,
  },

  fieldTitle: {
    flex: 1,

    fontSize: 16,

    lineHeight: 23,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  optionalPill: {
    minHeight: 26,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.surface,
  },

  optional: {
    marginTop: 7,

    fontSize: 9,

    letterSpacing: 0.6,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  ideaField: {
    minHeight: 160,

    padding: 16,

    borderRadius: 18,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: "rgba(142, 127, 194, 0.16)",
  },

  ideaInput: {
    minHeight: 114,

    padding: 0,

    fontSize: 15,

    lineHeight: 24,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  characterCount: {
    marginTop: 8,

    textAlign: "right",

    fontSize: 11,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  helperRow: {
    marginTop: 11,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 7,
  },

  helperText: {
    flex: 1,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  formatSection: {
    display: "none",
  },

  formatPanel: {
    marginBottom: 24,

    padding: 16,

    borderRadius: 22,

    backgroundColor: colors.blueLight,

    borderWidth: 1,

    borderColor: "rgba(121, 165, 184, 0.15)",
  },

  formatPanelHeader: {
    marginBottom: 13,

    flexDirection: "row",

    alignItems: "center",

    gap: 10,
  },

  formatPanelMark: {
    width: 42,
    height: 42,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  formatEyebrow: {
    marginBottom: 2,

    fontSize: 9,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.blue,
  },

  formats: {
    flexDirection: "row",

    gap: 8,
  },

  formatOption: {
    flex: 1,

    minHeight: 66,

    paddingHorizontal: 8,

    borderRadius: 17,

    borderWidth: 1,

    borderColor: "rgba(121, 165, 184, 0.14)",

    backgroundColor: "rgba(255, 253, 252, 0.82)",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,
  },

  formatOptionSelected: {
    backgroundColor: colors.text,

    borderColor: colors.text,
  },

  formatIcon: {
    width: 30,
    height: 30,

    borderRadius: 9,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  formatIconSelected: {
    backgroundColor: colors.terracotta,
  },

  formatText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  formatTextSelected: {
    color: colors.surface,
  },

  createButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
  },

  createButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  createButtonMark: {
    width: 34,
    height: 34,
    marginRight: 11,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    flex: 1,
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  createButtonTextDisabled: {
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
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  errorText: {
    maxWidth: 280,
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  backAction: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.text,
  },

  backActionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
