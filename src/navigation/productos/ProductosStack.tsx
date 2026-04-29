import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ProductosHomeScreen } from "@/screens/productos/ProductosHomeScreen";
import { CategoriaScreen } from "@/screens/productos/CategoriaScreen";
import { ProductoDetalleScreen } from "@/screens/productos/ProductoDetalleScreen";

export type ProductosStackParamList = {
  Home: { resetKey?: number; initialQuery?: string } | undefined;
  Categoria: { catGeneral: string };
  Detalle: { productoId: number };
};

const Stack = createNativeStackNavigator<ProductosStackParamList>();

export function ProductosStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={ProductosHomeScreen} />
      <Stack.Screen name="Categoria" component={CategoriaScreen} />
      <Stack.Screen name="Detalle" component={ProductoDetalleScreen} />
    </Stack.Navigator>
  );
}
export default ProductosStack;