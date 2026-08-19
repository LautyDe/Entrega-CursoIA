from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Image,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "MealBoard-entrega-final.pdf"
SCREENSHOT = ROOT / "docs" / "evidencias" / "01-produccion.png"

CREAM = colors.HexColor("#F7F0E5")
BURGUNDY = colors.HexColor("#681F32")
BURGUNDY_DARK = colors.HexColor("#3D1320")
GREEN = colors.HexColor("#34745B")
GREEN_LIGHT = colors.HexColor("#DCEBE3")
INK = colors.HexColor("#292521")
MUTED = colors.HexColor("#6E665F")
LINE = colors.HexColor("#D7CABD")
WHITE = colors.white

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="CoverKicker", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=GREEN, spaceAfter=9))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=31, leading=34, textColor=BURGUNDY_DARK, spaceAfter=12))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=14, leading=20, textColor=INK, spaceAfter=18))
styles.add(ParagraphStyle(name="H1x", fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=BURGUNDY_DARK, spaceAfter=12))
styles.add(ParagraphStyle(name="H2x", fontName="Helvetica-Bold", fontSize=14, leading=18, textColor=BURGUNDY, spaceBefore=7, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", fontName="Helvetica", fontSize=9.3, leading=13.2, textColor=INK, spaceAfter=7))
styles.add(ParagraphStyle(name="Smallx", fontName="Helvetica", fontSize=7.7, leading=10.3, textColor=INK))
styles.add(ParagraphStyle(name="Tinyx", fontName="Helvetica", fontSize=6.6, leading=8.6, textColor=INK))
styles.add(ParagraphStyle(name="Callout", fontName="Helvetica-Bold", fontSize=10.5, leading=15, textColor=BURGUNDY_DARK, backColor=GREEN_LIGHT, borderColor=GREEN, borderWidth=0.6, borderPadding=10, spaceBefore=7, spaceAfter=10))
styles.add(ParagraphStyle(name="Center", fontName="Helvetica", fontSize=8, leading=11, alignment=TA_CENTER, textColor=MUTED))


def P(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def page_header(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY)
    canvas.rect(0, h - 12 * mm, w, 12 * mm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(WHITE)
    canvas.drawString(18 * mm, h - 7.5 * mm, "MEALBOARD  ·  ENTREGA FINAL")
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(w - 18 * mm, 10 * mm, f"{doc.page}")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 14 * mm, w - 18 * mm, 14 * mm)
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY)
    canvas.rect(0, h - 20 * mm, w, 20 * mm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.circle(w - 24 * mm, h - 42 * mm, 17 * mm, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY_DARK)
    canvas.circle(w - 44 * mm, 31 * mm, 28 * mm, fill=1, stroke=0)
    canvas.restoreState()


def table(data, widths, header=True, font=7.5):
    rows = [[P(str(cell), "Smallx") for cell in row] for row in data]
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.35, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("BACKGROUND", (0, 1 if header else 0), (-1, -1), colors.Color(1, 1, 1, alpha=0.58)),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), BURGUNDY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE)]
    t.setStyle(TableStyle(commands))
    return t


def flow(nodes, widths=None):
    widths = widths or [39 * mm] * len(nodes)
    row = []
    for i, node in enumerate(nodes):
        row.append(P(node, "Smallx"))
        if i < len(nodes) - 1:
            row.append(P("→", "H2x"))
    col_widths = []
    for i, width in enumerate(widths):
        col_widths.append(width)
        if i < len(widths) - 1:
            col_widths.append(7 * mm)
    t = Table([row], colWidths=col_widths, hAlign="CENTER")
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("BACKGROUND", (0, 0), (-1, -1), GREEN_LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.5, GREEN),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return t


def title(text, subtitle=None):
    parts = [P(text, "H1x")]
    if subtitle:
        parts.append(P(subtitle, "Bodyx"))
    return parts


def bullets(items):
    return [P(f"• {item}", "Bodyx") for item in items]


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=19 * mm, bottomMargin=18 * mm,
                          title="MealBoard — Entrega final", author="Lautaro Demonte")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=frame, onPage=cover, autoNextPageTemplate="body"),
        PageTemplate(id="body", frames=frame, onPage=page_header),
    ])
    s = []

    # 1 — portada y accesos obligatorios
    s += [Spacer(1, 26 * mm), P("PROYECTO FINAL · CURSO DE IA", "CoverKicker"), P("MealBoard", "CoverTitle"),
          P("Planificación semanal de comidas, inventario y ahorro para personas que viven solas.", "CoverSub"),
          P("Lautaro Demonte · Desarrollo integral, producto, arquitectura, pruebas y documentación", "Callout")]
    links = [
        ["Recurso", "Acceso"],
        ["Repositorio", '<link href="https://github.com/LautyDe/Entrega-CursoIA" color="#34745B">github.com/LautyDe/Entrega-CursoIA</link>'],
        ["Aplicación publicada", '<link href="https://mealboard-ai.lauty-d-p.chatgpt.site" color="#34745B">mealboard-ai.lauty-d-p.chatgpt.site</link>'],
        ["Demostración", "Guion reproducible en docs/guion-demo.md; video opcional pendiente de grabación autenticada"],
        ["Documentación", "README.md, docs/arquitectura.md y anexos de evaluación"],
    ]
    s += [table(links, [40 * mm, 125 * mm]), Spacer(1, 10 * mm), P("Versión documentada: 19 de agosto de 2026", "Center"), PageBreak()]

    # 2
    s += title("1. Proyecto, problema y público")
    s += [P("MealBoard resuelve una dificultad concreta: planificar una semana de comidas cuando una sola persona debe coordinar inventario, vencimientos, presupuesto, preferencias, habilidades de cocina y promociones. El costo de equivocarse no es solo económico: también puede producir desperdicio o una recomendación incompatible con una alergia."),
          P("La propuesta combina una interfaz web instalable con un ciclo de nueve agentes determinísticos. No utiliza un LLM ni una API paga en producción. Esto permite explicar cada decisión y conservar una prioridad rígida: alergias y alimentos vencidos prevalecen sobre gustos, ahorro o velocidad."),
          P("Resultado entregado", "H2x")]
    s += bullets([
        "Aplicación responsive/PWA con autenticación por email y Google, onboarding y datos por usuario.",
        "Calendario semanal configurable por categoría: balanceado, fit/proteico, vegano, vegetariano, sin TACC y delicioso.",
        "Inventario, lista de compras, confirmación de comidas cocinadas y descuento de ingredientes.",
        "Calorías y macronutrientes básicos estimados para lo planificado y lo cocinado.",
        "Calendarios comunitarios reales en D1, con descripción y público recomendado.",
        "Mapa de supermercados cercanos y consulta acotada de beneficios públicos oficiales.",
    ])
    s += [P("Público objetivo", "H2x"), P("Personas adultas que viven solas en Argentina, cocinan con distintos niveles de experiencia y quieren reducir esfuerzo, gasto y desperdicio. La app evita exigir conocimientos técnicos y conserva confirmación humana para cambios importantes."),
          P("Alcance y honestidad de datos", "H2x"), P("Los precios del catálogo son demostrativos. Las publicaciones comunitarias sí provienen de usuarios autenticados. Las promociones públicas muestran fuente y vigencia cuando pueden verificarse, pero deben confirmarse antes de pagar porque cambian según entidad, sucursal y segmentación."), PageBreak()]

    # 3
    s += title("2. Arquitectura general", "Separación entre interfaz, reglas agénticas, servicios tradicionales y persistencia.")
    s += [Spacer(1, 5 * mm), flow(["Usuario\nPWA", "React / Vinext\nUI y estado", "API / Orquestador\nWorkingState", "D1 + respaldo\npor usuario"], [33*mm, 40*mm, 43*mm, 37*mm]), Spacer(1, 9 * mm)]
    s += [table([
        ["Componente", "Tipo", "Responsabilidad"],
        ["React + Vinext", "Software tradicional", "Interfaz, accesibilidad, validación visual y confirmaciones."],
        ["Orquestador", "Control determinístico", "Ejecuta nueve agentes en orden sin mutar el estado de entrada."],
        ["Agentes", "IA simbólica / reglas", "Observan, deciden y entregan resultados auditables."],
        ["Better Auth", "Servicio de identidad", "Email/contraseña, Google OAuth, sesión y recuperación."],
        ["Cloudflare D1", "Persistencia principal", "Usuarios, sesiones, estado privado y calendarios comunitarios."],
        ["localStorage", "Respaldo local", "Copia de continuidad; queda subordinada a D1 al autenticarse."],
        ["Overpass / OSM", "Datos abiertos", "Supermercados próximos, solo luego del permiso de ubicación."],
        ["Crawler oficial", "Infraestructura acotada", "Busca beneficios en dominios permitidos con límites y timeout."],
    ], [42*mm, 35*mm, 88*mm])]
    s += [P("La persistencia separa identidad y sesiones de los datos funcionales. Las rutas derivan la identidad desde la sesión y no confían en un identificador enviado por el navegador. La ubicación se usa de forma puntual y no se persiste.", "Callout"), PageBreak()]

    # 4
    s += title("3. Flujo de los nueve agentes")
    agent_rows = [["#", "Agente", "Observa", "Decide / entrega"]]
    agents = [
        ("1", "Captura", "Perfil, inventario, comidas", "Normaliza y separa urgentes/vencidos"),
        ("2", "Memoria", "Evaluaciones previas", "Recupera señales útiles"),
        ("3", "Análisis", "Alergias, rechazos, equipos", "Filtra recetas inseguras o inviables"),
        ("4", "Comunidad", "Categoría/fuente real opcional", "Transfiere orientación y etiquetas"),
        ("5", "Planificación", "Candidatas, costo, urgencia", "Asigna recetas a la semana"),
        ("6", "Recetas", "Plan, nivel y equipos", "Genera instrucciones adaptadas"),
        ("7", "Beneficios públicos", "Medios y fuentes oficiales", "Devuelve referencias verificables"),
        ("8", "Compras", "Plan, stock, precios/promos", "Calcula faltantes y costo"),
        ("9", "Evaluación", "Plan completo", "Revalida seguridad y presupuesto"),
    ]
    agent_rows += [list(a) for a in agents]
    s += [table(agent_rows, [9*mm, 35*mm, 53*mm, 68*mm]), Spacer(1, 7 * mm),
          P("Trazabilidad", "H2x"), P("Cada etapa conserva la forma <b>Observó / Decidió / Entregó</b>. El objeto WorkingState se copia en cada agente, de modo que la ejecución sea predecible y fácil de probar."),
          P("Barreras de seguridad", "H2x")]
    s += bullets([
        "Validación previa: elimina vencidos y recetas incompatibles con alergias, rechazos, nivel y electrodomésticos.",
        "Validación posterior: Evaluación vuelve a revisar el plan antes de mostrarlo.",
        "Confirmación humana: la propuesta no modifica el calendario persistido hasta que el usuario la acepta.",
        "Promociones: solo computan ahorro si coinciden proveedor, tipo de medio y vigencia.",
    ])
    s += [PageBreak()]

    # 5
    s += title("4. UML de secuencia y memoria persistente")
    uml = [
        ["Paso", "Usuario / UI", "API y agentes", "Persistencia"],
        ["1", "Configura perfil, stock y categoría", "—", "D1 guarda perfil confirmado"],
        ["2", "Solicita plan", "API crea WorkingState", "Recupera memoria previa"],
        ["3", "Espera propuesta", "Agentes 1→9 + validaciones", "Sin cambios definitivos"],
        ["4", "Revisa traza y calendario", "Devuelve propuesta", "—"],
        ["5A", "Confirma", "API acepta resultado", "D1 persiste plan/compras/memoria"],
        ["5B", "Cancela", "Descarta propuesta", "Estado anterior intacto"],
        ["6", "Marca comida cocinada", "Valida ingredientes/cantidades", "Descuenta inventario y suma nutrición"],
    ]
    s += [table(uml, [14*mm, 49*mm, 56*mm, 46*mm]), Spacer(1, 8 * mm),
          flow(["Entrada confirmada", "Memoria previa", "Propuesta segura", "Confirmación", "Aprendizaje"], [28*mm]*5), Spacer(1, 8 * mm),
          P("Qué se recuerda", "H2x")]
    s += bullets([
        "Perfil, preferencias, alergias, rechazos, equipos, presupuesto e inventario.",
        "Calendario confirmado, lista de compras, comidas cocinadas y totales nutricionales estimados.",
        "Evaluaciones y señales de semanas anteriores para ajustar variedad, velocidad y ahorro.",
        "El usuario puede consultar, corregir o eliminar la memoria desde la aplicación.",
    ])
    s += [P("La memoria no autoriza a relajar una alergia. Las restricciones críticas se aplican nuevamente en cada ciclo.", "Callout"), PageBreak()]

    # 6
    s += title("5. Stack tecnológico y justificación")
    stack = [
        ["Tecnología", "Uso", "Por qué se eligió"],
        ["TypeScript estricto", "Dominio y contratos", "Reduce estados inválidos entre agentes y API."],
        ["React 19", "Interfaz", "Componentes, estado y experiencia responsive."],
        ["Next.js 16 + Vinext", "Rutas y compatibilidad", "Modelo conocido de app/API con build sobre Vite."],
        ["Vite 8", "Tooling", "Desarrollo y compilación rápidos."],
        ["Cloudflare Workers", "Runtime", "Despliegue edge integrado con D1."],
        ["Cloudflare D1 + Drizzle", "Datos", "SQL administrado, tipado y adecuado al alcance multiusuario."],
        ["Better Auth", "Autenticación", "Email, OAuth, sesiones y hashes sin implementar criptografía propia."],
        ["Leaflet + OSM/Overpass", "Mapa", "Mapa accesible y datos abiertos sin servicio pago."],
        ["Resend", "Emails", "Verificación y recuperación; remitente sujeto a dominio autorizado."],
        ["Node test runner", "Pruebas", "Integración liviana con TypeScript y build real."],
        ["ESLint", "Calidad", "Reglas consistentes y detección temprana de errores."],
    ]
    s += [table(stack, [42*mm, 38*mm, 85*mm]), Spacer(1, 8 * mm),
          P("Decisión central", "H2x"), P("El proyecto usa IA basada en reglas en lugar de un LLM. Para este dominio, la explicabilidad y el cumplimiento rígido de alergias y vencimientos tienen más valor que una respuesta creativa. También evita costo por token y dependencia de una clave paga."), PageBreak()]

    # 7
    s += title("6. Evidencia visual de producción", "Captura real de la URL pública obtenida el 19 de agosto de 2026.")
    if SCREENSHOT.exists():
        img = Image(str(SCREENSHOT), width=165*mm, height=103.1*mm)
        s += [img, Spacer(1, 5 * mm)]
    s += [P("Figura 1. Pantalla pública de autenticación de MealBoard. Se observa identidad visual crema/bordo, alta por email y acceso con Google.", "Center"), Spacer(1, 5 * mm),
          P("Qué demuestra", "H2x")]
    s += bullets([
        "La aplicación está desplegada y accesible públicamente.",
        "El acceso a datos personales está detrás de autenticación.",
        "La interfaz conserva jerarquía, etiquetas visibles y acciones clásicas.",
    ])
    s += [P("Limitación de la evidencia", "H2x"), P("La captura automatizada disponible no tiene una sesión privada iniciada. Por privacidad, este informe no inventa capturas del interior. Las dos páginas siguientes documentan el flujo principal mediante artefactos técnicos reproducibles; el guion incluido indica cómo grabar la sesión autenticada opcional."), PageBreak()]

    # 8
    s += title("7. Evidencia del flujo principal", "Representación técnica basada en rutas, estado y pruebas del repositorio.")
    s += [flow(["Onboarding real", "Plan por categoría", "Confirmar calendario", "Cocinar y corregir", "Descontar stock"], [28*mm]*5), Spacer(1, 9 * mm)]
    evidence = [
        ["Acción observable", "Implementación", "Resultado esperado"],
        ["Completar perfil", "POST /api/user-state", "Estado asociado a la sesión en D1"],
        ["Generar calendario", "POST /api/plan", "Propuesta + traza de nueve agentes"],
        ["Confirmar", "Estado UI + persistencia", "Calendario aplicado solo con consentimiento"],
        ["Marcar cocinada", "lib/inventory-consumption.ts", "Confirmación editable y descuento validado"],
        ["Ver nutrición", "lib/nutrition.ts", "Calorías, proteínas, carbohidratos, grasas y fibra"],
        ["Compartir", "POST /api/community-calendars", "Publicación real sin datos privados"],
    ]
    s += [table(evidence, [43*mm, 55*mm, 67*mm]), Spacer(1, 9 * mm), P("Salida visible de IA", "H2x"),
          P("La salida principal es el calendario acompañado por la traza de decisiones. A diferencia de un chat generativo, cada agente declara qué observó, qué decisión tomó y qué entregó. Así se puede explicar por qué se descartó una receta o se priorizó un ingrediente próximo a vencer."),
          P("Confirmación requerida", "Callout"),
          P("La UI conserva la propuesta separada del calendario aplicado. Cancelar no modifica D1 ni el respaldo local; confirmar persiste plan, compras y memoria."), PageBreak()]

    # 9
    s += title("8. Evidencia reproducible y calidad")
    s += [P("La sesión documentada recorre: autenticación → onboarding → inventario → categoría → agentes → confirmación → cocina → nutrición → comunidad → mapa/promociones. El detalle paso a paso está versionado en <b>docs/evidencias/sesion-real.md</b>."),
          P("Cobertura automatizada", "H2x")]
    tests = [
        ["Suite", "Qué verifica"],
        ["rendered-html", "Frontend renderizado, orquestación, restricciones y confirmación."],
        ["payments-and-persistence", "Bancos, tipos de tarjeta, promociones compatibles y serialización."],
        ["promotion-discovery", "Fuentes oficiales, extracción y límites de vigencia."],
        ["inventory-consumption", "Corrección de cantidades, unidades y descuento sin stock negativo."],
        ["nutrition", "Cálculo nutricional por receta, comida y seguimiento cocinado."],
    ]
    s += [table(tests, [52*mm, 113*mm]), Spacer(1, 8 * mm),
          P("Comandos de aceptación", "H2x"),
          P("<font name='Courier'>npm run lint</font><br/><font name='Courier'>npm test</font><br/><font name='Courier'>npm run sites:build</font><br/><font name='Courier'>npm run sites:validate</font>", "Callout"),
          P("Criterios de aceptación", "H2x")]
    s += bullets([
        "Cero errores de lint y build reproducible.",
        "Todas las pruebas pasan, incluidas seguridad alimentaria, persistencia, pagos y nutrición.",
        "El artefacto de hosting valida antes del despliegue.",
        "README, arquitectura, evidencias e informe corresponden al mismo commit.",
    ])
    s += [PageBreak()]

    # 10
    s += title("9. Evaluación UX con Nielsen")
    ux = [
        ["Heurística", "Estado", "Evidencia"],
        ["Visibilidad del estado", "Cumple", "Carga, ciclo de agentes, resultados y notificaciones."],
        ["Mundo real", "Cumple", "Alacena, vencimiento, compras y medios argentinos."],
        ["Control y libertad", "Cumple", "Confirmar/cancelar, corregir consumo y eliminar memoria."],
        ["Consistencia", "Cumple", "Patrones estables de campos, botones y estados."],
        ["Prevención de errores", "Cumple", "Barreras dobles para alergias/vencimientos y stock."],
        ["Reconocer antes que recordar", "Cumple", "Selectores, chips, categorías y etiquetas visibles."],
        ["Flexibilidad", "Parcial", "Responsive/PWA; faltan atajos e importación masiva."],
        ["Estética minimalista", "Cumple", "Crema, bordo, verde y tareas agrupadas."],
        ["Recuperación de errores", "Cumple", "Mensajes para incompatibilidad, stock y fallas externas."],
        ["Ayuda", "Parcial", "README y ayuda contextual; falta tour integrado."],
    ]
    s += [table(ux, [48*mm, 20*mm, 97*mm]), Spacer(1, 7 * mm),
          P("Conclusión UX", "H2x"), P("Cumple ocho de diez heurísticas y cumple parcialmente dos. Para el público objetivo resulta especialmente importante que las decisiones de seguridad se expliquen y que ninguna acción irreversible dependa de recordar comandos."), PageBreak()]

    # 11
    s += title("10. Público objetivo y feedback real")
    s += [P("La evaluación se realizó desde el caso de uso de una persona que vive sola, compra en supermercados argentinos y usa la app principalmente desde el celular. El lenguaje evita tecnicismos; la geolocalización se pide cuando aporta valor; la corrección de ingredientes ocurre justo antes del descuento."),
          P("Feedback incorporado durante el desarrollo", "H2x")]
    feedback = [
        ["Observación real", "Cambio realizado", "Aprendizaje"],
        ["El buscador quedó más profesional visualmente pero dejó de devolver resultados.", "Se restauró el comportamiento, se separó banco/tipo y se añadieron alias y pruebas.", "Una mejora estética no puede degradar el flujo principal."],
        ["Galicia crédito y débito no mostraba supermercados con descuentos.", "Se priorizaron fuentes de supermercados y se complementó con bancos.", "La ausencia de resultados debe distinguirse de ausencia de beneficios."],
        ["Los calendarios comunitarios eran ficticios.", "Se migraron a publicaciones reales en D1 con descripción y público.", "Los datos sociales necesitan procedencia y privacidad explícitas."],
        ["Al cocinar, el inventario no reflejaba el consumo real.", "Se agregó confirmación editable de ingredientes antes de descontar.", "La última palabra sobre cantidades debe ser del usuario."],
    ]
    s += [table(feedback, [48*mm, 65*mm, 52*mm]), Spacer(1, 8 * mm),
          P("Próxima validación recomendada", "H2x"), P("Realizar cinco pruebas moderadas con personas que vivan solas: crear un plan, corregir un ingrediente, encontrar una promoción, publicar un calendario y borrar memoria. Medir éxito de tarea, tiempo, errores y confianza en las recomendaciones."), PageBreak()]

    # 12
    s += title("11. Ciberseguridad y privacidad")
    risks = [
        ["Riesgo", "Control / decisión"],
        ["Secretos OAuth/correo expuestos", ".env ignorado y variables privadas de producción; rotación si se divulgan."],
        ["Acceso horizontal a otro usuario", "La identidad se obtiene de la sesión, nunca de un userId enviado por el cliente."],
        ["Contraseñas comprometidas", "Better Auth administra hashes; la app no almacena contraseñas en su estado."],
        ["Datos privados publicados", "Comunidad excluye correo, inventario, alergias, ubicación y pagos."],
        ["Ubicación sin consentimiento", "Permiso explícito, consulta puntual y sin persistencia."],
        ["Promoción falsa o vencida", "Fuente/vigencia visibles; solo datos compatibles calculan ahorro."],
        ["Crawler abusivo / SSRF", "HTTPS, dominios oficiales, misma raíz, profundidad, páginas y timeout limitados."],
        ["Recomendación alimentaria insegura", "Validación antes/después y otra vez al publicar/adaptar."],
        ["Stock negativo", "Unidades y máximos validados antes de descontar."],
        ["Inyección de prompt", "No se ejecutan prompts ni LLM; entradas normalizadas como datos."],
    ]
    s += [table(risks, [60*mm, 105*mm]), Spacer(1, 6 * mm),
          P("Prioridad", "Callout"), P("La seguridad alimentaria domina el ranking funcional. La aplicación nunca debe compensar una alergia o un vencimiento con ahorro, popularidad, gusto o rapidez."), PageBreak()]

    # 13
    s += title("12. Co-work con inteligencia artificial")
    ai = [
        ["Herramienta", "Uso", "Evaluación crítica"],
        ["ChatGPT Work", "Ideación y primeras iteraciones", "Aceleró exploración; las ideas se verificaron en código."],
        ["Codex en VS Code", "Implementación, pruebas, auth, D1, documentación y despliegue", "Eficaz para recorrer el repo; requirió supervisión en OAuth y fuentes externas."],
        ["Gemini", "Consultas puntuales y contraste", "Segunda perspectiva; no integra el runtime."],
    ]
    s += [table(ai, [38*mm, 59*mm, 68*mm]), Spacer(1, 8 * mm),
          P("Reflexión", "H2x"), P("Sin co-work con IA, integrar frontend, nueve agentes, persistencia, autenticación, mapas, promociones y pruebas habría requerido aproximadamente el doble de tiempo. La mayor ganancia fue mantener contexto entre módulos y automatizar verificaciones repetitivas."),
          P("La IA también falló: hubo una regresión del buscador bancario, supuestos demasiado optimistas sobre promociones públicas y documentación desactualizada. El proyecto mejoró cuando esos resultados se trataron como hipótesis y se contrastaron con pruebas, código, fuentes oficiales y feedback humano."),
          P("Criterio profesional", "H2x"), P("La IA fue copiloto de desarrollo, no fuente de verdad del dominio. Las decisiones sobre alergias, privacidad, autenticación, vigencia de promociones y publicación se fijaron mediante reglas explícitas y controles verificables."), PageBreak()]

    # 14
    s += title("13. IA local: papel y aporte al usuario")
    s += [P("1. Papel de un LLM/SLM local", "H2x"),
          P("Un modelo pequeño local podría actuar como componente de soporte, no como autoridad sobre alergias o vencimientos. Interpretaría descripciones libres de inventario, resumiría feedback semanal y explicaría recetas con lenguaje flexible. Los nueve agentes determinísticos conservarían las decisiones críticas por ser auditables y reproducibles. No reemplazaría una API externa actual —MealBoard no consume un LLM en producción— sino que agregaría comprensión de lenguaje sin costo por token."),
          P("2. Aporte al usuario", "H2x"),
          P("El usuario podría escribir “me queda medio paquete de arroz y algo de pollo” o pedir una explicación adaptada a su experiencia. El procesamiento local mejoraría privacidad y funcionamiento sin internet para tareas de texto; mapa y promociones seguirían necesitando conexión. Toda propuesta pasaría después por las reglas de alergias, vencimientos y stock."),
          P("Arquitectura hipotética", "H2x"),
          flow(["Texto libre", "SLM local\ninterpreta", "Reglas MealBoard\nvalidan", "Usuario\nconfirma"], [34*mm, 38*mm, 45*mm, 34*mm]), Spacer(1, 8 * mm),
          P("El modelo local nunca escribe directamente en D1 ni decide una sustitución segura. Solo produce una propuesta estructurada que el motor de reglas valida.", "Callout"), PageBreak()]

    # 15
    s += title("14. IA local: aporte profesional y límites")
    s += [P("3. Aporte profesional", "H2x"),
          P("Permitiría analizar localmente logs anonimizados, dificultades frecuentes y patrones de abandono sin enviar datos sensibles fuera de la organización. Facilitaría clasificar feedback, preparar reportes y probar nuevos flujos sin conexión. También exigiría evaluaciones propias para medir calidad, sesgos y errores en el dominio alimentario."),
          P("4. Limitaciones frente a la nube", "H2x"),
          P("La calidad depende de memoria, CPU o GPU. Un modelo pequeño comprende menos matices y puede inventar información; no debería calcular alergias, nutrición ni promociones sin validación posterior. Además hay que descargar, versionar, actualizar y monitorear el modelo. Una API cloud suele ofrecer mayor capacidad y mantenimiento centralizado, a cambio de costo, conexión y exposición de datos."),
          P("Experimento opcional", "H2x"), P("Ejecutar Ollama con un SLM y pedir una adaptación lingüística de receta, sin delegar decisiones de alergias. Capturar modelo, prompt, respuesta, hardware y tiempo. El experimento queda deliberadamente fuera del runtime publicado."),
          P("Conclusión", "H2x"), P("MealBoard ya cumple su objetivo mediante una arquitectura explicable, autenticada y persistente. El siguiente salto de calidad no depende de agregar generación libre, sino de validar con usuarios, ampliar datos oficiales estructurados y observar métricas de éxito sin comprometer privacidad."),
          P("Checklist para defensa oral", "H2x")]
    s += bullets([
        "Abrir repositorio y producción desde la portada.",
        "Explicar el problema y la prioridad de alergias/vencimientos.",
        "Mostrar el flujo de nueve agentes y una traza Observó/Decidió/Entregó.",
        "Completar el ciclo: generar, confirmar, cocinar, descontar y compartir.",
        "Cerrar con UX, seguridad, límites de datos y posible SLM local.",
    ])

    doc.build(s)
    print(OUTPUT)


if __name__ == "__main__":
    main()
