"""
scripts/test_upload_mock.py — Tests del modo --upload con gspread mockeado.

NO requiere credenciales ni red. Mockea el spreadsheet a nivel de
`sheets_client.get_spreadsheet` y verifica:

  1. leer_hashes_ofertas: hashes idénticos a Oferta.hash (misma fórmula).
  2. siguiente_id_oferta: continúa desde el máximo existente, tolerando el
     prefijo por perfil (DIV00007 → siguiente 8).
  3. asegurar_pestanas_operacion: crea CONTROL/LOG/MANUAL (ya NO OFERTAS),
     idempotente (segunda corrida no duplica nada).
  4. subir_ofertas_al_sheet (main.py): enruta cada oferta a la pestaña de su
     perfil (OFERTAS_CT / OFERTAS_DIV), dedup por pestaña, ids con prefijo,
     estado=pendiente, sin-match NO se suben, y LOG una fila por fuente.
  5. registrar_log_scrape: mapea las columnas de LOG correctamente.

Uso:
  python scripts/test_upload_mock.py
"""

from __future__ import annotations

import sys
import unittest
from pathlib import Path
from typing import Any
from unittest import mock

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import gspread  # noqa: E402

import config  # noqa: E402
import main as main_mod  # noqa: E402
import sheets_client  # noqa: E402
from scrapers.base import Oferta, calcular_hash_oferta  # noqa: E402


# ============================================================
# Fakes mínimos de gspread
# ============================================================
class FakeWorksheet:
    def __init__(self, title: str, headers: list[str] | None = None,
                 rows: list[list[Any]] | None = None):
        self.title = title
        self._headers = list(headers or [])
        self._rows = [list(r) for r in (rows or [])]
        self.append_calls: list[list[list[Any]]] = []

    # --- API usada por sheets_client ---
    def row_values(self, idx: int) -> list[Any]:
        if idx == 1:
            return list(self._headers)
        return self._rows[idx - 2] if 0 <= idx - 2 < len(self._rows) else []

    def get_all_records(self) -> list[dict[str, Any]]:
        return [dict(zip(self._headers, r)) for r in self._rows]

    def append_rows(self, rows: list[list[Any]], value_input_option: str | None = None) -> None:
        self.append_calls.append([list(r) for r in rows])
        self._rows.extend([list(r) for r in rows])

    def update(self, range_name: Any = None, values: Any = None) -> None:
        # gspread 6.x: update(values, range_name) — el código usa update("A1", [headers])
        if range_name == "A1" and values:
            self._headers = list(values[0])
        elif values == "A1" and range_name:  # por si invierten args (compat 6.x)
            self._headers = list(range_name[0])

    @property
    def row_count(self) -> int:
        return 1 + len(self._rows)

    @property
    def col_count(self) -> int:
        return max(len(self._headers), 1)


class FakeSpreadsheet:
    def __init__(self, sheets: dict[str, FakeWorksheet] | None = None):
        self.title = "FAKE_SHEET"
        self._sheets: dict[str, FakeWorksheet] = dict(sheets or {})
        self.added: list[str] = []

    def worksheet(self, name: str) -> FakeWorksheet:
        if name not in self._sheets:
            raise gspread.WorksheetNotFound(name)
        return self._sheets[name]

    def add_worksheet(self, title: str, rows: int, cols: int) -> FakeWorksheet:
        ws = FakeWorksheet(title)
        self._sheets[title] = ws
        self.added.append(title)
        return ws

    def worksheets(self) -> list[FakeWorksheet]:
        return list(self._sheets.values())


def _fila_ofertas(**kwargs: Any) -> list[Any]:
    """Construye una fila alineada a HEADERS_OFERTAS."""
    return [kwargs.get(h, "") for h in sheets_client.HEADERS_OFERTAS]


def _oferta(titulo: str, empresa: str, fuente: str = "SECOP II",
            perfil: str = "DIV") -> Oferta:
    return Oferta(
        fuente_id="F001",
        fuente_nombre=fuente,
        tipo_oferta="convocatoria_publica",
        titulo=titulo,
        url_original="https://example.com/p",
        empresa_entidad=empresa,
        perfiles_match=[perfil] if perfil else [],
    )


# ============================================================
# Tests
# ============================================================
class TestUploadMock(unittest.TestCase):
    def setUp(self) -> None:
        # OFERTAS_DIV con 2 filas existentes; ids no consecutivos a propósito
        # (prefijo DIV, max=7) para probar el consecutivo con prefijo.
        self.tab_div = config.tab_ofertas("DIV")
        self.ws_ofertas = FakeWorksheet(
            self.tab_div,
            headers=sheets_client.HEADERS_OFERTAS,
            rows=[
                _fila_ofertas(id="DIV00001", fuente_nombre="SECOP II",
                              titulo="Consultoría datos", empresa_entidad="Alcaldía X",
                              estado="pendiente"),
                _fila_ofertas(id="DIV00007", fuente_nombre="SECOP II",
                              titulo="Plataforma digital", empresa_entidad="Gobernación Y",
                              estado="aprobada"),
            ],
        )
        self.sp = FakeSpreadsheet({self.tab_div: self.ws_ofertas})
        patcher = mock.patch.object(sheets_client, "get_spreadsheet", return_value=self.sp)
        patcher.start()
        self.addCleanup(patcher.stop)

    # ---------- 1. Hashes ----------
    def test_leer_hashes_coincide_con_oferta_hash(self) -> None:
        registros = self.ws_ofertas.get_all_records()
        hashes = sheets_client.leer_hashes_ofertas(registros)
        self.assertEqual(len(hashes), 2)
        # Misma fórmula que Oferta.hash (vía calcular_hash_oferta)
        o = _oferta("Consultoría datos", "Alcaldía X")
        self.assertIn(o.hash, hashes)
        self.assertIn(calcular_hash_oferta("SECOP II", "Plataforma digital", "Gobernación Y"), hashes)
        # La normalización aplica: mayúsculas/tildes/espacios no cambian el hash
        o2 = _oferta("  CONSULTORIA   DATOS ", "alcaldia x")
        self.assertIn(o2.hash, hashes)

    # ---------- 2. Ids consecutivos (con prefijo por perfil) ----------
    def test_siguiente_id_continua_desde_el_maximo(self) -> None:
        registros = self.ws_ofertas.get_all_records()
        self.assertEqual(sheets_client.siguiente_id_oferta(registros), 8)
        self.assertEqual(sheets_client.formatear_id_oferta(8, "DIV"), "DIV00008")
        self.assertEqual(sheets_client.formatear_id_oferta(8, "CT"), "CT00008")

    def test_siguiente_id_pestana_vacia(self) -> None:
        self.assertEqual(sheets_client.siguiente_id_oferta(registros=[]), 1)

    # ---------- 3. Pestañas de operación ----------
    def test_asegurar_pestanas_operacion_idempotente(self) -> None:
        sheets_client.asegurar_pestanas_operacion()
        # Ya NO crea OFERTAS: solo CONTROL/LOG/MANUAL
        self.assertEqual(sorted(self.sp.added),
                         sorted([config.TAB_CONTROL, config.TAB_LOG, config.TAB_MANUAL]))
        self.assertEqual(self.sp.worksheet(config.TAB_LOG).row_values(1),
                         sheets_client.HEADERS_LOG)
        self.assertEqual(self.sp.worksheet(config.TAB_CONTROL).row_values(1),
                         sheets_client.HEADERS_CONTROL)
        self.assertEqual(self.sp.worksheet(config.TAB_MANUAL).row_values(1),
                         sheets_client.HEADERS_MANUAL)
        # La pestaña de ofertas existente NO se recrea ni pierde sus filas
        self.assertEqual(len(self.ws_ofertas._rows), 2)
        # Idempotencia: segunda corrida no agrega nada
        sheets_client.asegurar_pestanas_operacion()
        self.assertEqual(len(self.sp.added), 3)

    # ---------- 4. Pipeline de upload (main.subir_ofertas_al_sheet) ----------
    def test_subir_ofertas_dedup_ids_y_columnas(self) -> None:
        ofertas = [
            # Duplicada contra el Sheet (difiere en mayúsculas/espacios → mismo hash)
            _oferta("Consultoría  DATOS", "Alcaldía X"),
            _oferta("Observatorio cultural", "MinCultura"),
            _oferta("Dashboard analítica", "DNP"),
        ]
        stats = {"SECOP II": {"scrapeadas": 3, "errores": 0, "duracion_seg": 1.27}}

        with mock.patch.object(main_mod, "validar_credenciales_upload", lambda: None):
            resumen = main_mod.subir_ofertas_al_sheet(ofertas, stats)

        self.assertEqual(resumen, {"nuevas": 2, "duplicadas_sheet": 1, "sin_match": 0})

        # UN solo append batch a OFERTAS_DIV, con 2 filas (la duplicada NO se sube)
        self.assertEqual(len(self.ws_ofertas.append_calls), 1)
        filas = self.ws_ofertas.append_calls[0]
        self.assertEqual(len(filas), 2)

        h = sheets_client.HEADERS_OFERTAS
        for fila in filas:
            self.assertEqual(len(fila), len(h), "fila no alineada a headers de OFERTAS")

        # Ids consecutivos con prefijo DIV, continuando desde DIV00007
        self.assertEqual([f[h.index("id")] for f in filas], ["DIV00008", "DIV00009"])
        # estado=pendiente y columnas correctas
        self.assertEqual([f[h.index("estado")] for f in filas], ["pendiente", "pendiente"])
        self.assertEqual([f[h.index("titulo")] for f in filas],
                         ["Observatorio cultural", "Dashboard analítica"])
        self.assertEqual([f[h.index("empresa_entidad")] for f in filas], ["MinCultura", "DNP"])
        self.assertEqual([f[h.index("fuente_nombre")] for f in filas], ["SECOP II", "SECOP II"])
        # La duplicada no aparece en lo subido
        titulos_subidos = [f[h.index("titulo")] for f in filas]
        self.assertNotIn("Consultoría  DATOS", titulos_subidos)

        # LOG: una fila por fuente, en un append batch
        ws_log = self.sp.worksheet(config.TAB_LOG)
        self.assertEqual(len(ws_log.append_calls), 1)
        log_rows = ws_log.get_all_records()
        self.assertEqual(len(log_rows), 1)
        r = log_rows[0]
        self.assertEqual(r["fuente"], "SECOP II")
        self.assertEqual(r["nuevas"], 2)
        self.assertEqual(r["duplicadas"], 1)
        self.assertEqual(r["errores"], 0)
        self.assertEqual(r["duracion_seg"], 1.3)
        self.assertTrue(str(r["fecha"]).startswith("20"), "fecha debe ser ISO")

    def test_enruta_cada_oferta_a_la_pestana_de_su_perfil(self) -> None:
        # Mezcla CT y DIV: cada una debe ir a su propia pestaña, con su prefijo.
        ofertas = [
            _oferta("AI Automation Lead", "Acme", perfil="CT"),
            _oferta("Observatorio cultural", "MinCultura", perfil="DIV"),
            _oferta("Head of Product", "Globant", perfil="CT"),
            _oferta("Sin perfil", "Nadie", perfil=""),  # sin match → no se sube
        ]
        stats = {"SECOP II": {"scrapeadas": 4, "errores": 0, "duracion_seg": 1.0}}
        with mock.patch.object(main_mod, "validar_credenciales_upload", lambda: None):
            resumen = main_mod.subir_ofertas_al_sheet(ofertas, stats)

        self.assertEqual(resumen, {"nuevas": 3, "duplicadas_sheet": 0, "sin_match": 1})
        h = sheets_client.HEADERS_OFERTAS

        # OFERTAS_CT: creada lazy, 2 filas con ids CT00001, CT00002
        ws_ct = self.sp.worksheet(config.tab_ofertas("CT"))
        filas_ct = ws_ct.append_calls[0]
        self.assertEqual([f[h.index("id")] for f in filas_ct], ["CT00001", "CT00002"])
        self.assertEqual([f[h.index("titulo")] for f in filas_ct],
                         ["AI Automation Lead", "Head of Product"])

        # OFERTAS_DIV: ya existía (max DIV00007), nueva en DIV00008
        filas_div = self.ws_ofertas.append_calls[0]
        self.assertEqual([f[h.index("id")] for f in filas_div], ["DIV00008"])
        self.assertEqual([f[h.index("titulo")] for f in filas_div], ["Observatorio cultural"])

        # La sin-match no creó ninguna pestaña extra
        self.assertNotIn("Sin perfil", [f[h.index("titulo")] for f in filas_ct])

    def test_segundo_upload_todo_duplicado_no_sube_nada(self) -> None:
        ofertas = [_oferta("Observatorio cultural", "MinCultura")]
        stats = {"SECOP II": {"scrapeadas": 1, "errores": 0, "duracion_seg": 0.5}}
        with mock.patch.object(main_mod, "validar_credenciales_upload", lambda: None):
            r1 = main_mod.subir_ofertas_al_sheet(ofertas, stats)
            r2 = main_mod.subir_ofertas_al_sheet(ofertas, stats)
        self.assertEqual(r1, {"nuevas": 1, "duplicadas_sheet": 0, "sin_match": 0})
        self.assertEqual(r2, {"nuevas": 0, "duplicadas_sheet": 1, "sin_match": 0})
        # Solo el primer run hizo append a OFERTAS_DIV
        self.assertEqual(len(self.ws_ofertas.append_calls), 1)

    # ---------- 5. registrar_log_scrape singular ----------
    def test_registrar_log_scrape_columnas(self) -> None:
        sheets_client.asegurar_pestanas_operacion()
        sheets_client.registrar_log_scrape("Devex", nuevas=5, duplicadas=2,
                                           errores=1, duracion_seg=12.345)
        ws_log = self.sp.worksheet(config.TAB_LOG)
        rows = ws_log.get_all_records()
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["fuente"], "Devex")
        self.assertEqual(rows[0]["nuevas"], 5)
        self.assertEqual(rows[0]["duplicadas"], 2)
        self.assertEqual(rows[0]["errores"], 1)
        self.assertEqual(rows[0]["duracion_seg"], 12.3)

    # ---------- 6. Credenciales faltantes ----------
    def test_subir_sin_credenciales_lanza_error_claro(self) -> None:
        # Sin mockear validar_credenciales_upload: no hay service-account.json real.
        if config.GOOGLE_CREDENTIALS_PATH.exists():
            self.skipTest("Hay credenciales reales; este test aplica solo sin ellas.")
        with self.assertRaises(main_mod.CredencialesFaltantesError) as ctx:
            main_mod.subir_ofertas_al_sheet([], {})
        self.assertIn("credenciales", str(ctx.exception).lower())
        self.assertIn("PLAN.md", str(ctx.exception))


if __name__ == "__main__":
    unittest.main(verbosity=2)
