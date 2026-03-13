import { Stack } from "expo-router";
import { useEffect } from "react";
import { createTable, resetTable } from "../database/historyDatabase";

export default function RootLayout() {
  
  useEffect(() => {
    const initDB = async () => {
      try {
          //  resetTable(); // ⚠️ deletes the table
        await createTable();
        console.log("History table ready");
      } catch (error) {
        console.error("Failed to create table:", error);
      }
    };

    initDB();
  }, []);
  
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="scan" options={{ headerShown: false }} />
      <Stack.Screen name="preview" options={{ headerShown: false }} />
      <Stack.Screen name="results" options={{ headerShown: false }} />
      <Stack.Screen name="text-entry" options={{ headerShown: false }} />
      <Stack.Screen name="history" options={{ headerShown: false }} />
    </Stack>
  );
}
