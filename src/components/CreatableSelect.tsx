import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useTheme } from "@/theme/ThemeProvider";

type Props = {
  label: string;
  value: string;
  options: string[];
  placeholder?: string;
  required?: boolean;
  allowCreate?: boolean;
  allowEmpty?: boolean;
  onChange: (v: string) => void;
};

function norm(s: string) {
  return (s ?? "").trim();
}

function isInvalidOptionValue(s: string) {
  const v = norm(s);
  if (!v) return false;
  const upper = v.toUpperCase();
  return upper === "#VALUE!" || upper === "#N/A" || upper === "N/A" || upper === "NULL" || v.startsWith("=");
}

export const CreatableSelect = React.memo(function CreatableSelect({
  label,
  value,
  options,
  placeholder,
  required,
  allowCreate = true,
  allowEmpty,
  onChange,
}: Props) {
  const { palette: c } = useTheme();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [custom, setCustom] = useState("");

  const cleanedOptions = useMemo(() => {
    const uniq = new Set<string>();
    for (const o of options ?? []) {
      const v = norm(String(o));
      if (v && !isInvalidOptionValue(v)) uniq.add(v);
    }
    const arr = Array.from(uniq).sort((a, b) => a.localeCompare(b));
    return allowEmpty ? ["", ...arr] : arr;
  }, [options, allowEmpty]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cleanedOptions;
    return cleanedOptions.filter((o) => o.toLowerCase().includes(s));
  }, [cleanedOptions, q]);

  const display = value?.trim() && !isInvalidOptionValue(value) ? value : "";

  const close = () => {
    setOpen(false);
    setQ("");
    setCustom("");
  };

  const pick = (v: string) => {
    onChange(v);
    close();
  };

  const addCustom = () => {
    const v = norm(custom);
    if (!v) return;
    pick(v);
  };

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={{ color: c.muted, fontWeight: "800", marginBottom: 6 }}>
        {label}
        {required ? " *" : ""}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        style={[
          sStyles.select,
          {
            backgroundColor: c.card,
            borderColor: c.border,
          },
        ]}
      >
        <Text
          numberOfLines={1}
          style={{ color: display ? c.text : c.muted, fontWeight: "700", flex: 1 }}
        >
          {display || placeholder || "Seleccionar"}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>

      <Modal visible={open} animationType="fade" onRequestClose={close}>
        <KeyboardAvoidingView
          behavior={Platform.select({ ios: "padding", android: undefined })}
          style={{ flex: 1, backgroundColor: c.bg }}
        >
          <View style={{ padding: 16, paddingTop: 10, gap: 10, flex: 1 }}>
            <View style={sStyles.modalTop}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: c.text, flex: 1 }} numberOfLines={1}>
                {label}
              </Text>
              <Pressable onPress={close} hitSlop={10} style={sStyles.iconBtn}>
                <Ionicons name="close" size={22} color={c.text} />
              </Pressable>
            </View>

            <View style={[sStyles.searchWrap, { borderColor: c.border, backgroundColor: c.card }]}>
              <Ionicons name="search" size={18} color={c.muted} />
              <TextInput
                value={q}
                onChangeText={setQ}
                placeholder="Buscar"
                placeholderTextColor={c.muted}
                style={{ flex: 1, color: c.text, fontWeight: "700" }}
                autoCapitalize="none"
              />
            </View>

            {allowCreate ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: c.muted, fontWeight: "800" }}>Agregar valor</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TextInput
                    value={custom}
                    onChangeText={setCustom}
                    placeholder="Escribí un valor nuevo"
                    placeholderTextColor={c.muted}
                    style={[sStyles.customInput, { borderColor: c.border, backgroundColor: c.card, color: c.text }]}
                  />
                  <Pressable
                    onPress={addCustom}
                    style={[sStyles.addBtn, { backgroundColor: c.primary }]}
                    disabled={!custom.trim()}
                  >
                    <Ionicons name="add" size={18} color={c.primaryText} />
                  </Pressable>
                </View>
              </View>
            ) : null}

            <Text style={{ color: c.muted, fontWeight: "800", marginTop: 4 }}>Opciones disponibles</Text>

            <FlatList
              data={filtered}
              keyExtractor={(i, index) => `${i}-${index}`}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={24}
              windowSize={8}
              removeClippedSubviews
              renderItem={({ item }) => {
                const selected = norm(item).toLowerCase() === norm(value).toLowerCase();
                const label = item === "" ? "Sin selección" : item;
                return (
                  <Pressable
                    onPress={() => pick(item)}
                    style={[
                      sStyles.option,
                      {
                        borderColor: c.border,
                        backgroundColor: selected ? "rgba(2,132,199,0.12)" : c.card,
                      },
                    ]}
                  >
                    <Text style={{ color: c.text, fontWeight: "800", flex: 1 }} numberOfLines={2}>
                      {label}
                    </Text>
                    {selected ? <Ionicons name="checkmark" size={18} color={c.primary} /> : null}
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 16 }}>
                  <Text style={{ color: c.muted, fontWeight: "700" }}>Sin resultados</Text>
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
});

const sStyles = StyleSheet.create({
  select: {
    height: 44,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modalTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 6 },
  searchWrap: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontWeight: "700",
  },
  addBtn: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  option: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
});