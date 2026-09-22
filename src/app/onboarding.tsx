import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";

import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { saveCreatorProfile } from "../services/profileStorage";

import { ContentFormat, CreatorObjective } from "../types/creatorProfile";

import { colors, radius, spacing, typography } from "../constants/theme";

const professionSuggestions = [
  "Nutricionista",
  "Personal trainer",
  "Fisioterapeuta",
  "Dentista",
  "Psicólogo",
  "Fotógrafo",
  "Designer",
];

const objectives: {
  value: CreatorObjective;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
}[] = [
  {
    value: "clientes",

    title: "Atrair clientes",

    description: "Transformar conteúdo em novas oportunidades e atendimentos.",

    icon: "people-outline",

    background: colors.terracottaLight,

    foreground: colors.terracotta,
  },

  {
    value: "autoridade",

    title: "Construir autoridade",

    description: "Ser lembrado como referência na sua área.",

    icon: "ribbon-outline",

    background: colors.amberLight,

    foreground: colors.amber,
  },

  {
    value: "audiencia",

    title: "Crescer audiência",

    description: "Alcançar mais pessoas e construir uma comunidade.",

    icon: "trending-up-outline",

    background: colors.blueLight,

    foreground: colors.blue,
  },

  {
    value: "vendas",

    title: "Vender produtos ou serviços",

    description: "Usar seu conteúdo para apoiar suas vendas.",

    icon: "bag-outline",

    background: colors.sageLight,

    foreground: colors.sage,
  },
];

const frequencies = [
  {
    value: 2,
    title: "1–2x",
    description: "Começar com calma",
  },

  {
    value: 3,
    title: "3x",
    description: "Bom equilíbrio",
  },

  {
    value: 5,
    title: "4–5x",
    description: "Ritmo consistente",
  },

  {
    value: 7,
    title: "Todos os dias",
    description: "Alta frequência",
  },
];

const formats: {
  value: ContentFormat;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
}[] = [
  {
    value: "Reel",

    icon: "videocam-outline",

    background: colors.terracottaLight,

    foreground: colors.terracotta,
  },

  {
    value: "Carrossel",

    icon: "albums-outline",

    background: colors.amberLight,

    foreground: colors.amber,
  },

  {
    value: "Story",

    icon: "phone-portrait-outline",

    background: colors.lavenderLight,

    foreground: colors.lavender,
  },

  {
    value: "Foto",

    icon: "image-outline",

    background: colors.blueLight,

    foreground: colors.blue,
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [profession, setProfession] = useState("");

  const [objective, setObjective] = useState<CreatorObjective | null>(null);

  const [postsPerWeek, setPostsPerWeek] = useState<number | null>(null);

  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);

  const [saving, setSaving] = useState(false);

  function canContinue() {
    switch (step) {
      case 1:
        return profession.trim().length >= 2;

      case 2:
        return objective !== null;

      case 3:
        return postsPerWeek !== null;

      case 4:
        return selectedFormats.length > 0;

      default:
        return false;
    }
  }

  function toggleFormat(format: ContentFormat) {
    setSelectedFormats((current) => {
      if (current.includes(format)) {
        return current.filter((item) => item !== format);
      }

      return [...current, format];
    });
  }

  function handleBack() {
    if (step <= 1) {
      return;
    }

    setStep((current) => current - 1);
  }

  async function handleContinue() {
    if (!canContinue() || saving) {
      return;
    }

    if (step < 4) {
      setStep((current) => current + 1);

      return;
    }

    if (!objective || !postsPerWeek) {
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      await saveCreatorProfile({
        profession: profession.trim(),

        objective,

        postsPerWeek,

        formats: selectedFormats,

        onboardingCompleted: true,

        createdAt: now,
        updatedAt: now,
      });

      router.replace("/");
    } catch (error) {
      console.error("Erro ao salvar onboarding:", error);

      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.topRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.backSpace} />
            )}

            <Text style={styles.stepText}>{step} de 4</Text>

            <View style={styles.backSpace} />
          </View>

          <View style={styles.progress}>
            {[1, 2, 3, 4].map((item) => (
              <View
                key={item}
                style={[
                  styles.progressItem,

                  item <= step && styles.progressItemActive,
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 1 && (
            <ProfessionStep profession={profession} onChange={setProfession} />
          )}

          {step === 2 && (
            <ObjectiveStep value={objective} onChange={setObjective} />
          )}

          {step === 3 && (
            <FrequencyStep value={postsPerWeek} onChange={setPostsPerWeek} />
          )}

          {step === 4 && (
            <FormatStep
              selectedFormats={selectedFormats}
              onToggle={toggleFormat}
            />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,

              !canContinue() && styles.continueButtonDisabled,
            ]}
            disabled={!canContinue() || saving}
            activeOpacity={0.85}
            onPress={handleContinue}
          >
            <Text
              style={[
                styles.continueText,

                !canContinue() && styles.continueTextDisabled,
              ]}
            >
              {saving
                ? "Salvando..."
                : step === 4
                  ? "Começar no ContentFlow"
                  : "Continuar"}
            </Text>

            {!saving && (
              <Ionicons
                name={step === 4 ? "sparkles-outline" : "arrow-forward"}
                size={18}
                color={canContinue() ? colors.surface : colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type ProfessionStepProps = {
  profession: string;

  onChange: (value: string) => void;
};

function ProfessionStep({ profession, onChange }: ProfessionStepProps) {
  return (
    <>
      <StepHeader
        eyebrow="SOBRE VOCÊ"
        title="O que você faz?"
        description="O ContentFlow vai usar isso para entender melhor o tipo de conteúdo que você cria."
      />

      <Text style={styles.inputLabel}>Sua profissão ou nicho</Text>

      <View style={styles.professionInput}>
        <Ionicons
          name="briefcase-outline"
          size={20}
          color={colors.terracotta}
        />

        <TextInput
          value={profession}
          onChangeText={onChange}
          placeholder="Ex.: Nutricionista"
          placeholderTextColor={colors.textMuted}
          style={styles.professionTextInput}
          autoCapitalize="sentences"
        />
      </View>

      <Text style={styles.suggestionLabel}>Algumas sugestões</Text>

      <View style={styles.suggestions}>
        {professionSuggestions.map((item) => {
          const selected = profession === item;

          return (
            <TouchableOpacity
              key={item}
              style={[styles.suggestion, selected && styles.suggestionSelected]}
              onPress={() => onChange(item)}
            >
              <Text
                style={[
                  styles.suggestionText,

                  selected && styles.suggestionTextSelected,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.tip}>
        <Ionicons
          name="information-circle-outline"
          size={19}
          color={colors.blue}
        />

        <Text style={styles.tipText}>
          Não encontrou sua profissão? Digite normalmente no campo acima.
        </Text>
      </View>
    </>
  );
}

type ObjectiveStepProps = {
  value: CreatorObjective | null;

  onChange: (objective: CreatorObjective) => void;
};

function ObjectiveStep({ value, onChange }: ObjectiveStepProps) {
  return (
    <>
      <StepHeader
        eyebrow="SEU OBJETIVO"
        title="O que você quer conquistar com seu conteúdo?"
        description="Escolha seu principal objetivo neste momento. Você poderá mudar isso depois."
      />

      <View style={styles.optionList}>
        {objectives.map((item) => {
          const selected = value === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.objectiveCard,

                selected && styles.objectiveCardSelected,
              ]}
              onPress={() => onChange(item.value)}
            >
              <View
                style={[
                  styles.objectiveIcon,

                  {
                    backgroundColor: item.background,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={item.foreground} />
              </View>

              <View style={styles.objectiveContent}>
                <Text style={styles.objectiveTitle}>{item.title}</Text>

                <Text style={styles.objectiveDescription}>
                  {item.description}
                </Text>
              </View>

              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected && <View style={styles.radioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </>
  );
}

type FrequencyStepProps = {
  value: number | null;

  onChange: (value: number) => void;
};

function FrequencyStep({ value, onChange }: FrequencyStepProps) {
  return (
    <>
      <StepHeader
        eyebrow="SUA ROTINA"
        title="Quantas vezes você quer publicar por semana?"
        description="Escolha um ritmo realista. Consistência vale mais do que tentar publicar demais."
      />

      <View style={styles.frequencyList}>
        {frequencies.map((item) => {
          const selected = value === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.frequencyCard,

                selected && styles.frequencyCardSelected,
              ]}
              onPress={() => onChange(item.value)}
            >
              <View>
                <Text
                  style={[
                    styles.frequencyTitle,

                    selected && styles.frequencyTitleSelected,
                  ]}
                >
                  {item.title}
                </Text>

                <Text
                  style={[
                    styles.frequencyDescription,

                    selected && styles.frequencyDescriptionSelected,
                  ]}
                >
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.frequencyCheck,

                  selected && styles.frequencyCheckSelected,
                ]}
              >
                {selected && (
                  <Ionicons name="checkmark" size={16} color={colors.surface} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.frequencyHint}>
        <Ionicons name="calendar-outline" size={21} color={colors.blue} />

        <Text style={styles.frequencyHintText}>
          Essa escolha será usada como sua meta semanal no planejamento.
        </Text>
      </View>
    </>
  );
}

type FormatStepProps = {
  selectedFormats: ContentFormat[];

  onToggle: (format: ContentFormat) => void;
};

function FormatStep({ selectedFormats, onToggle }: FormatStepProps) {
  return (
    <>
      <StepHeader
        eyebrow="SEUS FORMATOS"
        title="O que você gosta de publicar?"
        description="Escolha todos que fizerem sentido para você."
      />

      <View style={styles.formatGrid}>
        {formats.map((item) => {
          const selected = selectedFormats.includes(item.value);

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.formatCard,

                selected && {
                  borderColor: item.foreground,

                  backgroundColor: item.background,
                },
              ]}
              onPress={() => onToggle(item.value)}
            >
              <View
                style={[
                  styles.formatIcon,

                  {
                    backgroundColor: selected
                      ? colors.surface
                      : item.background,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={25} color={item.foreground} />
              </View>

              <View>
                <Text style={styles.formatTitle}>{item.value}</Text>

                <Text style={styles.formatSubtitle}>
                  {selected ? "Selecionado" : "Toque para selecionar"}
                </Text>
              </View>

              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={item.foreground}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.finishCard}>
        <View style={styles.finishIcon}>
          <Ionicons
            name="sparkles-outline"
            size={22}
            color={colors.terracotta}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.finishTitle}>Tudo pronto</Text>

          <Text style={styles.finishDescription}>
            Essas preferências poderão ser alteradas depois no seu perfil.
          </Text>
        </View>
      </View>
    </>
  );
}

type StepHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function StepHeader({ eyebrow, title, description }: StepHeaderProps) {
  return (
    <View style={styles.intro}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>{description}</Text>
    </View>
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

  top: {
    paddingHorizontal: spacing.lg,
  },

  topRow: {
    height: 58,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  backButton: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  backSpace: {
    width: 38,
  },

  stepText: {
    fontSize: typography.caption,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  progress: {
    flexDirection: "row",

    gap: 6,
  },

  progressItem: {
    flex: 1,

    height: 5,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  progressItemActive: {
    backgroundColor: colors.terracotta,
  },

  content: {
    paddingHorizontal: spacing.lg,

    paddingBottom: spacing.xl,
  },

  intro: {
    paddingTop: spacing.xl,

    paddingBottom: spacing.xl,
  },

  eyebrow: {
    marginBottom: spacing.sm,

    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 1.2,

    color: colors.terracotta,
  },

  title: {
    maxWidth: 350,

    fontSize: 29,

    lineHeight: 35,

    fontWeight: "700",

    color: colors.text,
  },

  description: {
    marginTop: spacing.sm,

    maxWidth: 350,

    fontSize: typography.body,

    lineHeight: 21,

    color: colors.textSecondary,
  },

  inputLabel: {
    marginBottom: spacing.sm,

    fontSize: typography.caption,

    fontWeight: "700",

    color: colors.text,
  },

  professionInput: {
    minHeight: 56,

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    paddingHorizontal: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  professionTextInput: {
    flex: 1,

    minHeight: 54,

    fontSize: 16,

    color: colors.text,
  },

  suggestionLabel: {
    marginTop: spacing.xl,

    marginBottom: spacing.sm,

    fontSize: typography.caption,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  suggestions: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  suggestion: {
    paddingHorizontal: spacing.md,

    paddingVertical: 10,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceSoft,

    borderWidth: 1,

    borderColor: colors.border,
  },

  suggestionSelected: {
    backgroundColor: colors.terracottaLight,

    borderColor: colors.terracotta,
  },

  suggestionText: {
    fontSize: typography.caption,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  suggestionTextSelected: {
    color: colors.terracotta,
  },

  tip: {
    marginTop: spacing.xl,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.blueLight,
  },

  tipText: {
    flex: 1,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  optionList: {
    gap: spacing.sm,
  },

  objectiveCard: {
    minHeight: 94,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  objectiveCardSelected: {
    borderColor: colors.primary,

    borderWidth: 1.5,
  },

  objectiveIcon: {
    width: 48,
    height: 48,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  objectiveContent: {
    flex: 1,
  },

  objectiveTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  objectiveDescription: {
    marginTop: 4,

    paddingRight: spacing.sm,

    fontSize: typography.caption,

    lineHeight: 17,

    color: colors.textSecondary,
  },

  radio: {
    width: 22,
    height: 22,

    borderRadius: radius.round,

    borderWidth: 1.5,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  radioSelected: {
    borderColor: colors.primary,
  },

  radioDot: {
    width: 12,
    height: 12,

    borderRadius: radius.round,

    backgroundColor: colors.primary,
  },

  frequencyList: {
    gap: spacing.sm,
  },

  frequencyCard: {
    minHeight: 78,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingHorizontal: spacing.lg,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  frequencyCardSelected: {
    backgroundColor: colors.blue,

    borderColor: colors.blue,
  },

  frequencyTitle: {
    fontSize: typography.heading,

    fontWeight: "800",

    color: colors.text,
  },

  frequencyTitleSelected: {
    color: colors.surface,
  },

  frequencyDescription: {
    marginTop: 3,

    fontSize: typography.caption,

    color: colors.textSecondary,
  },

  frequencyDescriptionSelected: {
    color: "#E5EFF3",
  },

  frequencyCheck: {
    width: 28,
    height: 28,

    borderRadius: radius.round,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  frequencyCheckSelected: {
    backgroundColor: colors.primary,

    borderColor: colors.primary,
  },

  frequencyHint: {
    marginTop: spacing.xl,

    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.blueLight,
  },

  frequencyHintText: {
    flex: 1,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  formatGrid: {
    gap: spacing.sm,
  },

  formatCard: {
    minHeight: 82,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  formatIcon: {
    width: 46,
    height: 46,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  formatTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  formatSubtitle: {
    marginTop: 3,

    fontSize: typography.tiny,

    color: colors.textSecondary,
  },

  finishCard: {
    marginTop: spacing.xl,

    flexDirection: "row",

    alignItems: "center",

    padding: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.terracottaLight,
  },

  finishIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  finishTitle: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.text,
  },

  finishDescription: {
    marginTop: 3,

    fontSize: typography.caption,

    lineHeight: 17,

    color: colors.textSecondary,
  },

  footer: {
    padding: spacing.lg,

    paddingTop: spacing.md,

    borderTopWidth: 1,

    borderTopColor: colors.border,

    backgroundColor: colors.background,
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
    backgroundColor: colors.surfaceMuted,
  },

  continueText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  continueTextDisabled: {
    color: colors.textMuted,
  },
});
