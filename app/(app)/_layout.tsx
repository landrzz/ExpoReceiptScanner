import { Stack } from "expo-router";

export default function AppLayout() {
  return (
    <Stack
      screenOptions={({ route }) => ({
        headerShown: !route.name.startsWith("tempobook"),
      })}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="receipt-details" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
    </Stack>
  );
}
