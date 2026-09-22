import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Alert,
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
    updateCreatorProfile,
} from "../services/profileStorage";

import {
    ContentFormat,
    CreatorObjective,
    CreatorProfile,
} from "../types/creatorProfile";

import { colors, radius, spacing, typography } from "../constants/theme";

const objectives: {
  value: CreatorObjective;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
}[] = [
  {
    value: "clientes",
    title: "Atrair clientes",
    icon: "people-outline",
    background: colors.terracottaLight,
    foreground: colors.terracotta,
  },

  {
    value: "autoridade",
    title: "Construir autoridade",
    icon: "ribbon-outline",
    background: colors.amberLight,
    foreground: colors.amber,
  },

  {
    value: "audiencia",
    title: "Crescer audiência",
    icon: "trending-up-outline",
    background: colors.blueLight,
    foreground: colors.blue,
  },

  {
    value: "vendas",
    title: "Vender produtos ou serviços",
    icon: "bag-outline",
    background: colors.sageLight,
    foreground: colors.sage,
  },
];

const frequencies = [
  {
    value: 2,
    label: "1–2x",
  },
  {
    value: 3,
    label: "3x",
  },
  {
    value: 5,
    label: "4–5x",
  },
  {
    value: 7,
    label: "Todos os dias",
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

export default function ProfileScreen() {
  const [profile, setProfile] = useState<CreatorProfile | null>(null);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [profession, setProfession] = useState("");

  const [objective, setObjective] = useState<CreatorObjective | null>(null);

  const [postsPerWeek, setPostsPerWeek] = useState<number | null>(null);

  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadProfile() {
        try {
          setLoading(true);

          const data = await getCreatorProfile();

          if (!active) {
            return;
          }

          if (!data) {
            setProfile(null);
            return;
          }

          setProfile(data);

          setProfession(data.profession);

          setObjective(data.objective);

          setPostsPerWeek(data.postsPerWeek);

          setSelectedFormats(data.formats);
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
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
    }, []),
  );

  function toggleFormat(format: ContentFormat) {
    setSelectedFormats((current) => {
      if (current.includes(format)) {
        return current.filter((item) => item !== format);
      }

      return [...current, format];
    });
  }

  function canSave() {
    return (
      profession.trim().length >= 2 &&
      objective !== null &&
      postsPerWeek !== null &&
      selectedFormats.length > 0
    );
  }

  async function handleSave() {
    if (!canSave() || !objective || !postsPerWeek || saving) {
      return;
    }

    try {
      setSaving(true);

      await updateCreatorProfile({
        profession: profession.trim(),

        objective,

        postsPerWeek,

        formats: selectedFormats,
      });

      const updated = await getCreatorProfile();

      setProfile(updated);

      Alert.alert(
        "Preferências salvas",
        "O ContentFlow foi atualizado com suas novas preferências.",
      );
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Perfil não encontrado</Text>

          <Text style={styles.errorText}>
            Conclua o onboarding para criar suas preferências.
          </Text>

          <TouchableOpacity
            style={styles.onboardingButton}
            onPress={() => router.replace("/onboarding")}
          >
            <Text style={styles.onboardingButtonText}>Fazer onboarding</Text>
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
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meu perfil</Text>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.profileHero}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={28} color={colors.surface} />
          </View>

          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{profession}</Text>

            <Text style={styles.heroSubtitle}>
              Personalize como o ContentFlow organiza sua rotina.
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: colors.terracottaLight,
                },
              ]}
            >
              <Ionicons
                name="briefcase-outline"
                size={19}
                color={colors.terracotta}
              />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Profissão ou nicho</Text>

              <Text style={styles.sectionSubtitle}>
                Como você se apresenta profissionalmente.
              </Text>
            </View>
          </View>

          <TextInput
            value={profession}
            onChangeText={setProfession}
            placeholder="Ex.: Nutricionista"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: colors.amberLight,
                },
              ]}
            >
              <Ionicons name="flag-outline" size={19} color={colors.amber} />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Objetivo principal</Text>

              <Text style={styles.sectionSubtitle}>
                O que seu conteúdo precisa ajudar a conquistar.
              </Text>
            </View>
          </View>

          <View style={styles.objectiveList}>
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

                      {
                        backgroundColor: item.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={item.icon}
                      size={20}
                      color={item.foreground}
                    />
                  </View>

                  <Text style={styles.objectiveText}>{item.title}</Text>

                  <View
                    style={[styles.radio, selected && styles.radioSelected]}
                  >
                    {selected && <View style={styles.radioDot} />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: colors.blueLight,
                },
              ]}
            >
              <Ionicons name="calendar-outline" size={19} color={colors.blue} />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Meta semanal</Text>

              <Text style={styles.sectionSubtitle}>
                Quantos conteúdos você quer publicar por semana.
              </Text>
            </View>
          </View>

          <View style={styles.frequencyGrid}>
            {frequencies.map((item) => {
              const selected = postsPerWeek === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.frequency,

                    selected && styles.frequencySelected,
                  ]}
                  onPress={() => setPostsPerWeek(item.value)}
                >
                  <Text
                    style={[
                      styles.frequencyText,

                      selected && styles.frequencyTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.sectionIcon,
                {
                  backgroundColor: colors.lavenderLight,
                },
              ]}
            >
              <Ionicons name="apps-outline" size={19} color={colors.lavender} />
            </View>

            <View>
              <Text style={styles.sectionTitle}>Formatos preferidos</Text>

              <Text style={styles.sectionSubtitle}>
                Selecione todos que fazem parte da sua rotina.
              </Text>
            </View>
          </View>

          <View style={styles.formatGrid}>
            {formats.map((item) => {
              const selected = selectedFormats.includes(item.value);

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.formatCard,

                    selected && {
                      backgroundColor: item.background,

                      borderColor: item.foreground,
                    },
                  ]}
                  onPress={() => toggleFormat(item.value)}
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
                    <Ionicons
                      name={item.icon}
                      size={21}
                      color={item.foreground}
                    />
                  </View>

                  <Text style={styles.formatText}>{item.value}</Text>

                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={19}
                      color={item.foreground}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="sparkles-outline"
            size={20}
            color={colors.terracotta}
          />

          <Text style={styles.infoText}>
            Essas preferências serão usadas pelo ContentFlow para personalizar
            planejamento e criação de conteúdo.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, !canSave() && styles.saveButtonDisabled]}
          disabled={!canSave() || saving}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Ionicons
            name="checkmark"
            size={19}
            color={canSave() ? colors.surface : colors.textMuted}
          />

          <Text
            style={[styles.saveText, !canSave() && styles.saveTextDisabled]}
          >
            {saving ? "Salvando..." : "Salvar preferências"}
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

  headerSpace: {
    width: 40,
  },

  headerTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  profileHero: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.primaryDark,

    borderRadius: radius.xl,

    padding: spacing.lg,

    marginTop: spacing.md,

    marginBottom: spacing.xl,
  },

  avatar: {
    width: 58,
    height: 58,

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  heroContent: {
    flex: 1,
  },

  heroTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.surface,
  },

  heroSubtitle: {
    marginTop: 4,

    fontSize: typography.caption,

    lineHeight: 18,

    color: "#D7E3DE",
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    marginBottom: spacing.md,
  },

  sectionIcon: {
    width: 40,
    height: 40,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.sm,
  },

  sectionTitle: {
    fontSize: typography.subheading,

    fontWeight: "700",

    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,

    maxWidth: 285,

    fontSize: typography.tiny,

    lineHeight: 15,

    color: colors.textSecondary,
  },

  input: {
    height: 54,

    paddingHorizontal: spacing.md,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: 16,

    color: colors.text,
  },

  objectiveList: {
    gap: spacing.sm,
  },

  objectiveCard: {
    minHeight: 62,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: spacing.md,

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
    width: 38,
    height: 38,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  objectiveText: {
    flex: 1,

    fontSize: typography.body,

    fontWeight: "600",

    color: colors.text,
  },

  radio: {
    width: 20,
    height: 20,

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
    width: 10,
    height: 10,

    borderRadius: radius.round,

    backgroundColor: colors.primary,
  },

  frequencyGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: spacing.sm,
  },

  frequency: {
    minWidth: "47%",

    flexGrow: 1,

    height: 52,

    borderRadius: radius.md,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  frequencySelected: {
    backgroundColor: colors.blue,

    borderColor: colors.blue,
  },

  frequencyText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  frequencyTextSelected: {
    color: colors.surface,
  },

  formatGrid: {
    gap: spacing.sm,
  },

  formatCard: {
    minHeight: 60,

    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: spacing.md,

    borderRadius: radius.lg,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  formatIcon: {
    width: 38,
    height: 38,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  formatText: {
    flex: 1,

    fontSize: typography.body,

    fontWeight: "600",

    color: colors.text,
  },

  infoCard: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    padding: spacing.md,

    marginBottom: spacing.lg,

    borderRadius: radius.lg,

    backgroundColor: colors.terracottaLight,
  },

  infoText: {
    flex: 1,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  saveButton: {
    height: 54,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    borderRadius: radius.md,

    backgroundColor: colors.primary,
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  saveTextDisabled: {
    color: colors.textMuted,
  },

  center: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    padding: spacing.lg,

    gap: spacing.md,
  },

  loadingText: {
    color: colors.textSecondary,
  },

  errorTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  errorText: {
    textAlign: "center",

    color: colors.textSecondary,
  },

  onboardingButton: {
    minHeight: 48,

    paddingHorizontal: spacing.lg,

    borderRadius: radius.md,

    backgroundColor: colors.primary,

    alignItems: "center",

    justifyContent: "center",
  },

  onboardingButtonText: {
    color: colors.surface,

    fontWeight: "700",
  },
});
