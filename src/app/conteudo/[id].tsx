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

            if (active) {
              setInspirationExists(Boolean(inspiration));
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

  const hasScript =
    Boolean(content.script?.hook?.trim()) ||
    Boolean(content.script?.points?.some((point) => point.trim())) ||
    Boolean(content.script?.cta?.trim());

  const ideaLength = content.idea.trim().length;

  const isLongIdea = ideaLength > 85;

  const isVeryLongIdea = ideaLength > 180;

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
            <Ionicons name="arrow-back" size={20} color={colors.text} />
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
              name={editing ? "close" : "create-outline"}
              size={19}
              color={editing ? colors.danger : colors.terracotta}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroTop}>
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
                size={14}
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

            {content.plannedDate && (
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
            )}
          </View>

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
            <View style={isLongIdea ? styles.longIdeaSurface : undefined}>
              {isLongIdea && (
                <Text style={styles.longIdeaLabel}>IDEIA DO CONTEÚDO</Text>
              )}

              <Text
                style={[
                  styles.title,

                  isLongIdea && styles.titleLong,

                  isVeryLongIdea && styles.titleVeryLong,
                ]}
              >
                {content.idea}
              </Text>
            </View>
          )}

          {!editing && (
            <View style={styles.metaRow}>
              {content.format && (
                <MetaItem icon="phone-portrait-outline" text={content.format} />
              )}

              {content.objective && (
                <MetaItem icon="flag-outline" text={content.objective} />
              )}
            </View>
          )}
        </View>

        {editing ? (
          <View style={styles.editingArea}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>FORMATO</Text>

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
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>OBJETIVO</Text>

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
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,

                !idea.trim() && styles.saveButtonDisabled,
              ]}
              disabled={!idea.trim()}
              activeOpacity={0.86}
              onPress={handleSave}
            >
              <View style={styles.saveButtonMark}>
                <Ionicons
                  name="checkmark"
                  size={17}
                  color={idea.trim() ? colors.terracotta : colors.textMuted}
                />
              </View>

              <Text
                style={[
                  styles.saveButtonText,

                  !idea.trim() && styles.saveButtonTextDisabled,
                ]}
              >
                Salvar alterações
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Roteiro</Text>

                <Text style={styles.sectionSubtitle}>
                  Sua estrutura para criar este conteúdo.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editScriptAction}
                activeOpacity={0.8}
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
              <TouchableOpacity
                style={styles.emptyScript}
                activeOpacity={0.85}
                onPress={handleEditScript}
              >
                <View style={styles.emptyScriptMark}>
                  <Ionicons
                    name="document-text-outline"
                    size={21}
                    color={colors.amber}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.emptyScriptTitle}>
                    Roteiro ainda vazio
                  </Text>

                  <Text style={styles.emptyScriptText}>
                    Comece com uma estrutura simples e ajuste do seu jeito.
                  </Text>
                </View>

                <Ionicons name="arrow-forward" size={17} color={colors.amber} />
              </TouchableOpacity>
            ) : (
              <View style={styles.scriptSurface}>
                {content.script.hook.trim() && (
                  <View style={styles.scriptSection}>
                    <ScriptHeader
                      icon="flash-outline"
                      label="HOOK"
                      hint="Como começa"
                      color={colors.terracotta}
                      background={colors.terracottaLight}
                    />

                    <Text style={styles.hookText}>{content.script.hook}</Text>
                  </View>
                )}

                {content.script.hook.trim() &&
                  content.script.points.some((point) => point.trim()) && (
                    <View style={styles.scriptDivider} />
                  )}

                {content.script.points.some((point) => point.trim()) && (
                  <View style={styles.scriptSection}>
                    <ScriptHeader
                      icon="list-outline"
                      label="DESENVOLVIMENTO"
                      hint={`${
                        content.script.points.filter((point) => point.trim())
                          .length
                      } ${
                        content.script.points.filter((point) => point.trim())
                          .length === 1
                          ? "etapa"
                          : "etapas"
                      }`}
                      color={colors.amber}
                      background={colors.amberLight}
                    />

                    <View style={styles.points}>
                      {content.script.points
                        .filter((point) => point.trim())
                        .map((point, index) => (
                          <View
                            key={`${point}-${index}`}
                            style={styles.pointRow}
                          >
                            <View style={styles.pointNumber}>
                              <Text style={styles.pointNumberText}>
                                {String(index + 1).padStart(2, "0")}
                              </Text>
                            </View>

                            <Text style={styles.pointText}>{point}</Text>
                          </View>
                        ))}
                    </View>
                  </View>
                )}

                {content.script.cta.trim() &&
                  (content.script.hook.trim() ||
                    content.script.points.some((point) => point.trim())) && (
                    <View style={styles.scriptDivider} />
                  )}

                {content.script.cta.trim() && (
                  <View style={styles.scriptSection}>
                    <ScriptHeader
                      icon="megaphone-outline"
                      label="CTA"
                      hint="Como termina"
                      color={colors.sage}
                      background={colors.sageLight}
                    />

                    <Text style={styles.ctaText}>{content.script.cta}</Text>
                  </View>
                )}
              </View>
            )}

            {content.reference && (
              <>
                <View style={styles.referenceHeader}>
                  <View>
                    <Text style={styles.sectionTitle}>Referência</Text>

                    <Text style={styles.sectionSubtitle}>
                      O conteúdo que deu origem a esta ideia.
                    </Text>
                  </View>
                </View>

                <View style={styles.referenceCard}>
                  <View style={styles.referenceTop}>
                    <View style={styles.referenceIdentity}>
                      <View style={styles.referenceMark}>
                        <Ionicons
                          name={getSourceIcon(content.reference.source)}
                          size={18}
                          color={colors.rose}
                        />
                      </View>

                      <View>
                        <Text style={styles.referenceSource}>
                          {content.reference.source}
                        </Text>

                        <Text style={styles.referenceCategory}>
                          {content.reference.category ?? "Referência original"}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.referenceOpen}
                      activeOpacity={0.8}
                      onPress={handleOpenReference}
                    >
                      <Ionicons
                        name="open-outline"
                        size={17}
                        color={colors.rose}
                      />
                    </TouchableOpacity>
                  </View>

                  {content.reference.note?.trim() && (
                    <Text style={styles.referenceNote}>
                      {content.reference.note}
                    </Text>
                  )}

                  <Text style={styles.referenceUrl} numberOfLines={1}>
                    {cleanUrl(content.reference.url)}
                  </Text>

                  <View style={styles.referenceActions}>
                    <TouchableOpacity
                      style={styles.openReferenceAction}
                      onPress={handleOpenReference}
                    >
                      <Text style={styles.openReferenceText}>
                        Abrir original
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={15}
                        color={colors.rose}
                      />
                    </TouchableOpacity>

                    {inspirationExists && (
                      <TouchableOpacity
                        style={styles.savedInspirationAction}
                        onPress={handleOpenInspiration}
                      >
                        <Text style={styles.savedInspirationText}>
                          Ver inspiração salva
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </>
            )}

            <View style={styles.flowSection}>
              <Text style={styles.sectionTitle}>Próxima etapa</Text>

              <Text style={styles.sectionSubtitle}>
                Mova o conteúdo pelo seu fluxo quando fizer sentido.
              </Text>

              {nextStatus && nextMeta ? (
                <TouchableOpacity
                  style={[
                    styles.advanceButton,

                    {
                      backgroundColor: nextMeta.background,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={handleAdvance}
                >
                  <View style={styles.advanceInfo}>
                    <View
                      style={[
                        styles.advanceMark,

                        {
                          backgroundColor: nextMeta.foreground,
                        },
                      ]}
                    >
                      <Ionicons
                        name={nextMeta.icon}
                        size={17}
                        color={colors.surface}
                      />
                    </View>

                    <View>
                      <Text style={styles.advanceEyebrow}>AVANÇAR PARA</Text>

                      <Text
                        style={[
                          styles.advanceText,

                          {
                            color: nextMeta.foreground,
                          },
                        ]}
                      >
                        {nextMeta.label}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name="arrow-forward"
                    size={18}
                    color={nextMeta.foreground}
                  />
                </TouchableOpacity>
              ) : (
                <View style={styles.completedFlow}>
                  <View style={styles.completedMark}>
                    <Ionicons name="checkmark" size={17} color={colors.sage} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.completedTitle}>Fluxo concluído</Text>

                    <Text style={styles.completedText}>
                      Este conteúdo já foi publicado.
                    </Text>
                  </View>
                </View>
              )}
            </View>

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

type MetaItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
};

function MetaItem({ icon, text }: MetaItemProps) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={13} color={colors.textMuted} />

      <Text style={styles.metaItemText}>{text}</Text>
    </View>
  );
}

type ScriptHeaderProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  color: string;
  background: string;
};

function ScriptHeader({
  icon,
  label,
  hint,
  color,
  background,
}: ScriptHeaderProps) {
  return (
    <View style={styles.scriptHeaderRow}>
      <View
        style={[
          styles.scriptMark,

          {
            backgroundColor: background,
          },
        ]}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>

      <View>
        <Text
          style={[
            styles.scriptLabel,

            {
              color,
            },
          ]}
        >
          {label}
        </Text>

        <Text style={styles.scriptHint}>{hint}</Text>
      </View>
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
    height: 68,

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

  hero: {
    paddingTop: 22,

    paddingBottom: 30,
  },

  heroTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  statusPill: {
    minHeight: 32,

    paddingHorizontal: 10,

    borderRadius: radius.round,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,
  },

  statusText: {
    fontSize: 11,

    letterSpacing: 0.7,

    fontFamily: fonts.bold,
  },

  datePill: {
    minHeight: 32,

    paddingHorizontal: 10,

    borderRadius: radius.round,

    backgroundColor: colors.blueLight,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  dateText: {
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.blue,
  },

  title: {
    maxWidth: 345,

    marginTop: 17,

    fontSize: 31,

    lineHeight: 38,

    letterSpacing: -0.9,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  longIdeaSurface: {
    marginTop: 16,

    padding: 17,

    borderRadius: 20,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  longIdeaLabel: {
    marginBottom: 10,

    fontSize: 11,

    letterSpacing: 0.9,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  titleLong: {
    marginTop: 0,

    maxWidth: "100%",

    fontSize: 21,

    lineHeight: 31,

    letterSpacing: -0.25,

    fontFamily: fonts.semibold,
  },

  titleVeryLong: {
    fontSize: 18,

    lineHeight: 29,

    letterSpacing: 0,

    fontFamily: fonts.regular,
  },

  ideaInput: {
    minHeight: 115,

    marginTop: 16,

    padding: 15,

    borderRadius: 19,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    fontSize: 20,

    lineHeight: 29,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  metaRow: {
    marginTop: 15,

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,
  },

  metaItem: {
    minHeight: 30,

    paddingHorizontal: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  metaItemText: {
    fontSize: 12,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  editingArea: {
    paddingTop: 2,
  },

  field: {
    marginBottom: 27,
  },

  fieldLabel: {
    marginBottom: 10,

    fontSize: 10,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.textMuted,
  },

  options: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,
  },

  option: {
    minHeight: 38,

    paddingHorizontal: 15,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    alignItems: "center",

    justifyContent: "center",
  },

  optionSelected: {
    backgroundColor: colors.text,

    borderColor: colors.text,
  },

  optionText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  optionTextSelected: {
    color: colors.surface,
  },

  objectiveList: {
    gap: 8,
  },

  objectiveOption: {
    minHeight: 54,

    paddingHorizontal: 14,

    borderRadius: 17,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",
  },

  objectiveOptionSelected: {
    borderColor: colors.terracotta,

    backgroundColor: colors.terracottaLight,
  },

  radio: {
    width: 20,
    height: 20,

    marginRight: 11,

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
    width: 10,
    height: 10,

    borderRadius: radius.round,

    backgroundColor: colors.terracotta,
  },

  objectiveText: {
    fontSize: 14,

    fontFamily: fonts.medium,

    color: colors.text,
  },

  saveButton: {
    minHeight: 58,

    paddingHorizontal: 14,

    borderRadius: 18,

    backgroundColor: colors.terracotta,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonDisabled: {
    backgroundColor: colors.surfaceMuted,
  },

  saveButtonMark: {
    width: 34,
    height: 34,

    marginRight: 10,

    borderRadius: 11,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  saveButtonText: {
    fontSize: 13,

    fontFamily: fonts.bold,

    color: colors.surface,
  },

  saveButtonTextDisabled: {
    color: colors.textMuted,
  },

  sectionHeader: {
    marginBottom: 14,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",

    gap: 12,
  },

  sectionTitle: {
    fontSize: 24,

    lineHeight: 31,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sectionSubtitle: {
    maxWidth: 295,

    marginTop: 5,

    fontSize: 14,

    lineHeight: 21,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  editScriptAction: {
    minHeight: 40,

    paddingHorizontal: 11,

    borderRadius: 12,

    backgroundColor: colors.amberLight,

    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  editScriptText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.amber,
  },

  emptyScript: {
    minHeight: 82,

    marginBottom: 30,

    padding: 14,

    borderRadius: 19,

    backgroundColor: colors.amberLight,

    flexDirection: "row",

    alignItems: "center",
  },

  emptyScriptMark: {
    width: 42,
    height: 42,

    marginRight: 11,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  emptyScriptTitle: {
    fontSize: 15,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  emptyScriptText: {
    marginTop: 4,

    paddingRight: 8,

    fontSize: 12,

    lineHeight: 18,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  scriptSurface: {
    marginBottom: 32,

    overflow: "hidden",

    borderRadius: 22,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,

    ...shadows.soft,
  },

  scriptSection: {
    padding: 20,
  },

  scriptHeaderRow: {
    marginBottom: 15,

    flexDirection: "row",

    alignItems: "center",
  },

  scriptMark: {
    width: 38,
    height: 38,

    marginRight: 10,

    borderRadius: 11,

    alignItems: "center",

    justifyContent: "center",
  },

  scriptLabel: {
    fontSize: 11,

    letterSpacing: 0.9,

    fontFamily: fonts.bold,
  },

  scriptHint: {
    marginTop: 2,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  hookText: {
    fontSize: 19,

    lineHeight: 29,

    letterSpacing: -0.2,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  ctaText: {
    fontSize: 17,

    lineHeight: 26,

    fontFamily: fonts.medium,

    color: colors.text,
  },

  scriptDivider: {
    height: 1,

    marginHorizontal: 18,

    backgroundColor: colors.divider,
  },

  points: {
    gap: 15,
  },

  pointRow: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  pointNumber: {
    width: 29,
    height: 29,

    marginRight: 11,

    borderRadius: radius.round,

    backgroundColor: colors.amberLight,

    alignItems: "center",

    justifyContent: "center",
  },

  pointNumberText: {
    fontSize: 10,

    fontFamily: fonts.bold,

    color: colors.amber,
  },

  pointText: {
    flex: 1,

    paddingTop: 2,

    fontSize: 16,

    lineHeight: 25,

    fontFamily: fonts.regular,

    color: colors.text,
  },

  referenceHeader: {
    marginBottom: 14,
  },

  referenceCard: {
    marginBottom: 32,

    padding: 15,

    borderRadius: 20,

    backgroundColor: colors.roseLight,
  },

  referenceTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  referenceIdentity: {
    flexDirection: "row",

    alignItems: "center",
  },

  referenceMark: {
    width: 38,
    height: 38,

    marginRight: 10,

    borderRadius: 12,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  referenceSource: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  referenceCategory: {
    marginTop: 3,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  referenceOpen: {
    width: 34,
    height: 34,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  referenceNote: {
    marginTop: 14,

    fontSize: 15,

    lineHeight: 23,

    fontFamily: fonts.medium,

    color: colors.text,
  },

  referenceUrl: {
    marginTop: 8,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  referenceActions: {
    minHeight: 45,

    marginTop: 12,

    borderTopWidth: 1,

    borderTopColor: "rgba(207,130,149,0.22)",

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",

    gap: 10,
  },

  openReferenceAction: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,
  },

  openReferenceText: {
    fontSize: 13,

    fontFamily: fonts.semibold,

    color: colors.rose,
  },

  savedInspirationAction: {
    paddingVertical: 4,
  },

  savedInspirationText: {
    fontSize: 12,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  flowSection: {
    marginTop: 2,
  },

  advanceButton: {
    minHeight: 68,

    marginTop: 13,

    paddingHorizontal: 13,

    borderRadius: 19,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  advanceInfo: {
    flexDirection: "row",

    alignItems: "center",
  },

  advanceMark: {
    width: 40,
    height: 40,

    marginRight: 11,

    borderRadius: 13,

    alignItems: "center",

    justifyContent: "center",
  },

  advanceEyebrow: {
    fontSize: 10,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  advanceText: {
    marginTop: 3,

    fontSize: 15,

    fontFamily: fonts.bold,
  },

  completedFlow: {
    minHeight: 68,

    marginTop: 13,

    paddingHorizontal: 13,

    borderRadius: 19,

    backgroundColor: colors.sageLight,

    flexDirection: "row",

    alignItems: "center",
  },

  completedMark: {
    width: 40,
    height: 40,

    marginRight: 11,

    borderRadius: 13,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",
  },

  completedTitle: {
    fontSize: 15,

    fontFamily: fonts.semibold,

    color: colors.sage,
  },

  completedText: {
    marginTop: 3,

    fontSize: 12,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  bottomDivider: {
    height: 1,

    marginTop: 32,

    backgroundColor: colors.divider,
  },

  deleteButton: {
    minHeight: 52,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,
  },

  deleteButtonText: {
    fontSize: 13,

    fontFamily: fonts.semibold,

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

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  errorTitle: {
    fontSize: 20,

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
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.surface,
  },
});
