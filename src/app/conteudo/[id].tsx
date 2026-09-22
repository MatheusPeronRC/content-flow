import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import { useCallback, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Linking,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import {
    deleteContent,
    getContentById,
    updateContent,
} from "../../services/contentStorage";

import { getInspirationById } from "../../services/inspirationStorage";

import {
    ContentItem,
    ContentReference,
    ContentStatus,
} from "../../types/content";

import {
    colors,
    radius,
    spacing,
    statusColors,
    typography,
} from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story", "Foto"];

const objectives = ["Atrair clientes", "Gerar autoridade", "Educar", "Engajar"];

export default function ContentDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [content, setContent] = useState<ContentItem | null>(null);

  const [reference, setReference] = useState<ContentReference | null>(null);

  const [originalInspirationAvailable, setOriginalInspirationAvailable] =
    useState(false);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [idea, setIdea] = useState("");

  const [format, setFormat] = useState<string | null>(null);

  const [objective, setObjective] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!id) {
          setLoading(false);
          return;
        }

        try {
          const data = await getContentById(id);

          if (!active || !data) {
            return;
          }

          let resolvedReference = data.reference ?? null;

          const relatedInspirationId =
            data.reference?.inspirationId ?? data.inspirationId;

          let relatedInspiration = null;

          if (relatedInspirationId) {
            relatedInspiration = await getInspirationById(relatedInspirationId);
          }

          // Compatibilidade com conteúdos antigos:
          // se ainda não existe snapshot, criamos um automaticamente ao abrir
          // o conteúdo, desde que a inspiração original ainda exista.
          if (!resolvedReference && relatedInspiration) {
            resolvedReference = {
              inspirationId: relatedInspiration.id,
              url: relatedInspiration.url,
              source: relatedInspiration.source,
              category: relatedInspiration.category,
              note: relatedInspiration.note,
            };

            await updateContent(data.id, {
              reference: resolvedReference,
            });
          }

          if (!active) {
            return;
          }

          const hydratedContent = resolvedReference
            ? {
                ...data,
                reference: resolvedReference,
              }
            : data;

          setContent(hydratedContent);

          setReference(resolvedReference);

          setOriginalInspirationAvailable(Boolean(relatedInspiration));

          setIdea(data.idea);

          setFormat(data.format);

          setObjective(data.objective);
        } catch (error) {
          console.error("Erro ao carregar conteúdo:", error);
        } finally {
          if (active) {
            setLoading(false);
          }
        }
      }

      load();

      return () => {
        active = false;
      };
    }, [id]),
  );

  async function handleSave() {
    if (!content || !idea.trim()) {
      return;
    }

    const updates = {
      idea: idea.trim(),
      format,
      objective,
    };

    await updateContent(content.id, updates);

    setContent({
      ...content,
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    setEditing(false);
  }

  function handleCancelEdit() {
    if (!content) {
      return;
    }

    setIdea(content.idea);

    setFormat(content.format);

    setObjective(content.objective);

    setEditing(false);
  }

  function handleEditScript() {
    if (!content) {
      return;
    }

    router.push({
      pathname: "/conteudo/roteiro",

      params: {
        contentId: content.id,
      },
    });
  }
  async function handleOpenReference() {
    if (!reference?.url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(reference.url);

      if (!supported) {
        Alert.alert(
          "Não foi possível abrir",
          "Confira se o link da referência está correto.",
        );

        return;
      }

      await Linking.openURL(reference.url);
    } catch (error) {
      console.error("Erro ao abrir referência:", error);

      Alert.alert(
        "Não foi possível abrir",
        "Tente novamente em alguns instantes.",
      );
    }
  }

  function handleViewInspiration() {
    if (!reference?.inspirationId || !originalInspirationAvailable) {
      return;
    }

    router.push(`/inspiracao/${reference.inspirationId}`);
  }

  function handleDelete() {
    if (!content) {
      return;
    }

    Alert.alert(
      "Excluir conteúdo?",
      "Esse conteúdo, o roteiro e o planejamento associados serão removidos.",
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
              await deleteContent(content.id);

              router.back();
            } catch (error) {
              console.error("Erro ao excluir conteúdo:", error);

              Alert.alert("Não foi possível excluir", "Tente novamente.");
            }
          },
        },
      ],
    );
  }
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />

          <Text style={styles.loadingText}>Carregando conteúdo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Conteúdo não encontrado</Text>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusMeta(content.status);

  const hasScript =
    Boolean(content.script.hook.trim()) ||
    content.script.points.some((point) => point.trim()) ||
    Boolean(content.script.cta.trim());

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={21} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Conteúdo</Text>

          <TouchableOpacity
            style={[styles.headerButton, editing && styles.headerButtonEditing]}
            onPress={() => {
              if (editing) {
                handleCancelEdit();
              } else {
                setEditing(true);
              }
            }}
          >
            <Ionicons
              name={editing ? "close-outline" : "create-outline"}
              size={21}
              color={editing ? colors.danger : colors.primary}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statusArea}>
          <View
            style={[
              styles.statusIcon,

              {
                backgroundColor: status.background,
              },
            ]}
          >
            <Ionicons name={status.icon} size={25} color={status.foreground} />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.statusLabel,

                {
                  color: status.foreground,
                },
              ]}
            >
              {status.label}
            </Text>

            <Text style={styles.statusDescription}>
              Etapa atual do conteúdo
            </Text>
          </View>

          {content.plannedDate && (
            <View style={styles.dateBadge}>
              <Ionicons name="calendar-outline" size={14} color={colors.blue} />

              <Text style={styles.dateBadgeText}>
                {formatDate(content.plannedDate)}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CONTEÚDO</Text>

          {editing ? (
            <TextInput
              value={idea}
              onChangeText={setIdea}
              multiline
              textAlignVertical="top"
              placeholder="Qual é a ideia do conteúdo?"
              placeholderTextColor={colors.textMuted}
              style={styles.ideaInput}
            />
          ) : (
            <Text style={styles.idea}>{content.idea}</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>FORMATO</Text>

          {editing ? (
            <View style={styles.options}>
              {formats.map((item) => {
                const selected = format === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => setFormat(selected ? null : item)}
                  >
                    <Text
                      style={[
                        styles.optionText,

                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.valueBadge}>
              <Text style={styles.valueBadgeText}>
                {content.format ?? "Não definido"}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>OBJETIVO</Text>

          {editing ? (
            <View style={styles.objectiveList}>
              {objectives.map((item) => {
                const selected = objective === item;

                return (
                  <TouchableOpacity
                    key={item}
                    style={[
                      styles.objectiveOption,

                      selected && styles.objectiveOptionSelected,
                    ]}
                    onPress={() => setObjective(selected ? null : item)}
                  >
                    <View
                      style={[styles.radio, selected && styles.radioSelected]}
                    >
                      {selected && <View style={styles.radioDot} />}
                    </View>

                    <Text style={styles.objectiveText}>{item}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text
              style={
                content.objective ? styles.objectiveRead : styles.emptyValue
              }
            >
              {content.objective ?? "Nenhum objetivo definido"}
            </Text>
          )}
        </View>

        {reference && (
          <View style={styles.referenceSection}>
            <Text style={styles.sectionLabel}>REFERÊNCIA ORIGINAL</Text>

            <View style={styles.referenceCard}>
              <View style={styles.referenceHeader}>
                <View style={styles.referenceSourceIcon}>
                  <Ionicons
                    name={getSourceIcon(reference.source)}
                    size={20}
                    color={colors.rose}
                  />
                </View>

                <View style={styles.referenceHeaderContent}>
                  <View style={styles.referenceMeta}>
                    <Text style={styles.referenceSource}>
                      {reference.source}
                    </Text>

                    {reference.category && (
                      <>
                        <View style={styles.referenceMetaDot} />

                        <Text style={styles.referenceCategory}>
                          {reference.category}
                        </Text>
                      </>
                    )}
                  </View>

                  <Text style={styles.referenceTitle}>
                    {reference.note.trim()
                      ? reference.note
                      : `Referência do ${reference.source}`}
                  </Text>
                </View>
              </View>

              <View style={styles.referenceLink}>
                <Ionicons
                  name="link-outline"
                  size={16}
                  color={colors.textMuted}
                />

                <Text style={styles.referenceUrl} numberOfLines={1}>
                  {cleanUrl(reference.url)}
                </Text>
              </View>

              <Text style={styles.referenceHint}>
                Abra a referência para rever formato, edição e estrutura antes
                de produzir.
              </Text>

              <View style={styles.referenceActions}>
                <TouchableOpacity
                  style={styles.openReferenceButton}
                  activeOpacity={0.8}
                  onPress={handleOpenReference}
                >
                  <Ionicons
                    name="open-outline"
                    size={17}
                    color={colors.surface}
                  />

                  <Text style={styles.openReferenceButtonText}>
                    Abrir referência
                  </Text>
                </TouchableOpacity>

                {originalInspirationAvailable ? (
                  <TouchableOpacity
                    style={styles.viewInspirationButton}
                    activeOpacity={0.8}
                    onPress={handleViewInspiration}
                  >
                    <Text style={styles.viewInspirationButtonText}>
                      Ver inspiração salva
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={colors.rose}
                    />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.referenceSnapshotNotice}>
                    <Ionicons
                      name="archive-outline"
                      size={16}
                      color={colors.textMuted}
                    />

                    <Text style={styles.referenceSnapshotNoticeText}>
                      A inspiração foi removida da biblioteca, mas esta
                      referência continua salva no conteúdo.
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        )}

        {editing ? (
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={19} color={colors.surface} />

            <Text style={styles.saveButtonText}>Salvar alterações</Text>
          </TouchableOpacity>
        ) : (
          <>
            <View style={styles.scriptHeader}>
              <View>
                <Text style={styles.scriptTitle}>Roteiro</Text>

                <Text style={styles.scriptSubtitle}>
                  O que será dito ou desenvolvido no conteúdo.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editScriptButton}
                onPress={handleEditScript}
              >
                <Ionicons
                  name="create-outline"
                  size={16}
                  color={colors.amber}
                />

                <Text style={styles.editScriptText}>Editar</Text>
              </TouchableOpacity>
            </View>

            {!hasScript ? (
              <View style={styles.emptyScript}>
                <View style={styles.emptyScriptIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={24}
                    color={colors.amber}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.emptyScriptTitle}>
                    Roteiro ainda vazio
                  </Text>

                  <Text style={styles.emptyScriptText}>
                    Adicione hook, desenvolvimento e CTA quando estiver pronto.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.scriptCard}>
                <ScriptSection
                  label="HOOK"
                  text={content.script.hook}
                  color={colors.terracotta}
                />

                <View style={styles.scriptDivider} />

                <View style={styles.scriptSection}>
                  <Text
                    style={[
                      styles.scriptLabel,

                      {
                        color: colors.amber,
                      },
                    ]}
                  >
                    DESENVOLVIMENTO
                  </Text>

                  {content.script.points
                    .filter((point) => point.trim())
                    .map((point, index) => (
                      <View key={`${point}-${index}`} style={styles.pointRow}>
                        <View style={styles.pointNumber}>
                          <Text style={styles.pointNumberText}>
                            {index + 1}
                          </Text>
                        </View>

                        <Text style={styles.pointText}>{point}</Text>
                      </View>
                    ))}
                </View>

                <View style={styles.scriptDivider} />

                <ScriptSection
                  label="CTA"
                  text={content.script.cta}
                  color={colors.sage}
                />
              </View>
            )}

            <TouchableOpacity
              style={styles.fullEditButton}
              onPress={handleEditScript}
            >
              <Ionicons
                name="document-text-outline"
                size={19}
                color={colors.surface}
              />

              <Text style={styles.fullEditButtonText}>Editar roteiro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              activeOpacity={0.8}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />

              <Text style={styles.deleteButtonText}>Excluir conteúdo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type ScriptSectionProps = {
  label: string;
  text: string;
  color: string;
};

function ScriptSection({ label, text, color }: ScriptSectionProps) {
  return (
    <View style={styles.scriptSection}>
      <Text style={[styles.scriptLabel, { color }]}>{label}</Text>

      <Text style={text ? styles.scriptText : styles.scriptEmptyText}>
        {text || "Não definido"}
      </Text>
    </View>
  );
}

function getSourceIcon(source: string): keyof typeof Ionicons.glyphMap {
  switch (source) {
    case "Instagram":
      return "logo-instagram";

    case "TikTok":
      return "musical-note-outline";

    case "YouTube":
      return "logo-youtube";

    default:
      return "link-outline";
  }
}

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
}

function getStatusMeta(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return {
        label: "IDEIA",
        icon: "bulb-outline" as const,
        ...statusColors.ideia,
      };

    case "roteiro":
      return {
        label: "ROTEIRO",
        icon: "create-outline" as const,
        ...statusColors.roteiro,
      };

    case "gravar":
      return {
        label: "PRODUZIR",
        icon: "videocam-outline" as const,
        ...statusColors.gravar,
      };

    case "editar":
      return {
        label: "EDITAR",
        icon: "cut-outline" as const,
        ...statusColors.editar,
      };

    case "pronto":
      return {
        label: "PRONTO",
        icon: "checkmark-circle-outline" as const,
        ...statusColors.pronto,
      };

    case "publicado":
      return {
        label: "PUBLICADO",
        icon: "paper-plane-outline" as const,
        ...statusColors.publicado,
      };
  }
}

function formatDate(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
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

  headerButtonEditing: {
    backgroundColor: "#F5E4E1",
  },

  headerTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  statusArea: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },

  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  statusLabel: {
    fontSize: typography.caption,
    fontWeight: "800",
    letterSpacing: 0.7,
  },

  statusDescription: {
    marginTop: 3,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  dateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.blueLight,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radius.round,
  },

  dateBadgeText: {
    fontSize: typography.tiny,
    fontWeight: "700",
    color: colors.blue,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    marginBottom: spacing.sm,
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.textMuted,
  },

  idea: {
    fontSize: 25,
    lineHeight: 32,
    fontWeight: "700",
    color: colors.text,
  },

  ideaInput: {
    minHeight: 110,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    fontSize: typography.subheading,
    lineHeight: 23,
    color: colors.text,
  },

  valueBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
  },

  valueBadgeText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.blue,
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
    backgroundColor: colors.blue,
    borderColor: colors.blue,
  },

  optionText: {
    fontSize: typography.caption,
    fontWeight: "600",
    color: colors.textSecondary,
  },

  optionTextSelected: {
    color: colors.surface,
  },

  objectiveRead: {
    fontSize: typography.body,
    color: colors.text,
  },

  emptyValue: {
    fontSize: typography.body,
    color: colors.textMuted,
  },

  objectiveList: {
    gap: spacing.sm,
  },

  objectiveOption: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },

  objectiveOptionSelected: {
    borderColor: colors.primary,
  },

  radio: {
    width: 20,
    height: 20,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
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

  objectiveText: {
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
  },

  referenceSection: {
    marginBottom: spacing.xl,
  },

  referenceCard: {
    backgroundColor: colors.roseLight,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "#E3CDD2",
    padding: spacing.md,
  },

  referenceHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  referenceSourceIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  referenceHeaderContent: {
    flex: 1,
    minWidth: 0,
  },

  referenceMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },

  referenceSource: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.rose,
  },

  referenceMetaDot: {
    width: 3,
    height: 3,
    borderRadius: radius.round,
    backgroundColor: colors.textMuted,
    marginHorizontal: 6,
  },

  referenceCategory: {
    fontSize: typography.tiny,
    fontWeight: "700",
    color: colors.textSecondary,
  },

  referenceTitle: {
    marginTop: 5,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: "700",
    color: colors.text,
  },

  referenceLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },

  referenceUrl: {
    flex: 1,
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  referenceHint: {
    marginTop: spacing.sm,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  referenceActions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },

  openReferenceButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.rose,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  openReferenceButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.surface,
  },

  viewInspirationButton: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },

  viewInspirationButtonText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.rose,
  },

  referenceSnapshotNotice: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  referenceSnapshotNoticeText: {
    flex: 1,
    fontSize: typography.tiny,
    lineHeight: 16,
    color: colors.textMuted,
  },

  saveButton: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  saveButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.surface,
  },

  scriptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },

  scriptTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  scriptSubtitle: {
    marginTop: 3,
    maxWidth: 260,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  editScriptButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.amberLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.round,
  },

  editScriptText: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.amber,
  },

  scriptCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  scriptSection: {
    paddingVertical: spacing.sm,
  },

  scriptLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },

  scriptText: {
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  scriptEmptyText: {
    fontSize: typography.body,
    color: colors.textMuted,
  },

  scriptDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.sm,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },

  pointNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.round,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
    marginTop: 1,
  },

  pointNumberText: {
    fontSize: typography.tiny,
    fontWeight: "800",
    color: colors.amber,
  },

  pointText: {
    flex: 1,
    fontSize: typography.body,
    lineHeight: 21,
    color: colors.text,
  },

  emptyScript: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.amberLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },

  emptyScriptIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  emptyScriptTitle: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.text,
  },

  emptyScriptText: {
    marginTop: 3,
    fontSize: typography.caption,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  fullEditButton: {
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },

  fullEditButtonText: {
    fontSize: typography.body,
    fontWeight: "700",
    color: colors.surface,
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

  backText: {
    color: colors.primary,
    fontWeight: "700",
  },
  deleteButton: {
    minHeight: 48,

    marginTop: spacing.md,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: spacing.sm,
  },

  deleteButtonText: {
    fontSize: typography.body,

    fontWeight: "600",

    color: colors.danger,
  },
});
