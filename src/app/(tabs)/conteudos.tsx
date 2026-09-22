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
  radius,
  shadows,
  spacing,
  statusColors,
  typography,
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

  async function advanceStatus(content: ContentItem) {
    const nextStatus = getNextStatus(content.status);

    if (!nextStatus) {
      return;
    }

    await changeStatus(content, nextStatus);
  }

  async function changeStatus(content: ContentItem, status: ContentStatus) {
    try {
      await updateContent(content.id, {
        status,
      });

      setContents((current) =>
        current.map((item) =>
          item.id === content.id
            ? {
                ...item,
                status,
                updatedAt: new Date().toISOString(),
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
          updatedAt: new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error("Erro ao alterar etapa:", error);
    }
  }

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}`);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Conteúdos</Text>

            <Text style={styles.subtitle}>
              Acompanhe o que está em produção e continue de onde parou.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="layers-outline" size={22} color={colors.lavender} />
          </View>
        </View>

        <View style={styles.summary}>
          <SummaryItem
            value={activeCount}
            label="Em andamento"
            background={colors.terracottaLight}
            foreground={colors.terracotta}
          />

          <SummaryItem
            value={readyCount}
            label="Prontos"
            background={colors.sageLight}
            foreground={colors.sage}
          />

          <SummaryItem
            value={publishedCount}
            label="Publicados"
            background={colors.blueLight}
            foreground={colors.blue}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const selected = selectedFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                style={[styles.filter, selected && styles.filterSelected]}
                onPress={() => setSelectedFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.filterText,

                    selected && styles.filterTextSelected,
                  ]}
                >
                  {filter.label}

                  {filter.value !== "todos" && (
                    <Text> {getStatusCount(contents, filter.value)}</Text>
                  )}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.usageHint}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.lavender}
          />

          <Text style={styles.usageHintText}>
            Toque no card para abrir e editar. Use “Avançar” para mover o
            conteúdo no fluxo.
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>{getFilterTitle(selectedFilter)}</Text>

          <Text style={styles.listCount}>{visibleContents.length}</Text>
        </View>

        {visibleContents.length === 0 ? (
          <EmptyState filter={selectedFilter} />
        ) : (
          visibleContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onPress={() => openContent(content)}
              onAdvance={() => advanceStatus(content)}
              onOptions={() => setSelectedContent(content)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedContent !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedContent(null)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSelectedContent(null)}
          />

          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Alterar etapa</Text>

                <Text style={styles.sheetContentTitle} numberOfLines={2}>
                  {selectedContent?.idea}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedContent(null)}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetDescription}>
              Use essa opção quando quiser mover o conteúdo manualmente para uma
              etapa específica.
            </Text>

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
                    onPress={async () => {
                      await changeStatus(selectedContent, status);

                      setSelectedContent(null);
                    }}
                  >
                    <View
                      style={[
                        styles.statusOptionIcon,

                        {
                          backgroundColor: meta.background,
                        },
                      ]}
                    >
                      <Ionicons
                        name={meta.icon}
                        size={19}
                        color={meta.foreground}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.statusOptionTitle}>{meta.label}</Text>

                      <Text style={styles.statusOptionDescription}>
                        {getStatusDescription(status)}
                      </Text>
                    </View>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={meta.foreground}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.openContentButton}
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
              <Ionicons name="open-outline" size={18} color={colors.primary} />

              <Text style={styles.openContentButtonText}>Abrir conteúdo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type SummaryItemProps = {
  value: number;
  label: string;
  background: string;
  foreground: string;
};

function SummaryItem({
  value,
  label,
  background,
  foreground,
}: SummaryItemProps) {
  return (
    <View
      style={[
        styles.summaryItem,

        {
          backgroundColor: background,
        },
      ]}
    >
      <Text
        style={[
          styles.summaryValue,

          {
            color: foreground,
          },
        ]}
      >
        {value}
      </Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type ContentCardProps = {
  content: ContentItem;

  onPress: () => void;

  onAdvance: () => void;

  onOptions: () => void;
};

function ContentCard({
  content,
  onPress,
  onAdvance,
  onOptions,
}: ContentCardProps) {
  const status = getStatusMeta(content.status);

  const nextStatus = getNextStatus(content.status);

  const nextMeta = nextStatus ? getStatusMeta(nextStatus) : null;

  return (
    <TouchableOpacity
      style={styles.contentCard}
      activeOpacity={0.8}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View
          style={[
            styles.statusIcon,

            {
              backgroundColor: status.background,
            },
          ]}
        >
          <Ionicons name={status.icon} size={21} color={status.foreground} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardMeta}>
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

                <Text style={styles.formatText}>{content.format}</Text>
              </>
            )}

            {content.plannedDate && (
              <>
                <View style={styles.metaDot} />

                <Ionicons
                  name="calendar-outline"
                  size={11}
                  color={colors.textMuted}
                />

                <Text style={styles.dateText}>
                  {formatDate(content.plannedDate)}
                </Text>
              </>
            )}
          </View>

          <Text style={styles.contentTitle} numberOfLines={2}>
            {content.idea}
          </Text>

          <Text style={styles.openHint}>Toque para abrir e editar</Text>
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
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {nextStatus && nextMeta && (
        <TouchableOpacity
          style={[
            styles.advanceButton,

            {
              backgroundColor: nextMeta.background,
            },
          ]}
          activeOpacity={0.8}
          onPress={(event) => {
            event.stopPropagation();

            onAdvance();
          }}
        >
          <View style={styles.advanceContent}>
            <Text style={styles.advancePrefix}>Próxima etapa</Text>

            <Text
              style={[
                styles.advanceText,

                {
                  color: nextMeta.foreground,
                },
              ]}
            >
              Avançar para {nextMeta.label}
            </Text>
          </View>

          <View
            style={[
              styles.advanceIcon,

              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Ionicons
              name="arrow-forward"
              size={17}
              color={nextMeta.foreground}
            />
          </View>
        </TouchableOpacity>
      )}

      {content.status === "publicado" && (
        <View style={styles.publishedArea}>
          <Ionicons name="checkmark-circle" size={18} color={colors.sage} />

          <Text style={styles.publishedText}>Fluxo concluído</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

type EmptyStateProps = {
  filter: FilterValue;
};

function EmptyState({ filter }: EmptyStateProps) {
  const isAll = filter === "todos";

  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyStateIcon}>
        <Ionicons
          name={isAll ? "documents-outline" : "filter-outline"}
          size={27}
          color={colors.lavender}
        />
      </View>

      <Text style={styles.emptyStateTitle}>
        {isAll ? "Nenhum conteúdo criado ainda" : "Nenhum conteúdo nessa etapa"}
      </Text>

      <Text style={styles.emptyStateText}>
        {isAll
          ? "Quando você criar um conteúdo, ele aparecerá aqui para acompanhar o progresso."
          : "Escolha outro filtro ou avance um conteúdo para esta etapa."}
      </Text>

      {isAll && (
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => router.push("/conteudo/manual")}
        >
          <Ionicons name="add" size={18} color={colors.surface} />

          <Text style={styles.createButtonText}>Criar conteúdo</Text>
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
      return "Conteúdo ainda em desenvolvimento.";

    case "roteiro":
      return "Estruture o que será publicado.";

    case "gravar":
      return "Produza ou grave o conteúdo.";

    case "editar":
      return "Faça os ajustes finais.";

    case "pronto":
      return "Conteúdo pronto para publicar.";

    case "publicado":
      return "Conteúdo já finalizado e publicado.";
  }
}

function getStatusCount(contents: ContentItem[], status: ContentStatus) {
  return contents.filter((content) => content.status === status).length;
}

function getFilterTitle(filter: FilterValue) {
  switch (filter) {
    case "todos":
      return "Todos os conteúdos";

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

    paddingBottom: 110,
  },

  header: {
    paddingTop: spacing.md,

    paddingBottom: spacing.xl,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  title: {
    fontSize: typography.title,

    fontWeight: "700",

    color: colors.text,
  },

  subtitle: {
    marginTop: 4,

    maxWidth: 290,

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,
  },

  headerIcon: {
    width: 44,
    height: 44,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.lavenderLight,
  },

  summary: {
    flexDirection: "row",

    gap: spacing.sm,

    marginBottom: spacing.lg,
  },

  summaryItem: {
    flex: 1,

    minHeight: 72,

    borderRadius: radius.lg,

    padding: spacing.md,

    justifyContent: "center",
  },

  summaryValue: {
    fontSize: 22,

    fontWeight: "800",
  },

  summaryLabel: {
    marginTop: 3,

    fontSize: 9,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  filters: {
    gap: spacing.sm,

    paddingBottom: spacing.md,
  },

  filter: {
    paddingHorizontal: spacing.md,

    paddingVertical: 9,

    borderRadius: radius.round,

    backgroundColor: colors.surface,

    borderWidth: 1,

    borderColor: colors.border,
  },

  filterSelected: {
    backgroundColor: colors.primary,

    borderColor: colors.primary,
  },

  filterText: {
    fontSize: typography.caption,

    fontWeight: "600",

    color: colors.textSecondary,
  },

  filterTextSelected: {
    color: colors.surface,
  },

  usageHint: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,

    padding: spacing.md,

    marginBottom: spacing.xl,

    borderRadius: radius.md,

    backgroundColor: colors.lavenderLight,
  },

  usageHintText: {
    flex: 1,

    fontSize: typography.tiny,

    lineHeight: 15,

    color: colors.textSecondary,
  },

  listHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: spacing.md,
  },

  listTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  listCount: {
    minWidth: 30,

    height: 30,

    paddingHorizontal: 8,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    textAlign: "center",

    textAlignVertical: "center",

    lineHeight: 30,

    fontSize: typography.caption,

    fontWeight: "700",

    color: colors.textSecondary,
  },

  contentCard: {
    padding: spacing.md,

    marginBottom: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    backgroundColor: colors.surface,

    ...shadows.card,
  },

  cardTop: {
    flexDirection: "row",

    alignItems: "flex-start",
  },

  statusIcon: {
    width: 46,
    height: 46,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",

    marginRight: spacing.md,
  },

  cardContent: {
    flex: 1,

    minWidth: 0,
  },

  cardMeta: {
    minHeight: 16,

    flexDirection: "row",

    flexWrap: "wrap",

    alignItems: "center",
  },

  statusLabel: {
    fontSize: typography.tiny,

    fontWeight: "800",

    letterSpacing: 0.6,
  },

  metaDot: {
    width: 3,
    height: 3,

    marginHorizontal: 6,

    borderRadius: radius.round,

    backgroundColor: colors.textMuted,
  },

  formatText: {
    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  dateText: {
    marginLeft: 3,

    fontSize: typography.tiny,

    color: colors.textMuted,
  },

  contentTitle: {
    marginTop: 5,

    fontSize: typography.subheading,

    lineHeight: 21,

    fontWeight: "700",

    color: colors.text,
  },

  openHint: {
    marginTop: 5,

    fontSize: 9,

    color: colors.textMuted,
  },

  optionsButton: {
    width: 36,
    height: 36,

    marginLeft: spacing.sm,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceSoft,
  },

  advanceButton: {
    minHeight: 52,

    marginTop: spacing.md,

    paddingHorizontal: spacing.md,

    borderRadius: radius.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",
  },

  advanceContent: {
    flex: 1,
  },

  advancePrefix: {
    fontSize: 8,

    fontWeight: "700",

    letterSpacing: 0.5,

    color: colors.textMuted,
  },

  advanceText: {
    marginTop: 2,

    fontSize: typography.caption,

    fontWeight: "800",
  },

  advanceIcon: {
    width: 32,
    height: 32,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",
  },

  publishedArea: {
    minHeight: 44,

    marginTop: spacing.md,

    paddingHorizontal: spacing.md,

    borderRadius: radius.md,

    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    backgroundColor: colors.sageLight,
  },

  publishedText: {
    fontSize: typography.caption,

    fontWeight: "700",

    color: colors.sage,
  },

  emptyState: {
    alignItems: "center",

    paddingHorizontal: spacing.lg,

    paddingVertical: spacing.xxl,
  },

  emptyStateIcon: {
    width: 60,
    height: 60,

    borderRadius: radius.xl,

    alignItems: "center",

    justifyContent: "center",

    marginBottom: spacing.md,

    backgroundColor: colors.lavenderLight,
  },

  emptyStateTitle: {
    textAlign: "center",

    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  emptyStateText: {
    maxWidth: 310,

    marginTop: spacing.sm,

    textAlign: "center",

    fontSize: typography.body,

    lineHeight: 20,

    color: colors.textSecondary,
  },

  createButton: {
    minHeight: 48,

    marginTop: spacing.xl,

    paddingHorizontal: spacing.lg,

    borderRadius: radius.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    backgroundColor: colors.terracotta,
  },

  createButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.surface,
  },

  modalBackdrop: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },

  sheet: {
    paddingHorizontal: spacing.lg,

    paddingTop: 12,

    paddingBottom: spacing.xl,

    borderTopLeftRadius: radius.xxl,

    borderTopRightRadius: radius.xxl,

    backgroundColor: colors.background,
  },

  sheetHandle: {
    width: 42,
    height: 4,

    alignSelf: "center",

    marginBottom: spacing.lg,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.md,
  },

  sheetTitle: {
    fontSize: typography.heading,

    fontWeight: "700",

    color: colors.text,
  },

  sheetContentTitle: {
    marginTop: spacing.sm,

    fontSize: typography.body,

    lineHeight: 20,

    fontWeight: "600",

    color: colors.text,
  },

  closeButton: {
    width: 38,
    height: 38,

    borderRadius: radius.round,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.surfaceMuted,
  },

  sheetDescription: {
    marginTop: spacing.md,

    marginBottom: spacing.lg,

    fontSize: typography.caption,

    lineHeight: 18,

    color: colors.textSecondary,
  },

  statusOptions: {
    gap: spacing.sm,
  },

  statusOption: {
    minHeight: 64,

    paddingHorizontal: spacing.md,

    borderRadius: radius.lg,

    borderWidth: 1,

    borderColor: colors.border,

    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.surface,
  },

  statusOptionSelected: {
    borderColor: colors.primary,

    borderWidth: 1.5,
  },

  statusOptionIcon: {
    width: 38,
    height: 38,

    marginRight: spacing.md,

    borderRadius: radius.md,

    alignItems: "center",

    justifyContent: "center",
  },

  statusOptionTitle: {
    fontSize: typography.caption,

    fontWeight: "800",

    color: colors.text,
  },

  statusOptionDescription: {
    marginTop: 2,

    fontSize: 9,

    color: colors.textSecondary,
  },

  openContentButton: {
    height: 48,

    marginTop: spacing.lg,

    borderRadius: radius.md,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: spacing.sm,

    backgroundColor: colors.primaryLight,
  },

  openContentButtonText: {
    fontSize: typography.body,

    fontWeight: "700",

    color: colors.primary,
  },
});
