"""One-shot: aplica la curaduría del lote PAU (skill curador-paula, 2026-06-16).
Decisiones por fragmento de título. Verifica con asserts antes de escribir.
"""
import json, sys, unicodedata
from datetime import datetime
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
RAIZ = Path(__file__).resolve().parent.parent
LATEST = RAIZ / "data" / "ofertas_latest.json"


def norm(s):
    s = unicodedata.normalize("NFD", s or "").encode("ascii", "ignore").decode("ascii")
    return s.lower()


# Decisiones (fragmento distintivo del título -> razón)
APROBAR = {
    "premio de ensayo sobre arte": "ensayo/escritura sobre arte (su área)",
    "consultor senior de comunicaciones": "comunicación estratégica senior",
    "tecnico/a de comunicacion del programa ibermuseos": "comunicación + museos (Ibermuseos)",
    "clinicas de escrituras creativas": "escritura creativa narrativa/poesía",
    "periodismo para investigar el desplazamiento": "periodismo de investigación + memoria",
    "periodismo para investigar la desaparicion": "periodismo de investigación + memoria",
    "beca filarmonica de medios de comunicacion comunitarios": "medios de comunicación comunitarios",
    "catedra cinemateca": "cine/audiovisual/archivo (Cinemateca)",
    "director(a) de comunicaciones estrategicas": "dirección de comunicación estratégica",
    "comunicador social organizacional": "comunicación organizacional",
    "docente medio tiempo virtual comunicacion": "docencia de comunicación",
    "periodismo de datos de brasil": "periodismo de datos (proyectos)",
    "narradores de f": "narrativa/escritura (jurado)",
    "coordinador(a) de comunicaciones - sector salud": "coordinación de comunicaciones",
    "videoteca local": "audiovisual/archivo (Videoteca)",
    "digitalizacion de cine": "cine/preservación audiovisual",
    "head de comunicacion y posicionamiento": "dirección de comunicación",
    "profesional experto relacion con los medios": "relación con medios",
    "estratega de contenido de inversiones": "estrategia de contenido/comunicación",
    "productor audiovisual": "producción audiovisual",
    "ronda de proyectos de la cu": "convocatoria periodismo (Cumbre)",
    "premios ortega y gasset": "premio de periodismo",
    "pollinate impact network storyteller": "storytelling/narrativa para impacto",
    "jefe de comunicaciones y servicio al cliente": "jefatura de comunicaciones",
    "gestor(a) de campo para investigacion social": "investigación social de campo",
    "comunicador social sector construccion": "comunicación social",
    "especialista en comunicaciones personas con y sin discapac": "comunicación inclusiva",
}
RECHAZAR = {
    "especialista en telecomunicaciones e infraestructura": "rol técnico (telecomunicaciones)",
    "premio luis caballero": "premio de artes plásticas (artista ejecutante, no Paula)",
    "especialista en sistemas de voz, datos": "rol técnico (sistemas/telecom)",
    "jefe de diseno de proyectos energeticos": "ingeniería energética",
    "beca lep ruta teatro": "teatro (ejecución artística)",
    "beca plataforma bogota - arte, ciencia y tecnologia": "beca para artistas (creación)",
    "beca lep de produccion opera": "música/ópera (ejecución)",
    "beca festival salsa al parque": "música/danza (ejecución)",
    "premio danza k-pop": "danza (ejecución artística)",
    "premio biva": "premio para artistas (imagen en movimiento)",
    "premio danza urbana": "danza (ejecución artística)",
    "premio distrital breaking": "danza/breaking (ejecución)",
    "premio filarmonico mujeres compositoras": "composición musical (ejecución)",
    "premio de composicion coro filarmonico": "composición musical (ejecución)",
    "premio de composicion 2026": "composición musical (ejecución)",
    "analista de compras en medios": "compras/administrativo (no comunicación)",
    "oficial de proyecto [fortalecimiento economico": "proyecto económico (no comunicación)",
    "convocatoria lep - ecosistemas de interes publico": "producción/circulación espectáculos (operativo)",
}
PENDIENTE = {
    "secretario/a tecnico/a del programa ibermedia": "rol técnico-admin de programa audiovisual ibero: revisar",
    "laboratorio sur(de)aca": "laboratorio cultural ambiguo: revisar",
}


def decidir(titulo_norm):
    for frag, razon in APROBAR.items():
        if norm(frag) in titulo_norm:
            return "aprobada", razon
    for frag, razon in RECHAZAR.items():
        if norm(frag) in titulo_norm:
            return "rechazada", razon
    for frag, razon in PENDIENTE.items():
        if norm(frag) in titulo_norm:
            return "pendiente", razon
    return None, None


def pm(o):
    v = o.get("perfiles_match")
    return json.loads(v) if isinstance(v, str) else (v or [])


def main():
    ofertas = json.loads(LATEST.read_text(encoding="utf-8"))
    cont = {"aprobada": 0, "rechazada": 0, "pendiente": 0}
    sin_decidir = []
    for o in ofertas:
        if "PAU" not in pm(o):
            continue
        if (o.get("estado") or "pendiente") != "pendiente":
            continue
        estado, razon = decidir(norm(o.get("titulo", "")))
        if estado is None:
            sin_decidir.append(o.get("titulo", "")[:55])
            continue
        o["estado"] = estado
        o["notas"] = (o.get("notas", "") or "") + f" | [auto-curador-paula] {razon}"
        cont[estado] += 1

    # Asserts de seguridad
    total = sum(cont.values())
    print(f"Clasificadas: {cont} · total {total}")
    if sin_decidir:
        print(f"⚠ SIN DECIDIR ({len(sin_decidir)}):")
        for t in sin_decidir:
            print(f"    {t}")
        print("ABORTADO: hay ofertas sin regla. Revisar antes de escribir.")
        sys.exit(1)
    assert total == 47, f"Esperaba 47, clasifiqué {total}"
    assert cont["aprobada"] == 27 and cont["rechazada"] == 18 and cont["pendiente"] == 2

    snap = RAIZ / "data" / f"ofertas_curated_{datetime.now():%Y%m%d_%H%M%S}.json"
    snap.write_text(json.dumps(ofertas, ensure_ascii=False, indent=2), encoding="utf-8")
    LATEST.write_text(json.dumps(ofertas, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"✓ Guardado. Snapshot: {snap.name}")


if __name__ == "__main__":
    main()
