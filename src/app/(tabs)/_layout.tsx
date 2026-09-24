import { Ionicons } from "@expo/vector-icons";

import { Tabs, router } from "expo-router";

import { useEffect, useState } from "react";

import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors, fonts, radius, shadows, spacing } from "../../constants/theme";

import { getCreatorProfile } from "../../services/profileStorage";

export default function TabsLayout() {
  const [ready, setReady] = useState(false);

  const [createModalVisible, setCreateModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkProfile() {
      try {
        const profile = await getCreatorProfile();

        if (!mounted) {
          return;
        }

        if (!profile?.onboardingCompleted) {
          router.replace("/onboarding");

          return;
        }

        setReady(true);
      } catch (error) {
        console.error("Erro ao verificar onboarding:", error);

        if (mounted) {
          setReady(true);
        }
      }
    }

    checkProfile();

    return () => {
      mounted = false;
    };
  }, []);

  function closeAndNavigate(route: string) {
    setCreateModalVisible(false);

    setTimeout(() => {
      router.push(route as any);
    }, 160);
  }

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.terracotta} />
      </View>
    );
  }

  return (
    <>
      <Tabs
        backBehavior="history"
        screenOptions={{
          headerShown: false,

          tabBarActiveTintColor: colors.text,

          tabBarInactiveTintColor: colors.textSecondary,

          tabBarHideOnKeyboard: true,

          tabBarStyle: {
            position: "absolute",

            left: 14,
            right: 14,
            bottom: 12,

            height: 80,

            paddingTop: 9,
            paddingBottom: 9,

            borderTopWidth: 0,

            borderRadius: 24,

            backgroundColor: colors.surface,

            shadowColor: "#231F1C",

            shadowOffset: {
              width: 0,
              height: 7,
            },

            shadowOpacity: 0.1,

            shadowRadius: 18,

            elevation: 10,
          },

          tabBarItemStyle: {
            borderRadius: 18,
          },

          tabBarLabelStyle: {
            marginTop: 1,

            fontSize: 11,

            fontFamily: fonts.semibold,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Hoje",

            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="inspiracoes"
          options={{
            title: "Inspirações",

            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "bulb" : "bulb-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="criar"
          options={{
            title: "Criar",

            tabBarLabel: () => <Text style={styles.createLabel}>Criar</Text>,

            tabBarIcon: () => (
              <View style={styles.createIcon}>
                <Ionicons name="add" size={25} color={colors.surface} />
              </View>
            ),
          }}
          listeners={{
            tabPress: (event) => {
              event.preventDefault();

              setCreateModalVisible(true);
            },
          }}
        />

        <Tabs.Screen
          name="planejar"
          options={{
            title: "Planejar",

            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="conteudos"
          options={{
            title: "Conteúdos",

            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "layers" : "layers-outline"}
                size={23}
                color={color}
              />
            ),
          }}
        />

        <Tabs.Screen
          name="inspiracao/[id]"
          options={{
            href: null,
          }}
        />

        <Tabs.Screen
          name="conteudo/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>

      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setCreateModalVisible(false)}
          />

          <SafeAreaView edges={["bottom"]} style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>NOVO CONTEÚDO</Text>

                <Text style={styles.sheetTitle}>Como você quer começar?</Text>

                <Text style={styles.sheetSubtitle}>
                  Escolha um ponto de partida. Você poderá ajustar tudo depois.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                activeOpacity={0.8}
                onPress={() => setCreateModalVisible(false)}
              >
                <Ionicons name="close" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.options}>
              <TouchableOpacity
                style={styles.option}
                activeOpacity={0.84}
                onPress={() =>
                  closeAndNavigate("/conteudo/escolher-inspiracao")
                }
              >
                <View style={styles.optionMarkPrimary}>
                  <Ionicons
                    name="sparkles-outline"
                    size={21}
                    color={colors.terracotta}
                  />
                </View>

                <View style={styles.optionContent}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>Usar uma inspiração</Text>

                    <View style={styles.quickBadge}>
                      <Text style={styles.quickBadgeText}>MAIS RÁPIDO</Text>
                    </View>
                  </View>

                  <Text style={styles.optionText}>
                    Transforme uma referência salva em uma versão com a sua
                    identidade.
                  </Text>
                </View>

                <View style={styles.optionArrow}>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={colors.terracotta}
                  />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                activeOpacity={0.84}
                onPress={() => closeAndNavigate("/conteudo/manual")}
              >
                <View style={styles.optionMarkNeutral}>
                  <Ionicons
                    name="create-outline"
                    size={21}
                    color={colors.text}
                  />
                </View>

                <View style={styles.optionContent}>
                  <Text style={styles.optionTitle}>Começar do zero</Text>

                  <Text style={styles.optionText}>
                    Parta de uma ideia sua e construa o conteúdo passo a passo.
                  </Text>
                </View>

                <View style={styles.optionArrowNeutral}>
                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetNote}>
              <Ionicons
                name="information-circle-outline"
                size={15}
                color={colors.textMuted}
              />

              <Text style={styles.sheetNoteText}>
                Os dois caminhos terminam no mesmo fluxo de produção.
              </Text>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,

    alignItems: "center",

    justifyContent: "center",

    backgroundColor: colors.background,
  },

  createIcon: {
    width: 44,
    height: 44,

    borderRadius: 15,

    backgroundColor: colors.terracotta,

    alignItems: "center",

    justifyContent: "center",

    marginTop: -4,

    ...shadows.elevated,
  },

  createLabel: {
    marginTop: 4,

    fontSize: 11,

    fontFamily: fonts.bold,

    color: colors.terracotta,
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
    paddingTop: 10,
    paddingBottom: spacing.lg,
    borderRadius: radius.xxl,
    backgroundColor: colors.surface,
    ...shadows.elevated,
  },

  handle: {
    width: 36,
    height: 4,
    alignSelf: "center",
    marginBottom: 18,
    borderRadius: radius.round,
    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 18,
  },

  sheetHeaderCopy: {
    flex: 1,
    minWidth: 0,
  },

  sheetEyebrow: {
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  sheetTitle: {
    marginTop: 3,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.45,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  sheetSubtitle: {
    maxWidth: 310,
    marginTop: 5,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  closeButton: {
    width: 38,
    height: 38,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  options: {
    gap: 9,
  },

  option: {
    minHeight: 96,
    padding: 12,
    borderRadius: 17,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  optionMarkPrimary: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  optionMarkNeutral: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  optionContent: {
    flex: 1,
    minWidth: 0,
  },

  optionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },

  optionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontFamily: fonts.bold,
    color: colors.text,
  },

  optionText: {
    maxWidth: 260,
    marginTop: 4,
    fontSize: 11,
    lineHeight: 17,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
  },

  quickBadge: {
    minHeight: 22,
    paddingHorizontal: 7,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  quickBadgeText: {
    fontSize: 8,
    letterSpacing: 0.55,
    fontFamily: fonts.bold,
    color: colors.terracotta,
  },

  optionArrow: {
    width: 31,
    height: 31,
    borderRadius: radius.round,
    backgroundColor: colors.terracottaLight,
    alignItems: "center",
    justifyContent: "center",
  },

  optionArrowNeutral: {
    width: 31,
    height: 31,
    borderRadius: radius.round,
    backgroundColor: colors.surfaceMuted,
    alignItems: "center",
    justifyContent: "center",
  },

  sheetNote: {
    marginTop: 14,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
  },

  sheetNoteText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    fontFamily: fonts.regular,
    color: colors.textMuted,
  },
});
