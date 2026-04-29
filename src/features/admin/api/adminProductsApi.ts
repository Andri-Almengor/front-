import { api } from "@/lib/api/client";

export type AdminProduct = {
  id: number;
  catGeneral: string;
  catGeneralEn?: string | null;
  categoria1: string;
  categoria1En?: string | null;
  fabricanteMarca: string;
  fabricanteMarcaEn?: string | null;
  nombre: string;
  nombreEn?: string | null;

  certifica?: string | null;
  certificaEn?: string | null;
  sello?: string | null;
  selloEn?: string | null;

  atributo1?: string | null;
  atributo1En?: string | null;
  atributo2?: string | null;
  atributo2En?: string | null;
  atributo3?: string | null;
  atributo3En?: string | null;

  tienda?: string | null;
  tiendaEn?: string | null;

  fotoProducto?: string | null;
  fotoSello1?: string | null;
  fotoSello2?: string | null;
  creadoEn?: string | null;
  actualizadoEn?: string | null;
};

export async function listAdminProducts() {
  const { data } = await api.get<AdminProduct[]>("/admin/productos");
  return data;
}

export async function createAdminProduct(payload: Omit<AdminProduct, "id">) {
  const { data } = await api.post<AdminProduct>("/admin/productos", payload);
  return data;
}

export async function updateAdminProduct(id: number, payload: Partial<Omit<AdminProduct, "id">>) {
  const { data } = await api.put<AdminProduct>(`/admin/productos/${id}`, payload);
  return data;
}

export async function deleteAdminProduct(id: number) {
  const { data } = await api.delete(`/admin/productos/${id}`);
  return data;
}

export type ImportExcelInput =
  | { uri: string; name: string; mimeType?: string }
  | { file: File };

export async function importProductsExcel(input: ImportExcelInput) {
  const form = new FormData();

  // ✅ WEB: recibimos File directamente
  if ("file" in input) {
    form.append("file", input.file);
  } else {
    // ✅ RN (Android/iOS): FormData file object con uri
    form.append("file", {
      uri: input.uri,
      name: input.name,
      type:
        input.mimeType ??
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    } as any);
  }

  // ⚠️ En React Native, setear manualmente "Content-Type" puede romper el boundary.
  // Dejamos que axios lo resuelva.
  const { data } = await api.post("/admin/productos/import-excel", form);

  return data;
}

