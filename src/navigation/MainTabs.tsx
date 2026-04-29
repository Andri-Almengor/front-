import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { HomeScreen } from "@/screens/home/HomeScreen";
import { ProductosStack } from "@/navigation/productos/ProductosStack";
import { NovedadesStack } from "@/navigation/novedades/NovedadesStack";
import { RestaurantesStack } from "@/navigation/restaurantes/RestaurantesStack";
import { DonacionesScreen } from "@/screens/donaciones/DonacionesScreen";
import { AppIcon } from "@/components/AppIcon";
import { emitTabReset } from "@/lib/ui/tabReset";
import { setCurrentTab } from "@/lib/ui/activeTab";
import { useTheme } from "@/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import Ionicons from "@expo/vector-icons/Ionicons";
import { SwipeTabContainer } from "@/navigation/SwipeTabContainer";

export type MainTabsParamList = {
  Inicio: undefined;
  Productos: undefined;
  Novedades: undefined;
  Restaurantes: undefined;
  Donaciones: undefined;
};

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { palette: c } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        animation: "shift",
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: c.primary,
        tabBarInactiveTintColor: c.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", paddingBottom: 1 },
        tabBarStyle: {
          height: 64 + bottomInset,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: bottomInset,
          backgroundColor: c.card,
          elevation: 8,
          shadowOpacity: 0.08,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -2 },
        },
        tabBarItemStyle: {
          paddingBottom: 2,
          minHeight: 48,
        },
        tabBarBackground: () => <View style={{ flex: 1, backgroundColor: c.card }} />,
        tabBarIcon: ({ color, size, focused }) => {
          if (route.name === "Inicio") return <AppIcon name="home" size={(size ?? 22) + (focused ? 2 : 0)} opacity={focused ? 1 : 0.72} />;
          if (route.name === "Productos") return <AppIcon name="lista" size={(size ?? 22) + (focused ? 2 : 0)} opacity={focused ? 1 : 0.72} />;
          if (route.name === "Novedades") return <AppIcon name="novedades" size={(size ?? 22) + (focused ? 2 : 0)} opacity={focused ? 1 : 0.72} />;
          if (route.name === "Restaurantes") return <AppIcon name="restYComer" size={(size ?? 22) + (focused ? 2 : 0)} opacity={focused ? 1 : 0.72} />;
          return <Ionicons name={focused ? "heart" : "heart-outline"} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        options={{ tabBarLabel: t("home") }}
        listeners={{ focus: () => { setCurrentTab("Inicio"); emitTabReset("Inicio"); } }}
      >
        {() => (
          <SwipeTabContainer currentTab="Inicio">
            <HomeScreen />
          </SwipeTabContainer>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Productos"
        options={{ tabBarLabel: t("products") }}
        listeners={({ navigation }) => ({
          focus: () => { setCurrentTab("Productos"); emitTabReset("Productos"); },
          tabPress: () => {
            emitTabReset("Productos");
            navigation.navigate("Productos" as never, { screen: "Home", params: { resetKey: Date.now() } } as never);
          },
        })}
      >
        {() => (
          <SwipeTabContainer currentTab="Productos">
            <ProductosStack />
          </SwipeTabContainer>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Novedades"
        options={{ tabBarLabel: t("news") }}
        listeners={({ navigation }) => ({
          focus: () => { setCurrentTab("Novedades"); emitTabReset("Novedades"); },
          tabPress: () => {
            emitTabReset("Novedades");
            navigation.navigate("Novedades" as never, { screen: "Home", params: { resetKey: Date.now(), restaurantId: null, mode: null, fromRestaurant: null } } as never);
          },
        })}
      >
        {() => (
          <SwipeTabContainer currentTab="Novedades">
            <NovedadesStack />
          </SwipeTabContainer>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Restaurantes"
        options={{ tabBarLabel: t("restaurantsTab") }}
        listeners={({ navigation }) => ({
          focus: () => { setCurrentTab("Restaurantes"); emitTabReset("Restaurantes"); },
          tabPress: () => {
            emitTabReset("Restaurantes");
            navigation.navigate("Restaurantes" as never, { screen: "Home", params: { resetKey: Date.now() } } as never);
          },
        })}
      >
        {() => (
          <SwipeTabContainer currentTab="Restaurantes">
            <RestaurantesStack />
          </SwipeTabContainer>
        )}
      </Tab.Screen>
      <Tab.Screen
        name="Donaciones"
        options={{ tabBarLabel: t("donations") }}
        listeners={{ focus: () => { setCurrentTab("Donaciones"); emitTabReset("Donaciones"); } }}
      >
        {() => (
          <SwipeTabContainer currentTab="Donaciones">
            <DonacionesScreen />
          </SwipeTabContainer>
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default MainTabs;
