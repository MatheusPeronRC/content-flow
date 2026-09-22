import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";

import { Stack } from "expo-router";

import * as SplashScreen from "expo-splash-screen";

import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />

      <Stack.Screen
        name="inspiracao/nova"
        options={{
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="conteudo/roteiro"
        options={{
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="conteudo/gerar"
        options={{
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="inspiracao/[id]"
        options={{
          presentation: "card",
        }}
      />

      <Stack.Screen
        name="onboarding"
        options={{
          presentation: "card",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
