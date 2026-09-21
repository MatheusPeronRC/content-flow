import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { saveInspiration } from "../../services/inspirationStorage";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing, typography } from "../../constants/theme";

const categories = ["Hook", "Tema", "Edição", "Formato", "Roteiro", "CTA"];

export default function NovaInspiracaoScreen() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const canSave = url.trim().length > 0;

  function handleCategoryPress(selectedCategory: string) {
    if (category === selectedCategory) {
      setCategory(null);
      return;
    }

    setCategory(selectedCategory);
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    let source = "Outro";

    if (url.includes("instagram.com")) {
      source = "Instagram";
    }

    if (url.includes("tiktok.com")) {
      source = "TikTok";
    }

    const inspiration = {
      id: Date.now().toString(),
      url: url.trim(),
      source,
      category,
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    await saveInspiration(inspiration);

    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={23} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Salvar inspiração</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>Guarde agora. Organize depois.</Text>

            <Text style={styles.description}>
              Cole o link de um conteúdo que você quer usar como referência.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Link da inspiração</Text>

            <View style={styles.inputContainer}>
              <Ionicons
                name="link-outline"
                size={20}
                color={colors.textMuted}
              />

              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="instagram.com/reel/..."
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.linkInput}
              />
            </View>

            <Text style={styles.helper}>
              Instagram, TikTok ou outro link de referência.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>O que chamou sua atenção?</Text>

              <Text style={styles.optional}>Opcional</Text>
            </View>

            <View style={styles.categories}>
              {categories.map((item) => {
                const selected = category === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryButton,
                      selected && styles.categoryButtonSelected,
                    ]}
                    onPress={() => handleCategoryPress(item)}
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
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Anotação</Text>

              <Text style={styles.optional}>Opcional</Text>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Ex.: gostei da forma como ele começou o vídeo..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              style={styles.noteInput}
              maxLength={300}
            />

            <Text style={styles.characterCount}>{note.length}/300</Text>
          </View>

          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="flash-outline" size={19} color={colors.primary} />
            </View>

            <Text style={styles.tipText}>
              Não precisa organizar tudo agora. O importante é não perder a
              referência.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            disabled={!canSave}
            activeOpacity={0.8}
            onPress={handleSave}
          >
            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled,
              ]}
            >
              Salvar inspiração
            </Text>

            <Ionicons
              name="arrow-forward"
              size={18}
              color={canSave ? colors.surface : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  header: {
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  closeButton: {
    width: 40,
    height: 40,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  headerSpace: {
    width: 40,
  },

  intro: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  formGroup: {
    marginBottom: spacing.xl,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  label: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  optional: {
    fontSize: typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },

  inputContainer: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },

  linkInput: {
    flex: 1,
    fontSize: typography.body,
    color: colors.text,
  },

  helper: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    color: colors.textMuted,
  },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  categoryButtonSelected: {
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

  noteInput: {
    minHeight: 120,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  characterCount: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.lg,
  },

  tipIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  tipText: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 18,
    color: colors.textSecondary,
  },

  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },

  saveButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  saveButtonDisabled: {
    backgroundColor: colors.border,
  },

  saveButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },
});
