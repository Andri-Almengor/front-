import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Modal, Pressable, StyleSheet, ScrollView, Image, TextInput } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/theme/ThemeProvider";
import { useI18n } from "@/i18n/I18nProvider";
import { CreatableSelect } from "@/components/CreatableSelect";
import type { SealFilterOption } from "@/features/products/utils/filterValueHelpers";

export type ProductFilters = {
  tienda?: string;
  sello?: string;
  certifica?: string;
  catGeneral?: string;
  categoria1?: string;
  atributo1?: string;
  atributo2?: string;
  atributo3?: string;
};

type Props = {
  visibleKeys?: Array<keyof ProductFilters>;
  visible: boolean;
  onClose: () => void;
  value: ProductFilters;
  options: {
    tienda: string[];
    sello: string[];
    selloVisuales?: SealFilterOption[];
    certifica: string[];
    catGeneral: string[];
    categoria1: string[];
    atributo1: string[];
    atributo2: string[];
    atributo3: string[];
  };
  onApply: (filters: ProductFilters) => void;
};

const norm = (s?: string | null) => (s ?? "").trim();

function SealDropdownPreview({ label, value, options, onChange }: { label: string; value: string; options: SealFilterOption[]; onChange: (v: string) => void; }) {
  const { palette: c } = useTheme();
  const selected = norm(value);
  const selectedOption = useMemo(() => options.find((option) => norm(option.value) === selected) ?? null, [options, selected]);

  return (
    <View style={{ marginTop: 12 }}>
      <CreatableSelect
        label={label}
        value={value}
        options={options.map((option) => option.value)}
        allowCreate={false}
        allowEmpty
        placeholder="Seleccionar"
        onChange={onChange}
      />

      <View style={[s.sealDropdownPreview, { borderColor: c.border, backgroundColor: c.card }]}> 
        <View style={s.sealDropdownMedia}>
          {selectedOption?.imageUrl ? (
            <Image source={{ uri: selectedOption.imageUrl }} style={s.sealDropdownImage} resizeMode="contain" />
          ) : (
            <View style={[s.sealDropdownEmpty, { borderColor: c.border, backgroundColor: c.bg }]}> 
              <Ionicons name="ribbon-outline" size={24} color={c.muted} />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: c.muted, fontWeight: "800", fontSize: 12, marginBottom: 4 }}>Preview del sello</Text>
          <Text style={{ color: c.text, fontWeight: "900", fontSize: 15 }} numberOfLines={2}>
            {selectedOption?.value || "Todos los sellos"}
          </Text>
          <Text style={{ color: c.muted, fontWeight: "700", fontSize: 12, lineHeight: 18, marginTop: 6 }}>
            Selecciona el sello desde el desplegable y aquí verás su imagen para identificarlo más fácil.
          </Text>
        </View>
      </View>
    </View>
  );
}


export function ProductFiltersModal({ visible, onClose, value, options, onApply, visibleKeys }: Props) {
  const { palette: c } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<ProductFilters>(value ?? {});

  useEffect(() => {
    if (visible) setDraft(value ?? {});
  }, [visible, value]);

  const keys = visibleKeys?.length ? visibleKeys : ["tienda", "sello", "certifica", "catGeneral", "categoria1", "atributo1", "atributo2", "atributo3"];

  const hasAny = useMemo(() => keys.some((k) => !!norm(draft[k])), [draft, keys]);

  const activeChips = useMemo(() => {
    const pairs: Array<{ k: keyof ProductFilters; label: string; value: string }> = [
      { k: "tienda", label: t("tienda"), value: norm(draft.tienda) },
      { k: "catGeneral", label: t("catGeneral"), value: norm(draft.catGeneral) },
      { k: "categoria1", label: t("categoria1"), value: norm(draft.categoria1) },
      { k: "sello", label: t("selloOptional"), value: norm(draft.sello) },
      { k: "certifica", label: t("certificaOptional"), value: norm(draft.certifica) },
      { k: "atributo1", label: t("atributo1"), value: norm(draft.atributo1) },
      { k: "atributo2", label: t("atributo2"), value: norm(draft.atributo2) },
    ];
    return pairs.filter((p) => !!p.value);
  }, [draft, t]);

  const clearAll = () => setDraft({});

  const apply = () => {
    const cleaned: ProductFilters = {};
    (Object.keys(draft) as (keyof ProductFilters)[]).forEach((k) => {
      const v = norm(draft[k]);
      if (v) cleaned[k] = v;
    });
    onApply(cleaned);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[s.root, { backgroundColor: c.bg }]}> 
        <View style={[s.top, { paddingTop: Math.max(insets.top, 12) }]}> 
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 20, fontWeight: "900", color: c.text }}>{t("filters")}</Text>
          </View>

          {hasAny ? (
            <Pressable onPress={clearAll} hitSlop={10} style={[s.ghostBtn, { borderColor: c.border, backgroundColor: c.card }]}> 
              <Ionicons name="trash-outline" size={16} color={c.text} />
              <Text style={{ color: c.text, fontWeight: "900", fontSize: 12 }}>{t("clear")}</Text>
            </Pressable>
          ) : null}

          <Pressable onPress={onClose} hitSlop={10} style={s.iconBtn}>
            <Ionicons name="close" size={22} color={c.text} />
          </Pressable>
        </View>

        {activeChips.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 8 }}>
            {activeChips.map((chip) => (
              <Pressable key={chip.k} onPress={() => setDraft((s0) => ({ ...s0, [chip.k]: "" }))} style={[s.chip, { backgroundColor: c.card, borderColor: c.border }]}> 
                <Text style={{ color: c.text, fontWeight: "900" }} numberOfLines={1}>{chip.label}: {chip.value}</Text>
                <Ionicons name="close" size={14} color={c.muted} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 + Math.max(insets.bottom, 12) + 78 }}>
          {keys.includes("tienda") ? (
            <CreatableSelect
              label={t("tienda")}
              value={draft.tienda ?? ""}
              options={options.tienda}
              allowCreate={false}
              allowEmpty
              placeholder={t("select")}
              onChange={(v) => setDraft((s0) => ({ ...s0, tienda: v }))}
            />
          ) : null}

          {keys.includes("sello") ? (
            options.selloVisuales?.length ? (
              <SealDropdownPreview label={t("selloOptional")} value={draft.sello ?? ""} options={options.selloVisuales} onChange={(v) => setDraft((s0) => ({ ...s0, sello: v }))} />
            ) : (
              <CreatableSelect
                label={t("selloOptional")}
                value={draft.sello ?? ""}
                options={options.sello}
                allowCreate={false}
                allowEmpty
                placeholder={t("select")}
                onChange={(v) => setDraft((s0) => ({ ...s0, sello: v }))}
              />
            )
          ) : null}

          {keys.includes("certifica") ? <CreatableSelect label={t("certificaOptional")} value={draft.certifica ?? ""} options={options.certifica} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, certifica: v }))} /> : null}
          {keys.includes("catGeneral") ? <CreatableSelect label={t("catGeneral")} value={draft.catGeneral ?? ""} options={options.catGeneral} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, catGeneral: v }))} /> : null}
          {keys.includes("categoria1") ? <CreatableSelect label={t("categoria1")} value={draft.categoria1 ?? ""} options={options.categoria1} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, categoria1: v }))} /> : null}
          {keys.includes("atributo1") ? <CreatableSelect label={t("atributo1")} value={draft.atributo1 ?? ""} options={options.atributo1} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, atributo1: v }))} /> : null}
          {keys.includes("atributo2") ? <CreatableSelect label={t("atributo2")} value={draft.atributo2 ?? ""} options={options.atributo2} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, atributo2: v }))} /> : null}
          {keys.includes("atributo3") ? <CreatableSelect label={t("atributo3")} value={draft.atributo3 ?? ""} options={options.atributo3} allowCreate={false} allowEmpty placeholder={t("select")} onChange={(v) => setDraft((s0) => ({ ...s0, atributo3: v }))} /> : null}
        </ScrollView>

        <View style={[s.bottomBar, { borderTopColor: c.border, backgroundColor: c.bg, paddingBottom: Math.max(insets.bottom, 12) }]}> 
          <Pressable onPress={onClose} style={[s.bottomGhost, { borderColor: c.border, backgroundColor: c.card }]}>
            <Text style={{ color: c.text, fontWeight: "900" }}>{t("cancel")}</Text>
          </Pressable>
          <Pressable onPress={apply} style={[s.bottomPrimary, { backgroundColor: c.primary }]}>
            <Text style={{ color: c.primaryText, fontWeight: "900" }}>{t("apply")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  top: { paddingHorizontal: 16, paddingBottom: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  ghostBtn: { minHeight: 34, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 6 },
  chip: { marginRight: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 8, flexDirection: "row", alignItems: "center", gap: 8, maxWidth: 280 },
  bottomBar: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 12, flexDirection: "row", gap: 12 },
  bottomGhost: { flex: 1, minHeight: 48, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  bottomPrimary: { flex: 1, minHeight: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  sealDropdownPreview: { borderWidth: 1, borderRadius: 18, marginTop: 10, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  sealDropdownMedia: { width: 82, height: 82 },
  sealDropdownImage: { width: "100%", height: "100%" },
  sealDropdownEmpty: { width: "100%", height: "100%", borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center" },
});
