import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "@/theme/ThemeProvider";
import { useAuth } from "@/app/auth/authStore";
import { useI18n } from "@/i18n/I18nProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  listAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type AdminUserRow,
} from "@/features/admin/api/adminUsersApi";

type Mode = "create" | "edit";

export default function AdminUsersScreen() {
  const { t } = useI18n();
  const { palette: c } = useTheme();
  const isAdmin = useAuth((s) => s.isAdmin());
  const token = useAuth((s) => s.token);
  const hydrated = useAuth((s) => s.hydrated);
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("create");
  const [editing, setEditing] = useState<AdminUserRow | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const { data: users = [], isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-users"],
    queryFn: listAdminUsers,
    enabled: hydrated && isAdmin && !!token,
    retry: 1,
    staleTime: 60_000,
    refetchOnMount: false,
  });

  useFocusEffect(React.useCallback(() => { if (hydrated && isAdmin && token) refetch(); }, [hydrated, isAdmin, token, refetch]));

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) => `${u.nombre} ${u.email} ${u.rol ?? ""}`.toLowerCase().includes(s));
  }, [users, q]);

  const resetForm = () => {
    setNombre("");
    setEmail("");
    setPassword("");
    setEditing(null);
    setMode("create");
    setShowPw(false);
  };

  const openCreate = () => {
    resetForm();
    setMode("create");
    setModalOpen(true);
  };

  const openEdit = (u: AdminUserRow) => {
    setMode("edit");
    setEditing(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword("");
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const createMut = useMutation({
    mutationFn: createAdminUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      closeModal();
      resetForm();
      Alert.alert(t("done"), t("userCreated"));
    },
    onError: (e: any) => Alert.alert(t("error"), e?.response?.data?.message ?? t("couldNotCreateUser")),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: any }) => updateAdminUser(id, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      closeModal();
      resetForm();
      Alert.alert(t("done"), t("userUpdated"));
    },
    onError: (e: any) => Alert.alert(t("error"), e?.response?.data?.message ?? t("couldNotUpdateUser")),
  });

  const deleteMut = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-users"] });
      Alert.alert(t("done"), t("userDeleted"));
    },
    onError: (e: any) => Alert.alert(t("error"), e?.response?.data?.message ?? t("couldNotDeleteUser")),
  });

  const onSave = () => {
    if (!nombre.trim() || !email.trim() || (mode === "create" && !password.trim())) {
      Alert.alert(t("requiredFields"), t("requiredFieldsUsersMsg"));
      return;
    }

    const payload: any = { nombre: nombre.trim(), email: email.trim() };
    if (password.trim()) payload.password = password.trim();

    if (mode === "create") createMut.mutate({ nombre: nombre.trim(), email: email.trim(), password: password.trim() });
    else if (editing) updateMut.mutate({ id: editing.id, payload });
  };

  const onDelete = (u: AdminUserRow) => {
    Alert.alert(t("deleteUser"), `${t("confirmDelete")} "${u.email}"?`, [
      { text: t("cancel"), style: "cancel" },
      { text: t("delete"), style: "destructive", onPress: () => deleteMut.mutate(u.id) },
    ]);
  };

  if (!hydrated) {
    return <View style={[styles.center, { backgroundColor: c.bg }]}><ActivityIndicator /></View>;
  }

  if (!isAdmin) {
    return (
      <View style={[styles.center, { backgroundColor: c.bg }]}> 
        <Text style={{ color: c.text, fontWeight: "900" }}>{t("adminOnly")}</Text>
      </View>
    );
  }

  const authError = (error as any)?.response?.status === 401 || (error as any)?.response?.status === 403;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8) }]}>
      <View style={styles.topBar}>
        <Text style={[styles.h1, { color: c.text }]}>{t("users")}</Text>
        <Pressable style={[styles.addBtn, { backgroundColor: c.primary }]} onPress={openCreate}>
          <Ionicons name="add" size={22} color={c.primaryText} />
        </Pressable>
      </View>

      <View style={[styles.summaryCard, { backgroundColor: c.card, borderColor: c.border }]}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryMain}>
            <Text style={[styles.summaryTitle, { color: c.text }]}>Administración de usuarios</Text>
            <Text style={[styles.summaryCopy, { color: c.muted }]}>Consulta, crea y ajusta accesos con una distribución más limpia en pantallas pequeñas.</Text>
          </View>
          <View style={[styles.summaryBadge, { backgroundColor: `${c.primary}18` }]}>
            <Text style={[styles.summaryBadgeText, { color: c.primary }]}>{filtered.length}</Text>
            <Text style={[styles.summaryBadgeLabel, { color: c.muted }]}>cuentas</Text>
          </View>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <View style={[styles.searchShell, { backgroundColor: c.card, borderColor: c.border }]}> 
          <Ionicons name="search-outline" size={18} color={c.muted} />
          <TextInput
            placeholder={t("search")}
            placeholderTextColor={c.muted}
            value={q}
            onChangeText={setQ}
            style={[styles.search, { color: c.text }]}
          />
          {!!q && <Pressable onPress={() => setQ("")} hitSlop={8}><Ionicons name="close-circle" size={18} color={c.muted} /></Pressable>}
        </View>
      </View>

      {isLoading || isFetching ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={{ color: c.danger, fontWeight: "900", textAlign: "center" }}>
            {authError ? t("adminSessionRequired") : t("errorLoad")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          removeClippedSubviews={Platform.OS === "android"}
          initialNumToRender={12}
          maxToRenderPerBatch={12}
          windowSize={8}
          keyExtractor={(i) => String(i.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 14, paddingBottom: Math.max(insets.bottom, 16) + 72 }}
          ListEmptyComponent={<View style={styles.center}><Text style={{ color: c.muted, textAlign: "center" }}>{t("noUsersYet")}</Text></View>}
          renderItem={({ item }) => (
            <Pressable style={[styles.row, { borderColor: c.border, backgroundColor: c.card }]} onPress={() => openEdit(item)}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: "900" }}>{item.nombre}</Text>
                <Text style={{ color: c.muted, fontWeight: "700", marginTop: 2 }}>{item.email} • {item.rol ?? "user"}</Text>
              </View>
              <Pressable onPress={() => onDelete(item)} hitSlop={10} style={{ padding: 6 }}>
                <Ionicons name="trash-outline" size={20} color={c.danger} />
              </Pressable>
            </Pressable>
          )}
        />
      )}

      <Modal visible={modalOpen} animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.select({ ios: "padding", android: undefined })} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <View style={{ paddingTop: Math.max(insets.top, 12), paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: "900", color: c.text }}>
                  {mode === "create" ? t("newAdmin") : t("editAdmin")}
                </Text>
                <Text style={{ color: c.muted, fontWeight: "700", marginTop: 2 }}>
                  {mode === "create" ? t("adminCreateHint") : t("adminEditHint")}
                </Text>
              </View>
              <Pressable onPress={closeModal} hitSlop={10} style={{ padding: 6 }}>
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 + Math.max(insets.bottom, 12) + 84 }} keyboardShouldPersistTaps="handled">
              <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}> 
                <LabeledInput label={t("name")}>
                  <TextInput placeholder={t("name")} placeholderTextColor={c.muted} value={nombre} onChangeText={setNombre} style={[styles.field, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]} />
                </LabeledInput>

                <LabeledInput label={t("email")}>
                  <TextInput placeholder={t("email")} placeholderTextColor={c.muted} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={[styles.field, { backgroundColor: c.bg, borderColor: c.border, color: c.text }]} />
                </LabeledInput>

                <LabeledInput label={mode === "create" ? t("password") : t("passwordOptional")} hint={mode === "edit" ? t("passwordKeepHint") : undefined}>
                  <View style={[styles.pwWrap, { backgroundColor: c.bg, borderColor: c.border }]}> 
                    <TextInput placeholder={mode === "create" ? t("password") : t("passwordOptional")} placeholderTextColor={c.muted} value={password} onChangeText={setPassword} secureTextEntry={!showPw} style={[styles.pwInput, { color: c.text }]} />
                    <Pressable onPress={() => setShowPw((v) => !v)} hitSlop={10} style={{ padding: 6 }}>
                      <Ionicons name={showPw ? "eye-off" : "eye"} size={18} color={c.muted} />
                    </Pressable>
                  </View>
                </LabeledInput>
              </View>
            </ScrollView>

            <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12), borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.bg }}>
              <Pressable style={[styles.saveBtn, { backgroundColor: c.primary, opacity: createMut.isPending || updateMut.isPending ? 0.7 : 1 }]} onPress={onSave} disabled={createMut.isPending || updateMut.isPending}>
                <Text style={{ color: c.primaryText, fontWeight: "900" }}>
                  {createMut.isPending || updateMut.isPending ? t("saving") : t("save")}
                </Text>
              </Pressable>

              <Pressable style={[styles.cancelBtn, { borderColor: c.border }]} onPress={closeModal}>
                <Text style={{ color: c.text, fontWeight: "900" }}>{t("cancel")}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function LabeledInput({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  const { palette: c } = useTheme();
  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: c.muted, fontWeight: "800", marginBottom: 6 }}>{label}</Text>
      {children}
      {hint ? <Text style={{ color: c.muted, fontWeight: "700", marginTop: 6 }}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  topActions: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingTop: 10 },
  smallActionBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  root: { flex: 1, backgroundColor: "#f8fafc" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  h1: { flex: 1, fontSize: 28, fontWeight: "900" },
  addBtn: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", shadowColor: "#0f172a", shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 10 },
  summaryCard: { marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 28, padding: 18, shadowColor: "#0f172a", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryMain: { flex: 1 },
  summaryTitle: { fontSize: 16, fontWeight: "900" },
  summaryCopy: { marginTop: 4, fontSize: 12, lineHeight: 18, fontWeight: "700" },
  summaryBadge: { minWidth: 72, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 10, alignItems: "center" },
  summaryBadgeText: { fontSize: 18, fontWeight: "900" },
  summaryBadgeLabel: { marginTop: 2, fontSize: 11, fontWeight: "700" },
  searchShell: { minHeight: 54, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10, shadowColor: "#0f172a", shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 }, search: { flex: 1, height: 52, fontWeight: "700", fontSize: 14 },
  refresh: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, borderWidth: 1, borderRadius: 22, padding: 16, marginBottom: 12, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  card: { borderWidth: 1, borderRadius: 24, padding: 18, gap: 12, shadowColor: "#0f172a", shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  field: { height: 50, borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, fontWeight: "700" },
  pwWrap: { height: 50, borderWidth: 1, borderRadius: 16, paddingLeft: 14, paddingRight: 8, flexDirection: "row", alignItems: "center" },
  pwInput: { flex: 1, fontWeight: "700" },
  saveBtn: { height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", marginTop: 10 },
  cancelBtn: { height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, backgroundColor: "rgba(255,255,255,0.88)" },
});
