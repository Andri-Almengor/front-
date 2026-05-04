import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, FlatList, TextInput, Modal, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, Linking, ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "@/app/auth/authStore";
import { useTheme } from "@/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ImagePickerUpload from "@/components/ImagePickerUpload";
import { translateField } from "@/features/admin/utils/bilingualAutofill";
import { listRestaurants, type AdminRestaurant } from "@/features/admin/api/adminRestaurantsApi";
import { listNews, createNews, updateNews, deleteNews, type AdminNews } from "@/features/admin/api/adminNewsApi";

type Mode = "create" | "edit";
type Destino = "NOVEDADES" | "ANUNCIANTES";

export default function AdminNewsScreen() {
  const { t } = useI18n();
  const { palette: c } = useTheme();
  const isAdmin = useAuth((s) => s.isAdmin());
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editing, setEditing] = useState<AdminNews | null>(null);
  const [titulo, setTitulo] = useState("");
  const [contenido, setContenido] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [destino, setDestino] = useState<Destino>("NOVEDADES");
  const [activo, setActivo] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(false);
  const [restauranteId, setRestauranteId] = useState<number | null>(null);

  const { data: news = [], isLoading, isFetching, refetch, error } = useQuery({ queryKey: ["admin-news"], queryFn: listNews, enabled: isAdmin });
  const { data: restaurants = [] } = useQuery({ queryKey: ["admin-restaurants"], queryFn: listRestaurants, enabled: isAdmin });
  useFocusEffect(React.useCallback(() => { if (isAdmin) refetch(); }, [isAdmin, refetch]));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return news;
    return news.filter((n: any) =>
      `${n.titulo} ${n.contenido ?? ""} ${n.destino ?? ""} ${n.restaurante?.nombreEs ?? ""}`.toLowerCase().includes(s)
    );
  }, [news, q]);

  const restaurantOptions = useMemo(() => restaurants.filter((x) => x.activo !== false).map((r) => ({
    id: r.id,
    label: r.nombreEs,
  })), [restaurants]);

  const resetForm = () => {
    setTitulo(""); setContenido(""); setImageUrl(""); setFileUrl("");
    setDestino("NOVEDADES"); setActivo(true); setNotifyUsers(false); setRestauranteId(null); setEditing(null); setMode("create");
  };

  const openCreate = () => { resetForm(); setMode("create"); setModalOpen(true); };
  const openEdit = (n: AdminNews) => {
    setMode("edit"); setEditing(n); setTitulo(n.titulo ?? ""); setContenido(n.contenido ?? "");
    setImageUrl(n.imageUrl ?? ""); setFileUrl(n.fileUrl ?? ""); setDestino((n.destino as Destino) ?? "NOVEDADES");
    setActivo(n.activo ?? true); setNotifyUsers(n.notifyUsers ?? false); setRestauranteId(n.restauranteId ?? n.restaurante?.id ?? null); setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const createMut = useMutation({
    mutationFn: createNews,
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["admin-news"] }); closeModal(); resetForm(); Alert.alert("Listo", "Elemento creado."); },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message ?? "No se pudo crear."),
  });
  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateNews(id, payload),
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["admin-news"] }); closeModal(); resetForm(); Alert.alert("Listo", "Elemento actualizado."); },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message ?? "No se pudo actualizar."),
  });
  const deleteMut = useMutation({
    mutationFn: deleteNews,
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["admin-news"] }); Alert.alert("Listo", "Elemento eliminado."); },
    onError: (e: any) => Alert.alert("Error", e?.response?.data?.message ?? "No se pudo eliminar."),
  });

  const onSave = () => {
    const payload: any = { destino, activo, notifyUsers, restauranteId: destino === "ANUNCIANTES" ? restauranteId : null };
    payload.titulo = titulo.trim() || t("untitled");
    if (contenido.trim()) payload.contenido = contenido.trim();
    if (imageUrl.trim()) payload.imageUrl = imageUrl.trim();
    if (fileUrl.trim()) payload.fileUrl = fileUrl.trim();
    if (mode === "create") createMut.mutate(payload);
    else if (editing) updateMut.mutate({ id: editing.id, payload });
  };

  const autoTranslateContent = async () => {
    if (!contenido.trim()) return;
    const translated = await translateField(contenido);
    Alert.alert("Referencia", "Traducción sugerida al inglés generada en caché para usarla en frontend.");
    console.log("translated preview", translated);
  };

  if (!isAdmin) return <View style={[styles.center, { backgroundColor: c.bg }]}><Text style={{ color: c.text }}>{t("adminOnly")}</Text></View>;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8), paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.topBar}>
        <Text style={[styles.h1, { color: c.text }]}>{t("adminPosts")}</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={openCreate}>
          <Ionicons name="add" size={22} color={c.primaryText} />
        </Pressable>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryTitle, { color: c.text }]}>Gestión de novedades</Text>
            <Text style={[styles.summaryCopy, { color: c.muted }]}>Ahora el listado queda más claro para revisar visibilidad, destino y relación con restaurantes.</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: `${c.primary}18` }]}>
            <Text style={[styles.summaryBadgeText, { color: c.primary }]}>{filtered.length}</Text>
            <Text style={[styles.summaryBadgeLabel, { color: c.muted }]}>items</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchShell, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Ionicons name="search-outline" size={18} color={c.muted} />
          <TextInput placeholder="Buscar…" placeholderTextColor={c.muted} value={q} onChangeText={setQ}
            style={[styles.search, { color: c.text }]} />
          {!!q && <Pressable onPress={() => setQ("")} hitSlop={8}><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable>}
        </View>
      </View>

      {isLoading || isFetching ? <View style={styles.center}><ActivityIndicator /></View> : error ? (
        <View style={styles.center}><Text style={{ color: c.danger, fontWeight: "900" }}>{t("errorLoad")}</Text></View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i: any) => String(i.id)}
          contentContainerStyle={{ padding: 14, paddingBottom: Math.max(insets.bottom, 16) + 72 }}
          renderItem={({ item }: any) => {
            const itemDestino: Destino = item.destino ?? "NOVEDADES";
            return (
              <Pressable style={[styles.row, { borderColor: c.border, backgroundColor: c.card, opacity: item.activo === false ? 0.6 : 1 }]} onPress={() => openEdit(item)}>
                <View style={{ flex: 1 }}>
                  <View style={styles.rowTop}>
                    <Text style={{ color: c.text, fontWeight: "900", flex: 1 }} numberOfLines={1}>{item.titulo?.trim() ? item.titulo : "(Sin título)"}</Text>
                    <View style={[styles.tag, { backgroundColor: itemDestino === "ANUNCIANTES" ? "rgba(2,132,199,0.16)" : "rgba(34,197,94,0.16)", borderColor: c.border }]}><Text style={{ color: c.text, fontWeight: "900", fontSize: 11 }}>{itemDestino}</Text></View>
                    <View style={[styles.tag, { backgroundColor: item.activo === false ? "rgba(153,27,27,0.16)" : "rgba(22,101,52,0.16)", borderColor: c.border }]}><Text style={{ color: c.text, fontWeight: "900", fontSize: 11 }}>{item.activo === false ? "Oculto" : "Visible"}</Text></View>
                    {item.notifyUsers ? <View style={[styles.tag, { backgroundColor: "rgba(37,99,235,0.16)", borderColor: c.border }]}><Text style={{ color: c.text, fontWeight: "900", fontSize: 11 }}>Push</Text></View> : null}
                  </View>
                  {!!item.restaurante?.nombreEs && <Text style={{ color: c.primary, fontWeight: "700", marginTop: 6 }}>{item.restaurante.nombreEs}</Text>}
                  {!!item.contenido && <Text style={{ color: c.muted, fontWeight: "700", marginTop: 6 }} numberOfLines={2}>{item.contenido}</Text>}
                  {!!item.fileUrl && <Pressable onPress={() => Linking.openURL(item.fileUrl)} style={{ marginTop: 8 }}><Text style={{ color: c.primary, fontWeight: "900" }}>{t("openAttachment")}</Text></Pressable>}
                </View>
                <View style={{ gap: 8 }}>
                  <Pressable onPress={() => updateMut.mutate({ id: item.id, payload: { activo: !(item.activo ?? true) } })} hitSlop={10} style={{ padding: 6 }}>
                    <Ionicons name={item.activo === false ? "eye-outline" : "eye-off-outline"} size={20} color={c.text} />
                  </Pressable>
                  <Pressable onPress={() => deleteMut.mutate(item.id)} hitSlop={10} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={20} color={c.danger} />
                  </Pressable>
                </View>
              </Pressable>
            );
          }}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <View style={{ paddingTop: Math.max(insets.top, 12), paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: c.text }}>{mode === "create" ? t("newPost") : t("editPost")}</Text>
              </View>
              <Pressable onPress={autoTranslateContent} style={[styles.ghostBtn, { borderColor: c.border }]}><Text style={{ color: c.text, fontWeight: "900", fontSize: 12 }}>Preparar EN</Text></Pressable>
              <Pressable onPress={closeModal} hitSlop={10} style={{ padding: 6 }}><Ionicons name="close" size={22} color={c.text} /></Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 24 + Math.max(insets.bottom, 12) + 84 }}>
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
                <Text style={[styles.label, { color: c.muted }]}>Estado</Text>
                <Pressable onPress={() => setActivo((v) => !v)} style={[styles.switchBtn, { backgroundColor: activo ? "#166534" : "#991b1b" }]}><Text style={{ color: "#fff", fontWeight: "900" }}>{activo ? "Visible" : "Oculto"}</Text></Pressable>

                <Text style={[styles.label, { color: c.muted }]}>{t("notifyUsers")}</Text>
                <Pressable onPress={() => setNotifyUsers((v) => !v)} style={[styles.notifyRow, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={{ color: c.text, fontWeight: "900" }}>{notifyUsers ? (t("all") ? t("notifyUsers") : "Notificar") : t("notifyUsers")}</Text>
                    <Text style={{ color: c.muted, marginTop: 4, fontSize: 12, lineHeight: 18 }}>{t("notifyUsersHelp")}</Text>
                  </View>
                  <View style={[styles.notifyBadge, { backgroundColor: notifyUsers ? c.primary : c.card, borderColor: c.border }]}>
                    <Text style={{ color: notifyUsers ? c.primaryText : c.text, fontWeight: "900" }}>{notifyUsers ? "ON" : "OFF"}</Text>
                  </View>
                </Pressable>

                <Text style={[styles.label, { color: c.muted }]}>{t("destination")}</Text>
                <View style={[styles.segment, { backgroundColor: c.bg, borderColor: c.border }]}>
                  <Pressable onPress={() => { setDestino("NOVEDADES"); setRestauranteId(null); }} style={[styles.segmentBtn, destino === "NOVEDADES" ? { backgroundColor: c.primary } : null]}><Text style={{ color: destino === "NOVEDADES" ? c.primaryText : c.text, fontWeight: "900" }}>{t("news")}</Text></Pressable>
                  <Pressable onPress={() => setDestino("ANUNCIANTES")} style={[styles.segmentBtn, destino === "ANUNCIANTES" ? { backgroundColor: c.primary } : null]}><Text style={{ color: destino === "ANUNCIANTES" ? c.primaryText : c.text, fontWeight: "900" }}>{t("advertisers")}</Text></Pressable>
                </View>

                {destino === "ANUNCIANTES" ? (
                  <>
                    <Text style={[styles.label, { color: c.muted }]}>Restaurante relacionado</Text>
                    <View style={[styles.segment, { backgroundColor: c.bg, borderColor: c.border, flexWrap: "wrap", padding: 8 }]}>
                      {restaurantOptions.map((item) => {
                        const active = restauranteId === item.id;
                        return (
                          <Pressable key={item.id} onPress={() => setRestauranteId(item.id)} style={[styles.pill, { backgroundColor: active ? c.primary : c.card, borderColor: c.border }]}>
                            <Text style={{ color: active ? c.primaryText : c.text, fontWeight: "700" }}>{item.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </>
                ) : null}

                <Text style={[styles.label, { color: c.muted }]}>{t("title")} ({t("optional")})</Text>
                <TextInput value={titulo} onChangeText={setTitulo} style={[styles.field, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]} placeholderTextColor={c.muted} placeholder={t("title")} />

                <Text style={[styles.label, { color: c.muted }]}>Contenido</Text>
                <TextInput value={contenido} onChangeText={setContenido} multiline style={[styles.field, styles.area, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]} placeholderTextColor={c.muted} placeholder="Texto principal" />

                <ImagePickerUpload
                  label="URL imagen"
                  value={imageUrl}
                  onChange={setImageUrl}
                  folder="kosher-costa-rica/novedades"
                  textColor={c.text}
                  mutedColor={c.muted}
                  borderColor={c.border}
                  backgroundColor={c.bg}
                  inputStyle={styles.field}
                  labelStyle={styles.label}
                />

                <Text style={[styles.label, { color: c.muted }]}>URL adjunto</Text>
                <TextInput value={fileUrl} onChangeText={setFileUrl} style={[styles.field, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]} placeholderTextColor={c.muted} placeholder="https://..." />
              </View>
            </ScrollView>

            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12), backgroundColor: c.bg, borderTopColor: c.border }]}>
              <Pressable style={[styles.secondaryBtn, { borderColor: c.border }]} onPress={closeModal}><Text style={{ color: c.text, fontWeight: "900" }}>{t("cancel")}</Text></Pressable>
              <Pressable style={[styles.primaryBtn, { backgroundColor: c.primary }]} onPress={onSave}><Text style={{ color: c.primaryText, fontWeight: "900" }}>{t("save")}</Text></Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8fafc" }, center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 12 },
  summaryCard: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 28, padding: 18, shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryMain: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: "900" },
  summaryCopy: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  summaryBadge: { minWidth: 72, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center" },
  summaryBadgeText: { fontSize: 18, fontWeight: "900" },
  summaryBadgeLabel: { marginTop: 2, fontSize: 11, fontWeight: "700" },
  h1: { fontSize: 28, fontWeight: "900" }, addBtn: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  searchWrap: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }, searchShell: { minHeight: 54, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, search: { flex: 1, height: 52, fontSize: 14, fontWeight: "700" },
  row: { borderWidth: 1, borderRadius: 22, padding: 16, marginBottom: 14, flexDirection: "row", gap: 12, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }, tag: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "rgba(255,255,255,0.85)" },
  card: { borderWidth: 1, borderRadius: 24, padding: 16, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 }, label: { marginBottom: 8, marginTop: 14, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  field: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, height: 50 }, area: { minHeight: 128, height: 128, textAlignVertical: "top", paddingTop: 14 },
  segment: { borderWidth: 1, borderRadius: 18, padding: 5, flexDirection: "row", gap: 8, backgroundColor: "rgba(255,255,255,0.8)" }, segmentBtn: { flex: 1, borderRadius: 14, paddingVertical: 13, alignItems: "center" },
  footer: { flexDirection: "row", gap: 12, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }, primaryBtn: { flex: 1, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" }, secondaryBtn: { flex: 1, height: 52, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.88)" },
  switchBtn: { alignSelf: "flex-start", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  notifyRow: { marginTop: 2, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: "row", alignItems: "center" },
  notifyBadge: { minWidth: 62, height: 38, borderRadius: 999, borderWidth: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  ghostBtn: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "rgba(255,255,255,0.9)" },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 10, margin: 4, backgroundColor: "rgba(255,255,255,0.85)" },
});
