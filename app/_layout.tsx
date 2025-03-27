import {
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, Fragment } from "react";
import "react-native-reanimated";
import "../global.css";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ensureStorageBucketExists } from "../lib/storage-service";
import { AuthProvider } from "../lib/auth-context";
import { supabase } from "../lib/supabase";
import AuthGuard from "../components/AuthGuard";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Make sure this is explicitly exported as default
export default function RootLayout(): JSX.Element {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      const { TempoDevtools } = require("tempo-devtools");
      TempoDevtools.init();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Initialize Supabase storage bucket
  useEffect(() => {
    const initializeStorage = async () => {
      try {
        // Get the current session
        const { data } = await supabase.auth.getSession();
        
        // Only initialize storage bucket if user is authenticated
        if (data.session?.user) {
          console.log("User authenticated, initializing storage bucket...");
          await ensureStorageBucketExists();
          console.log("Storage bucket initialization complete");
        } else {
          console.log("User not authenticated, skipping storage bucket initialization");
        }
      } catch (error) {
        // Just log the error without letting it crash the app
        console.error("Error initializing storage:", error);
      }
    };

    // Wrap in another try-catch to ensure app doesn't crash during initialization
    try {
      initializeStorage();
    } catch (e) {
      console.error("Failed to start initialization process:", e);
    }
  }, []);

  if (!loaded) {
    return <Fragment />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <AuthGuard>
            <Slot />
          </AuthGuard>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
