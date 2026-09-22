import { Ionicons } from "@expo/vector-icons";

import { router, useFocusEffect } from "expo-router";

import { useCallback, useMemo, useState } from "react";

import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { getContents, updateContent } from "../../services/contentStorage";

import { ContentItem, ContentStatus } from "../../types/content";

import {
  colors,
  fonts,
  radius,
  shadows,
  spacing,
  statusColors,
} from "../../constants/theme";

const statusOrder: ContentStatus[] = [
  "ideia",
  "roteiro",
  "gravar",
  "editar",
  "pronto",
  "publicado",
];

type FilterValue = "todos" | ContentStatus;

const filters: {
  value: FilterValue;
  label: string;
}[] = [
  {
    value: "todos",
    label: "Todos",
  },
  {
    value: "ideia",
    label: "Ideias",
  },
  {
    value: "roteiro",
    label: "Roteiro",
  },
  {
    value: "gravar",
    label: "Produzir",
  },
  {
    value: "editar",
    label: "Editar",
  },
  {
    value: "pronto",
    label: "Pronto",
  },
  {
    value: "publicado",
    label: "Publicado",
  },
];

export default function ContentsScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("todos");

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadContents() {
        try {
          const data = await getContents();

          if (active) {
            setContents(data);
          }
        } catch (error) {
          console.error("Erro ao carregar conteúdos:", error);
        }
      }

      loadContents();

      return () => {
        active = false;
      };
    }, []),
  );

  const visibleContents = useMemo(() => {
    const filtered =
      selectedFilter === "todos"
        ? contents
        : contents.filter((content) => content.status === selectedFilter);

    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [contents, selectedFilter]);

  const activeCount = contents.filter(
    (content) => content.status !== "publicado" && content.status !== "pronto",
  ).length;

  const readyCount = contents.filter(
    (content) => content.status === "pronto",
  ).length;

  const publishedCount = contents.filter(
    (content) => content.status === "publicado",
  ).length;

  async function changeStatus(content: ContentItem, status: ContentStatus) {
    try {
      const now = new Date().toISOString();

      await updateContent(content.id, {
        status,
      });

      setContents((current) =>
        current.map((item) =>
          item.id === content.id
            ? {
                ...item,
                status,
                updatedAt: now,
              }
            : item,
        ),
      );

      setSelectedContent((current) => {
        if (!current || current.id !== content.id) {
          return current;
        }

        return {
          ...current,
          status,
          updatedAt: now,
        };
      });
    } catch (error) {
      console.error("Erro ao alterar etapa:", error);
    }
  }

  async function advanceStatus(content: ContentItem) {
    const nextStatus = getNextStatus(content.status);

    if (!nextStatus) {
      return;
    }

    await changeStatus(content, nextStatus);
  }

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}` as any);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Conteúdos</Text>

            <Text style={styles.subtitle}>Tudo que está ganhando forma.</Text>
          </View>

          <View style={styles.headerMark}>
            <Ionicons name="layers-outline" size={21} color={colors.lavender} />
          </View>
        </View>

        <View style={styles.overview}>
          <OverviewItem
            value={activeCount}
            label="em andamento"
            color={colors.terracotta}
          />

          <View style={styles.overviewDivider} />

          <OverviewItem
            value={readyCount}
            label="prontos"
            color={colors.sage}
          />

          <View style={styles.overviewDivider} />

          <OverviewItem
            value={publishedCount}
            label="publicados"
            color={colors.blue}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const selected = selectedFilter === filter.value;

            const count =
              filter.value === "todos"
                ? contents.length
                : getStatusCount(contents, filter.value);

            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filter, selected && styles.filterSelected]}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterText,

                    selected && styles.filterTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>

                {count > 0 && (
                  <View
                    style={[
                      styles.filterCount,

                      selected && styles.filterCountSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,

                        selected && styles.filterCountTextSelected,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listHeader}>
          <View>
            <Text style={styles.listTitle}>
              {getFilterTitle(selectedFilter)}
            </Text>

            <Text style={styles.listSubtitle}>
              {getFilterSubtitle(selectedFilter, visibleContents.length)}
            </Text>
          </View>
        </View>

        {visibleContents.length === 0 ? (
          <EmptyState filter={selectedFilter} />
        ) : (
          <View style={styles.list}>
            {visibleContents.map((content) => (
              <ContentCard
                key={content.id}
                content={content}
                onOpen={() => openContent(content)}
                onAdvance={() => advanceStatus(content)}
                onOptions={() => setSelectedContent(content)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedContent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedContent(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedContent(null)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetEyebrow}>ORGANIZAR CONTEÚDO</Text>

                <Text style={styles.sheetTitle}>Alterar etapa</Text>

                <Text style={styles.sheetContent} numberOfLines={2}>
                  {selectedContent?.idea}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sheetClose}
                onPress={() => setSelectedContent(null)}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetHint}>Escolha uma etapa do fluxo.</Text>

            <View style={styles.statusOptions}>
              {statusOrder.map((status) => {
                if (!selectedContent) {
                  return null;
                }

                const meta = getStatusMeta(status);

                const selected = selectedContent.status === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,

                      selected && styles.statusOptionSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={async () => {
                      await changeStatus(selectedContent, status);

                      setSelectedContent(null);
                    }}
                  >
                    <View
                      style={[
                        styles.statusOptionMark,

                        {
                          backgroundColor: meta.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={18}
                        color={meta.foreground}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusOptionTitle}>{meta.label}</Text>

                      <Text style={styles.statusOptionText}>
                        {getStatusDescription(status)}
                      </Text>
                    </View>

                    {selected ? (
                      <View
                        style={[
                          styles.selectedStatus,

                          {
                            backgroundColor: meta.foreground,
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark"
                          size={13}
                          color={colors.surface}
                        />
                      </View>
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={colors.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.openContentAction}
              activeOpacity={0.8}
              onPress={() => {
                if (!selectedContent) {
                  return;
                }

                const content = selectedContent;

                setSelectedContent(null);

                setTimeout(() => {
                  openContent(content);
                }, 150);
              }}
            >
              <Text style={styles.openContentText}>Abrir conteúdo</Text>

              <Ionicons
                name="arrow-forward"
                size={17}
                color={colors.terracotta}
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type OverviewItemProps = {
  value: number;
  label: string;
  color: string;
};

function OverviewItem({ value, label, color }: OverviewItemProps) {
  return (
    <View style={styles.overviewItem}>
      <Text
        style={[
          styles.overviewValue,
          {
            color,
          },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.overviewLabel}>{label}</Text>
    </View>
  );
}

type ContentCardProps = {
  content: ContentItem;
  onOpen: () => void;
  onAdvance: () => void;
  onOptions: () => void;
};

function ContentCard({
  content,
  onOpen,
  onAdvance,
  onOptions,
}: ContentCardProps) {
  const status = getStatusMeta(content.status);

  const nextStatus = getNextStatus(content.status);

  const nextMeta = nextStatus ? getStatusMeta(nextStatus) : null;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.88} onPress={onOpen}>
      <View
        style={[
          styles.cardAccent,

          {
            backgroundColor: status.foreground,
          },
        ]}
      />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardMeta}>
            <View
              style={[
                styles.statusMark,

                {
                  backgroundColor: status.background,
                },
              ]}
            >
              <Ionicons
                name={status.icon}
                size={16}
                color={status.foreground}
              />
            </View>

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

            {content.format && (
              <>
                <View style={styles.metaDot} />

                <Text style={styles.metaText}>{content.format}</Text>
              </>
            )}

            {content.plannedDate && (
              <>
                <View style={styles.metaDot} />

                <Text style={styles.metaText}>
                  {formatDate(content.plannedDate)}
                </Text>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.optionsButton}
            activeOpacity={0.8}
            onPress={(event) => {
              event.stopPropagation();

              onOptions();
            }}
          >
            <Ionicons
              name="ellipsis-horizontal"
              size={19}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.cardTitle} numberOfLines={3}>
          {content.idea}
        </Text>

        {nextStatus && nextMeta ? (
          <>
            <View style={styles.cardDivider} />

            <TouchableOpacity
              style={styles.nextAction}
              activeOpacity={0.8}
              onPress={(event) => {
                event.stopPropagation();

                onAdvance();
              }}
            >
              <View>
                <Text style={styles.nextEyebrow}>PRÓXIMA ETAPA</Text>

                <Text
                  style={[
                    styles.nextText,

                    {
                      color: nextMeta.foreground,
                    },
                  ]}
                >
                  {nextMeta.label}
                </Text>
              </View>

              <View
                style={[
                  styles.nextArrow,

                  {
                    backgroundColor: nextMeta.background,
                  },
                ]}
              >
                <Ionicons
                  name="arrow-forward"
                  size={16}
                  color={nextMeta.foreground}
                />
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.cardDivider} />

            <View style={styles.finishedArea}>
              <View style={styles.finishedMark}>
                <Ionicons name="checkmark" size={14} color={colors.sage} />
              </View>

              <View>
                <Text style={styles.finishedTitle}>Fluxo concluído</Text>

                <Text style={styles.finishedText}>
                  Esse conteúdo já foi publicado.
                </Text>
              </View>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function EmptyState({ filter }: { filter: FilterValue }) {
  const all = filter === "todos";

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyVisual}>
        <View style={styles.emptyVisualOne} />

        <View style={styles.emptyVisualTwo} />

        <View style={styles.emptyVisualIcon}>
          <Ionicons
            name={all ? "sparkles-outline" : "layers-outline"}
            size={24}
            color={colors.lavender}
          />
        </View>
      </View>

      <Text style={styles.emptyTitle}>
        {all ? "Sua produção começa aqui." : "Nada nessa etapa agora."}
      </Text>

      <Text style={styles.emptyText}>
        {all
          ? "Crie algo do zero ou transforme uma referência que você salvou."
          : "Seus conteúdos aparecerão aqui conforme avançarem pelo fluxo."}
      </Text>

      {all && (
        <TouchableOpacity
          style={styles.emptyAction}
          activeOpacity={0.85}
          onPress={() => router.push("/conteudo/manual" as any)}
        >
          <Ionicons name="add" size={18} color={colors.surface} />

          <Text style={styles.emptyActionText}>Criar conteúdo</Text>
        </TouchableOpacity>
      )}
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

function getStatusDescription(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return "Uma ideia que ainda está tomando forma.";

    case "roteiro":
      return "Estruture o que você quer comunicar.";

    case "gravar":
      return "Hora de produzir ou gravar.";

    case "editar":
      return "Refine antes de publicar.";

    case "pronto":
      return "Tudo pronto para ir ao ar.";

    case "publicado":
      return "Conteúdo finalizado e publicado.";
  }
}

function getStatusCount(contents: ContentItem[], status: ContentStatus) {
  return contents.filter((content) => content.status === status).length;
}

function getFilterTitle(filter: FilterValue) {
  switch (filter) {
    case "todos":
      return "Sua produção";

    case "ideia":
      return "Ideias";

    case "roteiro":
      return "Em roteiro";

    case "gravar":
      return "Para produzir";

    case "editar":
      return "Para editar";

    case "pronto":
      return "Prontos";

    case "publicado":
      return "Publicados";
  }
}

function getFilterSubtitle(filter: FilterValue, count: number) {
  if (count === 0) {
    return "Nenhum conteúdo por aqui.";
  }

  if (filter === "todos") {
    return count === 1
      ? "1 conteúdo no seu fluxo."
      : `${count} conteúdos no seu fluxo.`;
  }

  return count === 1
    ? "1 conteúdo nesta etapa."
    : `${count} conteúdos nesta etapa.`;
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,

    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,

    paddingBottom: 135,
  },

  header: {
    paddingTop: spacing.lg,

    paddingBottom: 28,

    flexDirection: "row",

    alignItems: "flex-start",

    justifyContent: "space-between",

    gap: spacing.md,
  },

  title: {
    fontSize: 32,

    lineHeight: 38,

    letterSpacing: -1,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  subtitle: {
    marginTop: 4,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  headerMark: {
    width: 42,
    height: 42,

    marginTop: 3,

    borderRadius: 14,

    backgroundColor: colors.lavenderLight,

    alignItems: "center",

    justifyContent: "center",
  },

  overview: {
    minHeight: 76,

    marginBottom: 26,

    paddingVertical: 15,

    paddingHorizontal: 10,

    flexDirection: "row",

    alignItems: "center",

    borderTopWidth: 1,

    borderBottomWidth: 1,

    borderColor: colors.divider,
  },

  overviewItem: {
    flex: 1,

    alignItems: "center",
  },

  overviewValue: {
    fontSize: 21,

    lineHeight: 26,

    fontFamily: fonts.bold,
  },

  overviewLabel: {
    marginTop: 2,

    fontSize: 9,

    fontFamily: fonts.medium,

    color: colors.textSecondary,
  },

  overviewDivider: {
    width: 1,

    height: 33,

    backgroundColor: colors.divider,
  },

  filters: {
    gap: 8,

    paddingBottom: 30,
  },

  filter: {
    minHeight: 36,

    paddingHorizontal: 14,

    flexDirection: "row",

    alignItems: "center",

    gap: 6,

    borderRadius: radius.round,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,
  },

  filterSelected: {
    backgroundColor: colors.text,

    borderColor: colors.text,
  },

  filterText: {
    fontSize: 10,

    fontFamily: fonts.semibold,

    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.surface,
  },

  filterCount: {
    minWidth: 18,

    height: 18,

    paddingHorizontal: 4,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceMuted,
  },

  filterCountSelected: {
    backgroundColor: colors.inkSoft,
  },

  filterCountText: {
    fontSize: 8,

    fontFamily: fonts.bold,

    color: colors.textSecondary,
  },

  filterCountTextSelected: {
    color: colors.surface,
  },

  listHeader: {
    marginBottom: 14,
  },

  listTitle: {
    fontSize: 22,

    lineHeight: 28,

    letterSpacing: -0.6,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  listSubtitle: {
    marginTop: 3,

    fontSize: 11,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  list: {
    gap: 12,
  },

  card: {
    position: "relative",

    overflow: "hidden",

    borderRadius: 21,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,

    ...shadows.soft,
  },

  cardAccent: {
    position: "absolute",

    left: 0,
    top: 15,
    bottom: 15,

    width: 3,

    borderRadius: radius.round,
  },

  cardBody: {
    paddingTop: 15,

    paddingRight: 15,

    paddingBottom: 11,

    paddingLeft: 18,
  },

  cardTop: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    gap: 8,
  },

  cardMeta: {
    flex: 1,

    minWidth: 0,

    flexDirection: "row",

    alignItems: "center",
  },

  statusMark: {
    width: 29,
    height: 29,

    marginRight: 9,

    borderRadius: 9,

    alignItems: "center",

    justifyContent: "center",
  },

  statusLabel: {
    fontSize: 8,

    letterSpacing: 0.7,

    fontFamily: fonts.bold,
  },

  metaDot: {
    width: 3,
    height: 3,

    marginHorizontal: 6,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  metaText: {
    fontSize: 9,

    fontFamily: fonts.regular,

    color: colors.textMuted,
  },

  optionsButton: {
    width: 34,
    height: 34,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceSoft,
  },

  cardTitle: {
    maxWidth: 315,

    marginTop: 14,

    fontSize: 17,

    lineHeight: 23,

    letterSpacing: -0.25,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  cardDivider: {
    height: 1,

    marginTop: 16,

    backgroundColor: colors.divider,
  },

  nextAction: {
    minHeight: 58,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  nextEyebrow: {
    fontSize: 7,

    letterSpacing: 0.8,

    fontFamily: fonts.bold,

    color: colors.textMuted,
  },

  nextText: {
    marginTop: 3,

    fontSize: 12,

    letterSpacing: 0.2,

    fontFamily: fonts.bold,
  },

  nextArrow: {
    width: 34,
    height: 34,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  finishedArea: {
    minHeight: 58,

    flexDirection: "row",

    alignItems: "center",
  },

  finishedMark: {
    width: 31,
    height: 31,

    marginRight: 10,

    borderRadius: radius.round,

    backgroundColor: colors.sageLight,

    alignItems: "center",

    justifyContent: "center",
  },

  finishedTitle: {
    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.sage,
  },

  finishedText: {
    marginTop: 1,

    fontSize: 9,

    fontFamily: fonts.regular,

    color: colors.textMuted,
  },

  emptyState: {
    alignItems: "center",

    paddingTop: 48,

    paddingHorizontal: spacing.lg,
  },

  emptyVisual: {
    width: 94,
    height: 82,

    position: "relative",

    marginBottom: 24,
  },

  emptyVisualOne: {
    position: "absolute",

    left: 5,
    top: 8,

    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: colors.terracottaLight,

    transform: [
      {
        rotate: "-7deg",
      },
    ],
  },

  emptyVisualTwo: {
    position: "absolute",

    right: 4,
    bottom: 2,

    width: 58,
    height: 58,

    borderRadius: 18,

    backgroundColor: colors.lavenderLight,

    transform: [
      {
        rotate: "7deg",
      },
    ],
  },

  emptyVisualIcon: {
    position: "absolute",

    left: 29,
    top: 25,

    width: 42,
    height: 42,

    borderRadius: 14,

    backgroundColor: colors.surface,

    alignItems: "center",

    justifyContent: "center",

    ...shadows.soft,
  },

  emptyTitle: {
    maxWidth: 310,

    fontSize: 21,

    lineHeight: 27,

    letterSpacing: -0.4,

    textAlign: "center",

    fontFamily: fonts.bold,

    color: colors.text,
  },

  emptyText: {
    maxWidth: 295,

    marginTop: 7,

    fontSize: 12,

    lineHeight: 18,

    textAlign: "center",

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  emptyAction: {
    minHeight: 48,

    marginTop: 22,

    paddingHorizontal: 19,

    borderRadius: 15,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    backgroundColor: colors.terracotta,
  },

  emptyActionText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.surface,
  },

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: colors.overlay,
  },

  sheet: {
    marginHorizontal: 10,

    marginBottom: 8,

    paddingHorizontal: spacing.lg,

    paddingTop: 12,

    paddingBottom: spacing.lg,

    borderRadius: radius.xxl,

    backgroundColor: colors.surface,
  },

  sheetHandle: {
    width: 36,
    height: 4,

    alignSelf: "center",

    marginBottom: 22,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: 12,
  },

  sheetEyebrow: {
    marginBottom: 5,

    fontSize: 8,

    letterSpacing: 1,

    fontFamily: fonts.bold,

    color: colors.lavender,
  },

  sheetTitle: {
    fontSize: 23,

    lineHeight: 29,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sheetContent: {
    maxWidth: 275,

    marginTop: 5,

    fontSize: 11,

    lineHeight: 17,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  sheetClose: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  sheetHint: {
    marginTop: 24,

    marginBottom: 11,

    fontSize: 11,

    fontFamily: fonts.semibold,

    color: colors.text,
  },

  statusOptions: {
    gap: 8,
  },

  statusOption: {
    minHeight: 61,

    paddingHorizontal: 12,

    borderRadius: 17,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surface,
  },

  statusOptionSelected: {
    backgroundColor: colors.surfaceSoft,

    borderColor: colors.text,
  },

  statusOptionMark: {
    width: 37,
    height: 37,

    marginRight: 12,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",
  },

  statusOptionTitle: {
    fontSize: 10,

    letterSpacing: 0.4,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  statusOptionText: {
    marginTop: 2,

    fontSize: 9,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  selectedStatus: {
    width: 23,
    height: 23,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  openContentAction: {
    minHeight: 48,

    marginTop: 18,

    paddingHorizontal: 3,

    borderTopWidth: 1,

    borderTopColor: colors.divider,

    flexDirection: "row",

    alignItems: "flex-end",

    justifyContent: "space-between",
  },

  openContentText: {
    fontSize: 12,

    fontFamily: fonts.semibold,

    color: colors.terracotta,
  },
});
