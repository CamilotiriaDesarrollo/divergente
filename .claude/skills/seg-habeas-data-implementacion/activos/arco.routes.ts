// arco.routes.ts — Derechos del titular (Ley 1581/2012, art. 8): conocer, actualizar, rectificar,
// revocar el consentimiento y solicitar supresión. Línea Node/Express + OpenAPI (back-openapi-contratos-versionado).
// Montar bajo /api/v1/datos-personales. TODA ruta exige verificación de identidad del titular (middleware auth).
// `repo` y `audit` son puertos a implementar; audit.registrar debe capturar fecha, IP y hash (DI-GSI-010).
import { Router, type Request, type Response } from "express";

export const datosPersonalesRouter = Router();

// Consulta: qué datos y finalidades tiene la entidad sobre el titular (art. 8, "conocer").
datosPersonalesRouter.get("/mis-datos", async (req: Request, res: Response) => {
  const titularId = req.titular!.id; // resuelto por el middleware de autenticación
  const datos = await repo.obtenerDatosTitular(titularId);
  await audit.registrar("CONSULTA", req);
  res.json(datos); // DTO administrativo del propio titular (él sí ve sus datos completos)
});

// Rectificación / actualización.
datosPersonalesRouter.patch("/mis-datos", async (req: Request, res: Response) => {
  await repo.actualizarDatos(req.titular!.id, req.body);
  await audit.registrar("RECTIFICACION", req);
  res.sendStatus(204);
});

// Revocación de consentimiento por finalidad -> detiene el tratamiento de esa finalidad.
datosPersonalesRouter.post("/revocar/:finalidad", async (req: Request, res: Response) => {
  await repo.revocarConsentimiento(req.titular!.id, req.params.finalidad);
  await audit.registrar("REVOCACION", req);
  res.sendStatus(204);
});

// Supresión: se anonimiza salvo obligación legal de conservar (ver politica-retencion.yaml).
datosPersonalesRouter.delete("/mis-datos", async (req: Request, res: Response) => {
  const resultado = await repo.solicitarSupresion(req.titular!.id);
  await audit.registrar("SUPRESION", req);
  // { estado: 'anonimizado' | 'retenido_por_ley', detalle: string }
  res.json(resultado);
});
