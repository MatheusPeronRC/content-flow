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

const professions = [
  "Nutricionista",
  "Personal trainer",
  "Fisioterapeuta",
  "Dentista",
  "Esteticista",
  "Psicólogo",
  "Fotógrafo",
  "Designer",
  "Outro",
];

const objectives: {
  value: CreatorObjective;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "clientes",
    title: "Atrair clientes",
    description:
      "Criar conteúdo para gerar oportunidades e novos atendimentos.",
    icon: "people-outline",
  },
  {
    value: "autoridade",
    title: "Construir autoridade",
    description: "Ser reconhecido como referência na sua área.",
    icon: "ribbon-outline",
  },
  {
    value: "audiencia",
    title: "Crescer audiência",
    description: "Alcançar mais pessoas e aumentar sua comunidade.",
    icon: "trending-up-outline",
  },
  {
    value: "vendas",
    title: "Vender produtos ou serviços",
    description: "Usar conteúdo para apoiar suas vendas.",
    icon: "bag-outline",
  },
];

const frequencies = [
  {
    value: 2,
    label: "1–2x",
    description: "Começar com calma",
  },
  {
    value: 3,
    label: "3x",
    description: "Bom equilíbrio",
  },
  {
    value: 5,
    label: "4–5x",
    description: "Ritmo consistente",
  },
  {
    value: 7,
    label: "Todos os dias",
    description: "Alta frequência",
  },
];

const formats: {
  value: ContentFormat;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  {
    value: "Reel",
    icon: "videocam-outline",
  },
  {
    value: "Carrossel",
    icon: "albums-outline",
  },
  {
    value: "Story",
    icon: "phone-portrait-outline",
  },
  {
    value: "Foto",
    icon: "image-outline",
  },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [profession, setProfession] = useState("");
  const [customProfession, setCustomProfession] = useState("");

  const [objective, setObjective] = useState<CreatorObjective | null>(null);

  const [postsPerWeek, setPostsPerWeek] = useState<number | null>(null);

  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);

  const finalProfession =
    profession === "Outro" ? customProfession.trim() : profession;

  function canContinue() {
    switch (step) {
      case 1:
        return finalProfession.length > 0;

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
    setSelectedFormats((current) =>
      current.includes(format)
        ? current.filter((item) => item !== format)
        : [...current, format],
    );
  }

  async function handleContinue() {
    if (!canContinue()) {
      return;
    }

    if (step < 4) {
      setStep((current) => current + 1);
      return;
    }

    if (!objective || !postsPerWeek) {
      return;
    }

    const now = new Date().toISOString();

    await saveCreatorProfile({
      profession: finalProfession,
      objective,
      postsPerWeek,
      formats: selectedFormats,

      onboardingCompleted: true,

      createdAt: now,
      updatedAt: now,
    });

    router.replace("/");
  }

  function handleBack() {
    if (step === 1) {
      return;
    }

    setStep((current) => current - 1);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.topRow}>
            {step > 1 ? (
              <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                <Ionicons name="arrow-back" size={21} color={colors.text} />
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
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <>
              <Header
                eyebrow="SOBRE VOCÊ"
                title="O que você faz?"
                description="Isso ajuda o ContentFlow a organizar melhor suas ideias e conteúdos."
              />

              <View style={styles.professions}>
                {professions.map((item) => {
                  const selected = profession === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[
                        styles.profession,
                        selected && styles.professionSelected,
                      ]}
                      onPress={() => setProfession(item)}
                    >
                      <Text
                        style={[
                          styles.professionText,
                          selected && styles.professionTextSelected,
                        ]}
                      >
                        {item}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {profession === "Outro" && (
                <TextInput
                  value={customProfession}
                  onChangeText={setCustomProfession}
                  placeholder="Digite sua profissão ou nicho"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />
              )}
            </>
          )}

          {step === 2 && (
            <>
              <Header
                eyebrow="SEU OBJETIVO"
                title="O que o conteúdo precisa fazer por você?"
                description="Escolha o principal objetivo neste momento."
              />

              <View style={styles.optionList}>
                {objectives.map((item) => {
                  const selected = objective === item.value;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.objectiveCard,
                        selected && styles.objectiveCardSelected,
                      ]}
                      onPress={() => setObjective(item.value)}
                    >
                      <View
                        style={[
                          styles.objectiveIcon,
                          selected && styles.objectiveIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={22}
                          color={selected ? colors.surface : colors.primary}
                        />
                      </View>

                      <View style={styles.optionContent}>
                        <Text style={styles.optionTitle}>{item.title}</Text>

                        <Text style={styles.optionDescription}>
                          {item.description}
                        </Text>
                      </View>

                      <View
                        style={[styles.radio, selected && styles.radioSelected]}
                      >
                        {selected && <View style={styles.radioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Header
                eyebrow="SUA ROTINA"
                title="Quantas vezes você quer publicar por semana?"
                description="Não precisa ser perfeito. Escolha um ritmo que pareça possível."
              />

              <View style={styles.frequencyGrid}>
                {frequencies.map((item) => {
                  const selected = postsPerWeek === item.value;

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.frequencyCard,
                        selected && styles.frequencyCardSelected,
                      ]}
                      onPress={() => setPostsPerWeek(item.value)}
                    >
                      <Text
                        style={[
                          styles.frequencyValue,
                          selected && styles.frequencyValueSelected,
                        ]}
                      >
                        {item.label}
                      </Text>

                      <Text
                        style={[
                          styles.frequencyDescription,
                          selected && styles.frequencyDescriptionSelected,
                        ]}
                      >
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Header
                eyebrow="SEUS FORMATOS"
                title="O que você costuma publicar?"
                description="Você pode escolher mais de uma opção."
              />

              <View style={styles.formatGrid}>
                {formats.map((item) => {
                  const selected = selectedFormats.includes(item.value);

                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.formatCard,
                        selected && styles.formatCardSelected,
                      ]}
                      onPress={() => toggleFormat(item.value)}
                    >
                      <View
                        style={[
                          styles.formatIcon,
                          selected && styles.formatIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={item.icon}
                          size={25}
                          color={selected ? colors.surface : colors.primary}
                        />
                      </View>

                      <Text style={styles.formatTitle}>{item.value}</Text>

                      {selected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={colors.primary}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.finishHint}>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color={colors.primary}
                />

                <Text style={styles.finishHintText}>
                  Pronto. Com isso o ContentFlow já consegue entender melhor sua
                  rotina de criação.
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue() && styles.continueButtonDisabled,
            ]}
            disabled={!canContinue()}
            onPress={handleContinue}
          >
            <Text
              style={[
                styles.continueText,
                !canContinue() && styles.continueTextDisabled,
              ]}
            >
              {step === 4 ? "Começar a organizar" : "Continuar"}
            </Text>

            <Ionicons
              name={step === 4 ? "checkmark" : "arrow-forward"}
              size={18}
              color={canContinue() ? colors.surface : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

type HeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function Header({ eyebrow, title, description }: HeaderProps) {
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
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },

  progressItemActive: {
    backgroundColor: colors.primary,
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
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: colors.primary,
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "700",
    color: colors.text,
  },

  description: {
    marginTop: spacing.sm,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.textSecondary,
  },

  professions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  profession: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
  },

  professionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  professionText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  professionTextSelected: {
    color: colors.surface,
  },

  input: {
    height: 54,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    fontSize: typography.body,
    color: colors.text,
  },

  optionList: {
    gap: spacing.sm,
  },

  objectiveCard: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  objectiveCardSelected: {
    borderColor: colors.primary,
  },

  objectiveIcon: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  objectiveIconSelected: {
    backgroundColor: colors.primary,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  optionDescription: {
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

  frequencyGrid: {
    gap: spacing.sm,
  },

  frequencyCard: {
    minHeight: 78,
    padding: spacing.md,
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
  },

  frequencyCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  frequencyValue: {
    fontSize: typography.heading,
    fontWeight: "800",
    color: colors.text,
  },

  frequencyValueSelected: {
    color: colors.surface,
  },

  frequencyDescription: {
    marginTop: 3,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  frequencyDescriptionSelected: {
    color: "#D7E3DE",
  },

  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  formatCard: {
    width: "48%",
    minHeight: 120,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
  },

  formatCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },

  formatIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  formatIconSelected: {
    backgroundColor: colors.primary,
  },

  formatTitle: {
    marginTop: spacing.md,
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  finishHint: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryLight,
  },

  finishHintText: {
    flex: 1,
    fontSize: typography.caption,
    lineHeight: 18,
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
