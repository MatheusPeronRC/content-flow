import { Ionicons } from "@expo/vector-icons";
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
} from "expo-router";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../../components/InspirationThumbnail";
import PlatformIcon, {
  getPlatformMeta,
} from "../../../components/PlatformIcon";

import {
  ProductionEffortBadge,
  ProductionEffortSelector,
} from "../../../components/ProductionEffortSelector";

import {
  deleteInspiration,
  getInspirationById,
  updateInspiration,
} from "../../../services/inspirationStorage";

import {
  getMediaMetadata,
  normalizeMediaUrl,
} from "../../../services/mediaMetadataService";

import { Inspiration } from "../../../types/inspiration";
import { ProductionEffort } from "../../../types/productionEffort";

import {
  colors,
  fonts,
  radius,
  shadows,
  spacing,
} from "../../../constants/theme";

const categories = ["Hook", "Tema", "Edição", "Formato", "Roteiro", "CTA"];

export default function InspirationDetailsScreen() {
  const params = useLocalSearchParams();
  const navigation = useNavigation();

  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [inspiration, setInspiration] = useState<Inspiration | null>(null);

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [productionEffort, setProductionEffort] =
    useState<ProductionEffort | null>(null);

  useEffect(() => {
    navigation.setOptions({
      tabBarStyle: editing ? { display: "none" } : undefined,
    } as any);

    return () => {
      navigation.setOptions({
        tabBarStyle: undefined,
      } as any);
    };
  }, [editing, navigation]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setEditing(false);
      setMenuVisible(false);

      async function load() {
        if (!id) {
          if (active) {
            setLoading(false);
          }

          return;
        }

        try {
          const data = await getInspirationById(id);

          if (!active) {
            return;
          }

          if (!data) {
            setInspiration(null);
            return;
          }

          setInspiration(data);
          setUrl(data.url);
          setCategory(data.category);
          setNote(data.note);
          setProductionEffort(data.productionEffort ?? null);
        } catch (error) {
          console.error("Erro ao carregar inspiração:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, [id]),
  );

  const sourceAccent = useMemo(
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
        Alert.alert(
          "Não foi possível abrir",
          "Confira se o link da referência está correto.",
        );

        return;
      }

      await Linking.openURL(inspiration.url);
    } catch {
      Alert.alert(
        "Erro ao abrir link",
        "Não foi possível abrir essa referência.",
      );
    }
  }

  async function handleSave() {
    if (!inspiration || !url.trim() || saving) {
      return;
    }

    try {
      setSaving(true);

      const normalizedUrl = normalizeMediaUrl(url);
      const metadata = await getMediaMetadata(normalizedUrl);

      const updates = {
        url: normalizedUrl,
        source: metadata.source,
        category,
        note: note.trim(),
        productionEffort,
        thumbnailUrl: metadata.thumbnailUrl,
        mediaTitle: metadata.mediaTitle,
        authorName: metadata.authorName,
        metadataUpdatedAt: metadata.metadataUpdatedAt,
      };

      await updateInspiration(inspiration.id, updates);

      setInspiration({
        ...inspiration,
        ...updates,
      });

      setUrl(normalizedUrl);
      setEditing(false);
    } catch (error) {
      console.error("Erro ao salvar inspiração:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    if (!inspiration) {
      return;
    }

    setUrl(inspiration.url);
    setCategory(inspiration.category);
    setNote(inspiration.note);
    setProductionEffort(inspiration.productionEffort ?? null);
    setEditing(false);
  }

  function handleDelete() {
    if (!inspiration) {
      return;
    }

    Alert.alert(
      "Excluir inspiração?",
      "Essa referência será removida da sua biblioteca.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteInspiration(inspiration.id);
              router.back();
            } catch (error) {
              console.error("Erro ao excluir inspiração:", error);

              Alert.alert("Não foi possível excluir", "Tente novamente.");
            }
          },
        },
      ],
    );
  }

  function handleCreateVersion() {
    if (!inspiration) {
      return;
    }

    router.push({
      pathname: "/conteudo/adaptar",
      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.terracotta} />
          <Text style={styles.loadingText}>Abrindo inspiração...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!inspiration) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorIcon}>
            <Ionicons
              name="bookmark-outline"
              size={24}
              color={colors.textSecondary}
            />
          </View>

          <Text style={styles.errorTitle}>Inspiração não encontrada</Text>

          <TouchableOpacity
            style={styles.errorButton}
            activeOpacity={0.82}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayTitle =
    inspiration.mediaTitle?.trim() ||
    inspiration.note?.trim() ||
    `Referência do ${inspiration.source}`;

  if (editing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.editContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.editHeader}>
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.8}
              onPress={handleCancelEdit}
            >
              <Ionicons name="arrow-back" size={20} color={colors.text} />
            </TouchableOpacity>

            <Text style={styles.editHeaderTitle}>Editar inspiração</Text>

            <View style={styles.headerSpace} />
          </View>

          <View style={styles.editPreview}>
            <InspirationThumbnail
              thumbnailUrl={inspiration.thumbnailUrl}
              source={inspiration.source}
              variant="compact"
              style={styles.editPreviewThumbnail}
            />

            <View style={styles.editPreviewMain}>
              <Text style={styles.editPreviewLabel}>REFERÊNCIA ATUAL</Text>

              <Text style={styles.editPreviewTitle} numberOfLines={3}>
                {displayTitle}
              </Text>

              <Text style={styles.editPreviewHint}>
                Capa e informações podem ser atualizadas ao salvar.
              </Text>
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>LINK ORIGINAL</Text>

            <View style={styles.inputWrap}>
              <Ionicons
                name="link-outline"
                size={18}
                color={colors.textSecondary}
              />

              <TextInput
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                placeholder="https://..."
                placeholderTextColor={colors.textMuted}
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>ESFORÇO DE PRODUÇÃO</Text>

            <ProductionEffortSelector
              value={productionEffort}
              onChange={setProductionEffort}
              compact
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>CATEGORIA</Text>

            <View style={styles.categories}>
              {categories.map((item) => {
                const selected = category === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.categoryOption,
                      selected && styles.categoryOptionSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setCategory(selected ? null : item)}
                  >
                    <Text
                      style={[
                        styles.categoryOptionText,
                        selected && styles.categoryOptionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.noteLabelRow}>
              <Text style={styles.formLabel}>MINHA ANOTAÇÃO</Text>

              <Text style={styles.characterCount}>{note.length}/300</Text>
            </View>

            <TextInput
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={300}
              scrollEnabled={false}
              textAlignVertical="top"
              placeholder="Por que você salvou essa referência?"
              placeholderTextColor={colors.textMuted}
              style={styles.noteInput}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.saveEditButton,
              (!url.trim() || saving) && styles.saveEditButtonDisabled,
            ]}
            activeOpacity={0.86}
            disabled={!url.trim() || saving}
            onPress={handleSave}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="checkmark" size={18} color={colors.surface} />
            )}

            <Text style={styles.saveEditText}>
              {saving ? "Atualizando..." : "Salvar alterações"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={17} color={colors.danger} />

            <Text style={styles.deleteText}>Excluir inspiração</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              activeOpacity={0.8}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={colors.text}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <InspirationThumbnail
            thumbnailUrl={inspiration.thumbnailUrl}
            source={inspiration.source}
            variant="wide"
            style={styles.heroImage}
            showSourceBadge={false}
          />

          <View
            style={[
              styles.platformHeroBadge,
              {
                backgroundColor: sourceAccent.background,
              },
            ]}
          >
            <PlatformIcon source={inspiration.source} size={18} />
          </View>

          <TouchableOpacity
            style={styles.openOriginalButton}
            activeOpacity={0.86}
            onPress={handleOpenOriginal}
          >
            <Text style={styles.openOriginalText}>
              Ver no {inspiration.source}
            </Text>

            <Ionicons name="open-outline" size={14} color={colors.surface} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{displayTitle}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <PlatformIcon source={inspiration.source} size={13} />

            <Text style={styles.metaText}>{inspiration.source}</Text>
          </View>

          {inspiration.category ? (
            <View style={styles.metaPill}>
              <Text style={styles.metaText}>{inspiration.category}</Text>
            </View>
          ) : null}

          <ProductionEffortBadge effort={inspiration.productionEffort} />
        </View>

        <Text style={styles.savedDate}>
          Salva em {formatCreatedDate(inspiration.createdAt)}
        </Text>

        {inspiration.authorName ? (
          <View style={styles.authorRow}>
            <Ionicons
              name="person-outline"
              size={15}
              color={colors.textSecondary}
            />

            <Text style={styles.authorText}>{inspiration.authorName}</Text>
          </View>
        ) : null}

        <View style={styles.noteCard}>
          <View style={styles.noteHeader}>
            <View style={styles.noteIcon}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={17}
                color={colors.text}
              />
            </View>

            <Text style={styles.noteTitle}>Minha anotação</Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setEditing(true)}
            >
              <Ionicons
                name="chevron-forward"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <Text
            style={[styles.noteText, !inspiration.note && styles.noteTextEmpty]}
          >
            {inspiration.note || "Nenhuma anotação adicionada."}
          </Text>
        </View>

        <View style={styles.contextSection}>
          <Text style={styles.sectionTitle}>Sobre esta referência</Text>

          <View style={styles.contextList}>
            <ContextRow
              icon="bookmark-outline"
              label="Categoria"
              value={inspiration.category ?? "Não definida"}
            />

            <ContextRow
              icon="flash-outline"
              label="Esforço"
              value={getEffortLabel(inspiration.productionEffort)}
            />

            <ContextRow
              icon="link-outline"
              label="Origem"
              value={inspiration.source}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.secondaryAction}
            activeOpacity={0.84}
            onPress={() => setEditing(true)}
          >
            <Ionicons name="create-outline" size={18} color={colors.text} />

            <Text style={styles.secondaryActionText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryAction}
            activeOpacity={0.86}
            onPress={handleCreateVersion}
          >
            <Ionicons
              name="sparkles-outline"
              size={18}
              color={colors.surface}
            />

            <Text style={styles.primaryActionText}>
              Transformar em conteúdo
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.menuSheet}>
            <View style={styles.menuHandle} />

            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Mais opções</Text>

              <TouchableOpacity
                style={styles.menuClose}
                activeOpacity={0.8}
                onPress={() => setMenuVisible(false)}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.menuOption}
              activeOpacity={0.82}
              onPress={() => {
                setMenuVisible(false);

                setTimeout(() => {
                  setEditing(true);
                }, 120);
              }}
            >
              <View style={styles.menuOptionIcon}>
                <Ionicons name="create-outline" size={18} color={colors.text} />
              </View>

              <View style={styles.menuOptionTextWrap}>
                <Text style={styles.menuOptionTitle}>Editar inspiração</Text>

                <Text style={styles.menuOptionText}>
                  Alterar link, esforço, categoria ou anotação.
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={17}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuOption, styles.menuDeleteOption]}
              activeOpacity={0.82}
              onPress={() => {
                setMenuVisible(false);

                setTimeout(() => {
                  handleDelete();
                }, 120);
              }}
            >
              <View style={[styles.menuOptionIcon, styles.menuDeleteIcon]}>
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={colors.danger}
                />
              </View>

              <View style={styles.menuOptionTextWrap}>
                <Text style={styles.menuDeleteTitle}>Excluir inspiração</Text>

                <Text style={styles.menuOptionText}>
                  Remover esta referência da sua biblioteca.
                </Text>
              </View>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function ContextRow({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.contextRow}>
      <View style={styles.contextIcon}>
        <Ionicons name={icon} size={16} color={colors.textSecondary} />
      </View>

      <Text style={styles.contextLabel}>{label}</Text>

      <Text style={styles.contextValue}>{value}</Text>
    </View>
  );
}

function getEffortLabel(effort?: ProductionEffort | null) {
  switch (effort) {
    case "quick":
      return "Rápido";
    case "medium":
      return "Médio";
    case "demanding":
      return "Demorado";
    default:
      return "Não definido";
  }
}

function formatCreatedDate(isoDate: string) {
  return new Date(isoDate).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 140,
  },

  header: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerButton: {
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
    height: 40,
  },

  menuBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },

  menuSheet: {
    marginHorizontal: 10,
    marginBottom: 8,
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.elevated,
  },

  menuHandle: {
    width: 36,
    height: 4,
    marginBottom: 16,
    alignSelf: "center",
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },

  menuHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  menuClose: {
    width: 36,
    height: 36,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  menuOption: {
    minHeight: 70,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  menuDeleteOption: {
    marginTop: 8,
  },

  menuOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  menuDeleteIcon: {
    backgroundColor: "rgba(190, 70, 70, 0.08)",
  },

  menuOptionTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  menuOptionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  menuDeleteTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.danger,
  },

  menuOptionText: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  hero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 20,
    backgroundColor: colors.surface,
    ...shadows.card,
  },

  heroImage: {
    width: "100%",
    aspectRatio: 1.42,
    borderRadius: 20,
  },

  platformHeroBadge: {
    position: "absolute",
    left: 12,
    top: 12,
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },

  openOriginalButton: {
    position: "absolute",
    right: 12,
    bottom: 12,
    minHeight: 38,
    paddingHorizontal: 11,
    borderRadius: radius.round,
    backgroundColor: "rgba(28,25,23,0.80)",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  openOriginalText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },

  title: {
    marginTop: 17,
    fontSize: 25,
    lineHeight: 31,
    letterSpacing: -0.6,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  metaRow: {
    marginTop: 11,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 7,
  },

  metaPill: {
    minHeight: 28,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaText: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  savedDate: {
    marginTop: 11,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  authorRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  authorText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  noteCard: {
    marginTop: 20,
    padding: 15,
    borderRadius: 18,
    backgroundColor: colors.terracottaLight,
    borderWidth: 1,
    borderColor: "rgba(225,116,85,0.10)",
  },

  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  noteIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  noteTitle: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  noteText: {
    marginTop: 10,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  noteTextEmpty: {
    color: colors.textMuted,
  },

  contextSection: {
    marginTop: 26,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  contextList: {
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  contextRow: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  contextIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  contextLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  contextValue: {
    maxWidth: "48%",
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.text,
    textAlign: "right",
  },

  actions: {
    marginTop: 24,
    flexDirection: "row",
    gap: 9,
  },

  secondaryAction: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  secondaryActionText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  primaryAction: {
    flex: 1,
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  primaryActionText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  editContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 52,
  },

  editHeader: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  editHeaderTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editPreview: {
    padding: 11,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  editPreviewThumbnail: {
    width: 74,
    height: 86,
    borderRadius: 13,
  },

  editPreviewMain: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  editPreviewLabel: {
    fontSize: 9,
    letterSpacing: 0.65,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  editPreviewTitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editPreviewHint: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  formSection: {
    marginTop: 22,
  },

  formLabel: {
    marginBottom: 8,
    fontSize: 10,
    letterSpacing: 0.65,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },

  inputWrap: {
    minHeight: 52,
    paddingHorizontal: 13,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  input: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  categoryOption: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  categoryOptionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: colors.terracotta,
  },

  categoryOptionText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  categoryOptionTextSelected: {
    color: colors.terracotta,
  },

  noteLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  characterCount: {
    marginBottom: 8,
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  noteInput: {
    minHeight: 135,
    padding: 14,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  saveEditButton: {
    minHeight: 52,
    marginTop: 26,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  saveEditButtonDisabled: {
    opacity: 0.45,
  },

  saveEditText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  deleteButton: {
    minHeight: 48,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  deleteText: {
    fontSize: 11,
    fontFamily: fonts.medium,
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
    fontSize: 12,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  errorIcon: {
    width: 54,
    height: 54,
    marginBottom: 15,
    borderRadius: 17,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  errorButton: {
    minHeight: 43,
    marginTop: 17,
    paddingHorizontal: 16,
    borderRadius: 13,
    backgroundColor: colors.text,
    alignItems: "center",
    justifyContent: "center",
  },

  errorButtonText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
