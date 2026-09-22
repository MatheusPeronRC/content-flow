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

import {
  deleteInspiration,
  getInspirationById,
  updateInspiration,
} from "../../services/inspirationStorage";

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

  const accent = useMemo(
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
    if (!inspiration || !url.trim()) {
      return;
    }

    try {
      const updates = {
        url: url.trim(),
        source: detectSource(url.trim()),
        category,
        note: note.trim(),
      };

      await updateInspiration(inspiration.id, updates);

      setInspiration({
        ...inspiration,
        ...updates,
      });

      setEditing(false);
    } catch (error) {
      console.error("Erro ao salvar inspiração:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
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
              size={19}
              color={editing ? colors.danger : colors.rose}
            />
          </TouchableOpacity>
        </View>

        {!editing ? (
          <>
            <View style={styles.hero}>
              <View style={styles.heroMeta}>
                <View
                  style={[
                    styles.sourceChip,

                    {
                      backgroundColor: accent.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={getSourceIcon(inspiration.source)}
                    size={14}
                    color={accent.foreground}
                  />

                  <Text
                    style={[
                      styles.sourceChipText,

                      {
                        color: accent.foreground,
                      },
                    ]}
                  >
                    {inspiration.source}
                  </Text>
                </View>

                {inspiration.category && (
                  <>
                    <View style={styles.heroDot} />

                    <Text
                      style={[
                        styles.heroCategory,

                        {
                          color: accent.foreground,
                        },
                      ]}
                    >
                      {inspiration.category.toUpperCase()}
                    </Text>
                  </>
                )}
              </View>

              <Text style={styles.heroTitle}>
                {inspiration.note || `Referência do ${inspiration.source}`}
              </Text>

              <Text style={styles.savedDate}>
                Salva em {formatCreatedDate(inspiration.createdAt)}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>REFERÊNCIA ORIGINAL</Text>

              <TouchableOpacity
                style={styles.referenceCard}
                activeOpacity={0.82}
                onPress={handleOpenOriginal}
              >
                <View
                  style={[
                    styles.referenceIcon,

                    {
                      backgroundColor: accent.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={getSourceIcon(inspiration.source)}
                    size={19}
                    color={accent.foreground}
                  />
                </View>

                <View style={styles.referenceContent}>
                  <Text style={styles.referenceSource}>
                    {inspiration.source}
                  </Text>

                  <Text style={styles.referenceUrl} numberOfLines={1}>
                    {cleanUrl(inspiration.url)}
                  </Text>
                </View>

                <View style={styles.openMark}>
                  <Ionicons
                    name="arrow-up-outline"
                    size={15}
                    color={colors.textSecondary}
                    style={{
                      transform: [
                        {
                          rotate: "45deg",
                        },
                      ],
                    }}
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
                        backgroundColor: accent.foreground,
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
                <Ionicons name="open-outline" size={16} color={colors.blue} />

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
                  size={16}
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
                Link, categoria e anotação podem ser alterados a qualquer
                momento.
              </Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>LINK</Text>

              <View style={styles.inputWrap}>
                <Ionicons
                  name="link-outline"
                  size={17}
                  color={colors.textMuted}
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
                textAlignVertical="top"
                placeholder="Por que você salvou essa referência?"
                placeholderTextColor={colors.textMuted}
                style={styles.noteInput}
              />
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,

                !url.trim() && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!url.trim()}
              onPress={handleSave}
            >
              <View style={styles.saveButtonMark}>
                <Ionicons
                  name="checkmark"
                  size={17}
                  color={url.trim() ? colors.terracotta : colors.textMuted}
                />
              </View>

              <Text
                style={[
                  styles.saveButtonText,

                  !url.trim() && styles.saveButtonTextDisabled,
                ]}
              >
                Salvar alterações
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

    default:
      return "link-outline";
  }
}

function detectSource(url: string) {
  const normalized = url.toLowerCase();

  if (normalized.includes("instagram.com")) {
    return "Instagram";
  }

  if (normalized.includes("tiktok.com")) {
    return "TikTok";
  }

  if (normalized.includes("youtube.com") || normalized.includes("youtu.be")) {
    return "YouTube";
  }

  return "Outro";
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

    paddingBottom: 48,
  },

  header: {
    height: 68,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
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

  headerButtonEditing: {
    backgroundColor: "#F7E7E4",
  },

  headerTitle: {
    fontSize: 16,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  hero: {
    paddingTop: 28,

    paddingBottom: 34,
  },

  heroMeta: {
    flexDirection: "row",

    alignItems: "center",
  },

  sourceChip: {
    minHeight: 28,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  sourceChipText: {
    fontSize: 11,

    fontFamily: fonts.semibold,
  },

  heroDot: {
    width: 3,
    height: 3,

    marginHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  heroCategory: {
    fontSize: 10,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,
  },

  heroTitle: {
    maxWidth: 340,

    marginTop: 17,

    fontSize: 31,

    lineHeight: 39,

    letterSpacing: -0.9,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  savedDate: {
    marginTop: 10,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textMuted,
  },

  section: {
    marginBottom: 30,
  },

  sectionLabel: {
    marginBottom: 11,

    fontSize: 10,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.textMuted,
  },

  referenceCard: {
    minHeight: 74,

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
    width: 40,
    height: 40,

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

    fontFamily: fonts.regular,

    color: colors.textMuted,
  },

  openMark: {
    width: 30,
    height: 30,

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

    fontFamily: fonts.regular,

    color: colors.textMuted,
  },

  actions: {
    marginTop: 4,
  },

  createButton: {
    minHeight: 58,

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

    fontSize: 14,

    fontFamily: fonts.bold,

    color: colors.surface,
  },

  openOriginalAction: {
    minHeight: 48,

    marginTop: 8,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
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
    minHeight: 50,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  deleteButtonText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.danger,
  },

  editingContent: {
    paddingTop: 24,
  },

  editIntro: {
    marginBottom: 30,
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
    maxWidth: 320,

    marginTop: 8,

    fontSize: 14,

    lineHeight: 21,

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

    color: colors.textMuted,
  },

  inputWrap: {
    minHeight: 54,

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

    minHeight: 52,

    paddingVertical: 0,

    fontSize: 14,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  categories: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,
  },

  categoryOption: {
    minHeight: 36,

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

    fontSize: 10,

    fontFamily: fonts.medium,

    color: colors.textMuted,
  },

  noteInput: {
    minHeight: 150,

    padding: 16,

    borderRadius: 19,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: 15,

    lineHeight: 23,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  saveButton: {
    minHeight: 58,

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
    fontSize: 20,

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
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.surface,
  },
});
