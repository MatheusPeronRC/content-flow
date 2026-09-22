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
import { saveContent } from "../../services/contentStorage";

import { SafeAreaView } from "react-native-safe-area-context";

import { getInspirationById } from "../../services/inspirationStorage";
import { Inspiration } from "../../types/inspiration";

import { colors, radius, spacing, typography } from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story", "Foto"];

const objectives = ["Atrair clientes", "Gerar autoridade", "Educar", "Engajar"];

export default function CriarConteudoScreen() {
  const { inspirationId } = useLocalSearchParams<{
    inspirationId?: string;
  }>();

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [idea, setIdea] = useState("");
  const [format, setFormat] = useState<string | null>(null);
  const [objective, setObjective] = useState<string | null>(null);
  async function handleContinue() {
    if (!idea.trim()) {
      return;
    }

    const now = new Date().toISOString();

    const content = {
      id: Date.now().toString(),

      inspirationId: inspirationId || undefined,

      idea: idea.trim(),

      format,
      objective,

      status: "roteiro" as const,

      script: {
        hook: "",
        points: ["", "", ""],
        cta: "",
      },

      createdAt: now,
      updatedAt: now,
    };

    await saveContent(content);

    router.push({
      pathname: "/conteudo/roteiro",
      params: {
        contentId: content.id,
      },
    });
  }
  useEffect(() => {
    async function loadInspiration() {
      if (!inspirationId) {
        return;
      }

      const data = await getInspirationById(inspirationId);

      if (data) {
        setInspiration(data);
      }
    }

    loadInspiration();
  }, [inspirationId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="close" size={23} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Criar conteúdo</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.intro}>
          <Text style={styles.title}>Crie sua versão.</Text>

          <Text style={styles.subtitle}>
            Use a referência como ponto de partida, sem precisar copiar o
            conteúdo original.
          </Text>
        </View>

        {inspiration && (
          <View style={styles.referenceCard}>
            <View style={styles.referenceIcon}>
              <Ionicons name="bulb-outline" size={22} color={colors.primary} />
            </View>

            <View style={styles.referenceContent}>
              <Text style={styles.referenceLabel}>REFERÊNCIA</Text>

              <Text style={styles.referenceUrl} numberOfLines={1}>
                {inspiration.url}
              </Text>

              {inspiration.note && (
                <Text style={styles.referenceNote} numberOfLines={2}>
                  {inspiration.note}
                </Text>
              )}
            </View>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Qual é a sua ideia?</Text>

          <TextInput
            value={idea}
            onChangeText={setIdea}
            placeholder="Ex.: explicar por que creatina não engorda..."
            placeholderTextColor={colors.textMuted}
            multiline
            textAlignVertical="top"
            style={styles.ideaInput}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Formato</Text>

          <View style={styles.options}>
            {formats.map((item) => (
              <OptionButton
                key={item}
                label={item}
                selected={format === item}
                onPress={() => setFormat(item)}
              />
            ))}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Objetivo do conteúdo</Text>

          <View style={styles.options}>
            {objectives.map((item) => (
              <OptionButton
                key={item}
                label={item}
                selected={objective === item}
                onPress={() => setObjective(item)}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !idea.trim() && styles.continueButtonDisabled,
          ]}
          disabled={!idea.trim()}
          onPress={handleContinue}
        >
          <Text
            style={[
              styles.continueButtonText,
              !idea.trim() && styles.continueButtonTextDisabled,
            ]}
          >
            Continuar para o roteiro
          </Text>

          <Ionicons
            name="arrow-forward"
            size={18}
            color={idea.trim() ? colors.surface : colors.textMuted}
          />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

type OptionButtonProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.option, selected && styles.optionSelected]}
      onPress={onPress}
    >
      <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
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

  title: {
    fontSize: typography.title,
    fontWeight: "700",
    color: colors.text,
  },

  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  referenceCard: {
    flexDirection: "row",
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
  },

  referenceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  referenceContent: {
    flex: 1,
  },

  referenceLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    color: colors.primary,
  },

  referenceUrl: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
    marginTop: 3,
  },

  referenceNote: {
    fontSize: typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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

  ideaInput: {
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

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  option: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
  },

  optionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  optionText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  optionTextSelected: {
    color: colors.surface,
  },

  continueButton: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
  },

  continueButtonDisabled: {
    backgroundColor: colors.border,
  },

  continueButtonText: {
    color: colors.surface,
    fontSize: typography.body,
    fontWeight: "700",
  },

  continueButtonTextDisabled: {
    color: colors.textMuted,
  },
});
