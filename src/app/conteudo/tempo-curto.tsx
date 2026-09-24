import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";

import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import InspirationThumbnail from "../../components/InspirationThumbnail";
import PlatformIcon from "../../components/PlatformIcon";
import { ProductionEffortBadge } from "../../components/ProductionEffortSelector";

import { getContents } from "../../services/contentStorage";
import { getInspirations } from "../../services/inspirationStorage";

import { ContentItem } from "../../types/content";
import { Inspiration } from "../../types/inspiration";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

export default function ShortOnTimeScreen() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [inspirations, setInspirations] = useState<Inspiration[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function load() {
        try {
          const [savedContents, savedInspirations] = await Promise.all([
            getContents(),
            getInspirations(),
          ]);

          if (!active) {
            return;
          }

          setContents(savedContents);
          setInspirations(savedInspirations);
        } catch (error) {
          console.error("Erro ao carregar opções rápidas:", error);
        }
      }

      void load();

      return () => {
        active = false;
      };
    }, []),
  );

  const quickContents = useMemo(
    () =>
      contents
        .filter(
          (content) =>
            content.productionEffort === "quick" &&
            content.status !== "publicado",
        )
        .sort(
          (a, b) =>
            getStatusPriority(b.status) - getStatusPriority(a.status) ||
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [contents],
  );

  const activeInspirationIds = useMemo(
    () =>
      new Set(
        contents
          .filter((content) => content.status !== "publicado")
          .map((content) => content.inspirationId)
          .filter((id): id is string => Boolean(id)),
      ),
    [contents],
  );

  const quickInspirations = useMemo(
    () =>
      inspirations.filter(
        (inspiration) =>
          inspiration.productionEffort === "quick" &&
          !activeInspirationIds.has(inspiration.id),
      ),
    [inspirations, activeInspirationIds],
  );

  const totalOptions = quickContents.length + quickInspirations.length;

  function openContent(content: ContentItem) {
    router.push(`/conteudo/${content.id}`);
  }

  function useInspiration(inspiration: Inspiration) {
    router.push({
      pathname: "/conteudo/adaptar",
      params: {
        inspirationId: inspiration.id,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            activeOpacity={0.8}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>MODO RÁPIDO</Text>
            <Text style={styles.headerTitle}>Tenho pouco tempo</Text>
          </View>

          <View style={styles.headerSpace} />
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Ionicons name="flash" size={22} color={colors.terracotta} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>
              Foque no que cabe no seu momento.
            </Text>

            <Text style={styles.heroText}>
              Aqui aparecem somente conteúdos e inspirações que você marcou como
              Rápido.
            </Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <SummaryItem
            value={quickContents.length}
            label="conteúdos"
            icon="document-text-outline"
          />

          <View style={styles.summaryDivider} />

          <SummaryItem
            value={quickInspirations.length}
            label="inspirações"
            icon="bulb-outline"
          />

          <View style={styles.summaryDivider} />

          <SummaryItem
            value={totalOptions}
            label="opções"
            icon="flash-outline"
            accent
          />
        </View>

        {totalOptions === 0 ? (
          <EmptyQuickState />
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Continue algo que já começou
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Conteúdos rápidos que ainda não foram publicados.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sectionLink}
                activeOpacity={0.8}
                onPress={() => router.push("/conteudos")}
              >
                <Text style={styles.sectionLinkText}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            {quickContents.length === 0 ? (
              <View style={styles.smallEmpty}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.smallEmptyText}>
                  Nenhum conteúdo rápido em andamento.
                </Text>
              </View>
            ) : (
              <View style={styles.contentList}>
                {quickContents.slice(0, 5).map((content) => (
                  <QuickContentCard
                    key={content.id}
                    content={content}
                    onPress={() => openContent(content)}
                  />
                ))}
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sectionTitle}>
                  Comece por uma referência
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Inspirações rápidas que ainda não viraram conteúdo ativo.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.sectionLink}
                activeOpacity={0.8}
                onPress={() => router.push("/inspiracoes")}
              >
                <Text style={styles.sectionLinkText}>Ver todas</Text>
              </TouchableOpacity>
            </View>

            {quickInspirations.length === 0 ? (
              <View style={styles.smallEmpty}>
                <Ionicons
                  name="images-outline"
                  size={20}
                  color={colors.textSecondary}
                />
                <Text style={styles.smallEmptyText}>
                  Nenhuma inspiração rápida disponível.
                </Text>
              </View>
            ) : (
              <View style={styles.inspirationGrid}>
                {quickInspirations.slice(0, 6).map((inspiration) => (
                  <QuickInspirationCard
                    key={inspiration.id}
                    inspiration={inspiration}
                    onPress={() => useInspiration(inspiration)}
                  />
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({
  value,
  label,
  icon,
  accent = false,
}: {
  value: number;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: boolean;
}) {
  return (
    <View style={styles.summaryItem}>
      <Ionicons
        name={icon}
        size={16}
        color={accent ? colors.terracotta : colors.textSecondary}
      />

      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function QuickContentCard({
  content,
  onPress,
}: {
  content: ContentItem;
  onPress: () => void;
}) {
  const thumbnail = content.reference?.thumbnailUrl ?? null;

  return (
    <TouchableOpacity
      style={styles.contentCard}
      activeOpacity={0.86}
      onPress={onPress}
    >
      <View style={styles.contentThumb}>
        {thumbnail ? (
          <Image source={{ uri: thumbnail }} style={styles.contentThumbImage} />
        ) : (
          <Ionicons
            name="document-text-outline"
            size={22}
            color={colors.textSecondary}
          />
        )}
      </View>

      <View style={styles.contentCardMain}>
        <View style={styles.cardMetaRow}>
          <ProductionEffortBadge effort={content.productionEffort} subtle />

          {content.format ? (
            <Text style={styles.formatText}>{content.format}</Text>
          ) : null}
        </View>

        <Text style={styles.cardTitle} numberOfLines={2}>
          {content.idea}
        </Text>

        <Text style={styles.cardHint}>
          {getStatusLabel(content.status)}
          {content.plannedDate ? " · já está no planejamento" : ""}
        </Text>
      </View>

      <View style={styles.goButton}>
        <Ionicons name="arrow-forward" size={17} color={colors.terracotta} />
      </View>
    </TouchableOpacity>
  );
}

function QuickInspirationCard({
  inspiration,
  onPress,
}: {
  inspiration: Inspiration;
  onPress: () => void;
}) {
  const title =
    inspiration.note?.trim() ||
    inspiration.mediaTitle?.trim() ||
    `Referência do ${inspiration.source}`;

  return (
    <TouchableOpacity
      style={styles.inspirationCard}
      activeOpacity={0.86}
      onPress={onPress}
    >
      <InspirationThumbnail
        thumbnailUrl={inspiration.thumbnailUrl}
        source={inspiration.source}
        variant="wide"
        style={styles.inspirationThumb}
        showSourceBadge={false}
      />

      <View style={styles.inspirationBody}>
        <View style={styles.inspirationPlatform}>
          <PlatformIcon source={inspiration.source} size={13} />
          <Text style={styles.inspirationSource}>{inspiration.source}</Text>
        </View>

        <Text style={styles.inspirationTitle} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.inspirationAction}>
          <Text style={styles.inspirationActionText}>Usar esta ideia</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.terracotta} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function EmptyQuickState() {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Ionicons name="flash-outline" size={25} color={colors.terracotta} />
      </View>

      <Text style={styles.emptyTitle}>Ainda não há opções rápidas.</Text>

      <Text style={styles.emptyText}>
        Classifique inspirações e conteúdos como Rápido para encontrá-los aqui
        quando o tempo estiver curto.
      </Text>

      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.emptyPrimary}
          activeOpacity={0.85}
          onPress={() => router.push("/inspiracoes")}
        >
          <Text style={styles.emptyPrimaryText}>Ver inspirações</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptySecondary}
          activeOpacity={0.85}
          onPress={() => router.push("/conteudos")}
        >
          <Text style={styles.emptySecondaryText}>Ver conteúdos</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStatusPriority(status: ContentItem["status"]) {
  switch (status) {
    case "pronto":
      return 6;
    case "editar":
      return 5;
    case "gravar":
      return 4;
    case "roteiro":
      return 3;
    case "ideia":
      return 2;
    case "publicado":
      return 1;
    default:
      return 0;
  }
}

function getStatusLabel(status: ContentItem["status"]) {
  switch (status) {
    case "ideia":
      return "Ideia";
    case "roteiro":
      return "Roteiro";
    case "gravar":
      return "Produzir";
    case "editar":
      return "Editar";
    case "pronto":
      return "Pronto";
    case "publicado":
      return "Publicado";
    default:
      return "Conteúdo";
  }
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 52,
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
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

  headerCopy: {
    flex: 1,
    marginHorizontal: 12,
    alignItems: "center",
  },

  headerEyebrow: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  headerTitle: {
    marginTop: 1,
    fontSize: 18,
    lineHeight: 23,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  headerSpace: {
    width: 42,
    height: 42,
  },

  hero: {
    marginTop: 8,
    padding: 17,
    borderRadius: 21,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    gap: 12,
    ...shadows.card,
  },

  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTitle: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  heroText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  summaryRow: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
  },

  summaryItem: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },

  summaryValue: {
    marginTop: 4,
    fontSize: 17,
    lineHeight: 21,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  summaryLabel: {
    marginTop: 1,
    fontSize: 10,
    lineHeight: 14,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  summaryDivider: {
    width: 1,
    backgroundColor: colors.divider,
  },

  sectionHeader: {
    marginTop: 29,
    marginBottom: 11,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },

  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
    letterSpacing: -0.35,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sectionSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  sectionLink: {
    minHeight: 32,
    justifyContent: "center",
  },

  sectionLinkText: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.terracotta,
  },

  contentList: {
    gap: 8,
  },

  contentCard: {
    minHeight: 88,
    padding: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
  },

  contentThumb: {
    width: 64,
    height: 64,
    overflow: "hidden",
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  contentThumbImage: {
    width: "100%",
    height: "100%",
  },

  contentCardMain: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 11,
  },

  cardMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  formatText: {
    fontSize: 11,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  cardTitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  cardHint: {
    marginTop: 3,
    fontSize: 11,
    lineHeight: 16,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  goButton: {
    width: 34,
    height: 34,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  inspirationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
  },

  inspirationCard: {
    width: "48.4%",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },

  inspirationThumb: {
    width: "100%",
    aspectRatio: 1.35,
    borderRadius: 0,
  },

  inspirationBody: {
    padding: 10,
  },

  inspirationPlatform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  inspirationSource: {
    fontSize: 10,
    fontFamily: fonts.medium,
    color: colors.textSecondary,
  },

  inspirationTitle: {
    minHeight: 38,
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    color: colors.text,
  },

  inspirationAction: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  inspirationActionText: {
    fontSize: 10,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  smallEmpty: {
    minHeight: 64,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  smallEmptyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  emptyState: {
    marginTop: 30,
    padding: 22,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },

  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 19,
    lineHeight: 25,
    fontFamily: fonts.bold,
    color: colors.text,
    textAlign: "center",
  },

  emptyText: {
    maxWidth: 310,
    marginTop: 6,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    textAlign: "center",
  },

  emptyActions: {
    width: "100%",
    marginTop: 18,
    gap: 8,
  },

  emptyPrimary: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: colors.terracotta,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyPrimaryText: {
    fontSize: 13,
    fontFamily: fonts.bold,
    color: colors.surface,
  },

  emptySecondary: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  emptySecondaryText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.text,
  },
});
