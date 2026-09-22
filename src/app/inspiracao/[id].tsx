import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useEffect, useState } from "react";

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
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [url, setUrl] = useState("");

  const [category, setCategory] = useState<string | null>(null);

  const [note, setNote] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const data = await getInspirationById(id);

        setInspiration(data);

        if (data) {
          setUrl(data.url);
          setCategory(data.category);
          setNote(data.note);
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

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

    const source = detectSource(url);

    const updates = {
      url: url.trim(),
      source,
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
          <ActivityIndicator color={colors.primary} />

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Inspiração</Text>

          <TouchableOpacity
            style={styles.editTopButton}
            onPress={() => setEditing((current) => !current)}
          >
            <Ionicons
              name={editing ? "close-outline" : "create-outline"}
              size={21}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.sourceIcon}>
            <Ionicons
              name={
                inspiration.source === "TikTok"
                  ? "musical-note-outline"
                  : inspiration.source === "Instagram"
                    ? "logo-instagram"
                    : "link-outline"
              }
              size={26}
              color={colors.primary}
            />
          </View>

          <Text style={styles.source}>{inspiration.source}</Text>

          <Text style={styles.heroTitle}>Referência salva</Text>

          <Text style={styles.savedDate}>
            Salva em {formatDate(inspiration.createdAt)}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Link</Text>

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
              activeOpacity={0.8}
              onPress={handleOpenOriginal}
            >
              <Ionicons name="link-outline" size={19} color={colors.primary} />

              <Text style={styles.linkText} numberOfLines={2}>
                {inspiration.url}
              </Text>

              <Ionicons
                name="open-outline"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>O que chamou sua atenção?</Text>

          {editing ? (
            <View style={styles.categories}>
              {categories.map((item) => {
                const selected = category === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.category,
                      selected && styles.categorySelected,
                    ]}
                    onPress={() => setCategory(selected ? null : item)}
                  >
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
          ) : (
            <View style={styles.categoryRead}>
              <Text style={styles.categoryReadText}>
                {inspiration.category ?? "Sem categoria"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Anotação</Text>

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
              activeOpacity={0.85}
              onPress={handleCreateVersion}
            >
              <Ionicons name="sparkles" size={19} color={colors.surface} />

              <Text style={styles.createButtonText}>Criar minha versão</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openButton}
              onPress={handleOpenOriginal}
            >
              <Ionicons name="open-outline" size={18} color={colors.primary} />

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

function formatDate(isoDate: string) {
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

  editTopButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  heroCard: {
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  sourceIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  source: {
    marginTop: spacing.md,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.primary,
    textTransform: "uppercase",
  },

  heroTitle: {
    marginTop: 5,
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  savedDate: {
    marginTop: 4,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  section: {
    marginBottom: spacing.xl,
  },

  label: {
    marginBottom: spacing.sm,
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },

  input: {
    minHeight: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    color: colors.text,
    fontSize: typography.body,
  },

  linkCard: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
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

  category: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categorySelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  categoryText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  categoryTextSelected: {
    color: colors.surface,
  },

  categoryRead: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
  },

  categoryReadText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },

  noteInput: {
    minHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.body,
    lineHeight: 21,
  },

  characterCount: {
    marginTop: 4,
    textAlign: "right",
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  noteCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  noteText: {
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  emptyNote: {
    fontSize: typography.body,
    color: colors.textMuted,
  },

  saveButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  saveButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.body,
  },

  createButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  createButtonText: {
    color: colors.surface,
    fontWeight: "700",
    fontSize: typography.body,
  },

  openButton: {
    height: 50,
    marginTop: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  openButtonText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: typography.body,
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
    color: colors.danger,
    fontSize: typography.body,
    fontWeight: "600",
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
    color: colors.primary,
    fontWeight: "700",
  },
});
