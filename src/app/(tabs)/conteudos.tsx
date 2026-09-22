import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
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
  typography,
} from "../../constants/theme";

type Filter = "todos" | ContentStatus;

const filters: {
  key: Filter;
  label: string;
}[] = [
  {
    key: "todos",
    label: "Todos",
  },
  {
    key: "roteiro",
    label: "Roteiro",
  },
  {
    key: "gravar",
    label: "Produzir",
  },
  {
    key: "editar",
    label: "Editar",
  },
  {
    key: "pronto",
    label: "Pronto",
  },
  {
    key: "publicado",
    label: "Publicado",
  },
];

const statusOrder: ContentStatus[] = [
  "ideia",
  "roteiro",
  "gravar",
  "editar",
  "pronto",
  "publicado",
];

export default function ConteudosScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);

  const [filter, setFilter] = useState<Filter>("todos");

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

  const filteredContents = useMemo(() => {
    if (filter === "todos") {
      return contents;
    }

    return contents.filter((content) => content.status === filter);
  }, [contents, filter]);

  const activeCount = contents.filter(
    (content) => content.status !== "publicado",
  ).length;

  const readyCount = contents.filter(
    (content) => content.status === "pronto",
  ).length;

  const publishedCount = contents.filter(
    (content) => content.status === "publicado",
  ).length;

  async function changeStatus(content: ContentItem, status: ContentStatus) {
    await updateContent(content.id, {
      status,
    });

    setContents((current) =>
      current.map((item) =>
        item.id === content.id
          ? {
              ...item,
              status,
            }
          : item,
      ),
    );

    setSelectedContent(null);
  }

  async function advanceStatus(content: ContentItem) {
    const currentIndex = statusOrder.indexOf(content.status);

    if (currentIndex < 0 || currentIndex === statusOrder.length - 1) {
      return;
    }

    await changeStatus(content, statusOrder[currentIndex + 1]);
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
              Acompanhe tudo que está em produção.
            </Text>
          </View>

          <View style={styles.headerIcon}>
            <Ionicons name="layers-outline" size={22} color={colors.primary} />
          </View>
        </View>

        <View style={styles.summary}>
          <SummaryItem value={activeCount} label="Em andamento" />

          <View style={styles.summaryDivider} />

          <SummaryItem value={readyCount} label="Prontos" />

          <View style={styles.summaryDivider} />

          <SummaryItem value={publishedCount} label="Publicados" />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((item) => {
            const selected = filter === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.filter, selected && styles.filterSelected]}
                onPress={() => setFilter(item.key)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selected && styles.filterTextSelected,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {filter === "todos"
              ? "Todos os conteúdos"
              : filters.find((item) => item.key === filter)?.label}
          </Text>

          <Text style={styles.listCount}>{filteredContents.length}</Text>
        </View>

        {filteredContents.length === 0 ? (
          <EmptyState />
        ) : (
          filteredContents.map((content) => (
            <ContentCard
              key={content.id}
              content={content}
              onPress={() => setSelectedContent(content)}
              onAdvance={() => advanceStatus(content)}
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

            <Text style={styles.sheetTitle}>Alterar etapa</Text>

            <Text style={styles.sheetContentTitle} numberOfLines={2}>
              {selectedContent?.idea}
            </Text>

            <Text style={styles.sheetDescription}>
              Em qual etapa esse conteúdo está agora?
            </Text>

            <View style={styles.statusOptions}>
              {statusOrder.map((status) => {
                const meta = getStatusMeta(status);

                const selected = selectedContent?.status === status;

                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      selected && styles.statusOptionSelected,
                    ]}
                    onPress={() => {
                      if (selectedContent) {
                        changeStatus(selectedContent, status);
                      }
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
                        color={colors.primary}
                      />
                    </View>

                    <Text
                      style={[
                        styles.statusOptionText,
                        selected && styles.statusOptionTextSelected,
                      ]}
                    >
                      {meta.label}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={20}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

type SummaryItemProps = {
  value: number;
  label: string;
};

function SummaryItem({ value, label }: SummaryItemProps) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>{value}</Text>

      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

type ContentCardProps = {
  content: ContentItem;
  onPress: () => void;
  onAdvance: () => void;
};

function ContentCard({ content, onPress, onAdvance }: ContentCardProps) {
  const meta = getStatusMeta(content.status);

  const nextStatus = getNextStatus(content.status);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View
        style={[
          styles.cardAccent,
          {
            backgroundColor: meta.background,
          },
        ]}
      >
        <Ionicons name={meta.icon} size={21} color={colors.primary} />
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardMeta}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: meta.background,
              },
            ]}
          >
            <Text style={styles.statusBadgeText}>{meta.label}</Text>
          </View>

          {content.format && (
            <Text style={styles.format}>{content.format}</Text>
          )}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {content.idea}
        </Text>

        {content.plannedDate && (
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={13}
              color={colors.textMuted}
            />

            <Text style={styles.dateText}>
              {formatDate(content.plannedDate)}
            </Text>
          </View>
        )}

        {nextStatus && (
          <TouchableOpacity
            style={styles.advanceButton}
            onPress={(event) => {
              event.stopPropagation();
              onAdvance();
            }}
          >
            <Text style={styles.advanceText}>
              Avançar para {getStatusMeta(nextStatus).label}
            </Text>

            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="documents-outline" size={28} color={colors.primary} />
      </View>

      <Text style={styles.emptyTitle}>Nada por aqui</Text>

      <Text style={styles.emptyDescription}>
        Seus conteúdos aparecerão aqui conforme você for criando.
      </Text>
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
        background: "#E7EFE9",
      };

    case "roteiro":
      return {
        label: "ROTEIRO",
        icon: "create-outline" as const,
        background: "#F4ECDD",
      };

    case "gravar":
      return {
        label: "PRODUZIR",
        icon: "videocam-outline" as const,
        background: "#F3E3DF",
      };

    case "editar":
      return {
        label: "EDITAR",
        icon: "cut-outline" as const,
        background: "#E8EAF6",
      };

    case "pronto":
      return {
        label: "PRONTO",
        icon: "checkmark-circle-outline" as const,
        background: "#E3F0E7",
      };

    case "publicado":
      return {
        label: "PUBLICADO",
        icon: "paper-plane-outline" as const,
        background: "#E4ECE8",
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
    fontSize: typography.body,
    color: colors.textSecondary,
  },

  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },

  summary: {
    height: 92,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.sm,
  },

  summaryItem: {
    flex: 1,
    alignItems: "center",
  },

  summaryValue: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.surface,
  },

  summaryLabel: {
    marginTop: 3,
    fontSize: typography.tiny,
    color: "#D7E3DE",
  },

  summaryDivider: {
    width: 1,
    height: 38,
    backgroundColor: "#456C61",
  },

  filters: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
    paddingBottom: spacing.xl,
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

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },

  listTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  listCount: {
    fontSize: typography.caption,
    fontWeight: "700",
    color: colors.textMuted,
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },

  cardAccent: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  cardContent: {
    flex: 1,
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
  },

  statusBadgeText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: colors.primary,
  },

  format: {
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  cardTitle: {
    marginTop: spacing.sm,
    paddingRight: spacing.sm,
    fontSize: typography.body,
    lineHeight: 20,
    fontWeight: "600",
    color: colors.text,
  },

  dateRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  dateText: {
    fontSize: typography.tiny,
    color: colors.textMuted,
  },

  advanceButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  advanceText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },

  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
    alignItems: "center",
  },

  emptyIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.round,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },

  emptyTitle: {
    fontSize: typography.subheading,
    fontWeight: "700",
    color: colors.text,
  },

  emptyDescription: {
    marginTop: spacing.sm,
    textAlign: "center",
    fontSize: typography.body,
    lineHeight: 20,
    color: colors.textSecondary,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.28)",
  },

  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: spacing.xl,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: radius.round,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginBottom: spacing.lg,
  },

  sheetTitle: {
    fontSize: typography.heading,
    fontWeight: "700",
    color: colors.text,
  },

  sheetContentTitle: {
    marginTop: spacing.sm,
    fontSize: typography.subheading,
    lineHeight: 22,
    fontWeight: "600",
    color: colors.text,
  },

  sheetDescription: {
    marginTop: 4,
    marginBottom: spacing.lg,
    fontSize: typography.caption,
    color: colors.textSecondary,
  },

  statusOptions: {
    gap: spacing.sm,
  },

  statusOption: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },

  statusOptionSelected: {
    borderColor: colors.primary,
  },

  statusOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  statusOptionText: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "600",
    color: colors.text,
  },

  statusOptionTextSelected: {
    color: colors.primary,
  },
});
