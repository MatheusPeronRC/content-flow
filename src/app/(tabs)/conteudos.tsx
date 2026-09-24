import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

import { getContents, updateContent } from "../../services/contentStorage";

import { ContentItem, ContentStatus } from "../../types/content";
import { ProductionEffort } from "../../types/productionEffort";

import {
  colors,
  fonts,
  radius,
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

type FilterValue = "todos" | "rascunho" | "andamento" | "pronto" | "publicado";

const filters: Array<{
  value: FilterValue;
  label: string;
}> = [
  { value: "todos", label: "Todos" },
  { value: "rascunho", label: "Rascunho" },
  { value: "andamento", label: "Em andamento" },
  { value: "pronto", label: "Pronto" },
  { value: "publicado", label: "Publicado" },
];

type EffortFilter = "all" | ProductionEffort;

const effortFilters: Array<{
  value: EffortFilter;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}> = [
  { value: "all", label: "Todos" },
  { value: "quick", label: "Rápidos", icon: "flash-outline" },
  { value: "medium", label: "Médios", icon: "time-outline" },
  { value: "demanding", label: "Demorados", icon: "layers-outline" },
];

export default function ContentsScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FilterValue>("todos");

  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null,
  );

  const [selectedEffort, setSelectedEffort] = useState<EffortFilter>("all");

  const [search, setSearch] = useState("");
  const [effortPanelVisible, setEffortPanelVisible] = useState(false);

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

      void loadContents();

      return () => {
        active = false;
      };
    }, []),
  );

  const visibleContents = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = contents.filter((content) => {
      if (!matchesStatusFilter(content.status, selectedFilter)) {
        return false;
      }

      if (
        selectedEffort !== "all" &&
        content.productionEffort !== selectedEffort
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = [
        content.idea,
        content.format,
        content.objective,
        content.status,
        content.reference?.mediaTitle,
        content.reference?.authorName,
        content.reference?.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });

    return [...filtered].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [contents, selectedFilter, selectedEffort, search]);

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

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}` as any);
  }

  function openCreate() {
    router.push("/conteudo/manual" as any);
  }

  const activeEffortLabel =
    effortFilters.find((item) => item.value === selectedEffort)?.label ??
    "Todos";

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Conteúdos</Text>

            <Text style={styles.subtitle}>
              Acompanhe e gerencie todos os seus conteúdos.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            activeOpacity={0.86}
            onPress={openCreate}
          >
            <Ionicons name="add" size={18} color={colors.surface} />

            <Text style={styles.createButtonText}>Criar conteúdo</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusFilters}
        >
          {filters.map((filter) => {
            const selected = selectedFilter === filter.value;

            return (
              <TouchableOpacity
                key={filter.value}
                style={[
                  styles.statusFilter,
                  selected && styles.statusFilterSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter.value)}
              >
                <Text
                  style={[
                    styles.statusFilterText,
                    selected && styles.statusFilterTextSelected,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.searchRow}>
          <View style={styles.searchField}>
            <Ionicons
              name="search-outline"
              size={19}
              color={colors.textSecondary}
            />

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar conteúdo..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              returnKeyType="search"
            />

            {search.length > 0 ? (
              <TouchableOpacity
                style={styles.clearSearch}
                activeOpacity={0.8}
                onPress={() => setSearch("")}
              >
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedEffort !== "all" && styles.filterButtonActive,
            ]}
            activeOpacity={0.82}
            onPress={() => setEffortPanelVisible((current) => !current)}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={selectedEffort !== "all" ? colors.terracotta : colors.text}
            />
          </TouchableOpacity>
        </View>

        {effortPanelVisible ? (
          <View style={styles.effortPanel}>
            <View style={styles.effortPanelHeader}>
              <View>
                <Text style={styles.effortTitle}>Esforço de produção</Text>

                <Text style={styles.effortSubtitle}>
                  Mostrando: {activeEffortLabel}
                </Text>
              </View>

              {selectedEffort !== "all" ? (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setSelectedEffort("all")}
                >
                  <Text style={styles.clearFilterText}>Limpar</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.effortFilters}>
              {effortFilters.map((filter) => {
                const selected = selectedEffort === filter.value;

                return (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.effortFilter,
                      selected && styles.effortFilterSelected,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setSelectedEffort(filter.value)}
                  >
                    {filter.icon ? (
                      <Ionicons
                        name={filter.icon}
                        size={14}
                        color={
                          selected ? colors.terracotta : colors.textSecondary
                        }
                      />
                    ) : null}

                    <Text
                      style={[
                        styles.effortFilterText,
                        selected && styles.effortFilterTextSelected,
                      ]}
                    >
                      {filter.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ) : null}

        <View style={styles.listHeader}>
          <Text style={styles.resultCount}>
            {visibleContents.length}{" "}
            {visibleContents.length === 1 ? "conteúdo" : "conteúdos"}
          </Text>
        </View>

        {visibleContents.length === 0 ? (
          <EmptyState
            hasSearch={Boolean(search.trim())}
            onCreate={openCreate}
          />
        ) : (
          <View style={styles.list}>
            {visibleContents.map((content) => (
              <ContentRow
                key={content.id}
                content={content}
                onOpen={() => openContent(content)}
                onStatusPress={() => setSelectedContent(content)}
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
                activeOpacity={0.8}
                onPress={() => setSelectedContent(null)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
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
                    activeOpacity={0.82}
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
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={colors.terracotta}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={17}
                        color={colors.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={styles.openContentAction}
              activeOpacity={0.82}
              onPress={() => {
                if (!selectedContent) {
                  return;
                }

                const content = selectedContent;
                setSelectedContent(null);

                setTimeout(() => {
                  openContent(content);
                }, 100);
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

function ContentRow({
  content,
  onOpen,
  onStatusPress,
}: {
  content: ContentItem;
  onOpen: () => void;
  onStatusPress: () => void;
}) {
  const status = getStatusMeta(content.status);
  const thumbnail = content.reference?.thumbnailUrl ?? null;

  return (
    <TouchableOpacity
      style={styles.contentRow}
      activeOpacity={0.86}
      onPress={onOpen}
    >
      <View style={styles.thumbnail}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.thumbnailImage} />
        ) : (
          <Ionicons name={status.icon} size={22} color={status.foreground} />
        )}
      </View>

      <View style={styles.rowMain}>
        <View style={styles.rowTitleLine}>
          <Text style={styles.rowTitle} numberOfLines={2}>
            {content.idea}
          </Text>

          <TouchableOpacity
            style={[
              styles.statusBadge,
              {
                backgroundColor: status.background,
              },
            ]}
            activeOpacity={0.78}
            onPress={(event) => {
              event.stopPropagation();
              onStatusPress();
            }}
          >
            <Text
              style={[
                styles.statusBadgeText,
                {
                  color: status.foreground,
                },
              ]}
            >
              {status.label}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metaRow}>
          {content.format ? (
            <View style={styles.metaPill}>
              <Ionicons
                name={getFormatIcon(content.format)}
                size={12}
                color={colors.textSecondary}
              />

              <Text style={styles.metaText}>{content.format}</Text>
            </View>
          ) : null}

          <ProductionEffortBadge effort={content.productionEffort} subtle />
        </View>

        <Text style={styles.dateText}>{formatContentDate(content)}</Text>
      </View>

      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

function EmptyState({
  hasSearch,
  onCreate,
}: {
  hasSearch: boolean;
  onCreate: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons
          name={hasSearch ? "search-outline" : "document-text-outline"}
          size={24}
          color={colors.terracotta}
        />
      </View>

      <Text style={styles.emptyTitle}>
        {hasSearch
          ? "Nenhum conteúdo encontrado."
          : "Sua produção começa aqui."}
      </Text>

      <Text style={styles.emptyText}>
        {hasSearch
          ? "Tente outro termo ou ajuste os filtros."
          : "Crie algo do zero ou transforme uma inspiração em conteúdo."}
      </Text>

      {!hasSearch ? (
        <TouchableOpacity
          style={styles.emptyButton}
          activeOpacity={0.85}
          onPress={onCreate}
        >
          <Ionicons name="add" size={18} color={colors.surface} />

          <Text style={styles.emptyButtonText}>Criar conteúdo</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function matchesStatusFilter(status: ContentStatus, filter: FilterValue) {
  switch (filter) {
    case "todos":
      return true;

    case "rascunho":
      return status === "ideia" || status === "roteiro";

    case "andamento":
      return status === "gravar" || status === "editar";

    case "pronto":
      return status === "pronto";

    case "publicado":
      return status === "publicado";
  }
}

function getStatusMeta(status: ContentStatus) {
  switch (status) {
    case "ideia":
      return {
        label: "Rascunho",
        icon: "bulb-outline" as const,
        ...statusColors.ideia,
      };

    case "roteiro":
      return {
        label: "Rascunho",
        icon: "create-outline" as const,
        ...statusColors.roteiro,
      };

    case "gravar":
      return {
        label: "Em andamento",
        icon: "videocam-outline" as const,
        ...statusColors.gravar,
      };

    case "editar":
      return {
        label: "Em andamento",
        icon: "cut-outline" as const,
        ...statusColors.editar,
      };

    case "pronto":
      return {
        label: "Pronto",
        icon: "checkmark-circle-outline" as const,
        ...statusColors.pronto,
      };

    case "publicado":
      return {
        label: "Publicado",
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

function getFormatIcon(format: string): keyof typeof Ionicons.glyphMap {
  const normalized = format.toLowerCase();

  if (normalized.includes("reel") || normalized.includes("vídeo")) {
    return "videocam-outline";
  }

  if (normalized.includes("carrossel")) {
    return "albums-outline";
  }

  if (normalized.includes("story")) {
    return "phone-portrait-outline";
  }

  return "image-outline";
}

function formatContentDate(content: ContentItem) {
  if (content.plannedDate) {
    const [year, month, day] = content.plannedDate.split("-").map(Number);

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("pt-BR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return new Date(content.updatedAt).toLocaleDateString("pt-BR", {
    day: "numeric",
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
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },

  title: {
    fontSize: 31,
    lineHeight: 38,
    letterSpacing: -0.9,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  subtitle: {
    maxWidth: 270,
    marginTop: 3,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  createButton: {
    minHeight: 42,
    marginTop: 2,
    paddingHorizontal: 13,
    borderRadius: 13,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  createButtonText: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  statusFilters: {
    gap: 7,
    paddingBottom: 16,
  },

  statusFilter: {
    minHeight: 37,
    paddingHorizontal: 13,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  statusFilterSelected: {
    backgroundColor: colors.terracotta,
    borderColor: colors.terracotta,
  },

  statusFilterText: {
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  statusFilterTextSelected: {
    color: colors.surface,
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  searchField: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: 13,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  searchInput: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 0,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.text,
  },

  clearSearch: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },

  filterButtonActive: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
  },

  effortPanel: {
    marginTop: 9,
    padding: 13,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  effortPanelHeader: {
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  effortTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  effortSubtitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  clearFilterText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  effortFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  effortFilter: {
    minHeight: 34,
    paddingHorizontal: 11,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  effortFilterSelected: {
    borderColor: colors.terracotta,
    backgroundColor: colors.terracottaLight,
  },

  effortFilterText: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.semibold,
    color: colors.textSecondary,
  },

  effortFilterTextSelected: {
    color: colors.terracotta,
  },

  listHeader: {
    minHeight: 47,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  resultCount: {
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },

  list: {
    overflow: "hidden",
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  contentRow: {
    minHeight: 97,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  thumbnail: {
    width: 66,
    height: 66,
    overflow: "hidden",
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  thumbnailImage: {
    width: "100%",
    height: "100%",
  },

  rowMain: {
    flex: 1,
    minWidth: 0,
  },

  rowTitleLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  rowTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  statusBadge: {
    minHeight: 25,
    maxWidth: 100,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    alignItems: "center",
    justifyContent: "center",
  },

  statusBadgeText: {
    fontSize: 9,
    lineHeight: 13,
    fontFamily: fonts.bold,
  },

  metaRow: {
    marginTop: 7,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },

  metaPill: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  metaText: {
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  dateText: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },

  emptyState: {
    marginTop: 22,
    padding: 24,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  emptyIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 14,
    fontSize: 18,
    lineHeight: 24,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 300,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  emptyButton: {
    minHeight: 46,
    marginTop: 17,
    paddingHorizontal: 15,
    borderRadius: 13,
    backgroundColor: colors.terracotta,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  emptyButtonText: {
    fontSize: 12,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlay,
  },

  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: 10,
    paddingBottom: 18,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    backgroundColor: colors.surface,
  },

  sheetHandle: {
    width: 42,
    height: 4,
    marginBottom: 18,
    alignSelf: "center",
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  sheetEyebrow: {
    fontSize: 9,
    letterSpacing: 0.75,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  sheetTitle: {
    marginTop: 3,
    fontSize: 20,
    lineHeight: 26,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sheetContent: {
    marginTop: 4,
    fontSize: 12,
    lineHeight: 18,
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
    marginTop: 18,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  statusOptions: {
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },

  statusOption: {
    minHeight: 61,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  statusOptionSelected: {
    backgroundColor: colors.background,
  },

  statusOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  statusOptionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  statusOptionText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  openContentAction: {
    minHeight: 48,
    marginTop: 12,
    borderRadius: 13,
    backgroundColor: colors.surfaceMuted,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },

  openContentText: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },
});
