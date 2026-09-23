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

          <View style={styles.intro}>
            <View style={styles.introLabelRow}>
              <View style={styles.introMark}>
                <Ionicons
                  name="bookmark-outline"
                  size={16}
                  color={colors.terracotta}
                />
              </View>

              <Text style={styles.introEyebrow}>NOVA REFERÊNCIA</Text>
            </View>

            <Text style={styles.introTitle}>
              Viu algo bom?{"\n"}Guarda aqui.
            </Text>

            <Text style={styles.introDescription}>
              Cole o link. O ContentFlow tenta reconhecer a plataforma, a capa e
              as principais informações da referência.
            </Text>
          </View>

          <View style={styles.primaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.linkIcon]}>
                <Ionicons name="link-outline" size={20} color={colors.blue} />
              </View>

              <View style={styles.sectionHeaderText}>
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
                <PlatformIcon source={source} size={21} />
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

            {url.trim() ? (
              <View style={styles.detectedRow}>
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

                <Text style={styles.detectedText}>
                  {metadataLoading
                    ? "Buscando capa e informações..."
                    : source === "Outro"
                      ? "Referência externa reconhecida."
                      : `${source} reconhecido automaticamente.`}
                </Text>
              </View>
            ) : (
              <Text style={styles.linkHelper}>
                Basta colar. O restante pode ser organizado depois.
              </Text>
            )}

            {url.trim() ? (
              <View style={styles.previewCard}>
                <InspirationThumbnail
                  thumbnailUrl={metadata?.thumbnailUrl}
                  source={source}
                  variant="preview"
                  style={styles.previewThumbnail}
                />

                <View style={styles.previewContent}>
                  <View style={styles.previewMetaRow}>
                    <Text style={styles.previewEyebrow}>REFERÊNCIA</Text>

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
                      A capa não está disponível, mas o link será salvo
                      normalmente.
                    </Text>
                  ) : null}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.categoryIcon]}>
                <Ionicons
                  name="pricetags-outline"
                  size={20}
                  color={colors.amber}
                />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>
                  O que chamou sua atenção?
                </Text>

                <Text style={styles.sectionSubtitle}>
                  Opcional — escolha uma categoria para encontrar isso mais
                  rápido depois.
                </Text>
              </View>
            </View>

            <View style={styles.categories}>
              {categories.map((item) => {
                const selected = category === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryOption,
                      selected && styles.categoryOptionSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(selected ? null : item)}
                  >
                    {selected ? (
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.terracotta}
                      />
                    ) : null}

                    <Text
                      style={[
                        styles.categoryText,
                        selected && styles.categoryTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.secondaryCard}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIcon, styles.noteIcon]}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={20}
                  color={colors.lavender}
                />
              </View>

              <View style={styles.sectionHeaderText}>
                <Text style={styles.sectionTitle}>Anote do seu jeito</Text>

                <Text style={styles.sectionSubtitle}>
                  Registre o detalhe que fez essa referência valer a pena.
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
              placeholder="Ex.: gostei da abertura, da forma de explicar ou da edição..."
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
            />

            <View style={styles.noteHelper}>
              <Ionicons
                name="bulb-outline"
                size={16}
                color={colors.textMuted}
              />

              <Text style={styles.noteHelperText}>
                Uma frase já é suficiente para você lembrar por que salvou.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            activeOpacity={0.86}
            disabled={!canSave}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="bookmark" size={18} color={colors.surface} />
            )}

            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled,
              ]}
            >
              {saving ? "Salvando..." : "Salvar inspiração"}
            </Text>

            {!saving ? (
              <Ionicons
                name="arrow-forward"
                size={19}
                color={canSave ? colors.surface : colors.textMuted}
              />
            ) : null}
          </TouchableOpacity>

          <Text style={styles.footerHint}>
            Depois você pode editar, reorganizar ou transformar essa referência
            em conteúdo.
          </Text>
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
    maxWidth: 340,
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

  linkIcon: {
    backgroundColor: colors.blueLight,
  },

  categoryIcon: {
    backgroundColor: colors.amberLight,
  },

  noteIcon: {
    backgroundColor: colors.lavenderLight,
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
    paddingRight: 2,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  urlField: {
    minHeight: 62,
    paddingHorizontal: 11,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  urlFieldActive: {
    borderColor: colors.border,
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
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  linkHelper: {
    marginTop: 9,
    paddingHorizontal: 2,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  detectedRow: {
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

  detectedText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  previewCard: {
    minHeight: 132,
    marginTop: 9,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
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
    marginLeft: 12,
  },

  previewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },

  previewEyebrow: {
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  previewSourcePill: {
    minHeight: 26,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  previewSourceText: {
    fontSize: 11,
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
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  previewFallbackText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
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
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  categoryOptionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  categoryText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  categoryTextSelected: {
    color: colors.terracotta,
  },

  counterPill: {
    minHeight: 28,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  counter: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  noteInput: {
    minHeight: 145,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  noteHelper: {
    marginTop: 10,
    paddingHorizontal: 2,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  noteHelperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  saveButton: {
    minHeight: 58,
    marginTop: 22,
    paddingHorizontal: 16,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    ...shadows.soft,
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },

  footerHint: {
    maxWidth: 320,
    marginTop: 10,
    alignSelf: "center",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    textAlign: "center",
    color: colors.textMuted,
  },
});
