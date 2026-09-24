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
import { ProductionEffortSelector } from "../../components/ProductionEffortSelector";

import { saveInspiration } from "../../services/inspirationStorage";
import { ProductionEffort } from "../../types/productionEffort";

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
  const [productionEffort, setProductionEffort] =
    useState<ProductionEffort | null>(null);

  const [saving, setSaving] = useState(false);
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null);
  const [metadataUrl, setMetadataUrl] = useState("");
  const [metadataLoading, setMetadataLoading] = useState(false);

  const source = useMemo(
    () => metadata?.source ?? detectMediaSource(url),
    [metadata?.source, url],
  );

  const sourceMeta = useMemo(() => getPlatformMeta(source), [source]);

  const canSave = url.trim().length > 0 && productionEffort !== null && !saving;

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
    if (!url.trim() || !productionEffort || saving) {
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
        productionEffort,
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
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Salvar inspiração</Text>

              <Text style={styles.headerSubtitle}>
                Cole o link e guarde o que vale lembrar.
              </Text>
            </View>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.linkField}>
            <Ionicons
              name="link-outline"
              size={20}
              color={colors.textSecondary}
            />

            <TextInput
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="Cole o link da publicação..."
              placeholderTextColor={colors.textMuted}
              style={styles.linkInput}
            />

            {metadataLoading ? (
              <ActivityIndicator size="small" color={colors.terracotta} />
            ) : url.trim() ? (
              <TouchableOpacity
                style={styles.clearLink}
                activeOpacity={0.8}
                onPress={() => setUrl("")}
              >
                <Ionicons
                  name="close-circle"
                  size={18}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {url.trim() ? (
            <View style={styles.previewCard}>
              <InspirationThumbnail
                thumbnailUrl={metadata?.thumbnailUrl}
                source={source}
                variant="preview"
                style={styles.previewThumbnail}
              />

              <View style={styles.previewMain}>
                <View style={styles.previewPlatformRow}>
                  <PlatformIcon source={source} size={14} />

                  <Text
                    style={[
                      styles.previewPlatform,
                      {
                        color: sourceMeta.brandColor,
                      },
                    ]}
                  >
                    {source}
                  </Text>
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
                ) : !metadataLoading ? (
                  <Text style={styles.previewHelper}>
                    {source === "Outro"
                      ? "Link reconhecido como referência externa."
                      : `${source} reconhecido automaticamente.`}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : (
            <View style={styles.emptyPreview}>
              <View style={styles.emptyPreviewIcon}>
                <Ionicons
                  name="images-outline"
                  size={21}
                  color={colors.textSecondary}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.emptyPreviewTitle}>
                  O preview aparece aqui
                </Text>

                <Text style={styles.emptyPreviewText}>
                  O ContentFlow tenta reconhecer capa, título e plataforma
                  automaticamente.
                </Text>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Quanto tempo isso parece exigir?
            </Text>

            <Text style={styles.sectionSubtitle}>
              Isso ajuda a encontrar o que cabe no seu tempo depois.
            </Text>

            <ProductionEffortSelector
              value={productionEffort}
              onChange={setProductionEffort}
              compact
              style={styles.effortSelector}
            />

            {!productionEffort ? (
              <Text style={styles.requiredHint}>
                Escolha Rápido, Médio ou Demorado para salvar.
              </Text>
            ) : null}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Categoria</Text>

            <Text style={styles.sectionSubtitle}>
              Opcional — marque o que mais chamou sua atenção.
            </Text>

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
                        size={13}
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

          <View style={styles.platformSection}>
            <View>
              <Text style={styles.sectionTitle}>Plataforma</Text>

              <Text style={styles.sectionSubtitle}>
                Detectada automaticamente pelo link.
              </Text>
            </View>

            <View
              style={[
                styles.platformCard,
                {
                  backgroundColor: sourceMeta.background,
                },
              ]}
            >
              <PlatformIcon source={source} size={20} />

              <Text
                style={[
                  styles.platformCardText,
                  {
                    color: sourceMeta.brandColor,
                  },
                ]}
              >
                {source}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.noteHeader}>
              <View>
                <Text style={styles.sectionTitle}>Minha anotação</Text>

                <Text style={styles.sectionSubtitle}>
                  Opcional — registre o motivo de ter salvo.
                </Text>
              </View>

              <Text style={styles.counter}>{note.length}/300</Text>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Ex.: gostei da abertura, do jeito de explicar ou da edição..."
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
            />
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
              <Ionicons
                name="bookmark-outline"
                size={18}
                color={canSave ? colors.surface : colors.textMuted}
              />
            )}

            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled,
              ]}
            >
              {saving ? "Salvando..." : "Salvar inspiração"}
            </Text>
          </TouchableOpacity>
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
    paddingBottom: 50,
  },

  header: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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

  headerCopy: {
    flex: 1,
    minWidth: 0,
  },

  headerTitle: {
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  headerSpace: {
    width: 40,
    height: 40,
  },

  linkField: {
    minHeight: 54,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  linkInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  clearLink: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  previewCard: {
    minHeight: 118,
    marginTop: 12,
    padding: 10,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  previewThumbnail: {
    width: 92,
    height: 96,
    borderRadius: 13,
  },

  previewMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  previewPlatformRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  previewPlatform: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.semibold,
  },

  previewTitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  previewAuthor: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  previewHelper: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  emptyPreview: {
    minHeight: 88,
    marginTop: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  emptyPreviewIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPreviewTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  emptyPreviewText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  section: {
    marginTop: 25,
  },

  sectionTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  effortSelector: {
    marginTop: 12,
  },

  requiredHint: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  categories: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  categoryOption: {
    minHeight: 37,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  categoryOptionSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
  },

  categoryText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  categoryTextSelected: {
    color: colors.terracotta,
  },

  platformSection: {
    marginTop: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  platformCard: {
    minWidth: 104,
    minHeight: 47,
    paddingHorizontal: 12,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  platformCardText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
  },

  noteHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  counter: {
    paddingBottom: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  noteInput: {
    minHeight: 132,
    marginTop: 11,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveButton: {
    minHeight: 54,
    marginTop: 27,
    borderRadius: 15,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    ...shadows.soft,
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },
});
