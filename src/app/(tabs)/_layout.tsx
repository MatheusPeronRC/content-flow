import { Ionicons } from "@expo/vector-icons";
import { Tabs, router } from "expo-router";

import { View } from "react-native";

import { colors, shadows } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,

        tabBarInactiveTintColor: colors.textMuted,

        tabBarStyle: {
          height: 74,

          paddingTop: 8,
          paddingBottom: 8,

          backgroundColor: "#FAF7F1",

          borderTopWidth: 1,
          borderTopColor: colors.border,
        },

        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoje",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inspiracoes"
        options={{
          title: "Inspirações",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bulb-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="criar"
        options={{
          title: "",

          tabBarIcon: () => (
            <View
              style={{
                width: 58,
                height: 58,

                borderRadius: 29,

                backgroundColor: colors.terracotta,

                alignItems: "center",
                justifyContent: "center",

                marginTop: -22,

                borderWidth: 5,
                borderColor: "#FAF7F1",

                ...shadows.floating,
              }}
            >
              <Ionicons name="add" size={30} color={colors.surface} />
            </View>
          ),
        }}
        listeners={{
          tabPress: (event) => {
            event.preventDefault();

            router.push("/conteudo/novo");
          },
        }}
      />

      <Tabs.Screen
        name="planejar"
        options={{
          title: "Planejar",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="conteudos"
        options={{
          title: "Conteúdos",

          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
