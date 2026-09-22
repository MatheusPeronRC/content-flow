import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useState } from "react";

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

import { colors, radius, spacing, typography } from "../../constants/theme";

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
          setLoading(false);
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
            await deleteInspiration(inspiration.id);

            router.back();
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
      pathname: "/conteudo/criar",

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

          <Text style={styles.loadingText}>Carregando inspiração...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Inspiração não encontrada</Text>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categoryColor = getCategoryColor(inspiration.category);

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
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Inspiração</Text>

          <TouchableOpacity
            style={[styles.headerButton, editing && styles.cancelButton]}
            onPress={() => {
              if (editing) {
                handleCancelEdit();
              } else {
                setEditing(true);
              }
            }}
          >
            <Ionicons
              name={editing ? "close-outline" : "create-outline"}
              size={21}
              color={editing ? colors.danger : colors.rose}
            />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.heroCard,

            {
              backgroundColor: categoryColor.background,
            },
          ]}
        >
          <View style={styles.heroIcon}>
            <Ionicons
              name={getSourceIcon(inspiration.source)}
              size={29}
              color={categoryColor.foreground}
            />
          </View>

          <Text
            style={[
              styles.categoryLabel,

              {
                color: categoryColor.foreground,
              },
            ]}
          >
            {inspiration.category?.toUpperCase() ?? "INSPIRAÇÃO"}
          </Text>

          <Text style={styles.heroTitle}>
            {inspiration.note || `Referência do ${inspiration.source}`}
          </Text>

          <Text style={styles.savedDate}>
            Salva em {formatCreatedDate(inspiration.createdAt)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LINK ORIGINAL</Text>

          {editing ? (
            <TextInput
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              style={styles.input}
            />
          ) : (
            <TouchableOpacity
              style={styles.linkCard}
              onPress={handleOpenOriginal}
            >
              <View style={styles.linkIcon}>
                <Ionicons name="link-outline" size={18} color={colors.blue} />
              </View>

              <Text style={styles.linkText} numberOfLines={2}>
                {inspiration.url}
              </Text>

              <Ionicons
                name="open-outline"
                size={17}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CATEGORIA</Text>

          {editing ? (
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
          ) : (
            <View
              style={[
                styles.categoryBadge,

                {
                  backgroundColor: categoryColor.background,
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryBadgeText,

                  {
                    color: categoryColor.foreground,
                  },
                ]}
              >
                {inspiration.category ?? "Sem categoria"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUA ANOTAÇÃO</Text>

          {editing ? (
            <>
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

              <Text style={styles.characterCount}>{note.length}/300</Text>
            </>
          ) : (
            <View style={styles.noteCard}>
              <View style={styles.noteIcon}>
                <Ionicons
                  name="bookmark-outline"
                  size={19}
                  color={colors.rose}
                />
              </View>

              <Text
                style={inspiration.note ? styles.noteText : styles.emptyNote}
              >
                {inspiration.note || "Nenhuma anotação adicionada."}
              </Text>
            </View>
          )}
        </View>

        {editing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={19} color={colors.surface} />

            <Text style={styles.saveButtonText}>Salvar alterações</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateVersion}
            >
              <Ionicons
                name="sparkles-outline"
                size={19}
                color={colors.surface}
              />

              <Text style={styles.createButtonText}>Criar minha versão</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openButton}
              onPress={handleOpenOriginal}
            >
              <Ionicons name="open-outline" size={18} color={colors.blue} />

              <Text style={styles.openButtonText}>Abrir conteúdo original</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />

              <Text style={styles.deleteButtonText}>Excluir inspiração</Text>
            </TouchableOpacity>
          </>
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
    month: "long",
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

    paddingBottom: spacing.xxl,
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

  cancelButton: {
    backgroundColor: "#F5E4E1",
  },

  headerTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  heroCard: {
    alignItems: "center",

    padding: spacing.xl,

    marginTop: spacing.md,

    marginBottom: spacing.xl,

    borderRadius: radius.xl,
  },

  heroIcon: {
    width: 58,
    height: 58,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,
  },

  categoryLabel: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 1,
  },

  heroTitle: {
    marginTop: spacing.sm,

    textAlign: "center",

    fontSize: typography.heading,

    lineHeight: 26,

    fontWeight: "700",

    color: colors.text,
  },

  savedDate: {
    marginTop: spacing.sm,

    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    marginBottom: spacing.sm,

    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 1,

    color: colors.textMuted,
  },

  input: {
    minHeight: 52,

    paddingHorizontal: spacing.md,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: typography.body,

    color: colors.text,
  },

  linkCard: {
    minHeight: 62,

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  linkIcon: {
    width: 36,
    height: 36,

    borderRadius: radius.md,

    backgroundColor: colors.blueLight,

    alignItems: "center",

    justifyContent: "center",
  },

  linkText: {
    flex: 1,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  categories: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  categoryOption: {
    paddingHorizontal: spacing.md,

    paddingVertical: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  categoryOptionText: {
    fontSize: typography.caption,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  categoryBadge: {
    alignSelf: "flex-start",

    paddingHorizontal: spacing.md,

    paddingVertical: 8,

    borderRadius: radius.round,
  },

  categoryBadgeText: {
    fontSize: typography.caption,

    fontWeight: "700",
  },

  noteInput: {
    minHeight: 120,

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: typography.body,

    lineHeight: 21,

    color: colors.text,
  },

  characterCount: {
    marginTop: 4,

    textAlign: "right",

    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  noteCard: {
    flexDirection: "row",

    alignItems: "flex-start",

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.roseLight,
  },

  noteIcon: {
    width: 36,
    height: 36,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  noteText: {
    flex: 1,

    fontSize: typography.body,

    lineHeight: 21,

    color: colors.text,
  },

  emptyNote: {
    flex: 1,

    fontSize: typography.body,

    lineHeight: 21,

    color: colors.textMuted,
  },

  saveButton: {
    height: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.primary,
  },

  saveButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  createButton: {
    height: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.terracotta,
  },

  createButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  openButton: {
    height: 50,

    marginTop: spacing.sm,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.blueLight,
  },

  openButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.blue,
  },

  deleteButton: {
    height: 48,

    marginTop: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,
  },

  deleteButtonText: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.danger,
  },

  center: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.md,

    padding: spacing.lg,
  },

  loadingText: {
    color: colors.textSecondary,
  },

  errorTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  backText: {
    fontWeight: "700",

    color: colors.primary,
  },
});
