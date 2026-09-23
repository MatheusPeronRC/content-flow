import { Ionicons } from "@expo/vector-icons";
import {
    router,
    useFocusEffect,
    useLocalSearchParams,
    useNavigation,
} from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../../components/InspirationThumbnail";
import PlatformIcon, {
    getPlatformMeta,
} from "../../../components/PlatformIcon";

import {
    deleteInspiration,
    getInspirationById,
    updateInspiration,
} from "../../../services/inspirationStorage";

import {
    getMediaMetadata,
    normalizeMediaUrl,
} from "../../../services/mediaMetadataService";

import { Inspiration } from "../../../types/inspiration";

import {
    colors,
    fonts,
    radius,
    shadows,
    spacing,
} from "../../../constants/theme";

const categories = ["Hook", "Tema", "Edição", "Formato", "Roteiro", "CTA"];

export default function InspirationDetailsScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [url, setUrl] = useState("");

  const [category, setCategory] = useState<string | null>(null);

  const [note, setNote] = useState("");

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: editing ? { display: "none" } : undefined,
    } as any);

    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      } as any);
    };
  }, [editing, navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setEditing(false);

      async function load() {
        if (!id) {
          if (active) {
            setLoading(false);
          }

          return;
        }

        try {
          const data = await getInspirationById(id);

          if (!active) {
            return;
          }

          if (!data) {
            setInspiration(null);
            return;
          }

          setInspiration(data);
          setUrl(data.url);
          setCategory(data.category);
          setNote(data.note);
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
    }, [id]),
  );

  const sourceAccent = useMemo(
    () => getPlatformMeta(inspiration?.source ?? "Outro"),
    [inspiration?.source],
  );

  const categoryAccent = useMemo(
    () => getCategoryColor(inspiration?.category ?? null),
    [inspiration?.category],
  );

  async function handleOpenOriginal() {
    if (!inspiration?.url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(inspiration.url);

      if (!supported) {
        Alert.alert(
          "Não foi possível abrir",
          "Confira se o link da referência está correto.",
        );

        return;
      }

      await Linking.openURL(inspiration.url);
    } catch {
      Alert.alert(
        "Erro ao abrir link",
        "Não foi possível abrir essa referência.",
      );
    }
  }

  async function handleSave() {
    if (!inspiration || !url.trim() || saving) {
      return;
    }

    try {
      setSaving(true);

      const normalizedUrl = normalizeMediaUrl(url);

      const metadata = await getMediaMetadata(normalizedUrl);

      const updates = {
        url: normalizedUrl,
        source: metadata.source,
        category,
        note: note.trim(),
        thumbnailUrl: metadata.thumbnailUrl,
        mediaTitle: metadata.mediaTitle,
        authorName: metadata.authorName,
        metadataUpdatedAt: metadata.metadataUpdatedAt,
      };

      await updateInspiration(inspiration.id, updates);

      setInspiration({
        ...inspiration,
        ...updates,
      });

      setUrl(normalizedUrl);
      setEditing(false);
    } catch (error) {
      console.error("Erro ao salvar inspiração:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!inspiration) {
      return;
    }

    setUrl(inspiration.url);
    setCategory(inspiration.category);
    setNote(inspiration.note);
    setEditing(false);
  }

  function handleDelete() {
    if (!inspiration) {
      return;
    }

    Alert.alert(
      "Excluir inspiração?",
      "Essa referência será removida da sua biblioteca.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInspiration(inspiration.id);

              router.back();
            } catch (error) {
              console.error("Erro ao excluir inspiração:", error);

              Alert.alert("Não foi possível excluir", "Tente novamente.");
            }
          },
        },
      ],
    );
  }

  function handleCreateVersion() {
    if (!inspiration) {
      return;
    }

    router.push({
      pathname: "/conteudo/adaptar",
      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.rose} />

          <Text style={styles.loadingText}>Abrindo inspiração...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorMark}>
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.errorTitle}>Inspiração não encontrada</Text>

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

  const displayTitle =
    inspiration.mediaTitle?.trim() || `Referência do ${inspiration.source}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          editing && styles.contentEditing,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>
            {editing ? "Editar inspiração" : "Inspiração"}
          </Text>

          <TouchableOpacity
            style={[styles.headerButton, editing && styles.headerButtonEditing]}
            onPress={() => {
              if (editing) {
                handleCancelEdit();
              } else {
                setEditing(true);
              }
            }}
          >
            <Ionicons
              name={editing ? "close" : "create-outline"}
              size={20}
              color={editing ? colors.danger : colors.rose}
            />
          </TouchableOpacity>
        </View>

        {!editing ? (
          <>
            <TouchableOpacity
              style={styles.referenceCard}
              activeOpacity={0.84}
              onPress={handleOpenOriginal}
            >
              <InspirationThumbnail
                thumbnailUrl={inspiration.thumbnailUrl}
                source={inspiration.source}
                variant="preview"
                style={styles.thumbnail}
              />

              <View style={styles.referenceContent}>
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.sourcePill,
                      {
                        backgroundColor: sourceAccent.background,
                      },
                    ]}
                  >
                    <PlatformIcon source={inspiration.source} size={12} />

                    <Text
                      style={[
                        styles.sourcePillText,
                        {
                          color: sourceAccent.brandColor,
                        },
                      ]}
                    >
                      {inspiration.source}
                    </Text>
                  </View>

                  {inspiration.category ? (
                    <View style={styles.categoryPill}>
                      <View
                        style={[
                          styles.categoryDot,
                          {
                            backgroundColor: categoryAccent.foreground,
                          },
                        ]}
                      />

                      <Text style={styles.categoryPillText}>
                        {inspiration.category}
                      </Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.referenceTitle} numberOfLines={5}>
                  {displayTitle}
                </Text>

                {inspiration.authorName ? (
                  <Text style={styles.author} numberOfLines={1}>
                    {inspiration.authorName}
                  </Text>
                ) : null}

                <View style={styles.referenceFooter}>
                  <Text style={styles.savedAt}>
                    Salva em {formatCreatedDate(inspiration.createdAt)}
                  </Text>

                  <View style={styles.referenceOpenHint}>
                    <Text style={styles.referenceOpenText}>Abrir original</Text>
                    <Ionicons
                      name="open-outline"
                      size={15}
                      color={colors.textSecondary}
                    />
                  </View>
                </View>
              </View>
            </TouchableOpacity>

            <View style={styles.noteSection}>
              <View style={styles.sectionHeading}>
                <View style={styles.sectionHeadingIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={18}
                    color={colors.lavender}
                  />
                </View>

                <View>
                  <Text style={styles.smallLabel}>SUA ANOTAÇÃO</Text>

                  <Text style={styles.sectionTitle}>
                    O que te chamou atenção
                  </Text>
                </View>
              </View>

              <View style={styles.noteQuote}>
                <View style={styles.noteAccent} />

                <Text
                  style={inspiration.note ? styles.noteText : styles.emptyNote}
                >
                  {inspiration.note || "Nenhuma anotação adicionada."}
                </Text>
              </View>
            </View>

            <View style={styles.nextSection}>
              <Text style={styles.nextEyebrow}>PRÓXIMO PASSO</Text>

              <Text style={styles.nextTitle}>
                Quer transformar isso em conteúdo?
              </Text>

              <Text style={styles.nextDescription}>
                Leve a referência para a próxima etapa e diga o que você quer
                aproveitar dela.
              </Text>

              <TouchableOpacity
                style={styles.createButton}
                activeOpacity={0.86}
                onPress={handleCreateVersion}
              >
                <View style={styles.createButtonIcon}>
                  <Ionicons
                    name="sparkles"
                    size={17}
                    color={colors.terracotta}
                  />
                </View>

                <Text style={styles.createButtonText}>Criar minha versão</Text>

                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={colors.surface}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />

              <Text style={styles.deleteButtonText}>Excluir inspiração</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.editingContent}>
            <View style={styles.editPreview}>
              <InspirationThumbnail
                thumbnailUrl={inspiration.thumbnailUrl}
                source={inspiration.source}
                variant="compact"
                style={styles.editPreviewThumbnail}
              />

              <View style={styles.editPreviewContent}>
                <Text style={styles.smallLabel}>REFERÊNCIA ATUAL</Text>

                <Text style={styles.editPreviewTitle} numberOfLines={3}>
                  {displayTitle}
                </Text>

                <Text style={styles.editPreviewHint}>
                  Ao salvar, capa e metadados podem ser atualizados.
                </Text>
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formTitleRow}>
                <Ionicons name="link-outline" size={17} color={colors.blue} />

                <Text style={styles.formLabel}>Link original</Text>
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  placeholder="https://..."
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formTitleRow}>
                <Ionicons
                  name="pricetags-outline"
                  size={17}
                  color={colors.amber}
                />

                <Text style={styles.formLabel}>Categoria</Text>
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
                          styles.categoryOptionText,
                          selected && styles.categoryOptionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formSection}>
              <View style={styles.formTitleRow}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={17}
                  color={colors.lavender}
                />

                <Text style={styles.formLabel}>Sua anotação</Text>

                <Text style={styles.characterCount}>{note.length}/300</Text>
              </View>

              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                maxLength={300}
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Por que você salvou essa referência?"
                placeholderTextColor={colors.textMuted}
                style={styles.noteInput}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (!url.trim() || saving) && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!url.trim() || saving}
              onPress={handleSave}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="checkmark" size={18} color={colors.surface} />
              )}

              <Text style={styles.saveButtonText}>
                {saving ? "Atualizando..." : "Salvar alterações"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryColor(category: string | null) {
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
    case "Edição":
      return {
        background: colors.lavenderLight,
        foreground: colors.lavender,
      };
    case "Formato":
      return {
        background: colors.blueLight,
        foreground: colors.blue,
      };
    case "Roteiro":
      return {
        background: colors.amberLight,
        foreground: colors.amber,
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

function formatCreatedDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 132,
  },

  contentEditing: {
    paddingBottom: 52,
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

  headerButtonEditing: {
    backgroundColor: "#F7E7E4",
    borderColor: "rgba(189,97,90,0.18)",
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  referenceCard: {
    marginTop: 14,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.card,
  },

  thumbnail: {
    width: 112,
    height: 144,
    borderRadius: 17,
  },

  referenceContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  sourcePill: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sourcePillText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
  },

  categoryPill: {
    minHeight: 27,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: radius.round,
  },

  categoryPillText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  referenceTitle: {
    marginTop: 10,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  author: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  referenceFooter: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  savedAt: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  referenceOpenHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  referenceOpenText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  smallLabel: {
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  noteSection: {
    marginTop: 22,
  },

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  sectionHeadingIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.lavenderLight,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionTitle: {
    marginTop: 2,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  noteQuote: {
    position: "relative",
    marginTop: 10,
    paddingVertical: 9,
    paddingLeft: 16,
    paddingRight: 4,
  },

  noteAccent: {
    position: "absolute",
    left: 0,
    top: 7,
    bottom: 7,
    width: 3,
    borderRadius: radius.round,
    backgroundColor: colors.lavender,
  },

  noteText: {
    fontSize: 17,
    lineHeight: 27,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  emptyNote: {
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  nextSection: {
    marginTop: 25,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  nextEyebrow: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  nextTitle: {
    maxWidth: 320,
    marginTop: 6,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  nextDescription: {
    maxWidth: 315,
    marginTop: 5,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  createButton: {
    minHeight: 58,
    marginTop: 15,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  createButtonIcon: {
    width: 34,
    height: 34,
    marginRight: 10,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    flex: 1,
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  deleteButton: {
    minHeight: 50,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteButtonText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.danger,
  },

  editingContent: {
    paddingTop: 14,
  },

  editPreview: {
    minHeight: 112,
    padding: 12,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  editPreviewThumbnail: {
    width: 72,
    height: 88,
    borderRadius: 14,
  },

  editPreviewContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  editPreviewTitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editPreviewHint: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  formSection: {
    marginTop: 24,
  },

  formTitleRow: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  formLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  characterCount: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  inputWrap: {
    minHeight: 58,
    paddingHorizontal: 13,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
  },

  input: {
    minHeight: 56,
    paddingVertical: 0,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
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
    backgroundColor: colors.surface,
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

  categoryOptionText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  categoryOptionTextSelected: {
    color: colors.terracotta,
  },

  noteInput: {
    minHeight: 155,
    padding: 15,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveButton: {
    minHeight: 56,
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.soft,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
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
    backgroundColor: colors.roseLight,
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
