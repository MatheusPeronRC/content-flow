import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Image,
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

import { colors, radius, spacing } from "../constants/theme";

const objectives: Array<{
  value: CreatorObjective;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
}> = [
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
    title: "Vender mais",
    icon: "bag-outline",
    background: colors.sageLight,
    foreground: colors.sage,
  },
];

const frequencies = [
  {
    value: 2,
    label: "2 por semana",
    shortLabel: "2 / semana",
  },
  {
    value: 3,
    label: "3 por semana",
    shortLabel: "3 / semana",
  },
  {
    value: 5,
    label: "5 por semana",
    shortLabel: "5 / semana",
  },
  {
    value: 7,
    label: "Todos os dias",
    shortLabel: "Todos os dias",
  },
];

const formats: Array<{
  value: ContentFormat;
  icon: keyof typeof Ionicons.glyphMap;
  background: string;
  foreground: string;
}> = [
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
  const [avatarUri, setAvatarUri] = useState<string | null>(null);

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
          setAvatarUri(data.avatarUri ?? null);
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

  const formIsValid =
    profession.trim().length >= 2 &&
    objective !== null &&
    postsPerWeek !== null &&
    selectedFormats.length > 0;

  const hasChanges = useMemo(() => {
    if (!profile) {
      return false;
    }

    const currentFormats = [...selectedFormats].sort();
    const savedFormats = [...profile.formats].sort();

    return (
      profession.trim() !== profile.profession ||
      objective !== profile.objective ||
      postsPerWeek !== profile.postsPerWeek ||
      avatarUri !== (profile.avatarUri ?? null) ||
      currentFormats.length !== savedFormats.length ||
      currentFormats.some((item, index) => item !== savedFormats[index])
    );
  }, [
    profile,
    profession,
    objective,
    postsPerWeek,
    selectedFormats,
    avatarUri,
  ]);

  const canSave = formIsValid && hasChanges && !saving;

  const selectedObjective = objectives.find((item) => item.value === objective);

  const selectedFrequency = frequencies.find(
    (item) => item.value === postsPerWeek,
  );

  const formatsSummary =
    selectedFormats.length > 0
      ? selectedFormats.join(" • ")
      : "Nenhum formato selecionado";

  function toggleFormat(format: ContentFormat) {
    setSelectedFormats((current) => {
      if (current.includes(format)) {
        return current.filter((item) => item !== format);
      }

      return [...current, format];
    });
  }

  async function handlePickAvatar() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permissão necessária",
          "Permita o acesso às suas fotos para escolher uma imagem de perfil.",
        );

        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      setAvatarUri(result.assets[0].uri);
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);

      Alert.alert("Não foi possível abrir suas fotos", "Tente novamente.");
    }
  }

  function handleAvatarPress() {
    if (!avatarUri) {
      handlePickAvatar();
      return;
    }

    Alert.alert("Foto do perfil", "O que você deseja fazer?", [
      {
        text: "Trocar foto",
        onPress: handlePickAvatar,
      },
      {
        text: "Remover foto",
        style: "destructive",
        onPress: () => setAvatarUri(null),
      },
      {
        text: "Cancelar",
        style: "cancel",
      },
    ]);
  }

  async function handleSave() {
    if (!formIsValid || !objective || !postsPerWeek || saving || !hasChanges) {
      return;
    }

    try {
      setSaving(true);

      await updateCreatorProfile({
        profession: profession.trim(),
        objective,
        postsPerWeek,
        formats: selectedFormats,
        avatarUri,
      });

      const updated = await getCreatorProfile();

      if (updated) {
        setProfile(updated);
        setProfession(updated.profession);
        setObjective(updated.objective);
        setPostsPerWeek(updated.postsPerWeek);
        setSelectedFormats(updated.formats);
        setAvatarUri(updated.avatarUri ?? null);
      }

      Alert.alert("Perfil atualizado", "Suas preferências foram salvas.");
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
          <View style={styles.emptyIcon}>
            <Ionicons
              name="person-outline"
              size={24}
              color={colors.terracotta}
            />
          </View>

          <Text style={styles.errorTitle}>Perfil não encontrado</Text>

          <Text style={styles.errorText}>
            Conclua o onboarding para criar suas preferências.
          </Text>

          <TouchableOpacity
            style={styles.onboardingButton}
            activeOpacity={0.86}
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
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Meu perfil</Text>

          <TouchableOpacity
            style={[
              styles.headerSaveButton,
              !canSave && styles.headerSaveButtonDisabled,
            ]}
            activeOpacity={0.8}
            disabled={!canSave}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.terracotta} />
            ) : (
              <Text
                style={[
                  styles.headerSaveText,
                  !canSave && styles.headerSaveTextDisabled,
                ]}
              >
                Salvar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileHeader}>
          <TouchableOpacity
            style={styles.avatarWrap}
            activeOpacity={0.85}
            onPress={handleAvatarPress}
          >
            <View style={styles.avatar}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={35}
                  color={colors.terracotta}
                />
              )}
            </View>

            <View style={styles.avatarAction}>
              <Ionicons
                name="camera-outline"
                size={16}
                color={colors.surface}
              />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileLabel}>SEU PERFIL</Text>

          <Text style={styles.profileProfession}>
            {profession.trim() || "Seu perfil"}
          </Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons
                name="flag-outline"
                size={14}
                color={colors.terracotta}
              />

              <Text style={styles.summaryText}>
                {selectedObjective?.title ?? "Defina seu objetivo"}
              </Text>
            </View>

            <View style={styles.summaryDot} />

            <View style={styles.summaryItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.textSecondary}
              />

              <Text style={styles.summaryText}>
                {selectedFrequency?.shortLabel ?? "Defina sua meta"}
              </Text>
            </View>
          </View>

          <Text style={styles.formatsSummary}>{formatsSummary}</Text>
        </View>

        <View style={styles.headerDivider} />

        <View style={styles.preferencesIntro}>
          <Text style={styles.preferencesTitle}>Preferências</Text>

          <Text style={styles.preferencesDescription}>
            Ajuste como o ContentFlow entende sua rotina de criação.
          </Text>
        </View>

        <View style={styles.settingsCard}>
          <View style={styles.settingSection}>
            <SectionHeader
              icon="briefcase-outline"
              iconBackground={colors.terracottaLight}
              iconColor={colors.terracotta}
              title="Profissão ou nicho"
              subtitle="Como você se apresenta profissionalmente."
            />

            <TextInput
              value={profession}
              onChangeText={setProfession}
              placeholder="Ex.: Nutricionista"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              autoCapitalize="sentences"
              returnKeyType="done"
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingSection}>
            <SectionHeader
              icon="flag-outline"
              iconBackground={colors.amberLight}
              iconColor={colors.amber}
              title="Objetivo principal"
              subtitle="O que seu conteúdo precisa ajudar a conquistar."
            />

            <View style={styles.objectiveList}>
              {objectives.map((item) => {
                const selected = objective === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.objectiveOption,
                      selected && styles.optionSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => setObjective(item.value)}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        {
                          backgroundColor: item.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.icon}
                        size={19}
                        color={item.foreground}
                      />
                    </View>

                    <Text style={styles.optionText}>{item.title}</Text>

                    <View
                      style={[
                        styles.selectionCircle,
                        selected && styles.selectionCircleSelected,
                      ]}
                    >
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.surface}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.settingSection}>
            <SectionHeader
              icon="calendar-outline"
              iconBackground={colors.blueLight}
              iconColor={colors.blue}
              title="Meta semanal"
              subtitle="Quantos conteúdos você quer publicar por semana."
            />

            <View style={styles.frequencyGrid}>
              {frequencies.map((item) => {
                const selected = postsPerWeek === item.value;

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.frequencyOption,
                      selected && styles.frequencyOptionSelected,
                    ]}
                    activeOpacity={0.82}
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

          <View style={styles.divider} />

          <View style={styles.settingSection}>
            <SectionHeader
              icon="apps-outline"
              iconBackground={colors.lavenderLight}
              iconColor={colors.lavender}
              title="Formatos preferidos"
              subtitle="Selecione todos que fazem parte da sua rotina."
            />

            <View style={styles.formatGrid}>
              {formats.map((item) => {
                const selected = selectedFormats.includes(item.value);

                return (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.formatOption,
                      selected && styles.optionSelected,
                    ]}
                    activeOpacity={0.82}
                    onPress={() => toggleFormat(item.value)}
                  >
                    <View
                      style={[
                        styles.formatIcon,
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

                    <Text style={styles.formatText}>{item.value}</Text>

                    <View
                      style={[
                        styles.selectionCircle,
                        selected && styles.selectionCircleSelected,
                      ]}
                    >
                      {selected ? (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color={colors.surface}
                        />
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        <Text style={styles.footerHint}>
          As mudanças só são aplicadas quando você toca em Salvar.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

type SectionHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  title: string;
  subtitle: string;
};

function SectionHeader({
  icon,
  iconBackground,
  iconColor,
  title,
  subtitle,
}: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[
          styles.sectionIcon,
          {
            backgroundColor: iconBackground,
          },
        ]}
      >
        <Ionicons name={icon} size={19} color={iconColor} />
      </View>

      <View style={styles.sectionHeaderText}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 42,
  },

  header: {
    height: 68,
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
    fontWeight: "700",
    color: colors.text,
  },

  headerSaveButton: {
    minWidth: 58,
    height: 42,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSaveButtonDisabled: {
    opacity: 0.72,
  },

  headerSaveText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.terracotta,
  },

  headerSaveTextDisabled: {
    color: colors.textMuted,
  },

  profileHeader: {
    paddingTop: 16,
    paddingBottom: 25,
    alignItems: "center",
  },

  avatarWrap: {
    width: 92,
    height: 92,
    marginBottom: 15,
    position: "relative",
  },

  avatar: {
    width: 92,
    height: 92,
    overflow: "hidden",
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarAction: {
    position: "absolute",
    right: 0,
    bottom: 1,
    width: 31,
    height: 31,
    borderRadius: radius.round,
    backgroundColor: colors.terracotta,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  profileLabel: {
    marginBottom: 4,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: "700",
    color: colors.terracotta,
  },

  profileProfession: {
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.55,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },

  summaryRow: {
    maxWidth: 330,
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    rowGap: 6,
  },

  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  summaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  summaryDot: {
    width: 4,
    height: 4,
    marginHorizontal: 10,
    borderRadius: radius.round,
    backgroundColor: colors.textMuted,
  },

  formatsSummary: {
    maxWidth: 320,
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    color: colors.textMuted,
  },

  headerDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  preferencesIntro: {
    paddingTop: 23,
    paddingBottom: 14,
  },

  preferencesTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },

  preferencesDescription: {
    maxWidth: 340,
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  settingsCard: {
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  settingSection: {
    padding: 17,
  },

  divider: {
    height: 1,
    marginHorizontal: 17,
    backgroundColor: colors.border,
  },

  sectionHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  sectionIcon: {
    width: 40,
    height: 40,
    marginRight: 11,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  sectionHeaderText: {
    flex: 1,
    minWidth: 0,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 2,
    paddingRight: 4,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },

  input: {
    minHeight: 54,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    lineHeight: 22,
    color: colors.text,
  },

  objectiveList: {
    gap: 8,
  },

  objectiveOption: {
    minHeight: 58,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  optionSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.surface,
  },

  optionIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  optionText: {
    flex: 1,
    minWidth: 0,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.text,
  },

  selectionCircle: {
    width: 24,
    height: 24,
    marginLeft: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  selectionCircleSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  frequencyOption: {
    minWidth: "47%",
    minHeight: 50,
    flexGrow: 1,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  frequencyOptionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  frequencyText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.textSecondary,
    textAlign: "center",
  },

  frequencyTextSelected: {
    color: colors.terracotta,
  },

  formatGrid: {
    gap: 8,
  },

  formatOption: {
    minHeight: 58,
    paddingHorizontal: 11,
    borderRadius: 15,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  formatIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  formatText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: colors.text,
  },

  footerHint: {
    marginTop: 16,
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
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
    color: colors.textSecondary,
  },

  emptyIcon: {
    width: 54,
    height: 54,
    marginBottom: 16,
    borderRadius: 17,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    color: colors.text,
  },

  errorText: {
    maxWidth: 290,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    color: colors.textSecondary,
  },

  onboardingButton: {
    minHeight: 50,
    marginTop: 20,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },

  onboardingButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface,
  },
});
