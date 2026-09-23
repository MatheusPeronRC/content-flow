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
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>O que vamos criar?</Text>

                <Text style={styles.sheetSubtitle}>
                  Escolha como você quer começar.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCreateModalVisible(false)}
              >
                <Ionicons name="close" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.option, styles.inspirationOption]}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate("/conteudo/escolher-inspiracao")}
            >
              <View
                style={[
                  styles.optionMark,

                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Ionicons name="sparkles" size={22} color={colors.rose} />
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.optionTitleRow}>
                  <Text style={styles.optionTitle}>
                    A partir de uma inspiração
                  </Text>

                  <View style={styles.recommended}>
                    <Text style={styles.recommendedText}>RECOMENDADO</Text>
                  </View>
                </View>

                <Text style={styles.optionText}>
                  Transforme algo que você salvou na sua própria versão.
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={18} color={colors.rose} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, styles.scratchOption]}
              activeOpacity={0.85}
              onPress={() => closeAndNavigate("/conteudo/manual")}
            >
              <View
                style={[
                  styles.optionMark,

                  {
                    backgroundColor: colors.surface,
                  },
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={22}
                  color={colors.terracotta}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.optionTitle}>Começar do zero</Text>

                <Text style={styles.optionText}>
                  Pegue uma ideia sua e construa o conteúdo.
                </Text>
              </View>

              <Ionicons
                name="arrow-forward"
                size={18}
                color={colors.terracotta}
              />
            </TouchableOpacity>
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

    paddingTop: 12,

    paddingBottom: spacing.lg,

    borderRadius: radius.xxl,

    backgroundColor: colors.surface,
  },

  handle: {
    width: 36,
    height: 4,

    alignSelf: "center",

    marginBottom: spacing.lg,

    borderRadius: radius.round,

    backgroundColor: colors.border,
  },

  sheetHeader: {
    flexDirection: "row",

    alignItems: "flex-start",

    marginBottom: spacing.lg,
  },

  sheetTitle: {
    fontSize: 25,

    lineHeight: 32,

    letterSpacing: -0.5,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  sheetSubtitle: {
    marginTop: 5,

    fontSize: 14,

    lineHeight: 20,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  closeButton: {
    width: 40,
    height: 40,

    borderRadius: radius.round,

    backgroundColor: colors.surfaceMuted,

    alignItems: "center",

    justifyContent: "center",
  },

  option: {
    minHeight: 104,

    padding: spacing.md,

    flexDirection: "row",

    alignItems: "center",

    borderRadius: radius.xl,

    marginBottom: spacing.sm,
  },

  inspirationOption: {
    backgroundColor: colors.roseLight,
  },

  scratchOption: {
    backgroundColor: colors.terracottaLight,
  },

  optionMark: {
    width: 48,
    height: 48,

    marginRight: spacing.md,

    borderRadius: 15,

    alignItems: "center",

    justifyContent: "center",
  },

  optionTitleRow: {
    flexDirection: "row",

    alignItems: "center",

    flexWrap: "wrap",

    gap: 7,
  },

  optionTitle: {
    fontSize: 16,

    lineHeight: 22,

    fontFamily: fonts.bold,

    color: colors.text,
  },

  optionText: {
    maxWidth: 240,

    marginTop: 5,

    paddingRight: spacing.sm,

    fontSize: 13,

    lineHeight: 19,

    fontFamily: fonts.regular,

    color: colors.textSecondary,
  },

  recommended: {
    paddingHorizontal: 8,

    paddingVertical: 4,

    borderRadius: radius.round,

    backgroundColor: colors.surface,
  },

  recommendedText: {
    fontSize: 11,

    letterSpacing: 0.4,

    fontFamily: fonts.bold,

    color: colors.rose,
  },
});
