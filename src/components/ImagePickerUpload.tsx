import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, Pressable, Image, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  enqueueCloudinaryImageUpload,
  getCloudinaryUploadQueueCount,
  processCloudinaryUploadQueue,
  uploadImageToCloudinaryServer,
} from "@/lib/uploads/cloudinaryImageUpload";

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  folder?: string;
  inputStyle?: any;
  labelStyle?: any;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
  backgroundColor?: string;
};

export default function ImagePickerUpload({
  label = "Imagen",
  value,
  onChange,
  placeholder = "https://...",
  folder = "kosher-costa-rica",
  inputStyle,
  labelStyle,
  textColor = "#111827",
  mutedColor = "#64748b",
  borderColor = "#dbe3ef",
  backgroundColor = "#ffffff",
}: Props) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [queued, setQueued] = useState(0);
  const [dragging, setDragging] = useState(false);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);

  const refreshQueue = async () => setQueued(await getCloudinaryUploadQueueCount());

  useEffect(() => {
    void refreshQueue();

    const processQueue = () => {
      void processCloudinaryUploadQueue((_item, url) => onChange(url)).then(refreshQueue);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("online", processQueue);
      processQueue();
      return () => window.removeEventListener("online", processQueue);
    }
  }, [onChange]);

  const uploadFileNowOrQueue = async (file: File) => {
    const oldUrl = String(value || "").trim();

    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      await enqueueCloudinaryImageUpload({ file, oldUrl, folder });
      await refreshQueue();
      Alert.alert("Imagen en cola", "No hay conexión. La imagen se subirá automáticamente cuando vuelva internet.");
      return;
    }

    try {
      setUploading(true);
      setProgress(1);
      const url = await uploadImageToCloudinaryServer({ file, oldUrl, folder, onProgress: setProgress });
      onChange(url);
    } catch (error: any) {
      await enqueueCloudinaryImageUpload({ file, oldUrl, folder });
      await refreshQueue();
      Alert.alert("Subida en cola", error?.message || "No se pudo subir ahora. Se intentará de nuevo automáticamente.");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 700);
    }
  };

  const selectFile = () => {
    if (Platform.OS !== "web") {
      Alert.alert("Disponible en web", "Este módulo web permite cargar imágenes desde el navegador del teléfono o computadora.");
      return;
    }
    hiddenInputRef.current?.click();
  };

  const webDropProps = Platform.OS === "web" ? {
    onDragEnter: (event: any) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragOver: (event: any) => {
      event.preventDefault();
      setDragging(true);
    },
    onDragLeave: (event: any) => {
      event.preventDefault();
      setDragging(false);
    },
    onDrop: async (event: any) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) await uploadFileNowOrQueue(file);
    },
  } : {};

  return (
    <View style={styles.wrap} {...(webDropProps as any)}>
      <Text style={[styles.label, { color: mutedColor }, labelStyle]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={[styles.input, { backgroundColor, borderColor, color: textColor }, inputStyle]}
        placeholderTextColor={mutedColor}
        placeholder={placeholder}
        autoCapitalize="none"
      />

      {Platform.OS === "web" ? (
        <input
          ref={hiddenInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = "";
            if (file) void uploadFileNowOrQueue(file);
          }}
        />
      ) : null}

      <Pressable disabled={uploading} onPress={selectFile} style={[styles.uploadBtn, { borderColor: dragging ? textColor : borderColor, backgroundColor }]}> 
        {uploading ? <ActivityIndicator size="small" color={textColor} /> : <Ionicons name="cloud-upload-outline" size={18} color={textColor} />}
        <Text style={[styles.uploadText, { color: textColor }]}>{uploading ? `Subiendo... ${progress}%` : "Subir imagen"}</Text>
      </Pressable>

      <Text style={[styles.helper, { color: mutedColor }]}>Puedes pegar la URL manualmente, seleccionar una imagen o arrastrarla aquí.</Text>
      {queued > 0 ? <Text style={[styles.helper, { color: mutedColor }]}>Pendientes por subir cuando vuelva internet: {queued}</Text> : null}

      {progress > 0 ? (
        <View style={[styles.progressTrack, { backgroundColor: borderColor }]}> 
          <View style={[styles.progressFill, { width: `${Math.max(1, Math.min(progress, 100))}%`, backgroundColor: textColor }]} />
        </View>
      ) : null}

      {value ? <Image source={{ uri: value }} style={[styles.preview, { borderColor }]} resizeMode="cover" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 10, marginBottom: 6 },
  label: { marginBottom: 8, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  input: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, height: 50, fontWeight: "700" },
  uploadBtn: { marginTop: 10, minHeight: 48, borderWidth: 1, borderRadius: 16, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 12 },
  uploadText: { fontSize: 13, fontWeight: "900" },
  helper: { marginTop: 8, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  progressTrack: { marginTop: 10, height: 8, borderRadius: 999, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 999 },
  preview: { marginTop: 12, width: 132, height: 132, borderRadius: 18, borderWidth: 1 },
});
