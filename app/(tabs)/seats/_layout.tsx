import { Stack } from "expo-router";

export default function SeatsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[seatId]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
