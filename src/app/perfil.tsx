import { Ionicons } from "@expo/vector-icons";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
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
  updateCreatorProfile,
} from "../services/profileStorage";

import { deleteAvatar, uploadAvatar } from "../services/avatarStorage";

import {
  ContentFormat,
  CreatorObjective,
  CreatorProfile,
} from "../types/creatorProfile";

import { useAuth } from "../contexts/AuthContext";

import { colors, fonts, radius, shadows, spacing } from "../constants/theme";

const objectives: Array<{
  value: CreatorObjective;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    value: "clientes",
    title: "Atrair clientes",
    icon: "people-outline",
  },
  {
    value: "autoridade",
    title: "Construir autoridade",
    icon: "ribbon-outline",
  },
  {
    value: "audiencia",
    title: "Crescer audiência",
    icon: "trending-up-outline",
  },
  {
    value: "vendas",
    title: "Vender mais",
    icon: "bag-outline",
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
}> = [
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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [fullName, setFullName] = useState("");
  const [profession, setProfession] = useState("");
  const [objective, setObjective] = useState<CreatorObjective | null>(null);
  const [postsPerWeek, setPostsPerWeek] = useState<number | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [pendingAvatarBase64, setPendingAvatarBase64] = useState<string | null>(
    null,
  );
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

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
          setFullName(data.fullName ?? "");
          setProfession(data.profession);
          setObjective(data.objective);
          setPostsPerWeek(data.postsPerWeek);
          setSelectedFormats(data.formats);
          setAvatarUri(data.avatarUri ?? null);
          setPendingAvatarBase64(null);
        } catch (error) {
          console.error("Erro ao carregar perfil:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void loadProfile();

      return () => {
        active = false;
      };
    }, []),
  );

  const formIsValid =
    fullName.trim().length >= 2 &&
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
      fullName.trim() !== (profile.fullName ?? "") ||
      profession.trim() !== profile.profession ||
      objective !== profile.objective ||
      postsPerWeek !== profile.postsPerWeek ||
      avatarUri !== (profile.avatarUri ?? null) ||
      currentFormats.length !== savedFormats.length ||
      currentFormats.some((item, index) => item !== savedFormats[index])
    );
  }, [
    profile,
    fullName,
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
        quality: 0.9,
      });

      if (result.canceled || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      const manipulation = ImageManipulator.manipulate(asset.uri);

      manipulation.resize({
        width: 512,
        height: 512,
      });

      const renderedImage = await manipulation.renderAsync();

      const processedImage = await renderedImage.saveAsync({
        base64: true,
        compress: 0.82,
        format: SaveFormat.JPEG,
      });

      if (!processedImage.base64) {
        throw new Error("Não foi possível preparar a imagem para envio.");
      }

      setAvatarUri(processedImage.uri);
      setPendingAvatarBase64(processedImage.base64);
    } catch (error) {
      console.error("Erro ao selecionar foto:", error);

      Alert.alert(
        "Não foi possível preparar sua foto",
        "Escolha outra imagem e tente novamente.",
      );
    }
  }

  function handleAvatarPress() {
    if (!avatarUri) {
      void handlePickAvatar();
      return;
    }

    setAvatarModalVisible(true);
  }

  function handleRemoveAvatar() {
    setAvatarUri(null);
    setPendingAvatarBase64(null);
    setAvatarModalVisible(false);
  }

  function handleChangeAvatar() {
    setAvatarModalVisible(false);
    void handlePickAvatar();
  }

  async function handleSave() {
    if (!formIsValid || !objective || !postsPerWeek || saving || !hasChanges) {
      return;
    }

    try {
      setSaving(true);

      const previousAvatarUrl = profile?.avatarUri ?? null;
      const removingAvatar =
        avatarUri === null &&
        previousAvatarUrl !== null &&
        pendingAvatarBase64 === null;

      let savedAvatarUrl = avatarUri;

      if (pendingAvatarBase64) {
        savedAvatarUrl = await uploadAvatar(pendingAvatarBase64);
      } else if (removingAvatar) {
        savedAvatarUrl = null;
      }

      await updateCreatorProfile({
        fullName: fullName.trim(),
        profession: profession.trim(),
        objective,
        postsPerWeek,
        formats: selectedFormats,
        avatarUri: savedAvatarUrl,
      });

      if (removingAvatar) {
        try {
          await deleteAvatar();
        } catch (error) {
          console.warn(
            "Perfil salvo, mas não foi possível remover o arquivo antigo:",
            error,
          );
        }
      }

      const updated = await getCreatorProfile();

      if (updated) {
        setProfile(updated);
        setFullName(updated.fullName ?? "");
        setProfession(updated.profession);
        setObjective(updated.objective);
        setPostsPerWeek(updated.postsPerWeek);
        setSelectedFormats(updated.formats);
        setAvatarUri(updated.avatarUri ?? null);
        setPendingAvatarBase64(null);
      }

      Alert.alert("Perfil atualizado", "Suas preferências foram salvas.");
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  async function performSignOut() {
    if (signingOut) {
      return;
    }

    try {
      setSigningOut(true);
      await signOut();
    } catch (error) {
      console.error("Erro ao sair da conta:", error);

      if (Platform.OS === "web") {
        window.alert("Não foi possível sair da conta. Tente novamente.");
      } else {
        Alert.alert("Não foi possível sair", "Tente novamente.");
      }
    } finally {
      setSigningOut(false);
    }
  }

  function handleSignOut() {
    const message = hasChanges
      ? "Você tem alterações não salvas. Elas serão descartadas se sair agora."
      : "Você precisará entrar novamente para acessar o ContentFlow.";

    if (Platform.OS === "web") {
      const confirmed = window.confirm(`Sair da conta?\n\n${message}`);

      if (confirmed) {
        void performSignOut();
      }

      return;
    }

    Alert.alert("Sair da conta?", message, [
      {
        text: "Cancelar",
        style: "cancel",
      },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          void performSignOut();
        },
      },
    ]);
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
            style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
            activeOpacity={0.84}
            disabled={!canSave}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text
                style={[
                  styles.saveButtonText,
                  !canSave && styles.saveButtonTextDisabled,
                ]}
              >
                Salvar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
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
                  size={34}
                  color={colors.terracotta}
                />
              )}
            </View>

            <View style={styles.avatarAction}>
              <Ionicons
                name="camera-outline"
                size={15}
                color={colors.surface}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.profileMain}>
            <Text style={styles.profileName}>
              {fullName.trim() || "Seu nome"}
            </Text>

            <Text style={styles.profileProfession} numberOfLines={1}>
              {profession.trim() || "Seu perfil profissional"}
            </Text>

            <Text style={styles.profileEmail} numberOfLines={1}>
              {user?.email ?? "E-mail não disponível"}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAvatarPress}
              style={styles.editPhotoButton}
            >
              <Text style={styles.editPhotoText}>Editar foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconBlue}>
              <Ionicons name="flag-outline" size={19} color={colors.blue} />
            </View>

            <Text style={styles.summaryLabel}>OBJETIVO</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {selectedObjective?.title ?? "Defina seu objetivo"}
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryIconNeutral}>
              <Ionicons
                name="calendar-outline"
                size={19}
                color={colors.textSecondary}
              />
            </View>

            <Text style={styles.summaryLabel}>META SEMANAL</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {selectedFrequency?.shortLabel ?? "Defina sua meta"}
            </Text>
          </View>
        </View>

        <View style={styles.sectionIntro}>
          <Text style={styles.sectionTitle}>Preferências</Text>
          <Text style={styles.sectionDescription}>
            Ajuste como o ContentFlow entende sua rotina de criação.
          </Text>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIcon}>
              <Ionicons name="person-outline" size={19} color={colors.text} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Identidade profissional</Text>
              <Text style={styles.settingSubtitle}>
                Seu nome e como você se apresenta no ContentFlow.
              </Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>NOME</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Ex.: Mariana Silva"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />

          <Text style={styles.inputLabelSpaced}>PROFISSÃO OU NICHO</Text>
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

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIcon}>
              <Ionicons name="flag-outline" size={19} color={colors.text} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Objetivo principal</Text>
              <Text style={styles.settingSubtitle}>
                O que seu conteúdo precisa ajudar a conquistar.
              </Text>
            </View>
          </View>

          <View style={styles.choiceGrid}>
            {objectives.map((item) => {
              const selected = objective === item.value;

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.choiceCard,
                    selected && styles.choiceCardSelected,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => setObjective(item.value)}
                >
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={selected ? colors.terracotta : colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.choiceText,
                      selected && styles.choiceTextSelected,
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  {selected ? (
                    <Ionicons
                      name="checkmark-circle"
                      size={18}
                      color={colors.terracotta}
                    />
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIcon}>
              <Ionicons name="calendar-outline" size={19} color={colors.text} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Meta semanal</Text>
              <Text style={styles.settingSubtitle}>
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

        <View style={styles.settingCard}>
          <View style={styles.settingHeader}>
            <View style={styles.settingIcon}>
              <Ionicons name="apps-outline" size={19} color={colors.text} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Formatos preferidos</Text>
              <Text style={styles.settingSubtitle}>
                Selecione os formatos que fazem parte da sua rotina.
              </Text>
            </View>
          </View>

          <View style={styles.formatWrap}>
            {formats.map((item) => {
              const selected = selectedFormats.includes(item.value);

              return (
                <TouchableOpacity
                  key={item.value}
                  style={[
                    styles.formatChip,
                    selected && styles.formatChipSelected,
                  ]}
                  activeOpacity={0.82}
                  onPress={() => toggleFormat(item.value)}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={selected ? colors.terracotta : colors.textSecondary}
                  />

                  <Text
                    style={[
                      styles.formatChipText,
                      selected && styles.formatChipTextSelected,
                    ]}
                  >
                    {item.value}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Conta</Text>

          <View style={styles.accountCard}>
            <View style={styles.accountRow}>
              <View style={styles.accountIcon}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={colors.textSecondary}
                />
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.accountLabel}>E-MAIL</Text>
                <Text style={styles.accountEmail} numberOfLines={1}>
                  {user?.email ?? "E-mail não disponível"}
                </Text>
              </View>
            </View>

            <View style={styles.accountDivider} />

            <TouchableOpacity
              style={styles.signOutButton}
              activeOpacity={0.8}
              disabled={signingOut}
              onPress={handleSignOut}
            >
              {signingOut ? (
                <ActivityIndicator size="small" color={colors.terracotta} />
              ) : (
                <Ionicons
                  name="log-out-outline"
                  size={19}
                  color={colors.terracotta}
                />
              )}

              <Text style={styles.signOutText}>
                {signingOut ? "Saindo..." : "Sair da conta"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footerHint}>
          As mudanças só são aplicadas quando você toca em Salvar.
        </Text>
      </ScrollView>

      <Modal
        visible={avatarModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarModalVisible(false)}
      >
        <View style={styles.avatarModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setAvatarModalVisible(false)}
          />

          <View style={styles.avatarModalCard}>
            <View style={styles.avatarModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarModalTitle}>Foto do perfil</Text>
                <Text style={styles.avatarModalSubtitle}>
                  Confira como sua foto está aparecendo.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.avatarModalClose}
                activeOpacity={0.8}
                onPress={() => setAvatarModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.avatarPreviewWrap}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.avatarPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="person-outline"
                  size={54}
                  color={colors.terracotta}
                />
              )}
            </View>

            <TouchableOpacity
              style={styles.avatarPrimaryAction}
              activeOpacity={0.85}
              onPress={handleChangeAvatar}
            >
              <Ionicons
                name="camera-outline"
                size={18}
                color={colors.surface}
              />
              <Text style={styles.avatarPrimaryActionText}>Trocar foto</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarRemoveAction}
              activeOpacity={0.82}
              onPress={handleRemoveAvatar}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
              <Text style={styles.avatarRemoveActionText}>Remover foto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 44,
  },

  header: {
    minHeight: 68,
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
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  saveButton: {
    minWidth: 70,
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },

  profileCard: {
    marginTop: 12,
    padding: 16,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.card,
  },

  avatarWrap: {
    width: 82,
    height: 82,
    position: "relative",
  },

  avatar: {
    width: 82,
    height: 82,
    overflow: "hidden",
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    borderWidth: 3,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
  },

  avatarAction: {
    position: "absolute",
    right: -1,
    bottom: 1,
    width: 29,
    height: 29,
    borderRadius: radius.round,
    backgroundColor: colors.terracotta,
    borderWidth: 3,
    borderColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  profileMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 14,
  },

  profileName: {
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  profileProfession: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  profileEmail: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  editPhotoButton: {
    alignSelf: "flex-start",
    minHeight: 31,
    marginTop: 10,
    paddingHorizontal: 11,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  editPhotoText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  summaryGrid: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
  },

  summaryCard: {
    flex: 1,
    minHeight: 120,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  summaryIconBlue: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.blueLight,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryIconNeutral: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryLabel: {
    marginTop: 13,
    fontSize: 10,
    letterSpacing: 0.65,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  sectionIntro: {
    marginTop: 30,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionDescription: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  settingCard: {
    marginBottom: 10,
    padding: 16,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  settingHeader: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  settingIcon: {
    width: 40,
    height: 40,
    marginRight: 11,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  settingTitle: {
    fontSize: 16,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  settingSubtitle: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  inputLabel: {
    marginBottom: 7,
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  inputLabelSpaced: {
    marginTop: 14,
    marginBottom: 7,
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  input: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    lineHeight: 21,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  choiceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  choiceCard: {
    width: "48%",
    minHeight: 74,
    padding: 11,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "space-between",
  },

  choiceCardSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  choiceText: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  choiceTextSelected: {
    color: colors.terracotta,
  },

  frequencyGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  frequencyOption: {
    width: "48%",
    minHeight: 46,
    borderRadius: 13,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },

  frequencyOptionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  frequencyText: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },

  frequencyTextSelected: {
    color: colors.terracotta,
  },

  formatWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  formatChip: {
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  formatChipSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  formatChipText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  formatChipTextSelected: {
    color: colors.terracotta,
  },

  accountSection: {
    marginTop: 20,
  },

  accountCard: {
    marginTop: 11,
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  accountRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  accountIcon: {
    width: 38,
    height: 38,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  accountLabel: {
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  accountEmail: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  accountDivider: {
    height: 1,
    marginHorizontal: 14,
    backgroundColor: colors.border,
  },

  signOutButton: {
    minHeight: 54,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  signOutText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  footerHint: {
    marginTop: 16,
    paddingHorizontal: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    textAlign: "center",
    color: colors.textMuted,
  },

  avatarModalBackdrop: {
    flex: 1,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.overlay,
  },

  avatarModalCard: {
    width: "100%",
    maxWidth: 390,
    padding: 18,
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  avatarModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  avatarModalTitle: {
    fontSize: 21,
    lineHeight: 27,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  avatarModalSubtitle: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  avatarModalClose: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPreviewWrap: {
    width: 220,
    height: 220,
    marginTop: 22,
    marginBottom: 20,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    borderWidth: 4,
    borderColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarPreviewImage: {
    width: "100%",
    height: "100%",
  },

  avatarPrimaryAction: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  avatarPrimaryActionText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  avatarRemoveAction: {
    minHeight: 48,
    marginTop: 8,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  avatarRemoveActionText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.danger,
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
    fontFamily: fonts.bold,
    color: colors.text,
  },

  errorText: {
    maxWidth: 290,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.regular,
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
    fontFamily: fonts.bold,
    color: colors.surface,
  },
});
