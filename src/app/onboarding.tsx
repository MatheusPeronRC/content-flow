import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
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

import {
  getCreatorProfile,
  saveCreatorProfile,
} from "../services/profileStorage";

import {
  ContentFormat,
  CreatorObjective,
  CreatorProfile,
} from "../types/creatorProfile";

import { colors, fonts, radius, shadows, spacing } from "../constants/theme";

const TOTAL_STEPS = 4;

const professionSuggestions = [
  "Nutricionista",
  "Personal trainer",
  "Fisioterapeuta",
  "Dentista",
  "Esteticista",
  "Fotógrafo(a)",
  "Designer",
  "Consultor(a)",
];

const objectiveOptions: Array<{
  value: CreatorObjective;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  color: string;
}> = [
  {
    value: "clientes",
    title: "Atrair clientes",
    description:
      "Criar conteúdo para gerar oportunidades e novos atendimentos.",
    icon: "people-outline",
    background: colors.terracottaLight,
    color: colors.terracotta,
  },
  {
    value: "autoridade",
    title: "Construir autoridade",
    description: "Ser lembrado como referência no seu assunto.",
    icon: "ribbon-outline",
    background: colors.amberLight,
    color: colors.amber,
  },
  {
    value: "audiencia",
    title: "Crescer audiência",
    description: "Alcançar mais pessoas e criar uma comunidade.",
    icon: "trending-up-outline",
    background: colors.blueLight,
    color: colors.blue,
  },
  {
    value: "vendas",
    title: "Vender mais",
    description: "Usar conteúdo para apresentar e vender produtos ou serviços.",
    icon: "bag-handle-outline",
    background: colors.roseLight,
    color: colors.rose,
  },
];

const frequencyOptions = [
  {
    value: 2,
    label: "2 por semana",
    description: "Um ritmo leve para começar.",
  },
  {
    value: 3,
    label: "3 por semana",
    description: "Consistência sem pesar na rotina.",
  },
  {
    value: 5,
    label: "5 por semana",
    description: "Uma presença mais frequente.",
  },
  {
    value: 7,
    label: "Todos os dias",
    description: "Conteúdo como parte da rotina diária.",
  },
];

const formatOptions: Array<{
  value: ContentFormat;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  background: string;
  color: string;
}> = [
  {
    value: "Reel",
    icon: "videocam-outline",
    description: "Vídeos curtos e diretos.",
    background: colors.terracottaLight,
    color: colors.terracotta,
  },
  {
    value: "Carrossel",
    icon: "albums-outline",
    description: "Conteúdo visual em etapas.",
    background: colors.amberLight,
    color: colors.amber,
  },
  {
    value: "Story",
    icon: "phone-portrait-outline",
    description: "Conteúdo rápido e próximo.",
    background: colors.lavenderLight,
    color: colors.lavender,
  },
  {
    value: "Foto",
    icon: "image-outline",
    description: "Imagem acompanhada de texto.",
    background: colors.blueLight,
    color: colors.blue,
  },
];

const stepMeta = {
  1: {
    label: "Seu perfil",
    icon: "briefcase-outline" as const,
  },
  2: {
    label: "Seu objetivo",
    icon: "flag-outline" as const,
  },
  3: {
    label: "Seu ritmo",
    icon: "calendar-outline" as const,
  },
  4: {
    label: "Seus formatos",
    icon: "apps-outline" as const,
  },
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);

  const [profession, setProfession] = useState("");

  const [objective, setObjective] = useState<CreatorObjective | null>(null);

  const [postsPerWeek, setPostsPerWeek] = useState<number | null>(null);

  const [formats, setFormats] = useState<ContentFormat[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [hasExistingProfile, setHasExistingProfile] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const profile = await getCreatorProfile();

        if (!active || !profile) {
          return;
        }

        setProfession(profile.profession ?? "");

        setObjective(profile.objective ?? null);

        setPostsPerWeek(profile.postsPerWeek ?? null);

        setFormats(profile.formats ?? []);

        setHasExistingProfile(Boolean(profile.onboardingCompleted));
      } catch (error) {
        console.error("Erro ao carregar perfil no onboarding:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1:
        return profession.trim().length >= 2;

      case 2:
        return objective !== null;

      case 3:
        return postsPerWeek !== null;

      case 4:
        return formats.length > 0;

      default:
        return false;
    }
  }, [step, profession, objective, postsPerWeek, formats]);

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);

      return;
    }

    if (hasExistingProfile) {
      router.back();
    }
  }

  function handleContinue() {
    if (!canContinue) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);

      return;
    }

    handleFinish();
  }

  async function handleFinish() {
    if (
      !profession.trim() ||
      !objective ||
      !postsPerWeek ||
      formats.length === 0 ||
      saving
    ) {
      return;
    }

    try {
      setSaving(true);

      const existingProfile = await getCreatorProfile();

      const now = new Date().toISOString();

      const profile: CreatorProfile = {
        profession: profession.trim(),
        objective,
        postsPerWeek,
        formats,
        onboardingCompleted: true,
        createdAt: existingProfile?.createdAt ?? now,
        updatedAt: now,
      };

      await saveCreatorProfile(profile);

      router.replace("/");
    } catch (error) {
      console.error("Erro ao finalizar onboarding:", error);
    } finally {
      setSaving(false);
    }
  }

  function toggleFormat(format: ContentFormat) {
    setFormats((current) => {
      if (current.includes(format)) {
        return current.filter((item) => item !== format);
      }

      return [...current, format];
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Preparando seu espaço...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStepMeta = stepMeta[step as keyof typeof stepMeta];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <View style={styles.topAction}>
            {(step > 1 || hasExistingProfile) && (
              <TouchableOpacity
                style={styles.backButton}
                activeOpacity={0.8}
                onPress={handleBack}
              >
                <Ionicons name="arrow-back" size={20} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Ionicons name="sparkles" size={15} color={colors.surface} />
            </View>

            <Text style={styles.brandName}>ContentFlow</Text>
          </View>

          <View style={styles.topAction} />
        </View>

        <View style={styles.progressArea}>
          <View style={styles.progressHeader}>
            <View style={styles.progressIdentity}>
              <View style={styles.progressIcon}>
                <Ionicons
                  name={currentStepMeta.icon}
                  size={15}
                  color={colors.terracotta}
                />
              </View>

              <View>
                <Text style={styles.stepLabel}>
                  PASSO {step} DE {TOTAL_STEPS}
                </Text>

                <Text style={styles.stepName}>{currentStepMeta.label}</Text>
              </View>
            </View>

            <Text style={styles.progressPercent}>
              {Math.round((step / TOTAL_STEPS) * 100)}%
            </Text>
          </View>

          <View style={styles.progressTrack}>
            {Array.from({
              length: TOTAL_STEPS,
            }).map((_, index) => {
              const active = index + 1 <= step;

              return (
                <View
                  key={index}
                  style={[
                    styles.progressSegment,
                    active && styles.progressSegmentActive,
                  ]}
                />
              );
            })}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && (
            <ProfessionStep
              profession={profession}
              onChangeProfession={setProfession}
            />
          )}

          {step === 2 && (
            <ObjectiveStep objective={objective} onSelect={setObjective} />
          )}

          {step === 3 && (
            <FrequencyStep value={postsPerWeek} onSelect={setPostsPerWeek} />
          )}

          {step === 4 && (
            <FormatsStep formats={formats} onToggle={toggleFormat} />
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              !canContinue && styles.continueButtonDisabled,
            ]}
            disabled={!canContinue || saving}
            activeOpacity={0.86}
            onPress={handleContinue}
          >
            {step === TOTAL_STEPS ? (
              <View style={styles.continueMark}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.terracotta} />
                ) : (
                  <Ionicons
                    name="sparkles"
                    size={17}
                    color={canContinue ? colors.terracotta : colors.textMuted}
                  />
                )}
              </View>
            ) : null}

            <Text
              style={[
                styles.continueText,
                !canContinue && styles.continueTextDisabled,
              ]}
            >
              {saving
                ? "Preparando..."
                : step === TOTAL_STEPS
                  ? "Entrar no ContentFlow"
                  : "Continuar"}
            </Text>

            <Ionicons
              name="arrow-forward"
              size={19}
              color={canContinue ? colors.surface : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type ProfessionStepProps = {
  profession: string;
  onChangeProfession: (value: string) => void;
};

function ProfessionStep({
  profession,
  onChangeProfession,
}: ProfessionStepProps) {
  return (
    <>
      <StepIntro
        eyebrow="SOBRE VOCÊ"
        title={"Com o que você\ntrabalha?"}
        description="Vamos usar isso para adaptar o ContentFlow à sua rotina e ao tipo de conteúdo que você cria."
      />

      <View style={styles.inputSection}>
        <Text style={styles.fieldLabel}>PROFISSÃO OU NICHO</Text>

        <View
          style={[
            styles.professionInputWrap,
            profession.trim() && styles.professionInputWrapActive,
          ]}
        >
          <View style={styles.professionMark}>
            <Ionicons
              name="briefcase-outline"
              size={20}
              color={colors.terracotta}
            />
          </View>

          <TextInput
            value={profession}
            onChangeText={onChangeProfession}
            autoCapitalize="sentences"
            placeholder="Ex.: Nutricionista, designer, personal trainer..."
            placeholderTextColor={colors.textMuted}
            style={styles.professionInput}
            returnKeyType="done"
          />
        </View>

        <Text style={styles.suggestionsLabel}>ALGUMAS IDEIAS</Text>

        <View style={styles.suggestions}>
          {professionSuggestions.map((item) => {
            const selected = profession === item;

            return (
              <TouchableOpacity
                key={item}
                style={[
                  styles.suggestionChip,
                  selected && styles.suggestionChipSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => onChangeProfession(item)}
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

        <View style={styles.helper}>
          <Ionicons
            name="information-circle-outline"
            size={17}
            color={colors.textMuted}
          />

          <Text style={styles.helperText}>
            Não encontrou a sua? Digite livremente no campo acima.
          </Text>
        </View>
      </View>
    </>
  );
}

type ObjectiveStepProps = {
  objective: CreatorObjective | null;
  onSelect: (value: CreatorObjective) => void;
};

function ObjectiveStep({ objective, onSelect }: ObjectiveStepProps) {
  return (
    <>
      <StepIntro
        eyebrow="SEU OBJETIVO"
        title={"O que você quer\nconquistar com conteúdo?"}
        description="Não precisa ser definitivo. Você poderá mudar essa escolha depois."
      />

      <View style={styles.optionList}>
        {objectiveOptions.map((item) => {
          const selected = objective === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.largeOption,
                selected && styles.largeOptionSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => onSelect(item.value)}
            >
              <View
                style={[
                  styles.largeOptionMark,
                  {
                    backgroundColor: item.background,
                  },
                ]}
              >
                <Ionicons name={item.icon} size={22} color={item.color} />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.largeOptionTitle}>{item.title}</Text>

                <Text style={styles.largeOptionDescription}>
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.selectionCircle,
                  selected && styles.selectionCircleSelected,
                ]}
              >
                {selected && (
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                )}
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
  onSelect: (value: number) => void;
};

function FrequencyStep({ value, onSelect }: FrequencyStepProps) {
  return (
    <>
      <StepIntro
        eyebrow="SEU RITMO"
        title={"Quantos conteúdos\ncabem na sua semana?"}
        description="Vamos usar isso como uma meta de planejamento — sem cobrança e sem transformar conteúdo em obrigação."
      />

      <View style={styles.frequencyList}>
        {frequencyOptions.map((item) => {
          const selected = value === item.value;

          return (
            <TouchableOpacity
              key={item.value}
              style={[
                styles.frequencyOption,
                selected && styles.frequencyOptionSelected,
              ]}
              activeOpacity={0.85}
              onPress={() => onSelect(item.value)}
            >
              <View
                style={[
                  styles.frequencyNumber,
                  selected && styles.frequencyNumberSelected,
                ]}
              >
                <Text
                  style={[
                    styles.frequencyNumberText,
                    selected && styles.frequencyNumberTextSelected,
                  ]}
                >
                  {item.value}
                </Text>
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.frequencyTitle}>{item.label}</Text>

                <Text style={styles.frequencyDescription}>
                  {item.description}
                </Text>
              </View>

              <View
                style={[
                  styles.selectionCircle,
                  selected && styles.selectionCircleSelected,
                ]}
              >
                {selected && (
                  <Ionicons name="checkmark" size={14} color={colors.surface} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.weekPreview}>
        <View style={styles.weekPreviewIcon}>
          <Ionicons name="calendar-outline" size={19} color={colors.blue} />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.weekPreviewLabel}>SUA FUTURA META</Text>

          <Text style={styles.weekPreviewTitle}>
            {value
              ? `${value} ${value === 1 ? "conteúdo" : "conteúdos"} por semana`
              : "Escolha um ritmo"}
          </Text>

          <Text style={styles.weekPreviewText}>
            Essa meta aparece na Home e no planejamento semanal.
          </Text>
        </View>
      </View>
    </>
  );
}

type FormatsStepProps = {
  formats: ContentFormat[];
  onToggle: (format: ContentFormat) => void;
};

function FormatsStep({ formats, onToggle }: FormatsStepProps) {
  return (
    <>
      <StepIntro
        eyebrow="SEUS FORMATOS"
        title={"O que você costuma\ncriar?"}
        description="Escolha todos que fizerem sentido. O ContentFlow continua flexível para outros formatos depois."
      />

      <View style={styles.formatGrid}>
        {formatOptions.map((item) => {
          const selected = formats.includes(item.value);

          return (
            <TouchableOpacity
              key={item.value}
              style={[styles.formatCard, selected && styles.formatCardSelected]}
              activeOpacity={0.85}
              onPress={() => onToggle(item.value)}
            >
              <View style={styles.formatCardTop}>
                <View
                  style={[
                    styles.formatMark,
                    {
                      backgroundColor: item.background,
                    },
                  ]}
                >
                  <Ionicons name={item.icon} size={22} color={item.color} />
                </View>

                <View
                  style={[
                    styles.selectionCircle,
                    selected && styles.selectionCircleSelected,
                  ]}
                >
                  {selected && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.surface}
                    />
                  )}
                </View>
              </View>

              <Text style={styles.formatTitle}>{item.value}</Text>

              <Text style={styles.formatDescription}>{item.description}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.finishMessage}>
        <View style={styles.finishMessageMark}>
          <Ionicons name="sparkles" size={18} color={colors.terracotta} />
        </View>

        <View
          style={{
            flex: 1,
          }}
        >
          <Text style={styles.finishMessageTitle}>Pronto para começar.</Text>

          <Text style={styles.finishMessageText}>
            Essas escolhas adaptam o ContentFlow à sua rotina, mas não limitam o
            que você pode criar.
          </Text>
        </View>
      </View>
    </>
  );
}

type StepIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

function StepIntro({ eyebrow, title, description }: StepIntroProps) {
  return (
    <View style={styles.stepIntro}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>

      <Text style={styles.title}>{title}</Text>

      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  topBar: {
    height: 66,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  topAction: {
    width: 42,
    height: 42,
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

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  brandMark: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },

  brandName: {
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.text,
    letterSpacing: -0.3,
  },

  progressArea: {
    marginHorizontal: spacing.lg,
    marginTop: 4,
    paddingTop: 9,
    paddingBottom: 7,
  },

  progressHeader: {
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  progressIdentity: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  progressIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  stepLabel: {
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  stepName: {
    marginTop: 1,
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  progressPercent: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  progressTrack: {
    height: 5,
    flexDirection: "row",
    gap: 6,
  },

  progressSegment: {
    flex: 1,
    height: 5,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
  },

  progressSegmentActive: {
    backgroundColor: colors.terracotta,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 130,
  },

  stepIntro: {
    paddingTop: 30,
    paddingBottom: 26,
  },

  eyebrow: {
    marginBottom: 9,
    fontSize: 11,
    letterSpacing: 0.95,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  title: {
    maxWidth: 345,
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.95,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  description: {
    maxWidth: 345,
    marginTop: 11,
    fontSize: 14,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  inputSection: {
    paddingBottom: 8,
  },

  fieldLabel: {
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  professionInputWrap: {
    minHeight: 66,
    paddingHorizontal: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  professionInputWrapActive: {
    borderColor: colors.terracotta,
  },

  professionMark: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 13,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  professionInput: {
    flex: 1,
    minHeight: 64,
    paddingVertical: 0,
    paddingRight: 6,
    fontSize: 15,
    lineHeight: 22,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  suggestionsLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  suggestionChip: {
    minHeight: 41,
    paddingHorizontal: 14,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  suggestionChipSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  suggestionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  suggestionTextSelected: {
    color: colors.terracotta,
  },

  helper: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
  },

  helperText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  optionList: {
    gap: 10,
  },

  largeOption: {
    minHeight: 88,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  largeOptionSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.surface,
  },

  largeOptionMark: {
    width: 46,
    height: 46,
    marginRight: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  largeOptionTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  largeOptionDescription: {
    maxWidth: 245,
    marginTop: 3,
    paddingRight: 8,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  selectionCircle: {
    width: 25,
    height: 25,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracotta,
  },

  frequencyList: {
    gap: 9,
  },

  frequencyOption: {
    minHeight: 74,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  frequencyOptionSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.surface,
  },

  frequencyNumber: {
    width: 44,
    height: 44,
    marginRight: 12,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  frequencyNumberSelected: {
    backgroundColor: colors.terracotta,
  },

  frequencyNumberText: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  frequencyNumberTextSelected: {
    color: colors.surface,
  },

  frequencyTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  frequencyDescription: {
    marginTop: 2,
    paddingRight: 8,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  weekPreview: {
    minHeight: 90,
    marginTop: 15,
    padding: 13,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  weekPreviewIcon: {
    width: 42,
    height: 42,
    marginRight: 11,
    borderRadius: 13,
    backgroundColor: colors.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  weekPreviewLabel: {
    fontSize: 11,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  weekPreviewTitle: {
    marginTop: 3,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  weekPreviewText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  formatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },

  formatCard: {
    width: "48.5%",
    minHeight: 138,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },

  formatCardSelected: {
    borderColor: colors.terracotta,
  },

  formatCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },

  formatMark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  formatTitle: {
    marginTop: 13,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formatDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  finishMessage: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
  },

  finishMessageMark: {
    width: 36,
    height: 36,
    marginRight: 10,
    borderRadius: 11,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  finishMessageTitle: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  finishMessageText: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 10 : 18,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },

  continueButton: {
    minHeight: 60,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    ...shadows.soft,
  },

  continueButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  continueMark: {
    position: "absolute",
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  continueText: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.surface,
    textAlign: "center",
  },

  continueTextDisabled: {
    color: colors.textMuted,
  },
});
