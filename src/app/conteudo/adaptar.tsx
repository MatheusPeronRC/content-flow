import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getInspirationById } from "../../services/inspirationStorage";
import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story"];

export default function AdaptarConteudoScreen() {
  const { inspirationId } = useLocalSearchParams<{
    inspirationId?: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);
  const [loading, setLoading] = useState(true);

  const [referenceIdea, setReferenceIdea] = useState("");
  const [format, setFormat] = useState("Reel");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!inspirationId) {
        if (active) setLoading(false);
        return;
      }

      try {
        const data = await getInspirationById(inspirationId);

        if (!active) return;

        setInspiration(data);

        if (data?.note?.trim()) {
          setReferenceIdea(data.note.trim());
        }
      } catch (error) {
        console.error("Erro ao carregar inspiração:", error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [inspirationId]);

  const canContinue = referenceIdea.trim().length > 0;

  const sourceMeta = useMemo(() => {
    const source = inspiration?.source ?? "Referência";

    switch (source) {
      case "Instagram":
        return {
          icon: "logo-instagram" as const,
          color: colors.terracotta,
          background: colors.terracottaLight,
        };
      case "TikTok":
        return {
          icon: "musical-note-outline" as const,
          color: colors.text,
          background: colors.primaryLight,
        };
      case "YouTube":
        return {
          icon: "logo-youtube" as const,
          color: colors.rose,
          background: colors.roseLight,
        };
      default:
        return {
          icon: "link-outline" as const,
          color: colors.blue,
          background: colors.blueLight,
        };
    }
  }, [inspiration?.source]);

  function handleContinue() {
    if (!canContinue) return;

    router.push({
      pathname: "/conteudo/gerar",
      params: {
        inspirationId,
        referenceIdea: referenceIdea.trim(),
        format,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />
          <Text style={styles.loadingText}>Preparando sua referência...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorMark}>
            <Ionicons name="link-outline" size={23} color={colors.textMuted} />
          </View>

          <Text style={styles.errorTitle}>Referência não encontrada</Text>

          <Text style={styles.errorText}>
            Volte para sua biblioteca e escolha outra inspiração.
          </Text>

          <TouchableOpacity
            style={styles.backAction}
            onPress={() => router.back()}
          >
            <Text style={styles.backActionText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Adaptar referência</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>TRANSFORMAR REFERÊNCIA</Text>

          <Text style={styles.title}>
            Só preciso entender{"\n"}o que te chamou atenção.
          </Text>

          <Text style={styles.description}>
            Não precisa escrever um roteiro. Conte do seu jeito o que vale
            aproveitar dessa referência.
          </Text>
        </View>

        <View style={styles.reference}>
          <View
            style={[
              styles.referenceMark,
              { backgroundColor: sourceMeta.background },
            ]}
          >
            <Ionicons
              name={sourceMeta.icon}
              size={19}
              color={sourceMeta.color}
            />
          </View>

          <View style={styles.referenceContent}>
            <View style={styles.referenceMeta}>
              <Text style={styles.referenceSource}>{inspiration.source}</Text>

              {inspiration.category && (
                <>
                  <View style={styles.metaDot} />
                  <Text style={styles.referenceCategory}>
                    {inspiration.category}
                  </Text>
                </>
              )}
            </View>

            <Text style={styles.referenceUrl} numberOfLines={1}>
              {cleanUrl(inspiration.url)}
            </Text>
          </View>

          <Ionicons name="link-outline" size={17} color={colors.textMuted} />
        </View>

        <View style={styles.inputSection}>
          <View style={styles.fieldHeader}>
            <Text style={styles.fieldTitle}>
              O que você quer levar dessa referência?
            </Text>

            <Text style={styles.optional}>DO SEU JEITO</Text>
          </View>

          <View style={styles.ideaField}>
            <TextInput
              value={referenceIdea}
              onChangeText={setReferenceIdea}
              multiline
              textAlignVertical="top"
              placeholder="Ex.: gostei da abertura, do jeito de explicar, da estrutura do vídeo..."
              placeholderTextColor={colors.textMuted}
              style={styles.ideaInput}
              maxLength={500}
            />

            <Text style={styles.characterCount}>
              {referenceIdea.length}/500
            </Text>
          </View>

          <View style={styles.helperRow}>
            <Ionicons
              name="sparkles-outline"
              size={15}
              color={colors.terracotta}
            />

            <Text style={styles.helperText}>
              Uma frase já basta. O ContentFlow cuida da estrutura depois.
            </Text>
          </View>
        </View>

        <View style={styles.formatSection}>
          <Text style={styles.fieldTitle}>
            Em que formato você quer transformar?
          </Text>

          <View style={styles.formats}>
            {formats.map((item) => {
              const selected = format === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.formatOption,
                    selected && styles.formatOptionSelected,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setFormat(item)}
                >
                  <View
                    style={[
                      styles.formatIcon,
                      selected && styles.formatIconSelected,
                    ]}
                  >
                    <Ionicons
                      name={getFormatIcon(item)}
                      size={17}
                      color={selected ? colors.surface : colors.textSecondary}
                    />
                  </View>

                  <Text
                    style={[
                      styles.formatText,
                      selected && styles.formatTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.createButton,
            !canContinue && styles.createButtonDisabled,
          ]}
          disabled={!canContinue}
          activeOpacity={0.86}
          onPress={handleContinue}
        >
          <View style={styles.createButtonMark}>
            <Ionicons
              name="sparkles"
              size={18}
              color={canContinue ? colors.terracotta : colors.textMuted}
            />
          </View>

          <Text
            style={[
              styles.createButtonText,
              !canContinue && styles.createButtonTextDisabled,
            ]}
          >
            Criar minha versão
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={canContinue ? colors.surface : colors.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function getFormatIcon(format: string): keyof typeof Ionicons.glyphMap {
  switch (format) {
    case "Reel":
      return "videocam-outline";
    case "Carrossel":
      return "albums-outline";
    case "Story":
      return "phone-portrait-outline";
    default:
      return "document-outline";
  }
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
  headerTitle: {
    fontSize: 16,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  headerSpace: {
    width: 40,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 28,
  },
  eyebrow: {
    marginBottom: 10,
    fontSize: 10,
    letterSpacing: 1.1,
    fontFamily: fonts.bold,
    color: colors.terracotta,
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
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  reference: {
    minHeight: 74,
    marginBottom: 30,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  referenceMark: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  referenceContent: {
    flex: 1,
    minWidth: 0,
  },
  referenceMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  referenceSource: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  metaDot: {
    width: 3,
    height: 3,
    marginHorizontal: 6,
    borderRadius: radius.round,
    backgroundColor: colors.textMuted,
  },
  referenceCategory: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  referenceUrl: {
    marginTop: 4,
    paddingRight: 8,
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
  inputSection: {
    marginBottom: 30,
  },
  fieldHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  fieldTitle: {
    flex: 1,
    fontSize: 16,
    lineHeight: 23,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
  optional: {
    fontSize: 9,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },
  ideaField: {
    minHeight: 158,
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ideaInput: {
    minHeight: 112,
    padding: 0,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },
  characterCount: {
    marginTop: 8,
    textAlign: "right",
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  helperRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },
  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  formatSection: {
    marginBottom: 30,
  },
  formats: {
    marginTop: 13,
    flexDirection: "row",
    gap: 8,
  },
  formatOption: {
    flex: 1,
    minHeight: 62,
    paddingHorizontal: 9,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  formatOptionSelected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  formatIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  formatIconSelected: {
    backgroundColor: colors.terracotta,
  },
  formatText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },
  formatTextSelected: {
    color: colors.surface,
  },
  createButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
  },
  createButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
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
  createButtonTextDisabled: {
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
    fontSize: 11,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  errorMark: {
    width: 54,
    height: 54,
    marginBottom: 16,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },
  errorText: {
    maxWidth: 280,
    marginTop: 6,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },
  backAction: {
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.text,
  },
  backActionText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
