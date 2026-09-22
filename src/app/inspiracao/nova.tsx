import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Alert,
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
import PlatformIcon, { getPlatformMeta } from "../../components/PlatformIcon";

import { saveInspiration } from "../../services/inspirationStorage";

import {
    detectMediaSource,
    getMediaMetadata,
    MediaMetadata,
    normalizeMediaUrl,
} from "../../services/mediaMetadataService";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const categories = ["Hook", "Tema", "Roteiro", "Formato", "Edição", "CTA"];

export default function NewInspirationScreen() {
  const [url, setUrl] = useState("");

  const [category, setCategory] = useState<string | null>(null);

  const [note, setNote] = useState("");

  const [saving, setSaving] = useState(false);

  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);

  const [metadataUrl, setMetadataUrl] = useState("");

  const [metadataLoading, setMetadataLoading] = useState(false);

  const source = useMemo(
    () => metadata?.source ?? detectMediaSource(url),
    [metadata?.source, url],
  );

  const sourceMeta = useMemo(() => getPlatformMeta(source), [source]);

  const canSave = url.trim().length > 0 && !saving;

  useEffect(() => {
    const normalized = normalizeMediaUrl(url);

    setMetadata(null);
    setMetadataUrl("");

    if (!url.trim() || url.trim().length < 7) {
      setMetadataLoading(false);
      return;
    }

    let active = true;

    const timeout = setTimeout(async () => {
      try {
        setMetadataLoading(true);

        const resolved = await getMediaMetadata(normalized);

        if (!active) {
          return;
        }

        setMetadata(resolved);

        setMetadataUrl(normalized);
      } finally {
        if (active) {
          setMetadataLoading(false);
        }
      }
    }, 650);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [url]);

  async function handleSave() {
    if (!url.trim() || saving) {
      return;
    }

    try {
      setSaving(true);

      const normalized = normalizeMediaUrl(url);

      const resolved =
        metadata && metadataUrl === normalized
          ? metadata
          : await getMediaMetadata(normalized);

      await saveInspiration({
        id: Date.now().toString(),
        url: normalized,
        source: resolved.source,
        category,
        note: note.trim(),
        thumbnailUrl: resolved.thumbnailUrl,
        mediaTitle: resolved.mediaTitle,
        authorName: resolved.authorName,
        metadataUpdatedAt: resolved.metadataUpdatedAt,
        createdAt: new Date().toISOString(),
      });

      router.back();
    } catch (error) {
      console.error("Erro ao salvar inspiração:", error);

      Alert.alert(
        "Não foi possível salvar",
        "Confira o link e tente novamente.",
      );
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
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Salvar inspiração</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.heroPanel}>
            <View style={styles.heroBubbleOne} />

            <View style={styles.heroBubbleTwo} />

            <View style={styles.heroTop}>
              <View style={styles.heroBadge}>
                <Ionicons name="sparkles" size={13} color={colors.rose} />

                <Text style={styles.heroBadgeText}>SEU ACERVO CRIATIVO</Text>
              </View>

              <View style={styles.heroMark}>
                <Ionicons name="bookmark" size={20} color={colors.surface} />
              </View>
            </View>

            <Text style={styles.heroTitle}>
              Viu algo bom?
              {"\n"}
              Guarda aqui.
            </Text>

            <Text style={styles.heroDescription}>
              Cole o link e o ContentFlow tenta reconhecer a plataforma, a capa
              e as informações da referência.
            </Text>

            <View style={styles.heroTip}>
              <View style={styles.heroTipMark}>
                <Ionicons name="flash-outline" size={16} color={colors.rose} />
              </View>

              <Text style={styles.heroTipText}>
                Você organiza o motivo e a categoria em poucos segundos.
              </Text>
            </View>
          </View>

          <View style={styles.linkPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkBlue}>
                <Ionicons name="link-outline" size={19} color={colors.blue} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowBlue}>REFERÊNCIA</Text>

                <Text style={styles.sectionTitle}>Cole o link</Text>

                <Text style={styles.sectionSubtitle}>
                  Instagram, TikTok, YouTube, Kwai ou outro link.
                </Text>
              </View>
            </View>

            <View
              style={[styles.urlField, url.trim() && styles.urlFieldActive]}
            >
              <View
                style={[
                  styles.sourceMark,
                  {
                    backgroundColor: sourceMeta.background,
                  },
                ]}
              >
                <PlatformIcon source={source} size={20} />
              </View>

              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="Cole o link aqui..."
                placeholderTextColor={colors.textMuted}
                style={styles.urlInput}
              />
            </View>

            {url.trim() && (
              <View style={styles.sourceDetected}>
                <View
                  style={[
                    styles.detectedMark,
                    {
                      backgroundColor: metadataLoading
                        ? colors.terracottaLight
                        : colors.sageLight,
                    },
                  ]}
                >
                  {metadataLoading ? (
                    <ActivityIndicator size="small" color={colors.terracotta} />
                  ) : (
                    <Ionicons name="checkmark" size={15} color={colors.sage} />
                  )}
                </View>

                <Text style={styles.sourceDetectedText}>
                  {metadataLoading
                    ? "Buscando capa e informações..."
                    : source === "Outro"
                      ? "Referência externa reconhecida."
                      : `${source} reconhecido automaticamente.`}
                </Text>
              </View>
            )}

            {url.trim() && (
              <View style={styles.previewCard}>
                <InspirationThumbnail
                  thumbnailUrl={metadata?.thumbnailUrl}
                  source={source}
                  variant="preview"
                  style={styles.previewThumbnail}
                />

                <View style={styles.previewContent}>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewEyebrow}>PREVIEW</Text>

                    <View
                      style={[
                        styles.previewSourcePill,
                        {
                          backgroundColor: sourceMeta.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.previewSourceText,
                          {
                            color: sourceMeta.brandColor,
                          },
                        ]}
                      >
                        {source}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.previewTitle} numberOfLines={3}>
                    {metadataLoading
                      ? "Preparando o preview..."
                      : metadata?.mediaTitle || `Referência do ${source}`}
                  </Text>

                  {metadata?.authorName ? (
                    <Text style={styles.previewAuthor} numberOfLines={1}>
                      {metadata.authorName}
                    </Text>
                  ) : !metadataLoading &&
                    !metadata?.thumbnailUrl &&
                    (source === "Instagram" || source === "Kwai") ? (
                    <Text style={styles.previewFallbackText}>
                      Capa indisponível por enquanto. O link será salvo
                      normalmente.
                    </Text>
                  ) : null}
                </View>
              </View>
            )}
          </View>

          <View style={styles.categoryPanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkAmber}>
                <Ionicons
                  name="pricetags-outline"
                  size={19}
                  color={colors.amber}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowAmber}>ORGANIZAÇÃO</Text>

                <Text style={styles.sectionTitle}>
                  O que fez você salvar isso?
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Escolha uma categoria para encontrar depois.
                </Text>
              </View>

              <View style={styles.optionalPill}>
                <Text style={styles.optionalText}>OPCIONAL</Text>
              </View>
            </View>

            <View style={styles.categories}>
              {categories.map((item) => {
                const selected = category === item;

                const accent = getCategoryColor(item);

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryOption,
                      selected && {
                        backgroundColor: accent.background,
                        borderColor: accent.foreground,
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(selected ? null : item)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        selected && {
                          color: accent.foreground,
                        },
                      ]}
                    >
                      {item}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={13}
                        color={accent.foreground}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.notePanel}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionMarkLavender}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={19}
                  color={colors.lavender}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.sectionEyebrowLavender}>SUA LEITURA</Text>

                <Text style={styles.sectionTitle}>Por que vale guardar?</Text>

                <Text style={styles.sectionSubtitle}>
                  Anote o detalhe que você não quer esquecer.
                </Text>
              </View>

              <View style={styles.counterPill}>
                <Text style={styles.counter}>{note.length}/300</Text>
              </View>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Ex.: gostei da abertura, da forma de explicar, da edição ou do formato..."
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
            />

            <View style={styles.tip}>
              <View style={styles.tipMark}>
                <Ionicons
                  name="bulb-outline"
                  size={16}
                  color={colors.lavender}
                />
              </View>

              <Text style={styles.tipText}>
                Uma frase simples já ajuda você a lembrar depois por que essa
                referência valeu a pena.
              </Text>
            </View>
          </View>

          <View style={styles.savePanel}>
            <View style={styles.saveBubble} />

            <View style={styles.saveBadge}>
              <Ionicons
                name="bookmark-outline"
                size={14}
                color={colors.terracotta}
              />

              <Text style={styles.saveBadgeText}>SALVAR NO ACERVO</Text>
            </View>

            <Text style={styles.savePanelTitle}>Pronto para guardar.</Text>

            <Text style={styles.savePanelText}>
              Depois você pode editar, categorizar melhor ou transformar essa
              referência em conteúdo.
            </Text>

            <TouchableOpacity
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
              activeOpacity={0.86}
              disabled={!canSave}
              onPress={handleSave}
            >
              <View style={styles.saveButtonMark}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.terracotta} />
                ) : (
                  <Ionicons
                    name="bookmark"
                    size={18}
                    color={canSave ? colors.terracotta : colors.textMuted}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.saveButtonText,
                    !canSave && styles.saveButtonTextDisabled,
                  ]}
                >
                  {saving ? "Salvando..." : "Salvar inspiração"}
                </Text>

                <Text
                  style={[
                    styles.saveButtonHint,
                    !canSave && styles.saveButtonHintDisabled,
                  ]}
                >
                  Vai para sua biblioteca
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={19}
                color={canSave ? colors.surface : colors.textMuted}
              />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case "Hook":
      return {
        background: colors.terracottaLight,
        foreground: colors.terracotta,
      };

    case "Tema":
      return {
        background: colors.roseLight,
        foreground: colors.rose,
      };

    case "Roteiro":
      return {
        background: colors.amberLight,
        foreground: colors.amber,
      };

    case "Formato":
      return {
        background: colors.blueLight,
        foreground: colors.blue,
      };

    case "Edição":
      return {
        background: colors.lavenderLight,
        foreground: colors.lavender,
      };

    case "CTA":
      return {
        background: colors.sageLight,
        foreground: colors.sage,
      };

    default:
      return {
        background: colors.primaryLight,
        foreground: colors.primary,
      };
  }
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

  heroPanel: {
    position: "relative",
    overflow: "hidden",
    marginTop: 14,
    marginBottom: 16,
    padding: 18,
    borderRadius: 28,
    backgroundColor: colors.roseLight,
    borderWidth: 1,
    borderColor: "rgba(207,130,149,0.15)",
    ...shadows.card,
  },

  heroBubbleOne: {
    position: "absolute",
    width: 126,
    height: 126,
    top: -48,
    right: -36,
    borderRadius: 63,
    backgroundColor: "rgba(225,116,85,0.13)",
  },

  heroBubbleTwo: {
    position: "absolute",
    width: 82,
    height: 82,
    left: -28,
    bottom: 24,
    borderRadius: 41,
    backgroundColor: "rgba(142,127,194,0.12)",
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
    color: colors.rose,
  },

  heroMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.rose,
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
    minHeight: 55,
    marginTop: 15,
    padding: 10,
    borderRadius: 16,
    backgroundColor: "rgba(255,253,252,0.72)",
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

  linkPanel: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.blueLight,
    borderWidth: 1,
    borderColor: "rgba(121,165,184,0.14)",
    ...shadows.soft,
  },

  categoryPanel: {
    marginBottom: 14,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.amberLight,
    borderWidth: 1,
    borderColor: "rgba(201,154,69,0.14)",
    ...shadows.soft,
  },

  notePanel: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.lavenderLight,
    borderWidth: 1,
    borderColor: "rgba(142,127,194,0.14)",
    ...shadows.soft,
  },

  sectionHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  sectionMarkLavender: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
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

  sectionEyebrowLavender: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.lavender,
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

  optionalPill: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  optionalText: {
    fontSize: 9,
    letterSpacing: 0.55,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  urlField: {
    minHeight: 62,
    paddingHorizontal: 11,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
  },

  urlFieldActive: {
    borderColor: "rgba(121,165,184,0.3)",
  },

  sourceMark: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  urlInput: {
    flex: 1,
    minHeight: 60,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  sourceDetected: {
    minHeight: 38,
    marginTop: 9,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  detectedMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  sourceDetectedText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  previewCard: {
    minHeight: 132,
    marginTop: 10,
    padding: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255,253,252,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
  },

  previewThumbnail: {
    width: 82,
    height: 106,
    borderRadius: 14,
  },

  previewContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  previewEyebrow: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.blue,
  },

  previewSourcePill: {
    minHeight: 24,
    paddingHorizontal: 7,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  previewSourceText: {
    fontSize: 9,
    fontFamily: fonts.semibold,
  },

  previewTitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  previewAuthor: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  previewFallbackText: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  categoryOption: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,253,252,0.8)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  categoryText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  counterPill: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  counter: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  noteInput: {
    minHeight: 155,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.72)",
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  tip: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  tipMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  tipText: {
    flex: 1,
    paddingTop: 2,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  savePanel: {
    position: "relative",
    overflow: "hidden",
    padding: 17,
    borderRadius: 24,
    backgroundColor: colors.primary,
    ...shadows.hero,
  },

  saveBubble: {
    position: "absolute",
    width: 116,
    height: 116,
    top: -46,
    right: -30,
    borderRadius: 58,
    backgroundColor: "rgba(225,116,85,0.18)",
  },

  saveBadge: {
    alignSelf: "flex-start",
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: "rgba(255,253,252,0.1)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  saveBadgeText: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  savePanelTitle: {
    marginTop: 12,
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  savePanelText: {
    maxWidth: 305,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.68)",
  },

  saveButton: {
    minHeight: 62,
    marginTop: 14,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonMark: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },

  saveButtonHint: {
    marginTop: 1,
    fontSize: 10,
    fontFamily: fonts.regular,
    color: "rgba(255,253,252,0.72)",
  },

  saveButtonHintDisabled: {
    color: colors.textMuted,
  },
});
