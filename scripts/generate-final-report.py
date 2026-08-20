from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Flowable,
    Image,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "MealBoard-entrega-final.pdf"
DASHBOARD_SCREENSHOT = ROOT / "docs" / "evidencias" / "02-dashboard-autenticado.png"
CATEGORY_SCREENSHOT = ROOT / "docs" / "evidencias" / "03-categorias-seguridad.png"
TRACE_SCREENSHOT = ROOT / "docs" / "evidencias" / "04-traza-agentes.png"
CONFIRMATION_SCREENSHOT = ROOT / "docs" / "evidencias" / "05-evaluacion-confirmacion.png"
INVENTORY_SCREENSHOT = ROOT / "docs" / "evidencias" / "06-confirmacion-inventario.png"

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
styles.add(ParagraphStyle(name="CoverKicker", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=GREEN, spaceAfter=8, tracking=1.2))
styles.add(ParagraphStyle(name="CoverTitle", fontName="Helvetica-Bold", fontSize=36, leading=39, textColor=BURGUNDY_DARK, spaceAfter=11))
styles.add(ParagraphStyle(name="CoverSub", fontName="Helvetica", fontSize=15, leading=21, textColor=INK, spaceAfter=17))
styles.add(ParagraphStyle(name="H1x", fontName="Helvetica-Bold", fontSize=23, leading=28, textColor=BURGUNDY_DARK, spaceAfter=10))
styles.add(ParagraphStyle(name="H2x", fontName="Helvetica-Bold", fontSize=14.5, leading=18, textColor=BURGUNDY, spaceBefore=8, spaceAfter=6))
styles.add(ParagraphStyle(name="Bodyx", fontName="Helvetica", fontSize=10.1, leading=14.5, textColor=INK, spaceAfter=7.5))
styles.add(ParagraphStyle(name="Bulletx", fontName="Helvetica", fontSize=10.1, leading=14.5, textColor=INK, leftIndent=11, firstLineIndent=-8, bulletIndent=0, spaceAfter=6.5))
styles.add(ParagraphStyle(name="Smallx", fontName="Helvetica", fontSize=8.35, leading=11.2, textColor=INK))
styles.add(ParagraphStyle(name="Tinyx", fontName="Helvetica", fontSize=7.3, leading=9.5, textColor=INK))
styles.add(ParagraphStyle(name="TableHeader", fontName="Helvetica-Bold", fontSize=8.1, leading=10.2, textColor=WHITE))
styles.add(ParagraphStyle(name="Callout", fontName="Helvetica-Bold", fontSize=10.6, leading=15.2, textColor=BURGUNDY_DARK, backColor=GREEN_LIGHT, borderColor=GREEN, borderWidth=0.75, borderPadding=11, spaceBefore=15, spaceAfter=17))
styles.add(ParagraphStyle(name="Center", fontName="Helvetica", fontSize=8.5, leading=11.5, alignment=TA_CENTER, textColor=MUTED))
styles.add(ParagraphStyle(name="Metric", fontName="Helvetica-Bold", fontSize=18, leading=20, alignment=TA_CENTER, textColor=BURGUNDY_DARK))
styles.add(ParagraphStyle(name="MetricLabel", fontName="Helvetica-Bold", fontSize=7.4, leading=9, alignment=TA_CENTER, textColor=GREEN))


def P(text, style="Bodyx"):
    return Paragraph(text, styles[style])


def page_header(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY)
    canvas.rect(0, h - 15 * mm, w, 15 * mm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.rect(0, h - 15 * mm, 8 * mm, 15 * mm, fill=1, stroke=0)
    canvas.setFont("Helvetica-Bold", 8)
    canvas.setFillColor(WHITE)
    canvas.drawString(18 * mm, h - 9.4 * mm, "MEALBOARD  /  ENTREGA FINAL")
    canvas.setFont("Helvetica-Bold", 8)
    canvas.drawRightString(w - 18 * mm, h - 9.4 * mm, f"{doc.page:02d}")
    canvas.setFont("Helvetica", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(18 * mm, 9.2 * mm, "Lautaro Demonte  ·  Proyecto final de Inteligencia Artificial")
    canvas.drawRightString(w - 18 * mm, 9.2 * mm, "MealBoard")
    canvas.setStrokeColor(LINE)
    canvas.line(18 * mm, 13 * mm, w - 18 * mm, 13 * mm)
    canvas.setFillColor(GREEN_LIGHT)
    canvas.roundRect(w - 31 * mm, 18 * mm, 13 * mm, 3 * mm, 1.5 * mm, fill=1, stroke=0)
    canvas.restoreState()


def cover(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(CREAM)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY_DARK)
    canvas.rect(0, 0, 12 * mm, h, fill=1, stroke=0)
    canvas.setFillColor(BURGUNDY)
    canvas.rect(12 * mm, h - 17 * mm, w - 12 * mm, 17 * mm, fill=1, stroke=0)
    canvas.setFillColor(GREEN)
    canvas.roundRect(w - 47 * mm, h - 54 * mm, 29 * mm, 29 * mm, 6 * mm, fill=1, stroke=0)
    canvas.setFillColor(WHITE)
    canvas.setFont("Helvetica-Bold", 18)
    canvas.drawCentredString(w - 32.5 * mm, h - 43.2 * mm, "M")
    canvas.setFillColor(GREEN_LIGHT)
    canvas.roundRect(w - 67 * mm, 23 * mm, 49 * mm, 7 * mm, 3.5 * mm, fill=1, stroke=0)
    canvas.restoreState()


def table(data, widths, header=True):
    rows = []
    for index, row in enumerate(data):
        style = "TableHeader" if header and index == 0 else "Smallx"
        rows.append([P(str(cell), style) for cell in row])
    t = Table(rows, colWidths=widths, repeatRows=1 if header else 0, hAlign="LEFT")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, LINE),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("BACKGROUND", (0, 1 if header else 0), (-1, -1), colors.HexColor("#FFFDF9")),
    ]
    if header:
        commands += [("BACKGROUND", (0, 0), (-1, 0), BURGUNDY), ("TEXTCOLOR", (0, 0), (-1, 0), WHITE)]
        for row_index in range(2, len(rows), 2):
            commands.append(("BACKGROUND", (0, row_index), (-1, row_index), colors.HexColor("#F1E9DF")))
    t.setStyle(TableStyle(commands))
    return t


def flow(nodes, widths=None):
    widths = widths or [39 * mm] * len(nodes)
    row = []
    for i, node in enumerate(nodes):
        row.append(P(node.replace("\n", "<br/>"), "Smallx"))
        if i < len(nodes) - 1:
            row.append(P("→", "H2x"))
    col_widths = []
    for i, width in enumerate(widths):
        col_widths.append(width)
        if i < len(widths) - 1:
            col_widths.append(7 * mm)
    t = Table([row], colWidths=col_widths, hAlign="CENTER")
    commands = [
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]
    for col in range(0, len(row), 2):
        commands.extend([
            ("BACKGROUND", (col, 0), (col, 0), GREEN_LIGHT),
            ("BOX", (col, 0), (col, 0), 0.75, GREEN),
        ])
    t.setStyle(TableStyle(commands))
    return t


def metrics(items):
    values = [P(value, "Metric") for value, _ in items]
    labels = [P(label.upper(), "MetricLabel") for _, label in items]
    widths = [165 * mm / len(items)] * len(items)
    t = Table([values, labels], colWidths=widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF9")),
        ("BOX", (0, 0), (-1, -1), 0.7, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("TOPPADDING", (0, 0), (-1, 0), 8),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 1),
        ("TOPPADDING", (0, 1), (-1, 1), 1),
        ("BOTTOMPADDING", (0, 1), (-1, 1), 8),
    ]))
    return t


def cards(items, columns=3, total_width=165 * mm):
    gap = 4 * mm
    card_width = (total_width - gap * (columns - 1)) / columns
    rows = []
    for start in range(0, len(items), columns):
        batch = items[start:start + columns]
        row = []
        for index in range(columns):
            if index < len(batch):
                heading, body = batch[index]
                card = Table(
                    [[P(heading.upper(), "MetricLabel")], [P(body, "Smallx")]],
                    colWidths=[card_width],
                )
                card.setStyle(TableStyle([
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFFDF9")),
                    ("BOX", (0, 0), (-1, -1), 0.7, GREEN),
                    ("LEFTPADDING", (0, 0), (-1, -1), 8),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                    ("TOPPADDING", (0, 0), (-1, 0), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, 0), 3),
                    ("TOPPADDING", (0, 1), (-1, 1), 3),
                    ("BOTTOMPADDING", (0, 1), (-1, 1), 9),
                ]))
                row.append(card)
            else:
                row.append("")
            if index < columns - 1:
                row.append("")
        col_widths = []
        for index in range(columns):
            col_widths.append(card_width)
            if index < columns - 1:
                col_widths.append(gap)
        rows.append(row)
    outer = Table(rows, colWidths=col_widths, hAlign="LEFT")
    outer.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
    ]))
    return outer


class SequenceDiagram(Flowable):
    def __init__(self, width=165 * mm, height=92 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        canvas = self.canv
        participants = ["Usuario", "Interfaz", "Orquestador", "Cloudflare D1"]
        xs = [15 * mm, 60 * mm, 105 * mm, 150 * mm]
        top = self.height - 11 * mm
        bottom = 8 * mm

        canvas.saveState()
        canvas.setStrokeColor(GREEN)
        canvas.setLineWidth(0.7)
        for x, label in zip(xs, participants):
            canvas.setFillColor(GREEN_LIGHT)
            canvas.roundRect(x - 15 * mm, top, 30 * mm, 10 * mm, 2 * mm, fill=1, stroke=1)
            canvas.setFillColor(BURGUNDY_DARK)
            canvas.setFont("Helvetica-Bold", 7.2)
            canvas.drawCentredString(x, top + 3.6 * mm, label)
            canvas.setDash(3, 3)
            canvas.setStrokeColor(LINE)
            canvas.line(x, top, x, bottom)
            canvas.setDash()

        canvas.setFillColor(colors.HexColor("#FFF7EB"))
        canvas.setStrokeColor(BURGUNDY)
        canvas.roundRect(4 * mm, 5 * mm, self.width - 8 * mm, 24 * mm, 2 * mm, fill=1, stroke=1)
        canvas.setFillColor(BURGUNDY)
        canvas.setFont("Helvetica-Bold", 6.8)
        canvas.drawString(7 * mm, 26 * mm, "ALT  CONFIRMAR / CANCELAR")

        messages = [
            (0, 1, "Configura perfil, inventario y categoría"),
            (1, 3, "Guarda estado confirmado"),
            (0, 1, "Solicita calendario"),
            (1, 2, "Ejecuta agentes 1 a 9"),
            (2, 1, "Devuelve propuesta y traza"),
            (1, 0, "Muestra para revisión"),
            (0, 1, "Confirma"),
            (1, 3, "Persiste plan, compras y memoria"),
        ]
        y = top - 8 * mm
        for index, (source, target, label) in enumerate(messages):
            if index == 6:
                y = 21 * mm
            x1, x2 = xs[source], xs[target]
            canvas.setStrokeColor(BURGUNDY if index >= 6 else GREEN)
            canvas.setFillColor(BURGUNDY_DARK)
            canvas.setLineWidth(0.8)
            canvas.line(x1, y, x2, y)
            direction = 1 if x2 > x1 else -1
            canvas.line(x2, y, x2 - direction * 2.2 * mm, y + 1.2 * mm)
            canvas.line(x2, y, x2 - direction * 2.2 * mm, y - 1.2 * mm)
            canvas.setFont("Helvetica", 6.7)
            canvas.drawCentredString((x1 + x2) / 2, y + 1.7 * mm, label)
            y -= 7.1 * mm

        canvas.setFillColor(MUTED)
        canvas.setFont("Helvetica-Oblique", 6.5)
        canvas.drawString(7 * mm, 9 * mm, "Si cancela, la propuesta se descarta y el estado anterior permanece intacto.")
        canvas.restoreState()


class ArchitectureDiagram(Flowable):
    def __init__(self, width=165 * mm, height=58 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        canvas = self.canv

        def box(x, y, width, height, label, fill=GREEN_LIGHT):
            canvas.setFillColor(fill)
            canvas.setStrokeColor(GREEN)
            canvas.roundRect(x, y, width, height, 2 * mm, fill=1, stroke=1)
            canvas.setFillColor(BURGUNDY_DARK)
            canvas.setFont("Helvetica-Bold", 7.2)
            lines = label.split("\n")
            line_gap = 8
            first_baseline = y + height / 2 + (len(lines) - 1) * line_gap / 2 - 2.5
            for index, line in enumerate(lines):
                canvas.drawCentredString(x + width / 2, first_baseline - index * line_gap, line)

        def arrow(x1, y1, x2, y2, label=""):
            canvas.setStrokeColor(BURGUNDY)
            canvas.setLineWidth(0.8)
            canvas.line(x1, y1, x2, y2)
            angle_x = 2.2 * mm if x2 >= x1 else -2.2 * mm
            canvas.line(x2, y2, x2 - angle_x, y2 + 1.2 * mm)
            canvas.line(x2, y2, x2 - angle_x, y2 - 1.2 * mm)
            if label:
                canvas.setFillColor(MUTED)
                canvas.setFont("Helvetica", 6.2)
                canvas.drawCentredString((x1 + x2) / 2, (y1 + y2) / 2 + 2 * mm, label)

        canvas.saveState()
        box(0, 36 * mm, 35 * mm, 13 * mm, "Usuario\nPWA")
        box(48 * mm, 36 * mm, 43 * mm, 13 * mm, "React / Vinext\nUI y estado")
        box(104 * mm, 36 * mm, 61 * mm, 13 * mm, "API + Orquestador\nWorkingState")
        arrow(35 * mm, 42.5 * mm, 48 * mm, 42.5 * mm)
        arrow(91 * mm, 42.5 * mm, 104 * mm, 42.5 * mm)

        service_width = 37.5 * mm
        service_xs = [0, 42.5 * mm, 85 * mm, 127.5 * mm]
        labels = ["Better Auth\nsesión", "Cloudflare D1\ndatos", "OSM / Overpass\nubicación", "Crawler\nfuentes oficiales"]
        for x, label in zip(service_xs, labels):
            box(x, 5 * mm, service_width, 13 * mm, label, colors.HexColor("#FFFDF9"))

        arrow(69.5 * mm, 36 * mm, 18.75 * mm, 18 * mm, "identidad")
        arrow(134.5 * mm, 36 * mm, 61.25 * mm, 18 * mm, "persistencia")
        arrow(134.5 * mm, 36 * mm, 103.75 * mm, 18 * mm, "locales")
        arrow(122.5 * mm, 11.5 * mm, 127.5 * mm, 11.5 * mm)
        canvas.setFillColor(GREEN)
        canvas.setFont("Helvetica-Bold", 6.5)
        canvas.drawString(0, 53 * mm, "INTERACCIÓN Y CONTROL")
        canvas.drawString(0, 22 * mm, "SERVICIOS Y PERSISTENCIA")
        canvas.restoreState()


class ReportDocTemplate(BaseDocTemplate):
    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "H1x":
            title = flowable.getPlainText()
            key = f"section-{self.page}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(title, key, level=0, closed=False)


def title(text, subtitle=None):
    parts = [P(text, "H1x")]
    if subtitle:
        parts.append(P(subtitle, "Bodyx"))
    return parts


def bullets(items):
    return [Paragraph(item, styles["Bulletx"], bulletText="•") for item in items]


def main():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = ReportDocTemplate(str(OUTPUT), pagesize=A4, leftMargin=18 * mm, rightMargin=18 * mm, topMargin=19 * mm, bottomMargin=18 * mm,
                          title="MealBoard - Entrega final", author="Lautaro Demonte")
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([
        PageTemplate(id="cover", frames=frame, onPage=cover, autoNextPageTemplate="body"),
        PageTemplate(id="body", frames=frame, onPage=page_header),
    ])
    s = []

    # 1 - portada y accesos obligatorios
    s += [Spacer(1, 26 * mm), P("PROYECTO FINAL · CURSO DE IA", "CoverKicker"), P("MealBoard", "CoverTitle"),
          P("Planificación semanal de comidas, inventario y ahorro para personas que viven solas.", "CoverSub"),
          P("Lautaro Demonte · Desarrollo integral, producto, arquitectura, pruebas y documentación", "Callout")]
    links = [
        ["Recurso", "Acceso"],
        ["Repositorio", '<link href="https://github.com/LautyDe/Entrega-CursoIA" color="#34745B">github.com/LautyDe/Entrega-CursoIA</link>'],
        ["Aplicación publicada", '<link href="https://mealboard-ai.lauty-d-p.chatgpt.site" color="#34745B">mealboard-ai.lauty-d-p.chatgpt.site</link>'],
        ["Guion de demostración", '<link href="https://github.com/LautyDe/Entrega-CursoIA/blob/master/docs/guion-demo.md" color="#34745B">Recorrido reproducible de tres minutos</link>'],
        ["Documentación", '<link href="https://github.com/LautyDe/Entrega-CursoIA/blob/master/docs/arquitectura.md" color="#34745B">Arquitectura y anexos versionados</link>'],
    ]
    s += [table(links, [40 * mm, 125 * mm]), Spacer(1, 12 * mm),
          metrics([("9", "agentes"), ("39", "pruebas"), ("100%", "reglas auditables"), ("0", "API de LLM")]),
          Spacer(1, 9 * mm), P("Versión documentada: 19 de agosto de 2026", "Center"), PageBreak()]

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
    s += [Spacer(1, 3 * mm), metrics([("PWA", "experiencia"), ("D1", "persistencia"), ("OAuth", "acceso"), ("AR", "contexto")]), Spacer(1, 3 * mm)]
    s += [P("Público objetivo", "H2x"), P("Personas adultas que viven solas en Argentina, cocinan con distintos niveles de experiencia y quieren reducir esfuerzo, gasto y desperdicio. La app evita exigir conocimientos técnicos y conserva confirmación humana para cambios importantes."),
          P("Alcance y honestidad de datos", "H2x"), P("Los precios del catálogo son demostrativos. Las publicaciones comunitarias sí provienen de usuarios autenticados. Las promociones públicas muestran fuente y vigencia cuando pueden verificarse, pero deben confirmarse antes de pagar porque cambian según entidad, sucursal y segmentación."), PageBreak()]

    # 3
    s += title("2. Arquitectura general", "Separación entre interfaz, reglas agénticas, servicios tradicionales y persistencia.")
    s += [ArchitectureDiagram(), Spacer(1, 7 * mm)]
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
          P("Trazabilidad", "H2x"),
          cards([
              ("Observó", "Inventario, vencimientos, preferencias y restricciones confirmadas."),
              ("Decidió", "Descartar riesgos y ordenar opciones por reglas explícitas."),
              ("Entregó", "Una salida estructurada que el siguiente agente puede auditar."),
          ]),
          P("El objeto WorkingState se copia en cada agente, de modo que la ejecución sea predecible y fácil de probar."),
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
    s += [P("Secuencia principal desde la configuración hasta la persistencia del calendario confirmado."),
          SequenceDiagram(), Spacer(1, 6 * mm),
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
          P("Decisión central", "H2x"), P("El proyecto usa IA basada en reglas en lugar de un LLM. Para este dominio, la explicabilidad y el cumplimiento rígido de alergias y vencimientos tienen más valor que una respuesta creativa. También evita costo por token y dependencia de una clave paga."),
          cards([
              ("Explicable", "Cada decisión conserva una traza visible y reproducible."),
              ("Portable", "La PWA funciona en escritorio y celular sobre un único código."),
              ("Sostenible", "No requiere una API paga ni costo variable por token."),
          ]), PageBreak()]

    # 7
    s += title("6. Evidencia real: sesión autenticada", "Recorrido realizado en producción el 19 de agosto de 2026.")
    if DASHBOARD_SCREENSHOT.exists():
        s += [Image(str(DASHBOARD_SCREENSHOT), width=165*mm, height=97.3*mm), Spacer(1, 3 * mm)]
    s += [P("Figura 1. Panel real del único usuario registrado. El recorte oculta el correo y conserva presupuesto, vencimientos, ahorro, navegación y calendario.", "Center"), Spacer(1, 4 * mm),
          P("Qué demuestra", "H2x")]
    s += bullets([
        "La aplicación pública reconoce una sesión real y carga el estado asociado al usuario.",
        "El calendario muestra comidas, estado de cocción y estimaciones nutricionales por plato.",
        "Presupuesto, inventario, ahorro, compras y perfil están integrados en una misma experiencia responsive.",
    ])
    s += [P("Privacidad de la evidencia", "H2x"), P("La sesión corresponde al usuario autorizado para esta entrega. El correo electrónico no se publica en las figuras; las capturas se limitan a los datos necesarios para demostrar el recorrido."), PageBreak()]

    # 8
    s += title("7. Evidencia real: categoría y agentes", "La propuesta se generó en vivo y conservó la prioridad de seguridad.")
    if CATEGORY_SCREENSHOT.exists():
        s += [Image(str(CATEGORY_SCREENSHOT), width=155*mm, height=87.2*mm),
              P("Figura 2. Selección de categoría. La UI aclara que alergias, vencimientos y restricciones conservan prioridad.", "Center"), Spacer(1, 3 * mm)]
    if TRACE_SCREENSHOT.exists():
        s += [Image(str(TRACE_SCREENSHOT), width=155*mm, height=87.2*mm),
              P("Figura 3. Propuesta Fit/proteica con métricas y traza Observó / Decidió / Entregó de los agentes.", "Center")]
    s += [PageBreak()]

    # 9
    s += title("8. Evidencia real: control humano", "La interfaz expone la confirmación antes de aplicar calendario o consumo.")
    if CONFIRMATION_SCREENSHOT.exists():
        s += [Image(str(CONFIRMATION_SCREENSHOT), width=155*mm, height=87.2*mm),
              P("Figura 4. Los agentes 7, 8 y 9 verifican beneficios, compras y seguridad; la UI mantiene Cancelar y Confirmar calendario.", "Center"), Spacer(1, 3 * mm)]
    if INVENTORY_SCREENSHOT.exists():
        s += [Image(str(INVENTORY_SCREENSHOT), width=155*mm, height=87.2*mm),
              P("Figura 5. Antes de descontar stock, el usuario puede corregir productos y cantidades o dejar ingredientes sin descuento.", "Center")]
    s += [PageBreak()]

    # 10
    s += title("9. Resultados confirmados en la cuenta de prueba", "Cambios persistidos y verificados después de cada confirmación.")
    confirmed = [
        ["Recorrido", "Antes", "Acción confirmada", "Después"],
        ["Calendario", "$75.000 disponibles", "Aplicar plan Fit/proteico", "$70.000 · 14 comidas · compra $5.000"],
        ["Cocción", "Lentejas 500 g · 0 kcal", "Descontar 100 g", "Lentejas 400 g · 245 kcal"],
        ["Compra", "4 pendientes · 8 productos", "Finalizar 4 seleccionados", "0 pendientes · 12 productos · +$1.500"],
        ["Evaluación", "Sin cierre semanal", "Guardar 1 comida y $5.000", "Evaluación y gusto persistidos"],
        ["Comunidad", "0 publicaciones reales", "Publicar, puntuar y comentar", "1 calendario · 5,0 (1) · 1 comentario"],
        ["Pagos", "1 medio", "Guardar y consultar fuentes", "4 medios configurados"],
        ["Mapa", "Sin consulta", "Solicitar ubicación", "Permiso negado; app operativa, sin persistencia"],
    ]
    s += [table(confirmed, [28*mm, 38*mm, 46*mm, 53*mm]), Spacer(1, 7 * mm),
          metrics([("14", "comidas"), ("100 g", "descontados"), ("+$1.500", "ahorro"), ("5,0", "valoración")]),
          Spacer(1, 5 * mm),
          P("Confirmación observable", "H2x"),
          P("Cada resultado se comprobó después de la acción: el calendario actualizó presupuesto y lista; la cocción redujo stock y sumó nutrición; la compra incorporó productos; la evaluación y la memoria persistieron; la publicación recibió una interacción real."),
          P("Privacidad y falla controlada", "H2x"),
          P("La ubicación exacta no se registró. Cuando el navegador negó el permiso, MealBoard informó el estado y mantuvo disponibles las demás funciones. El detalle reproducible está en <b>docs/evidencias/recorridos-confirmados.md</b>.", "Callout"),
          PageBreak()]

    # 11
    s += title("10. Evidencia reproducible y calidad")
    s += [P("La sesión autenticada documentada recorre: panel real → categoría → nueve agentes → control humano → confirmaciones de calendario, consumo, compra, evaluación y comunidad. Los resultados antes/después están versionados en <b>docs/evidencias/sesion-real.md</b> y <b>docs/evidencias/recorridos-confirmados.md</b>."),
          P("Cobertura automatizada", "H2x")]
    tests = [
        ["Suite", "Qué verifica"],
        ["rendered-html", "Frontend renderizado, orquestación, restricciones y confirmación."],
        ["payments-and-persistence", "Bancos, tipos de tarjeta, promociones compatibles y serialización."],
        ["promotion-discovery", "Fuentes oficiales, extracción y límites de vigencia."],
        ["inventory-consumption", "Corrección de cantidades, unidades y descuento sin stock negativo."],
        ["confirmed-actions", "Efectos antes/después de confirmar consumo y compra."],
        ["nutrition", "Cálculo nutricional por receta, comida y seguimiento cocinado."],
    ]
    s += [table(tests, [52*mm, 113*mm]), Spacer(1, 8 * mm),
          metrics([("39", "casos"), ("6", "archivos"), ("0", "fallos"), ("1", "build real")]),
          Spacer(1, 4 * mm),
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

    # 12
    s += title("11. Evaluación UX con Nielsen")
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
          metrics([("8", "cumple"), ("2", "parcial"), ("0", "incumple"), ("10", "evaluadas")]),
          Spacer(1, 4 * mm),
          P("Conclusión UX", "H2x"), P("Cumple ocho de diez heurísticas y cumple parcialmente dos. Para el público objetivo resulta especialmente importante que las decisiones de seguridad se expliquen y que ninguna acción irreversible dependa de recordar comandos."),
          cards([
              ("Próximo paso", "Agregar un recorrido inicial integrado para la primera semana."),
              ("Accesibilidad", "Mantener foco visible, etiquetas y navegación por teclado."),
              ("Medición", "Registrar éxito de tarea, errores y confianza percibida."),
          ]), PageBreak()]

    # 13
    s += title("12. Público objetivo y feedback real")
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
          cards([
              ("Persona", "Adulto que vive solo, compra en Argentina y usa el celular durante la tarea."),
              ("Momento crítico", "Planificar, comprar o cocinar sin perder control sobre datos y cantidades."),
              ("Señal de éxito", "Completa la tarea, entiende la recomendación y confía en la confirmación."),
          ]),
          P("Próxima validación recomendada", "H2x"), P("Realizar cinco pruebas moderadas con personas que vivan solas: crear un plan, corregir un ingrediente, encontrar una promoción, publicar un calendario y borrar memoria. Medir éxito de tarea, tiempo, errores y confianza en las recomendaciones."), PageBreak()]

    # 14
    s += title("13. Ciberseguridad y privacidad")
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
          metrics([("10", "riesgos"), ("3", "capas"), ("0", "secretos públicos"), ("1", "prioridad")]),
          Spacer(1, 4 * mm),
          P("Prioridad", "Callout"), P("La seguridad alimentaria domina el ranking funcional. La aplicación nunca debe compensar una alergia o un vencimiento con ahorro, popularidad, gusto o rapidez."), PageBreak()]

    # 15
    s += title("14. Co-work con inteligencia artificial")
    ai = [
        ["Herramienta", "Uso", "Evaluación crítica"],
        ["ChatGPT Work", "Ideación y primeras iteraciones", "Aceleró exploración; las ideas se verificaron en código."],
        ["Codex en VS Code", "Implementación, pruebas, auth, D1, documentación y despliegue", "Eficaz para recorrer el repo; requirió supervisión en OAuth y fuentes externas."],
        ["Gemini", "Consultas puntuales y contraste", "Segunda perspectiva; no integra el runtime."],
    ]
    s += [table(ai, [38*mm, 59*mm, 68*mm]), Spacer(1, 8 * mm),
          flow(["Idea", "Implementación", "Prueba", "Revisión humana", "Despliegue"], [28*mm]*5), Spacer(1, 7 * mm),
          P("Reflexión", "H2x"), P("Sin co-work con IA, integrar frontend, nueve agentes, persistencia, autenticación, mapas, promociones y pruebas habría requerido aproximadamente el doble de tiempo. La mayor ganancia fue mantener contexto entre módulos y automatizar verificaciones repetitivas."),
          P("La IA también falló: hubo una regresión del buscador bancario, supuestos demasiado optimistas sobre promociones públicas y documentación desactualizada. El proyecto mejoró cuando esos resultados se trataron como hipótesis y se contrastaron con pruebas, código, fuentes oficiales y feedback humano."),
          P("Criterio profesional", "H2x"), P("La IA fue copiloto de desarrollo, no fuente de verdad del dominio. Las decisiones sobre alergias, privacidad, autenticación, vigencia de promociones y publicación se fijaron mediante reglas explícitas y controles verificables."),
          cards([
              ("Proponer", "La IA acelera alternativas y tareas repetitivas."),
              ("Verificar", "Pruebas y fuentes contrastan cada hipótesis relevante."),
              ("Decidir", "La responsabilidad final sigue siendo humana."),
          ]), PageBreak()]

    # 16
    s += title("15. IA local: papel y aporte al usuario")
    s += [P("1. Papel de un LLM/SLM local", "H2x"),
          P("Un modelo pequeño local podría actuar como componente de soporte, no como autoridad sobre alergias o vencimientos. Interpretaría descripciones libres de inventario, resumiría feedback semanal y explicaría recetas con lenguaje flexible. Los nueve agentes determinísticos conservarían las decisiones críticas por ser auditables y reproducibles. No reemplazaría una API externa actual -MealBoard no consume un LLM en producción- sino que agregaría comprensión de lenguaje sin costo por token."),
          P("2. Aporte al usuario", "H2x"),
          P("El usuario podría escribir “me queda medio paquete de arroz y algo de pollo” o pedir una explicación adaptada a su experiencia. El procesamiento local mejoraría privacidad y funcionamiento sin internet para tareas de texto; mapa y promociones seguirían necesitando conexión. Toda propuesta pasaría después por las reglas de alergias, vencimientos y stock."),
          cards([
              ("Interpretar", "Convertir lenguaje cotidiano en datos estructurados."),
              ("Explicar", "Adaptar instrucciones al nivel de cocina del usuario."),
              ("Resumir", "Sintetizar feedback sin enviar texto sensible a la nube."),
          ]),
          P("Arquitectura hipotética", "H2x"),
          flow(["Texto libre", "SLM local\ninterpreta", "Reglas MealBoard\nvalidan", "Usuario\nconfirma"], [34*mm, 38*mm, 45*mm, 34*mm]), Spacer(1, 8 * mm),
          P("El modelo local nunca escribe directamente en D1 ni decide una sustitución segura. Solo produce una propuesta estructurada que el motor de reglas valida.", "Callout"), PageBreak()]

    # 17
    s += title("16. IA local: aporte profesional y límites")
    s += [P("3. Aporte profesional", "H2x"),
          P("Permitiría analizar localmente logs anonimizados, dificultades frecuentes y patrones de abandono sin enviar datos sensibles fuera de la organización. Facilitaría clasificar feedback, preparar reportes y probar nuevos flujos sin conexión. También exigiría evaluaciones propias para medir calidad, sesgos y errores en el dominio alimentario."),
          P("4. Limitaciones frente a la nube", "H2x"),
          P("La calidad depende de memoria, CPU o GPU. Un modelo pequeño comprende menos matices y puede inventar información; no debería calcular alergias, nutrición ni promociones sin validación posterior. Además hay que descargar, versionar, actualizar y monitorear el modelo. Una API cloud suele ofrecer mayor capacidad y mantenimiento centralizado, a cambio de costo, conexión y exposición de datos."),
          table([
              ["Criterio", "SLM local", "API cloud"],
              ["Privacidad", "Datos en el dispositivo", "Datos salen al proveedor"],
              ["Conectividad", "Puede operar sin internet", "Requiere conexión"],
              ["Capacidad", "Limitada por el equipo", "Modelos más capaces"],
              ["Operación", "Descarga y mantenimiento propios", "Servicio administrado"],
          ], [42*mm, 58*mm, 65*mm]), Spacer(1, 5 * mm),
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
