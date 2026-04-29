import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NovedadesScreen } from "@/screens/novedades/NovedadesScreen";
import { NovedadDetalleScreen } from "@/screens/novedades/NovedadDetalleScreen";

export type NovedadesStackParamList = {
  Home: { resetKey?: number; initialQuery?: string; restaurantId?: number | null; mode?: "NOVEDADES" | "ANUNCIANTES" | null; fromRestaurant?: boolean | null } | undefined;
  Detalle: { newsId: number };
};

const Stack = createNativeStackNavigator<NovedadesStackParamList>();

export function NovedadesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={NovedadesScreen} />
      <Stack.Screen name="Detalle" component={NovedadDetalleScreen} />
    </Stack.Navigator>
  );
}

export default NovedadesStack;
