import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";

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

import InspirationThumbnail from "../../components/InspirationThumbnail";
import PlatformIcon from "../../components/PlatformIcon";

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
  fonts,
  radius,
  shadows,
  spacing,
  statusColors,
} from "../../constants/theme";

const formats = ["Reel", "Carrossel", "Story", "Foto"];

const objectives = ["Atrair clientes", "Gerar autoridade", "Educar", "Engajar"];

const statusOrder: ContentStatus[] = [
  "ideia",
  "roteiro",
  "gravar",
  "editar",
  "pronto",
  "publicado",
];

export default function ContentDetailsScreen() {
  const params = useLocalSearchParams();

  const rawId = params.id;

  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [content, setContent] = useState<ContentItem | null>(null);

  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);

  const [inspirationExists, setInspirationExists] = useState(false);

  const [idea, setIdea] = useState("");

  const [format, setFormat] = useState<string | null>(null);

  const [objective, setObjective] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        if (!id) {
          if (active) {
            setLoading(false);
          }

          return;
        }

        try {
          const data = await getContentById(id);

          if (!active) {
            return;
          }

          if (!data) {
            setContent(null);
            return;
          }

          let nextContent = data;

          if (!data.reference && data.inspirationId) {
            const inspiration = await getInspirationById(data.inspirationId);

            if (inspiration) {
              const reference: ContentReference = {
                inspirationId: inspiration.id,
                url: inspiration.url,
                source: inspiration.source,
                category: inspiration.category,
                note: inspiration.note,
                thumbnailUrl: inspiration.thumbnailUrl ?? null,
                mediaTitle: inspiration.mediaTitle ?? null,
                authorName: inspiration.authorName ?? null,
                metadataUpdatedAt: inspiration.metadataUpdatedAt ?? null,
              };

              await updateContent(data.id, {
                reference,
              });

              nextContent = {
                ...data,
                reference,
              };

              if (active) {
                setInspirationExists(true);
              }
            }
          } else if (data.reference?.inspirationId) {
            const inspiration = await getInspirationById(
              data.reference.inspirationId,
            );

            if (inspiration) {
              const enrichedReference: ContentReference = {
                ...data.reference,
                thumbnailUrl:
                  data.reference.thumbnailUrl ??
                  inspiration.thumbnailUrl ??
                  null,
                mediaTitle:
                  data.reference.mediaTitle ?? inspiration.mediaTitle ?? null,
                authorName:
                  data.reference.authorName ?? inspiration.authorName ?? null,
                metadataUpdatedAt:
                  data.reference.metadataUpdatedAt ??
                  inspiration.metadataUpdatedAt ??
                  null,
              };

              const needsBackfill =
                enrichedReference.thumbnailUrl !==
                  data.reference.thumbnailUrl ||
                enrichedReference.mediaTitle !== data.reference.mediaTitle ||
                enrichedReference.authorName !== data.reference.authorName ||
                enrichedReference.metadataUpdatedAt !==
                  data.reference.metadataUpdatedAt;

              if (needsBackfill) {
                await updateContent(data.id, {
                  reference: enrichedReference,
                });

                nextContent = {
                  ...data,
                  reference: enrichedReference,
                };
              }

              if (active) {
                setInspirationExists(true);
              }
            } else if (active) {
              setInspirationExists(false);
            }
          }

          if (!active) {
            return;
          }

          setContent(nextContent);
          setIdea(nextContent.idea);
          setFormat(nextContent.format);
          setObjective(nextContent.objective);
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

    try {
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
    } catch (error) {
      console.error("Erro ao salvar conteúdo:", error);

      Alert.alert("Não foi possível salvar", "Tente novamente.");
    }
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

  async function handleAdvance() {
    if (!content) {
      return;
    }

    const nextStatus = getNextStatus(content.status);

    if (!nextStatus) {
      return;
    }

    try {
      await updateContent(content.id, {
        status: nextStatus,
      });

      setContent({
        ...content,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao avançar conteúdo:", error);

      Alert.alert("Não foi possível avançar", "Tente novamente.");
    }
  }

  async function handleOpenReference() {
    const url = content?.reference?.url;

    if (!url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (!supported) {
        Alert.alert(
          "Não foi possível abrir",
          "Confira se o link original ainda está disponível.",
        );

        return;
      }

      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "Erro ao abrir referência",
        "Não foi possível abrir esse link.",
      );
    }
  }

  function handleOpenInspiration() {
    const inspirationId =
      content?.reference?.inspirationId ?? content?.inspirationId;

    if (!inspirationId || !inspirationExists) {
      return;
    }

    router.push({
      pathname: "/inspiracao/[id]",
      params: {
        id: inspirationId,
      },
    });
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
          <ActivityIndicator color={colors.terracotta} />

          <Text style={styles.loadingText}>Abrindo conteúdo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!content) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <View style={styles.errorMark}>
            <Ionicons
              name="document-text-outline"
              size={24}
              color={colors.textMuted}
            />
          </View>

          <Text style={styles.errorTitle}>Conteúdo não encontrado</Text>

          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const status = getStatusMeta(content.status);

  const nextStatus = getNextStatus(content.status);

  const nextMeta = nextStatus ? getStatusMeta(nextStatus) : null;

  const scriptPoints = content.script.points.filter((point) => point.trim());

  const hasScript =
    Boolean(content.script.hook.trim()) ||
    scriptPoints.length > 0 ||
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
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Conteúdo</Text>

          <TouchableOpacity
            style={[styles.headerButton, editing && styles.headerButtonEditing]}
            activeOpacity={0.8}
            onPress={() => {
              if (editing) {
                handleCancelEdit();
              } else {
                setEditing(true);
              }
            }}
          >
            <Ionicons
              name={editing ? "close" : "create-outline"}
              size={19}
              color={editing ? colors.danger : colors.terracotta}
            />
          </TouchableOpacity>
        </View>

        {editing ? (
          <View style={styles.editingContent}>
            <Text style={styles.editEyebrow}>EDITAR CONTEÚDO</Text>

            <Text style={styles.editTitle}>
              Ajuste as informações principais.
            </Text>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>IDEIA</Text>

              <TextInput
                value={idea}
                onChangeText={setIdea}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
                placeholder="Qual é a ideia do conteúdo?"
                placeholderTextColor={colors.textMuted}
                style={styles.ideaInput}
              />
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>FORMATO</Text>

              <View style={styles.options}>
                {formats.map((item) => {
                  const selected = format === item;

                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.option, selected && styles.optionSelected]}
                      activeOpacity={0.8}
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
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>OBJETIVO</Text>

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
                      activeOpacity={0.8}
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
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                !idea.trim() && styles.saveButtonDisabled,
              ]}
              activeOpacity={0.86}
              disabled={!idea.trim()}
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={18} color={colors.surface} />

              <Text style={styles.saveButtonText}>Salvar alterações</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.overview}>
              <View style={styles.overviewTop}>
                <View
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: status.background,
                    },
                  ]}
                >
                  <Ionicons
                    name={status.icon}
                    size={13}
                    color={status.foreground}
                  />

                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: status.foreground,
                      },
                    ]}
                  >
                    {status.label}
                  </Text>
                </View>

                {content.plannedDate ? (
                  <View style={styles.datePill}>
                    <Ionicons
                      name="calendar-outline"
                      size={13}
                      color={colors.blue}
                    />

                    <Text style={styles.dateText}>
                      {formatDate(content.plannedDate)}
                    </Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.overviewTitle}>{content.idea}</Text>

              <View style={styles.metaRow}>
                {content.format ? (
                  <MetaPill
                    icon="phone-portrait-outline"
                    text={content.format}
                  />
                ) : null}

                {content.objective ? (
                  <MetaPill icon="flag-outline" text={content.objective} />
                ) : null}
              </View>

              {content.reference ? (
                <View style={styles.originStrip}>
                  <InspirationThumbnail
                    thumbnailUrl={content.reference.thumbnailUrl}
                    source={content.reference.source}
                    variant="compact"
                    style={styles.originThumbnail}
                  />

                  <View style={styles.originContent}>
                    <Text style={styles.originLabel}>
                      CRIADO A PARTIR DE UMA REFERÊNCIA
                    </Text>

                    <Text style={styles.originTitle} numberOfLines={2}>
                      {content.reference.mediaTitle?.trim() ||
                        content.reference.note?.trim() ||
                        `Referência do ${content.reference.source}`}
                    </Text>

                    <View style={styles.originSourceRow}>
                      <PlatformIcon
                        source={content.reference.source}
                        size={12}
                      />

                      <Text style={styles.originSourceText}>
                        {content.reference.source}
                      </Text>
                    </View>
                  </View>
                </View>
              ) : null}
            </View>

            <View style={styles.sectionHeading}>
              <View>
                <Text style={styles.sectionEyebrow}>ROTEIRO</Text>

                <Text style={styles.sectionTitle}>Estrutura do conteúdo</Text>
              </View>

              <TouchableOpacity
                style={styles.editScriptButton}
                activeOpacity={0.8}
                onPress={handleEditScript}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={colors.terracotta}
                />

                <Text style={styles.editScriptText}>Editar</Text>
              </TouchableOpacity>
            </View>

            {!hasScript ? (
              <TouchableOpacity
                style={styles.emptyScript}
                activeOpacity={0.84}
                onPress={handleEditScript}
              >
                <View style={styles.emptyScriptIcon}>
                  <Ionicons
                    name="document-text-outline"
                    size={20}
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
                    Abra o editor e construa uma estrutura simples.
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={17}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            ) : (
              <View style={styles.scriptDocument}>
                {content.script.hook.trim() ? (
                  <ScriptBlock
                    label="HOOK"
                    hint="Como começa"
                    accent={colors.terracotta}
                    icon="flash-outline"
                  >
                    <Text style={styles.hookText}>{content.script.hook}</Text>
                  </ScriptBlock>
                ) : null}

                {content.script.hook.trim() && scriptPoints.length > 0 ? (
                  <View style={styles.scriptDivider} />
                ) : null}

                {scriptPoints.length > 0 ? (
                  <ScriptBlock
                    label="DESENVOLVIMENTO"
                    hint={`${scriptPoints.length} ${
                      scriptPoints.length === 1 ? "etapa" : "etapas"
                    }`}
                    accent={colors.amber}
                    icon="list-outline"
                  >
                    <View style={styles.points}>
                      {scriptPoints.map((point, index) => (
                        <View key={`${point}-${index}`} style={styles.pointRow}>
                          <Text style={styles.pointNumber}>
                            {String(index + 1).padStart(2, "0")}
                          </Text>

                          <Text style={styles.pointText}>{point}</Text>
                        </View>
                      ))}
                    </View>
                  </ScriptBlock>
                ) : null}

                {scriptPoints.length > 0 && content.script.cta.trim() ? (
                  <View style={styles.scriptDivider} />
                ) : null}

                {content.script.cta.trim() ? (
                  <ScriptBlock
                    label="CTA"
                    hint="Como termina"
                    accent={colors.sage}
                    icon="megaphone-outline"
                  >
                    <Text style={styles.ctaText}>{content.script.cta}</Text>
                  </ScriptBlock>
                ) : null}
              </View>
            )}

            <View style={styles.flowSection}>
              <View style={styles.flowHeading}>
                <Text style={styles.sectionEyebrow}>SEU FLUXO</Text>

                <Text style={styles.flowCurrent}>
                  Etapa atual: {status.label.toLowerCase()}
                </Text>
              </View>

              {nextMeta ? (
                <TouchableOpacity
                  style={styles.nextStageCard}
                  activeOpacity={0.84}
                  onPress={handleAdvance}
                >
                  <View
                    style={[
                      styles.nextStageIcon,
                      {
                        backgroundColor: nextMeta.background,
                      },
                    ]}
                  >
                    <Ionicons
                      name={nextMeta.icon}
                      size={19}
                      color={nextMeta.foreground}
                    />
                  </View>

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text style={styles.nextStageLabel}>PRÓXIMA ETAPA</Text>

                    <Text style={styles.nextStageTitle}>
                      Avançar para {nextMeta.label.toLowerCase()}
                    </Text>

                    <Text style={styles.nextStageText}>
                      Atualize o estágio quando estiver pronto para continuar.
                    </Text>
                  </View>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={colors.text}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.completedCard}>
                  <View style={styles.completedIcon}>
                    <Ionicons name="checkmark" size={18} color={colors.sage} />
                  </View>

                  <View>
                    <Text style={styles.completedTitle}>Fluxo concluído</Text>

                    <Text style={styles.completedText}>
                      Este conteúdo já foi publicado.
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {content.reference ? (
              <View style={styles.referenceSection}>
                <View style={styles.referenceHeading}>
                  <Text style={styles.sectionEyebrow}>REFERÊNCIA</Text>

                  <Text style={styles.referenceHeadingText}>
                    Origem da ideia
                  </Text>
                </View>

                <View style={styles.referenceCard}>
                  <InspirationThumbnail
                    thumbnailUrl={content.reference.thumbnailUrl}
                    source={content.reference.source}
                    variant="compact"
                    style={styles.referenceThumbnail}
                  />

                  <View style={styles.referenceContent}>
                    <View style={styles.referenceSourceRow}>
                      <PlatformIcon
                        source={content.reference.source}
                        size={12}
                      />

                      <Text style={styles.referenceSource}>
                        {content.reference.source}
                      </Text>

                      {content.reference.category ? (
                        <>
                          <View style={styles.metaDot} />

                          <Text
                            style={styles.referenceCategory}
                            numberOfLines={1}
                          >
                            {content.reference.category}
                          </Text>
                        </>
                      ) : null}
                    </View>

                    <Text style={styles.referenceTitle} numberOfLines={2}>
                      {content.reference.mediaTitle?.trim() ||
                        content.reference.note?.trim() ||
                        `Referência do ${content.reference.source}`}
                    </Text>

                    <Text style={styles.referenceSecondary} numberOfLines={1}>
                      {content.reference.authorName?.trim() ||
                        cleanUrl(content.reference.url)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.referenceOpen}
                    activeOpacity={0.8}
                    onPress={handleOpenReference}
                  >
                    <Ionicons
                      name="open-outline"
                      size={16}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {content.reference.note?.trim() &&
                content.reference.note.trim() !==
                  content.reference.mediaTitle?.trim() ? (
                  <View style={styles.referenceNote}>
                    <Text style={styles.referenceNoteLabel}>
                      O QUE TE CHAMOU ATENÇÃO
                    </Text>

                    <Text style={styles.referenceNoteText}>
                      {content.reference.note}
                    </Text>
                  </View>
                ) : null}

                {inspirationExists ? (
                  <TouchableOpacity
                    style={styles.savedInspirationLink}
                    activeOpacity={0.8}
                    onPress={handleOpenInspiration}
                  >
                    <Text style={styles.savedInspirationText}>
                      Ver inspiração salva
                    </Text>

                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <View style={styles.bottomDivider} />

            <TouchableOpacity
              style={styles.deleteButton}
              activeOpacity={0.8}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={16} color={colors.danger} />

              <Text style={styles.deleteButtonText}>Excluir conteúdo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type MetaPillProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function MetaPill({ icon, text }: MetaPillProps) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon} size={12} color={colors.textMuted} />

      <Text style={styles.metaPillText}>{text}</Text>
    </View>
  );
}

type ScriptBlockProps = {
  label: string;
  hint: string;
  accent: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
};

function ScriptBlock({
  label,
  hint,
  accent,
  icon,
  children,
}: ScriptBlockProps) {
  return (
    <View style={styles.scriptBlock}>
      <View style={styles.scriptBlockHeader}>
        <View style={styles.scriptBlockTitleRow}>
          <View
            style={[
              styles.scriptAccent,
              {
                backgroundColor: accent,
              },
            ]}
          />

          <Text
            style={[
              styles.scriptLabel,
              {
                color: accent,
              },
            ]}
          >
            {label}
          </Text>
        </View>

        <View style={styles.scriptHintRow}>
          <Ionicons name={icon} size={13} color={colors.textMuted} />

          <Text style={styles.scriptHint}>{hint}</Text>
        </View>
      </View>

      <View style={styles.scriptBlockContent}>{children}</View>
    </View>
  );
}

function getNextStatus(status: ContentStatus): ContentStatus | null {
  const index = statusOrder.indexOf(status);

  if (index < 0 || index === statusOrder.length - 1) {
    return null;
  }

  return statusOrder[index + 1];
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

  return date
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    })
    .replace(".", "")
    .toUpperCase();
}

function cleanUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
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
    height: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerButton: {
    width: 42,
    height: 42,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  headerButtonEditing: {
    backgroundColor: "#F7E7E4",
  },

  headerTitle: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  editingContent: {
    paddingTop: 16,
  },

  editEyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  editTitle: {
    maxWidth: 320,
    marginTop: 6,
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.75,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  formSection: {
    marginTop: 24,
  },

  formLabel: {
    marginBottom: 9,
    fontSize: 10,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  ideaInput: {
    minHeight: 135,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  option: {
    minHeight: 40,
    paddingHorizontal: 13,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  optionSelected: {
    backgroundColor: colors.terracottaLight,
    borderColor: "rgba(225,116,85,0.35)",
  },

  optionText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  optionTextSelected: {
    color: colors.terracotta,
  },

  objectiveList: {
    gap: 8,
  },

  objectiveOption: {
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  objectiveOptionSelected: {
    borderColor: "rgba(225,116,85,0.38)",
  },

  radio: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: radius.round,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: colors.terracotta,
  },

  radioDot: {
    width: 9,
    height: 9,
    borderRadius: radius.round,
    backgroundColor: colors.terracotta,
  },

  objectiveText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.text,
  },

  saveButton: {
    minHeight: 56,
    marginTop: 28,
    borderRadius: 16,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.soft,
  },

  saveButtonDisabled: {
    opacity: 0.45,
  },

  saveButtonText: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  overview: {
    marginTop: 16,
    marginBottom: 27,
  },

  overviewTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },

  statusPill: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  statusText: {
    fontSize: 10,
    letterSpacing: 0.7,
    fontFamily: fonts.bold,
  },

  datePill: {
    minHeight: 30,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  dateText: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.blue,
  },

  overviewTitle: {
    maxWidth: 350,
    marginTop: 15,
    fontSize: 31,
    lineHeight: 39,
    letterSpacing: -0.95,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  metaRow: {
    marginTop: 13,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  metaPill: {
    minHeight: 29,
    paddingHorizontal: 9,
    borderRadius: radius.round,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  metaPillText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  originStrip: {
    minHeight: 84,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "center",
  },

  originThumbnail: {
    width: 54,
    height: 66,
    borderRadius: 11,
  },

  originContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  originLabel: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  originTitle: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  originSourceRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  originSourceText: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  sectionHeading: {
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },

  sectionEyebrow: {
    fontSize: 10,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  sectionTitle: {
    marginTop: 3,
    fontSize: 22,
    lineHeight: 29,
    letterSpacing: -0.4,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  editScriptButton: {
    minHeight: 36,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: colors.terracottaLight,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  editScriptText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  emptyScript: {
    minHeight: 82,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  emptyScriptIcon: {
    width: 40,
    height: 40,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: colors.amberLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyScriptTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  emptyScriptText: {
    marginTop: 3,
    paddingRight: 5,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  scriptDocument: {
    paddingHorizontal: 17,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },

  scriptBlock: {
    paddingVertical: 18,
  },

  scriptBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },

  scriptBlockTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  scriptAccent: {
    width: 7,
    height: 7,
    borderRadius: radius.round,
  },

  scriptLabel: {
    fontSize: 10,
    letterSpacing: 0.85,
    fontFamily: fonts.bold,
  },

  scriptHintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  scriptHint: {
    fontSize: 9,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  scriptBlockContent: {
    marginTop: 13,
  },

  scriptDivider: {
    height: 1,
    backgroundColor: colors.divider,
  },

  hookText: {
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  points: {
    gap: 14,
  },

  pointRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  pointNumber: {
    width: 30,
    paddingTop: 2,
    fontSize: 9,
    letterSpacing: 0.4,
    fontFamily: fonts.bold,
    color: colors.amber,
  },

  pointText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 24,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  ctaText: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  flowSection: {
    marginTop: 26,
  },

  flowHeading: {
    marginBottom: 10,
  },

  flowCurrent: {
    marginTop: 3,
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  nextStageCard: {
    minHeight: 86,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    ...shadows.soft,
  },

  nextStageIcon: {
    width: 44,
    height: 44,
    marginRight: 11,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  nextStageLabel: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  nextStageTitle: {
    marginTop: 3,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  nextStageText: {
    marginTop: 2,
    paddingRight: 5,
    fontSize: 10,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  completedCard: {
    minHeight: 72,
    padding: 13,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  completedIcon: {
    width: 42,
    height: 42,
    marginRight: 10,
    borderRadius: 13,
    backgroundColor: colors.sageLight,
    alignItems: "center",
    justifyContent: "center",
  },

  completedTitle: {
    fontSize: 14,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  completedText: {
    marginTop: 3,
    fontSize: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  referenceSection: {
    marginTop: 28,
  },

  referenceHeading: {
    marginBottom: 10,
  },

  referenceHeadingText: {
    marginTop: 3,
    fontSize: 17,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  referenceCard: {
    minHeight: 96,
    padding: 11,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  referenceThumbnail: {
    width: 62,
    height: 76,
    borderRadius: 12,
  },

  referenceContent: {
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },

  referenceSourceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  referenceSource: {
    fontSize: 10,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  metaDot: {
    width: 3,
    height: 3,
    marginHorizontal: 2,
    borderRadius: radius.round,
    backgroundColor: colors.textMuted,
  },

  referenceCategory: {
    flexShrink: 1,
    fontSize: 9,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  referenceTitle: {
    marginTop: 5,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  referenceSecondary: {
    marginTop: 4,
    fontSize: 9,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  referenceOpen: {
    width: 34,
    height: 34,
    marginLeft: 7,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: "center",
    justifyContent: "center",
  },

  referenceNote: {
    marginTop: 10,
    paddingLeft: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.lavender,
  },

  referenceNoteLabel: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.textMuted,
  },

  referenceNoteText: {
    marginTop: 5,
    fontSize: 12,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  savedInspirationLink: {
    minHeight: 42,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  savedInspirationText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  bottomDivider: {
    height: 1,
    marginTop: 28,
    backgroundColor: colors.divider,
  },

  deleteButton: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  deleteButtonText: {
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
    fontSize: 13,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  errorMark: {
    width: 54,
    height: 54,
    marginBottom: 16,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 21,
    lineHeight: 28,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  errorButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: colors.text,
  },

  errorButtonText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.surface,
  },
});
