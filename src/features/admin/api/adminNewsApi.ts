import { api } from "@/lib/api/client";

export type AdminNews = {
  id: number;
  titulo?: string | null;
  contenido?: string | null;
  imageUrl?: string | null;
  fileUrl?: string | null;
  destino?: "NOVEDADES" | "ANUNCIANTES";
  activo?: boolean;
  notifyUsers?: boolean;
  restauranteId?: number | null;
  notifyUsers?: boolean;
  restaurante?: { id: number; nombreEs?: string | null; nombreEn?: string | null; imageUrl?: string | null } | null;
  creadoEn?: string;
};

export async function listNews() {
  const { data } = await api.get<AdminNews[]>("/admin/noticias");
  return data;
}

export async function createNews(payload: {
  titulo?: string | null;
  contenido?: string | null;
  imageUrl?: string | null;
  fileUrl?: string | null;
  destino?: "NOVEDADES" | "ANUNCIANTES";
  activo?: boolean;
  notifyUsers?: boolean;
  restauranteId?: number | null;
  notifyUsers?: boolean;
}) {
  const { data } = await api.post("/admin/noticias", payload);
  return data;
}

export async function updateNews(
  id: number,
  payload: {
    titulo?: string | null;
    contenido?: string | null;
    imageUrl?: string | null;
    fileUrl?: string | null;
    destino?: "NOVEDADES" | "ANUNCIANTES";
    activo?: boolean;
  notifyUsers?: boolean;
    restauranteId?: number | null;
    notifyUsers?: boolean;
  notifyUsers?: boolean;
  }
) {
  const { data } = await api.put(`/admin/noticias/${id}`, payload);
  return data;
}

export async function deleteNews(id: number) {
  const { data } = await api.delete(`/admin/noticias/${id}`);
  return data;
}
