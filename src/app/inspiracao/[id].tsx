import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useMemo, useState } from "react";

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

import InspirationThumbnail from "../../components/InspirationThumbnail";

import {
  deleteInspiration,
  getInspirationById,
  updateInspiration,
} from "../../services/inspirationStorage";

import {
  getMediaMetadata,
  normalizeMediaUrl,
} from "../../services/mediaMetadataService";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const categories = ["Hook", "Tema", "Edição", "Formato", "Roteiro", "CTA"];

export default function InspirationDetailsScreen() {
  const params = useLocalSearchParams();

  const rawId = params.id;

  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [url, setUrl] = useState("");

  const [category, setCategory] = useState<string | null>(null);

  const [note, setNote] = useState("");

  useFocusEffect(
    useCallback(() => {
      let active = true;

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

  const categoryAccent = useMemo(
    () => getCategoryColor(inspiration?.category ?? null),
    [inspiration?.category],
  );

  const sourceAccent = useMemo(
    () => getSourceColor(inspiration?.source ?? "Outro"),
    [inspiration?.source],
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

      // Reconsultamos os metadados ao salvar.
      // Isso também permite preencher thumbnail/título
      // de referências antigas apenas abrindo, editando
      // e salvando novamente.
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
            <Ionicons name="bulb-outline" size={24} color={colors.textMuted} />
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
        contentContainerStyle={styles.content}
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

          <Text style={styles.headerTitle}>Inspiração</Text>

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
            <View style={styles.visualCard}>
              <InspirationThumbnail
                thumbnailUrl={inspiration.thumbnailUrl}
                source={inspiration.source}
                variant="preview"
                style={styles.heroThumbnail}
              />

              <View style={styles.visualContent}>
                <Text style={styles.visualEyebrow}>REFERÊNCIA SALVA</Text>

                <View style={styles.visualMeta}>
                  <View
                    style={[
                      styles.sourceChip,
                      {
                        backgroundColor: sourceAccent.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={getSourceIcon(inspiration.source)}
                      size={13}
                      color={sourceAccent.foreground}
                    />

                    <Text
                      style={[
                        styles.sourceChipText,
                        {
                          color: sourceAccent.foreground,
                        },
                      ]}
                    >
                      {inspiration.source}
                    </Text>
                  </View>

                  {inspiration.category && (
                    <View
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: categoryAccent.background,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.categoryChipText,
                          {
                            color: categoryAccent.foreground,
                          },
                        ]}
                      >
                        {inspiration.category}
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={styles.visualTitle} numberOfLines={4}>
                  {displayTitle}
                </Text>

                {inspiration.authorName ? (
                  <Text style={styles.authorName} numberOfLines={1}>
                    {inspiration.authorName}
                  </Text>
                ) : null}

                <Text style={styles.savedDate}>
                  Salva em {formatCreatedDate(inspiration.createdAt)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>LINK ORIGINAL</Text>

              <TouchableOpacity
                style={styles.referenceCard}
                activeOpacity={0.82}
                onPress={handleOpenOriginal}
              >
                <View
                  style={[
                    styles.referenceIcon,
                    {
                      backgroundColor: sourceAccent.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={getSourceIcon(inspiration.source)}
                    size={19}
                    color={sourceAccent.foreground}
                  />
                </View>

                <View style={styles.referenceContent}>
                  <Text style={styles.referenceSource}>
                    Abrir no {inspiration.source}
                  </Text>

                  <Text style={styles.referenceUrl} numberOfLines={1}>
                    {cleanUrl(inspiration.url)}
                  </Text>
                </View>

                <View style={styles.openMark}>
                  <Ionicons
                    name="open-outline"
                    size={16}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SUA ANOTAÇÃO</Text>

              {inspiration.note ? (
                <View style={styles.noteArea}>
                  <View
                    style={[
                      styles.noteAccent,
                      {
                        backgroundColor: categoryAccent.foreground,
                      },
                    ]}
                  />

                  <Text style={styles.noteText}>{inspiration.note}</Text>
                </View>
              ) : (
                <Text style={styles.emptyNote}>
                  Nenhuma anotação adicionada.
                </Text>
              )}
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.createButton}
                activeOpacity={0.86}
                onPress={handleCreateVersion}
              >
                <View style={styles.createButtonMark}>
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

              <TouchableOpacity
                style={styles.openOriginalAction}
                activeOpacity={0.8}
                onPress={handleOpenOriginal}
              >
                <Ionicons name="open-outline" size={17} color={colors.blue} />

                <Text style={styles.openOriginalText}>Abrir original</Text>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={styles.deleteButton}
                activeOpacity={0.8}
                onPress={handleDelete}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={colors.danger}
                />

                <Text style={styles.deleteButtonText}>Excluir inspiração</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.editingContent}>
            <View style={styles.editIntro}>
              <Text style={styles.editEyebrow}>EDITAR REFERÊNCIA</Text>

              <Text style={styles.editTitle}>Ajuste o que você salvou.</Text>

              <Text style={styles.editDescription}>
                Se o link mudar, o ContentFlow também tenta atualizar a capa, o
                título e o autor.
              </Text>
            </View>

            <View style={styles.editPreview}>
              <InspirationThumbnail
                thumbnailUrl={inspiration.thumbnailUrl}
                source={inspiration.source}
                variant="compact"
              />

              <View style={styles.editPreviewContent}>
                <Text style={styles.editPreviewLabel}>PREVIEW ATUAL</Text>

                <Text style={styles.editPreviewTitle} numberOfLines={2}>
                  {displayTitle}
                </Text>

                <Text style={styles.editPreviewHint}>
                  O preview é atualizado ao salvar.
                </Text>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>LINK</Text>

              <View style={styles.inputWrap}>
                <Ionicons
                  name="link-outline"
                  size={17}
                  color={colors.textSecondary}
                />

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

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>CATEGORIA</Text>

              <View style={styles.categories}>
                {categories.map((item) => {
                  const selected = category === item;

                  const itemColor = getCategoryColor(item);

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.categoryOption,
                        selected && {
                          backgroundColor: itemColor.background,
                          borderColor: itemColor.foreground,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => setCategory(selected ? null : item)}
                    >
                      <Text
                        style={[
                          styles.categoryOptionText,
                          selected && {
                            color: itemColor.foreground,
                          },
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.field}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>SUA ANOTAÇÃO</Text>

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
              <View style={styles.saveButtonMark}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.terracotta} />
                ) : (
                  <Ionicons
                    name="checkmark"
                    size={17}
                    color={url.trim() ? colors.terracotta : colors.textMuted}
                  />
                )}
              </View>

              <Text
                style={[
                  styles.saveButtonText,
                  !url.trim() && styles.saveButtonTextDisabled,
                ]}
              >
                {saving ? "Atualizando preview..." : "Salvar alterações"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getSourceIcon(source: string): keyof typeof Ionicons.glyphMap {
  switch (source) {
    case "Instagram":
      return "logo-instagram";
    case "TikTok":
      return "musical-note-outline";
    case "YouTube":
      return "logo-youtube";
    case "Kwai":
      return "play-outline";
    default:
      return "link-outline";
  }
}

function getSourceColor(source: string) {
  switch (source) {
    case "Instagram":
      return {
        background: colors.terracottaLight,
        foreground: colors.terracotta,
      };
    case "TikTok":
      return {
        background: colors.primaryLight,
        foreground: colors.text,
      };
    case "YouTube":
      return {
        background: colors.roseLight,
        foreground: colors.rose,
      };
    case "Kwai":
      return {
        background: colors.amberLight,
        foreground: colors.amber,
      };
    default:
      return {
        background: colors.blueLight,
        foreground: colors.blue,
      };
  }
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
    paddingBottom: 50,
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
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  visualCard: {
    marginTop: 20,
    marginBottom: 30,
    padding: 14,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  heroThumbnail: {
    width: 126,
    height: 160,
    borderRadius: 18,
  },

  visualContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  visualEyebrow: {
    fontSize: 10,
    letterSpacing: 0.9,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  visualMeta: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  sourceChip: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  sourceChipText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
  },

  categoryChip: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryChipText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
  },

  visualTitle: {
    marginTop: 11,
    fontSize: 18,
    lineHeight: 25,
    letterSpacing: -0.25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  authorName: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  savedDate: {
    marginTop: 7,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  section: {
    marginBottom: 30,
  },

  sectionLabel: {
    marginBottom: 11,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  referenceCard: {
    minHeight: 76,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  referenceIcon: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  referenceContent: {
    flex: 1,
    minWidth: 0,
  },

  referenceSource: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  referenceUrl: {
    marginTop: 4,
    paddingRight: 8,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  openMark: {
    width: 32,
    height: 32,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  noteArea: {
    position: "relative",
    minHeight: 74,
    paddingVertical: 5,
    paddingLeft: 17,
    justifyContent: "center",
  },

  noteAccent: {
    position: "absolute",
    left: 0,
    top: 4,
    bottom: 4,
    width: 3,
    borderRadius: radius.round,
  },

  noteText: {
    fontSize: 18,
    lineHeight: 29,
    letterSpacing: -0.2,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  emptyNote: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  actions: {
    marginTop: 4,
  },

  createButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
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

  openOriginalAction: {
    minHeight: 50,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  openOriginalText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.blue,
  },

  actionDivider: {
    height: 1,
    marginTop: 4,
    backgroundColor: colors.divider,
  },

  deleteButton: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteButtonText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.danger,
  },

  editingContent: {
    paddingTop: 24,
  },

  editIntro: {
    marginBottom: 24,
  },

  editEyebrow: {
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fonts.bold,
    color: colors.rose,
  },

  editTitle: {
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.8,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  editDescription: {
    maxWidth: 330,
    marginTop: 8,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  editPreview: {
    minHeight: 112,
    marginBottom: 28,
    padding: 13,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  editPreviewContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },

  editPreviewLabel: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  editPreviewTitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editPreviewHint: {
    marginTop: 5,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  field: {
    marginBottom: 26,
  },

  fieldHeader: {
    marginBottom: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  fieldLabel: {
    marginBottom: 9,
    fontSize: 10,
    letterSpacing: 1,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  inputWrap: {
    minHeight: 58,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  input: {
    flex: 1,
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
    paddingHorizontal: 14,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryOptionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  characterCount: {
    marginBottom: 9,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  noteInput: {
    minHeight: 160,
    padding: 16,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonMark: {
    width: 34,
    height: 34,
    marginRight: 10,
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
