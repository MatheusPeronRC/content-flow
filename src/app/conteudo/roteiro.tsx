import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

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

import { getContentById, updateContent } from "../../services/contentStorage";

import { ContentItem } from "../../types/content";

import { colors, radius, spacing, typography } from "../../constants/theme";

export default function RoteiroScreen() {
  const { contentId } = useLocalSearchParams<{
    contentId: string;
  }>();

  const [content, setContent] = useState<ContentItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [hook, setHook] = useState("");

  const [points, setPoints] = useState(["", "", ""]);

  const [cta, setCta] = useState("");

  useEffect(() => {
    async function loadContent() {
      if (!contentId) {
        return;
      }

      try {
        const data = await getContentById(contentId);

        if (!data) {
          return;
        }

        setContent(data);

        setHook(data.script.hook);

        setPoints(
          data.script.points.length > 0 ? data.script.points : ["", "", ""],
        );

        setCta(data.script.cta);
      } finally {
        setLoading(false);
      }
    }

    loadContent();
  }, [contentId]);

  function updatePoint(index: number, value: string) {
    setPoints((currentPoints) =>
      currentPoints.map((point, currentIndex) =>
        currentIndex === index ? value : point,
      ),
    );
  }

  async function handleFinishScript() {
    if (!content) {
      return;
    }

    await updateContent(content.id, {
      status: "gravar",

      script: {
        hook: hook.trim(),

        points: points.map((point) => point.trim()),

        cta: cta.trim(),
      },
    });

    router.replace("/");
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Carregando roteiro...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text style={styles.errorTitle}>Conteúdo não encontrado</Text>

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
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Roteiro</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.label}>SEU CONTEÚDO</Text>

          <Text style={styles.title}>{content.idea}</Text>

          <View style={styles.meta}>
            {content.format && (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{content.format}</Text>
              </View>
            )}

            {content.objective && (
              <View style={styles.metaPill}>
                <Text style={styles.metaText}>{content.objective}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <View style={styles.number}>
              <Text style={styles.numberText}>1</Text>
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Hook</Text>

              <Text style={styles.sectionDescription}>
                Como você vai prender a atenção logo no início?
              </Text>
            </View>
          </View>

          <TextInput
            value={hook}
            onChangeText={setHook}
            placeholder="Ex.: Se você acha que creatina engorda, precisa ouvir isso..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
        </View>

        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <View style={styles.number}>
              <Text style={styles.numberText}>2</Text>
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>Pontos principais</Text>

              <Text style={styles.sectionDescription}>
                Organize o que precisa ser dito.
              </Text>
            </View>
          </View>

          {points.map((point, index) => (
            <View key={index} style={styles.pointRow}>
              <View style={styles.pointNumber}>
                <Text style={styles.pointNumberText}>{index + 1}</Text>
              </View>

              <TextInput
                value={point}
                onChangeText={(value) => updatePoint(index, value)}
                placeholder={`Ponto ${index + 1}`}
                placeholderTextColor={colors.textMuted}
                multiline
                style={styles.pointInput}
              />
            </View>
          ))}
        </View>

        <View style={styles.formGroup}>
          <View style={styles.sectionHeader}>
            <View style={styles.number}>
              <Text style={styles.numberText}>3</Text>
            </View>

            <View style={styles.sectionHeaderText}>
              <Text style={styles.sectionTitle}>CTA</Text>

              <Text style={styles.sectionDescription}>
                O que você quer que a pessoa faça depois?
              </Text>
            </View>
          </View>

          <TextInput
            value={cta}
            onChangeText={setCta}
            placeholder="Ex.: Salve este vídeo para consultar depois."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.input}
          />
        </View>

        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinishScript}
        >
          <Text style={styles.finishButtonText}>Roteiro pronto</Text>

          <Ionicons name="checkmark" size={19} color={colors.surface} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
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

  label: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.primary,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: colors.text,
    marginTop: spacing.sm,
  },

  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },

  metaPill: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.round,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  metaText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.primary,
  },

  formGroup: {
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    marginBottom: spacing.md,
  },

  number: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  numberText: {
    color: colors.surface,
    fontWeight: "700",
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  sectionDescription: {
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
    marginTop: 2,
  },

  input: {
    minHeight: 100,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },

  pointNumber: {
    width: 30,
    height: 30,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginRight: spacing.sm,
  },

  pointNumberText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.primary,
  },

  pointInput: {
    flex: 1,
    minHeight: 52,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    color: colors.text,
    fontSize: typography.body,
  },

  finishButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  finishButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  loading: {
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
