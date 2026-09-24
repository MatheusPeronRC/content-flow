import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/manrope";

import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

import { AuthProvider, useAuth } from "../contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  const fontsReady = fontsLoaded || !!fontError;

  return (
    <AuthProvider>
      <RootNavigator fontsReady={fontsReady} />
    </AuthProvider>
  );
}

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, loading } = useAuth();
  const pathname = usePathname();

  const appReady = fontsReady && !loading;
  const isPasswordRecoveryRoute = pathname === "/redefinir-senha";

  useEffect(() => {
    if (appReady) {
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Protected guard={isPasswordRecoveryRoute}>
        <Stack.Screen
          name="redefinir-senha"
          options={{
            presentation: "card",
            gestureEnabled: false,
          }}
        />
      </Stack.Protected>

      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" />
      </Stack.Protected>

      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" />

        <Stack.Screen
          name="perfil"
          options={{
            presentation: "card",
          }}
        />

        <Stack.Screen
          name="inspiracao/nova"
          options={{
            presentation: "modal",
          }}
        />

        <Stack.Screen
          name="conteudo/escolher-inspiracao"
          options={{
            presentation: "card",
          }}
        />

        <Stack.Screen
          name="conteudo/adaptar"
          options={{
            presentation: "card",
          }}
        />

        <Stack.Screen
          name="conteudo/manual"
          options={{
            presentation: "card",
          }}
        />

        <Stack.Screen
          name="conteudo/tempo-curto"
          options={{
            presentation: "card",
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
          name="onboarding"
          options={{
            presentation: "card",
            gestureEnabled: false,
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}
