import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RestaurantesHomeScreen } from "@/screens/restaurantes/RestaurantesHomeScreen";
import { RestauranteDetalleScreen } from "@/screens/restaurantes/RestauranteDetalleScreen";

export type RestaurantesStackParamList = {
  Home: { resetKey?: number; initialQuery?: string } | undefined;
  Detalle: { restauranteId: number };
};

const Stack = createNativeStackNavigator<RestaurantesStackParamList>();

export function RestaurantesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={RestaurantesHomeScreen} />
      <Stack.Screen name="Detalle" component={RestauranteDetalleScreen} />
    </Stack.Navigator>
  );
}

export default RestaurantesStack;
