import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";

import {
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

import { saveInspiration } from "../../services/inspirationStorage";

import { colors, fonts, radius, spacing } from "../../constants/theme";

const categories = ["Hook", "Tema", "Roteiro", "Formato", "Edição", "CTA"];

export default function NewInspirationScreen() {
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const source = useMemo(() => detectSource(url), [url]);

  const canSave = url.trim().length > 0 && !saving;

  async function handleSave() {
    if (!url.trim() || saving) {
      return;
    }

    try {
      setSaving(true);

      await saveInspiration({
        id: Date.now().toString(),
        url: url.trim(),
        source: detectSource(url.trim()),
        category,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      });

      router.back();
    } catch (error) {
      console.error("Erro ao salvar inspiração:", error);

      Alert.alert(
        "Não foi possível salvar",
        "Confira os dados e tente novamente.",
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

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>SEU ACERVO CRIATIVO</Text>

            <Text style={styles.title}>
              Guarde agora.{"\n"}
              Organize depois.
            </Text>

            <Text style={styles.description}>
              Salve uma referência enquanto ela ainda está fresca. Você pode
              voltar, editar e transformar em conteúdo quando quiser.
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>LINK DA REFERÊNCIA</Text>

            <View
              style={[styles.urlField, url.trim() && styles.urlFieldActive]}
            >
              <View
                style={[
                  styles.sourceMark,
                  {
                    backgroundColor: getSourceMeta(source).background,
                  },
                ]}
              >
                <Ionicons
                  name={getSourceMeta(source).icon}
                  size={20}
                  color={getSourceMeta(source).color}
                />
              </View>

              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="Cole aqui o link do Reel, TikTok, vídeo ou post..."
                placeholderTextColor={colors.textMuted}
                style={styles.urlInput}
              />
            </View>

            {url.trim() ? (
              <View style={styles.sourceDetected}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={colors.sage}
                />

                <Text style={styles.sourceDetectedText}>
                  {source === "Outro"
                    ? "Link reconhecido como referência externa."
                    : `${source} reconhecido automaticamente.`}
                </Text>
              </View>
            ) : (
              <Text style={styles.fieldHelper}>
                Instagram, TikTok, YouTube ou qualquer outro link funciona.
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>CATEGORIA</Text>

                <Text style={styles.fieldSubtitle}>
                  O que fez você salvar isso?
                </Text>
              </View>

              <Text style={styles.optional}>OPCIONAL</Text>
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
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.field}>
            <View style={styles.fieldHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>SUA ANOTAÇÃO</Text>

                <Text style={styles.fieldSubtitle}>
                  Escreva por que essa referência chamou sua atenção.
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
              placeholder="Ex.: gostei da abertura, da forma de explicar, da edição ou do formato..."
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
            />

            <View style={styles.tip}>
              <View style={styles.tipMark}>
                <Ionicons name="bulb-outline" size={16} color={colors.rose} />
              </View>

              <Text style={styles.tipText}>
                Uma frase simples já ajuda você a lembrar depois por que essa
                referência valeu a pena.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            activeOpacity={0.86}
            disabled={!canSave}
            onPress={handleSave}
          >
            <View style={styles.saveButtonMark}>
              <Ionicons
                name="bookmark"
                size={18}
                color={canSave ? colors.terracotta : colors.textMuted}
              />
            </View>

            <Text
              style={[
                styles.saveButtonText,
                !canSave && styles.saveButtonTextDisabled,
              ]}
            >
              {saving ? "Salvando..." : "Salvar inspiração"}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={canSave ? colors.surface : colors.textMuted}
            />
          </TouchableOpacity>

          <Text style={styles.bottomHint}>
            Você pode editar essa referência depois na sua biblioteca.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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

function getSourceMeta(source: string): {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
} {
  switch (source) {
    case "Instagram":
      return {
        icon: "logo-instagram",
        color: colors.terracotta,
        background: colors.terracottaLight,
      };

    case "TikTok":
      return {
        icon: "musical-note-outline",
        color: colors.text,
        background: colors.primaryLight,
      };

    case "YouTube":
      return {
        icon: "logo-youtube",
        color: colors.rose,
        background: colors.roseLight,
      };

    default:
      return {
        icon: "link-outline",
        color: colors.blue,
        background: colors.blueLight,
      };
  }
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

    paddingBottom: 48,
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

  hero: {
    paddingTop: 22,

    paddingBottom: 32,
  },

  eyebrow: {
    marginBottom: 10,

    fontSize: 10,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.rose,
  },

  title: {
    maxWidth: 340,

    fontSize: 31,

    lineHeight: 39,

    letterSpacing: -0.9,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  description: {
    maxWidth: 340,

    marginTop: 13,

    fontSize: 14,

    lineHeight: 22,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  field: {
    marginBottom: 30,
  },

  fieldHeader: {
    marginBottom: 12,

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: 12,
  },

  fieldLabel: {
    marginBottom: 5,

    fontSize: 10,

    letterSpacing: 0.9,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  fieldSubtitle: {
    maxWidth: 275,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  optional: {
    marginTop: 1,

    fontSize: 10,

    letterSpacing: 0.5,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  urlField: {
    minHeight: 66,

    paddingHorizontal: 13,

    borderRadius: 19,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",
  },

  urlFieldActive: {
    borderColor: "#D5CEC6",
  },

  sourceMark: {
    width: 42,
    height: 42,

    marginRight: 11,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",
  },

  urlInput: {
    flex: 1,

    minHeight: 64,

    paddingVertical: 0,

    fontSize: 14,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  sourceDetected: {
    marginTop: 10,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  sourceDetectedText: {
    flex: 1,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.medium,

    color: colors.sage,
  },

  fieldHelper: {
    marginTop: 10,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  categories: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 9,
  },

  categoryOption: {
    minHeight: 42,

    paddingHorizontal: 16,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  categoryText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  counter: {
    marginTop: 1,

    fontSize: 11,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  noteInput: {
    minHeight: 165,

    padding: 17,

    borderRadius: 20,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: 15,

    lineHeight: 24,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  tip: {
    marginTop: 11,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: 9,
  },

  tipMark: {
    width: 30,
    height: 30,

    borderRadius: 10,

    backgroundColor: colors.roseLight,

    alignItems: "center",

    justifyContent: "center",
  },

  tipText: {
    flex: 1,

    paddingTop: 2,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  saveButton: {
    minHeight: 60,

    paddingHorizontal: 14,

    borderRadius: 18,

    backgroundColor: colors.terracotta,

    flexDirection: "row",

    alignItems: "center",
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonMark: {
    width: 34,
    height: 34,

    marginRight: 11,

    borderRadius: 11,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonText: {
    flex: 1,

    fontSize: 15,

    fontFamily: fonts.bold,

    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },

  bottomHint: {
    maxWidth: 300,

    marginTop: 12,

    alignSelf: "center",

    textAlign: "center",

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },
});
