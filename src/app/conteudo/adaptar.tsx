import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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

import { getInspirationById } from "../../services/inspirationStorage";

import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

const formats = [
  {
    value: "Reel",
    icon: "videocam-outline" as const,
  },
  {
    value: "Carrossel",
    icon: "albums-outline" as const,
  },
  {
    value: "Story",
    icon: "phone-portrait-outline" as const,
  },
];

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
        if (active) {
          setLoading(false);
        }

        return;
      }

      try {
        const data = await getInspirationById(inspirationId);

        if (!active) {
          return;
        }

        setInspiration(data);

        if (data?.note?.trim()) {
          setReferenceIdea(data.note.trim());
        }
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
  }, [inspirationId]);

  const canContinue = referenceIdea.trim().length > 0;

  const platformMeta = useMemo(
    () => getPlatformMeta(inspiration?.source ?? "Outro"),
    [inspiration?.source],
  );

  async function handleOpenOriginal() {
    if (!inspiration?.url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(inspiration.url);

      if (!supported) {
        return;
      }

      await Linking.openURL(inspiration.url);
    } catch (error) {
      console.error("Erro ao abrir referência:", error);
    }
  }

  function handleContinue() {
    if (!canContinue) {
      return;
    }

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

  const referenceTitle =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios" ? "interactive" : "on-drag"
          }
        >
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.8}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Adaptar referência</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.intro}>
            <View style={styles.stepRow}>
              <View style={styles.stepIndicator}>
                <Text style={styles.stepIndicatorText}>1</Text>
              </View>

              <Text style={styles.stepText}>Entender a referência</Text>
            </View>

            <Text style={styles.title}>O que vale levar daqui?</Text>

            <Text style={styles.description}>
              Não escreva um roteiro. Só me diga o que te chamou atenção e o que
              você gostaria de aproveitar.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.referenceStrip}
            activeOpacity={0.84}
            onPress={handleOpenOriginal}
          >
            <InspirationThumbnail
              thumbnailUrl={inspiration.thumbnailUrl}
              source={inspiration.source}
              variant="compact"
              style={styles.referenceThumbnail}
            />

            <View style={styles.referenceContent}>
              <View style={styles.referenceMeta}>
                <View
                  style={[
                    styles.platformPill,
                    {
                      backgroundColor: platformMeta.background,
                    },
                  ]}
                >
                  <PlatformIcon source={inspiration.source} size={12} />

                  <Text
                    style={[
                      styles.platformText,
                      {
                        color: platformMeta.brandColor,
                      },
                    ]}
                  >
                    {inspiration.source}
                  </Text>
                </View>

                {inspiration.category ? (
                  <Text style={styles.categoryText}>
                    {inspiration.category}
                  </Text>
                ) : null}
              </View>

              <Text style={styles.referenceTitle} numberOfLines={2}>
                {referenceTitle}
              </Text>

              <View style={styles.referenceFooter}>
                <Text style={styles.referenceSecondary} numberOfLines={1}>
                  {inspiration.authorName?.trim() || cleanUrl(inspiration.url)}
                </Text>

                <View style={styles.referenceOpenHint}>
                  <Text style={styles.referenceOpenText}>Abrir</Text>
                  <Ionicons
                    name="open-outline"
                    size={14}
                    color={colors.textSecondary}
                  />
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.workspace}>
            <View style={styles.workspaceHeader}>
              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.workspaceLabel}>SUA LEITURA</Text>

                <Text style={styles.workspaceTitle}>Explique do seu jeito</Text>
              </View>

              <Text style={styles.characterCount}>
                {referenceIdea.length}
                /500
              </Text>
            </View>

            <TextInput
              value={referenceIdea}
              onChangeText={setReferenceIdea}
              multiline
              maxLength={500}
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Ex.: gostei da abertura e do jeito simples que ele explica o assunto..."
              placeholderTextColor={colors.textMuted}
              style={styles.ideaInput}
            />

            <View style={styles.helperRow}>
              <Ionicons
                name="sparkles-outline"
                size={15}
                color={colors.terracotta}
              />

              <Text style={styles.helperText}>
                Uma frase já basta. O ContentFlow transforma isso em estrutura
                na próxima etapa.
              </Text>
            </View>
          </View>

          <View style={styles.formatSection}>
            <Text style={styles.formatLabel}>FORMATO</Text>

            <Text style={styles.formatTitle}>
              Como você quer transformar isso?
            </Text>

            <View style={styles.formats}>
              {formats.map((item) => {
                const selected = format === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.formatOption,
                      selected && styles.formatOptionSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setFormat(item.value)}
                  >
                    <Ionicons
                      name={item.icon}
                      size={17}
                      color={
                        selected ? colors.terracotta : colors.textSecondary
                      }
                    />

                    <Text
                      style={[
                        styles.formatOptionText,
                        selected && styles.formatOptionTextSelected,
                      ]}
                    >
                      {item.value}
                    </Text>

                    {selected && <View style={styles.selectedDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.continueSection}>
            <Text style={styles.continueLabel}>PRÓXIMA ETAPA</Text>

            <Text style={styles.continueTitle}>
              Transformar sua leitura em uma primeira versão.
            </Text>

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
                  size={17}
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
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
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

  backButton: {
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
    marginTop: 18,
    marginBottom: 18,
  },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  stepIndicator: {
    width: 35,
    height: 35,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  stepIndicatorText: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  stepText: {
    fontSize: 16,
    letterSpacing: 0.25,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  title: {
    maxWidth: 330,
    marginTop: 13,
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  description: {
    maxWidth: 330,
    marginTop: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  referenceStrip: {
    minHeight: 104,
    marginBottom: 23,
    padding: 11,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  referenceThumbnail: {
    width: 68,
    height: 82,
    borderRadius: 13,
  },

  referenceContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  referenceMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  platformPill: {
    minHeight: 25,
    paddingHorizontal: 7,
    borderRadius: radius.round,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  platformText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
  },

  categoryText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  referenceTitle: {
    marginTop: 7,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  referenceFooter: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  referenceSecondary: {
    flex: 1,
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

  workspace: {
    padding: 16,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  workspaceHeader: {
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },

  workspaceLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  workspaceTitle: {
    marginTop: 3,
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  characterCount: {
    marginTop: 2,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  ideaInput: {
    minHeight: 190,
    padding: 0,
    paddingTop: 4,
    fontSize: 17,
    lineHeight: 27,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  helperRow: {
    marginTop: 10,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  helperText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  formatSection: {
    marginTop: 25,
  },

  formatLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  formatTitle: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formats: {
    marginTop: 11,
    flexDirection: "row",
    gap: 8,
  },

  formatOption: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  formatOptionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: "rgba(225,116,85,0.35)",
  },

  formatOptionText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  formatOptionTextSelected: {
    color: colors.terracotta,
  },

  selectedDot: {
    width: 5,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: colors.terracotta,
  },

  divider: {
    height: 1,
    marginTop: 20,
    backgroundColor: colors.divider,
  },

  continueSection: {
    paddingTop: 17,
  },

  continueLabel: {
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  continueTitle: {
    maxWidth: 310,
    marginTop: 5,
    fontSize: 18,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  createButton: {
    minHeight: 58,
    marginTop: 14,
    paddingHorizontal: 13,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  createButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  createButtonMark: {
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
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  errorMark: {
    width: 54,
    height: 54,
    marginBottom: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  errorText: {
    maxWidth: 280,
    marginTop: 7,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  backAction: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.text,
  },

  backActionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
