// enmascarar.ts — Enmascaramiento de datos personales para la línea Node/React (Ley 1581/2012).
// Funciones puras, sin dependencias. Úsalas en el DTO público del backend Express y, si hace falta,
// también en el cliente (Next.js 16 / React 19 / Vite). La verdad del enmascarado vive en el BACKEND:
// el cliente nunca debe recibir el dato completo "para mostrar solo una parte".

export const enmascararCorreo = (correo?: string | null): string | null => {
  if (!correo || !correo.includes("@")) return null;
  const [local, dominio] = correo.split("@");
  const visible = local.length <= 1 ? local : local[0] + "*".repeat(Math.min(local.length - 1, 6));
  return `${visible}@${dominio}`;
};

export const enmascararTelefono = (tel?: string | null): string | null => {
  if (!tel) return null;
  const d = tel.replace(/\D/g, "");
  if (d.length < 4) return "***";
  return `${d[0]}${"*".repeat(d.length - 3)}${d.slice(-2)}`;
};

// Para logs/soporte; nunca en un DTO público.
export const enmascararDocumento = (doc?: string | null): string => {
  if (!doc || doc.length < 4) return "****";
  return "*".repeat(doc.length - 4) + doc.slice(-4);
};

export const nombreVisible = (nombres: string, apellidos = ""): string =>
  `${nombres.trim().split(" ")[0]} ${apellidos ? apellidos.trim()[0] + "." : ""}`.trim();
