import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";

import {
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

import { colors, radius, spacing, typography } from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story"];

export default function AdaptarConteudoScreen() {
  const { inspirationId } = useLocalSearchParams<{
    inspirationId: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [referenceIdea, setReferenceIdea] = useState("");

  const [format, setFormat] = useState("Reel");

  useEffect(() => {
    async function load() {
      if (!inspirationId) {
        return;
      }

      const data = await getInspirationById(inspirationId);

      setInspiration(data);

      if (data?.note) {
        setReferenceIdea(data.note);
      }
    }

    load();
  }, [inspirationId]);

  const canContinue = referenceIdea.trim().length > 0;

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

          <Text style={styles.headerTitle}>Adaptar referência</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Só preciso entender a ideia.</Text>

          <Text style={styles.description}>
            Em poucas palavras, diga o que acontece nessa referência. Depois o
            ContentFlow poderá transformar isso em um roteiro.
          </Text>
        </View>

        {inspiration && (
          <View style={styles.reference}>
            <Ionicons name="link-outline" size={18} color={colors.primary} />

            <Text numberOfLines={1} style={styles.referenceUrl}>
              {inspiration.url}
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>
            O que você quer aproveitar dessa referência?
          </Text>

          <TextInput
            value={referenceIdea}
            onChangeText={setReferenceIdea}
            multiline
            textAlignVertical="top"
            placeholder="Ex.: ele começa dizendo que creatina engorda e depois quebra esse mito..."
            placeholderTextColor={colors.textMuted}
            style={styles.textArea}
          />

          <Text style={styles.helper}>
            Pode escrever do seu jeito. Não precisa montar nenhum roteiro.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Quero transformar em</Text>

          <View style={styles.formats}>
            {formats.map((item) => {
              const selected = format === item;

              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.formatButton,
                    selected && styles.formatButtonSelected,
                  ]}
                  onPress={() => setFormat(item)}
                >
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
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Ionicons
            name="sparkles"
            size={18}
            color={canContinue ? colors.surface : colors.textMuted}
          />

          <Text
            style={[
              styles.continueText,
              !canContinue && styles.continueTextDisabled,
            ]}
          >
            Criar minha versão
          </Text>
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
    fontSize: 29,
    lineHeight: 35,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  reference: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.xl,
  },

  referenceUrl: {
    flex: 1,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  formGroup: {
    marginBottom: spacing.xl,
  },

  label: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
    marginBottom: spacing.sm,
  },

  textArea: {
    minHeight: 140,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  helper: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textMuted,
  },

  formats: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  formatButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  formatButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  formatText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  formatTextSelected: {
    color: colors.surface,
  },

  continueButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  continueButtonDisabled: {
    backgroundColor: colors.border,
  },

  continueText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  continueTextDisabled: {
    color: colors.textMuted,
  },
});
