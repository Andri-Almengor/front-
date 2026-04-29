import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { CommonActions, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "@/navigation/AdminNavigator";
import { useAuth } from "@/app/auth/authStore";
import { useTheme } from "@/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { AppFonts } from "@/theme/fonts";

type Nav = NativeStackNavigationProp<AdminStackParamList>;

type AdminCardItem = {
  key: keyof AdminStackParamList;
  title: string;
  sub: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  tone: string;
};

export default function AdminHomeScreen() {
  const { t } = useI18n();
  const navigation = useNavigation<Nav>();
  const { palette: c } = useTheme();
  const isAdmin = useAuth((s) => s.isAdmin());
  const logout = useAuth((s) => s.logout);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 860;
  const resetKey = (navigation as any)?.getState?.()?.routes?.slice(-1)?.[0]?.params?.resetKey;
  const go = (screen: keyof AdminStackParamList) => () => navigation.navigate(screen as never);

  useEffect(() => {
    if (typeof resetKey === "number") {
      try {
        const state = (navigation as any)?.getState?.();
        const routes = state?.routes ?? [];
        if (routes.length > 1 && typeof (navigation as any)?.popToTop === "function") {
          (navigation as any).popToTop();
        }
      } catch {}
    }
  }, [navigation, resetKey]);

  const cards = useMemo<AdminCardItem[]>(() => [
    { key: "AdminProducts", title: t("products"), sub: "Catálogo, filtros, tarjeta principal y visibilidad.", icon: "cube-outline", tone: "#dbeafe" },
    { key: "AdminRestaurants", title: t("restaurantsTitle"), sub: "Restaurantes, estados, datos bilingües y orden.", icon: "restaurant-outline", tone: "#dcfce7" },
    { key: "AdminNews", title: t("news"), sub: "Feed unificado, anunciantes y relaciones por tienda.", icon: "newspaper-outline", tone: "#fef3c7" },
    { key: "AdminUsers", title: t("users"), sub: "Accesos del panel y administración de cuentas.", icon: "people-outline", tone: "#f3e8ff" },
    { key: "AdminLogs", title: t("logs"), sub: "Historial operativo y seguimiento de cambios.", icon: "receipt-outline", tone: "#fee2e2" },
  ], [t]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]}> 
        <View style={[styles.blockedCard, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Ionicons name="shield-outline" size={28} color={c.primary} />
          <Text style={[styles.blockedTitle, { color: c.text }]}>{t("adminZone")}</Text>
          <Text style={[styles.blockedCopy, { color: c.muted }]}>No tienes permisos para entrar a este panel.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: "#f8fafc" }]}> 
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { backgroundColor: c.primary }]}> 
          <View style={styles.heroTopRow}>
            <View style={[styles.heroBadge, { backgroundColor: "rgba(255,255,255,0.16)" }]}> 
              <Ionicons name="grid-outline" size={16} color="#fff" />
            </View>
            <Pressable style={styles.logoutBtn} onPress={logout}>
              <Ionicons name="log-out-outline" size={16} color="#fff" />
              <Text style={styles.logoutText}>{t("logout")}</Text>
            </Pressable>
          </View>

          <Text style={styles.heroTitle}>{t("adminTitle")}</Text>

          <View style={styles.heroMetrics}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Módulos</Text>
              <Text style={styles.metricValue}>{cards.length}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Estado</Text>
              <Text style={styles.metricValue}>Activo</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickRow}>
          <Pressable
            style={[styles.quickAction, { backgroundColor: "#ffffff", borderColor: c.border }]}
            onPress={() => {
              const drawerNav = navigation.getParent();
              if (!drawerNav) return;
              drawerNav.dispatch(CommonActions.navigate({ name: "Tabs", params: { screen: "Inicio" } }));
            }}
          >
            <Ionicons name="home-outline" size={18} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.quickTitle, { color: c.text }]}>{t("backHome")}</Text>
              <Text style={[styles.quickSub, { color: c.muted }]}>Regresar al flujo principal.</Text>
            </View>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: c.text }]}>Áreas de trabajo</Text>
        <View style={styles.grid}>
          {cards.map((card) => (
            <Pressable
              key={card.key}
              style={[
                styles.card,
                compact ? styles.cardFull : styles.cardHalf,
                { backgroundColor: "#ffffff", borderColor: c.border },
              ]}
              onPress={go(card.key)}
            >
              <View style={styles.cardMainRow}>
                <View style={[styles.iconWrap, { backgroundColor: card.tone }]}> 
                  <Ionicons name={card.icon} size={22} color={c.primary} />
                </View>
                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardTitle, { color: c.text }]}>{card.title}</Text>
                  <Text style={[styles.cardSub, { color: c.muted }]}>{card.sub}</Text>
                </View>
              </View>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardLink, { color: c.primary }]}>Entrar</Text>
                <Ionicons name="arrow-forward" size={16} color={c.primary} />
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 30 },
  hero: { borderRadius: 32, padding: 20, shadowColor: "#0f172a", shadowOpacity: 0.1, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 5 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heroBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 8 },
  heroBadgeText: { color: "#fff", fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800", fontSize: 12 },
  logoutBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.12)" },
  logoutText: { color: "#fff", fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800", fontSize: 12 },
  heroTitle: { marginTop: 18, color: "#fff", fontSize: 28, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  heroCopy: { marginTop: 8, color: "rgba(255,255,255,0.92)", fontSize: 13, lineHeight: 20, fontFamily: AppFonts.poppinsRegular },
  heroMetrics: { flexDirection: "row", gap: 12, marginTop: 18 },
  metricCard: { flex: 1, backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 18, padding: 14 },
  metricLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontFamily: AppFonts.poppinsRegular },
  metricValue: { marginTop: 4, color: "#fff", fontSize: 18, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  quickRow: { marginTop: 16, gap: 12 },
  quickAction: { borderWidth: 1, borderRadius: 24, padding: 18, flexDirection: "row", alignItems: "center", gap: 12, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  quickTitle: { fontSize: 14, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  quickSub: { marginTop: 2, fontSize: 12, fontFamily: AppFonts.poppinsRegular },
  sectionTitle: { marginTop: 22, marginBottom: 12, fontSize: 18, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { borderWidth: 1, borderRadius: 28, padding: 18, minHeight: 146, justifyContent: "space-between", shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  cardFull: { width: "100%" },
  cardHalf: { width: "48.4%" },
  cardMainRow: { flexDirection: "row", alignItems: "flex-start", gap: 14 },
  cardTextWrap: { flex: 1, minWidth: 0 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 17, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  cardSub: { marginTop: 6, fontSize: 12, lineHeight: 19, fontFamily: AppFonts.poppinsRegular },
  cardFooter: { marginTop: "auto", paddingTop: 16, flexDirection: "row", alignItems: "center", gap: 6 },
  cardLink: { fontSize: 13, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  blockedCard: { margin: 16, borderWidth: 1, borderRadius: 24, padding: 24, alignItems: "center" },
  blockedTitle: { marginTop: 12, fontSize: 20, fontFamily: AppFonts.poppinsSemiBold, fontWeight: "800" },
  blockedCopy: { marginTop: 8, textAlign: "center", fontSize: 13, fontFamily: AppFonts.poppinsRegular },
});
