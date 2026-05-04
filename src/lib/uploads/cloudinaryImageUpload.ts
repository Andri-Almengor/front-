import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/lib/api/client";
import { useAuth } from "@/app/auth/authStore";

type QueueItem = {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
  oldUrl?: string;
  folder?: string;
  createdAt: number;
};

const QUEUE_KEY = "admin_cloudinary_web_image_upload_queue_v1";
const ENDPOINT = "/admin/uploads/image";

function getUploadUrl() {
  const base = String(api.defaults.baseURL || "").replace(/\/+$/, "");
  return `${base}${ENDPOINT}`;
}

function getAuthHeader() {
  const token = useAuth.getState().token;
  return token ? `Bearer ${token}` : "";
}

function isOnline() {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine !== false;
}

async function readQueue(): Promise<QueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueueItem[]) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer la imagen seleccionada."));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const parts = dataUrl.split(",");
  const base64 = parts[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], fileName, { type: mimeType });
}

export async function compressImageFile(file: File): Promise<File> {
  if (typeof document === "undefined" || !file.type.startsWith("image/")) return file;

  const dataUrl = await fileToDataUrl(file);
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("No se pudo preparar la imagen para compresión."));
    img.src = dataUrl;
  });

  const maxWidth = 1600;
  const ratio = image.width > maxWidth ? maxWidth / image.width : 1;
  const width = Math.round(image.width * ratio);
  const height = Math.round(image.height * ratio);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.78));
  if (!blob) return file;

  const baseName = file.name.replace(/\.[^.]+$/, "") || `imagen-${Date.now()}`;
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

export async function enqueueCloudinaryImageUpload(params: { file: File; oldUrl?: string; folder?: string }) {
  const compressed = await compressImageFile(params.file);
  const dataUrl = await fileToDataUrl(compressed);
  const queue = await readQueue();
  const next: QueueItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fileName: compressed.name || `imagen-${Date.now()}.jpg`,
    mimeType: compressed.type || "image/jpeg",
    dataUrl,
    oldUrl: params.oldUrl,
    folder: params.folder,
    createdAt: Date.now(),
  };
  await writeQueue([...queue, next]);
  return next;
}

export async function getCloudinaryUploadQueueCount() {
  return (await readQueue()).length;
}

export async function removeCloudinaryUploadQueueItem(id: string) {
  const queue = await readQueue();
  await writeQueue(queue.filter((item) => item.id !== id));
}

export async function uploadImageToCloudinaryServer(params: {
  file: File;
  oldUrl?: string;
  folder?: string;
  onProgress?: (progress: number) => void;
}) {
  if (!isOnline()) throw new Error("No hay conexión a internet.");

  const compressed = await compressImageFile(params.file);
  const formData = new FormData();
  formData.append("file", compressed);
  if (params.oldUrl) formData.append("oldUrl", params.oldUrl);
  if (params.folder) formData.append("folder", params.folder);

  return await new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", getUploadUrl());

    const auth = getAuthHeader();
    if (auth) xhr.setRequestHeader("Authorization", auth);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && params.onProgress) {
        params.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300 && data?.url) {
          params.onProgress?.(100);
          resolve(String(data.url));
          return;
        }
        reject(new Error(data?.message || data?.error || "No se pudo subir la imagen."));
      } catch (error) {
        reject(error);
      }
    };

    xhr.onerror = () => reject(new Error("No se pudo conectar con el servidor para subir la imagen."));
    xhr.ontimeout = () => reject(new Error("La subida tardó demasiado y fue cancelada."));
    xhr.timeout = 120000;
    xhr.send(formData);
  });
}

export async function processCloudinaryUploadQueue(onUploaded?: (item: QueueItem, url: string) => void) {
  if (!isOnline()) return { processed: 0, remaining: await getCloudinaryUploadQueueCount() };

  const queue = await readQueue();
  let processed = 0;

  for (const item of queue) {
    try {
      const file = dataUrlToFile(item.dataUrl, item.fileName, item.mimeType);
      const url = await uploadImageToCloudinaryServer({ file, oldUrl: item.oldUrl, folder: item.folder });
      await removeCloudinaryUploadQueueItem(item.id);
      processed += 1;
      onUploaded?.(item, url);
    } catch {
      break;
    }
  }

  return { processed, remaining: await getCloudinaryUploadQueueCount() };
}
