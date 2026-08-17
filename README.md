# MealBoard

Aplicación web para personas que viven solas y necesitan organizar sus comidas,
aprovechar ingredientes, controlar el presupuesto y encontrar el mejor momento
para comprar.

## Proyecto publicado

[Abrir MealBoard](https://mealboard-ai.lauty-d-p.chatgpt.site)

## Funciones principales

- Calendario semanal configurable.
- Nueve agentes coordinados: captura, memoria, análisis, comunidad,
  planificación, recetas, beneficios públicos, compras y evaluación.
- Inventario con cantidades, precios y vencimientos.
- Lista de compras cruzada con múltiples bancos, billeteras y tipos de tarjeta.
- Promociones con vigencia, fecha de verificación y enlace a condiciones
  oficiales.
- Consulta bajo demanda de las páginas públicas oficiales correspondientes
  únicamente a los medios de pago seleccionados.
- Consulta complementaria de las páginas oficiales de Carrefour, Coto, Día,
  Jumbo, Disco, Vea y ChangoMás cuando alguna de esas cadenas aparece cerca
  del usuario.
- Mapa opcional de supermercados cercanos mediante geolocalización y datos de
  OpenStreetMap, con marcadores destacados cuando existe una promoción
  compatible con los medios seleccionados.
- Comunidad de calendarios para guardar, seguir, publicar y adaptar.
- Memoria persistente en `localStorage`, editable por el usuario.
- Confirmación humana antes de aplicar una planificación.

La versión actual no usa una API paga ni un LLM. Los agentes son módulos
determinísticos con reglas de dominio y una traza visible de sus decisiones.
El agente de beneficios realiza solicitudes web acotadas, con lista de fuentes
permitidas, tiempo límite y caché; no inicia sesión ni accede a información
personal del cliente.

Los agentes de beneficios navegan hasta dos niveles dentro del mismo dominio
oficial y priorizan enlaces relacionados con promociones, beneficios, medios de
pago y legales. Revisan como máximo seis páginas durante doce segundos por
sitio. Las secciones que producen resultados se recuerdan en la memoria
temporal del proceso para consultarlas primero la próxima vez; ese aprendizaje
se reinicia al volver a desplegar o iniciar el servidor.

Las tiendas basadas en VTEX u otras aplicaciones pueden publicar condiciones
dentro de datos estructurados embebidos. MealBoard analiza esos datos como
texto sin ejecutar sus scripts, descarta vigencias vencidas cuando la fuente
publica fechas y mantiene los resultados como referencias hasta verificarlos.
En Coto también se consulta directamente la sección pública de términos y su
endpoint oficial de promociones multicanal, porque la página los carga mediante
un iframe y una aplicación Angular en lugar de enlaces HTML convencionales.

## Tecnologías

- React 19
- TypeScript
- Next.js 16
- Vinext y Vite
- CSS propio
- Node Test Runner
- Cloudflare Workers compatible

## Requisitos

- Node.js 22.13 o posterior.
- npm.
- Git, si se quiere publicar el código en GitHub.

## Ejecutar en Visual Studio Code

1. Extraer la carpeta del proyecto.
2. En VS Code, seleccionar **Archivo > Abrir carpeta** y abrir
   `MealBoard-VSCode-GitHub`.
3. Abrir la terminal integrada.
4. Ejecutar:

```bash
npm install
npm run dev
```

Vite mostrará la dirección local que debe abrirse en el navegador.

## Verificación

```bash
npm run lint
npm test
```

## Repositorio

El código fuente se mantiene en
[LautyDe/Entrega-CursoIA](https://github.com/LautyDe/Entrega-CursoIA).

El trabajo local no publica cambios automáticamente. Los commits y el push se
realizan de forma explícita después de revisar las modificaciones.

## Trabajar con Codex en VS Code

1. Instalar la extensión oficial **Codex** de OpenAI desde Extensiones.
2. Iniciar sesión con la cuenta de ChatGPT.
3. Abrir esta carpeta completa, no un archivo suelto.
4. Abrir el panel de Codex y comenzar una conversación local.

El archivo `AGENTS.md` explica a Codex la arquitectura y las reglas que debe
preservar cuando modifica el proyecto.

En Windows puede trabajarse de forma nativa. Si una herramienta necesita un
entorno Linux, VS Code y Codex también admiten WSL2.

## Estructura relevante

```text
app/
  api/plan/route.ts       Endpoint del orquestador
  api/promotions/route.ts Consulta fuentes públicas de beneficios
  page.tsx                Interfaz y estado del MVP
  globals.css             Diseño visual
lib/agents/
  orchestrator.ts         Secuencia de agentes
  *-agent.ts              Agentes independientes
  catalog.ts              Recetas y precios de demostración
  types.ts                Contratos del dominio
tests/
  rendered-html.test.mjs              Pruebas de integración
  payments-and-persistence.test.mjs   Pagos, promociones y almacenamiento
```

La explicación completa y los diagramas se encuentran en
[`docs/arquitectura.md`](docs/arquitectura.md).

## Datos y limitaciones

- El perfil y la memoria se guardan en el navegador bajo
  `mealboard-state`.
- El medio de pago se guarda mediante banco y tipo de tarjeta separados. Los
  estados anteriores que usaban un único texto se migran al cargarse.
- El selector muestra una lista consistente en escritorio y celular, busca
  bancos, billeteras y fintech por nombre o alias, e ignora palabras del tipo
  de medio antes de confirmar opciones desconocidas.
- Los precios y calendarios sociales son demostrativos. Las promociones
  identifican fuente y período de vigencia, pero siempre deben confirmarse con
  la entidad antes de pagar porque pueden cambiar o agotarse.
- La búsqueda del mapa consulta primero las secciones oficiales del supermercado
  y después complementa los resultados con catálogos públicos estructurados de
  la entidad seleccionada cuando están disponibles, como Beneficios Galicia.
- Una promoción solo se aplica cuando coinciden exactamente el banco y el tipo
  de tarjeta; si no hay coincidencia, la compra no muestra un ahorro ficticio.
- Los errores de escritura cercanos a una entidad conocida generan una
  sugerencia. Las entidades desconocidas requieren confirmación, quedan
  marcadas como no verificadas y no reciben promociones.
- Los nombres históricos y abreviaturas frecuentes, como `Santander Río`,
  `BNA`, `Bapro` o `Banco Francés`, se normalizan a la entidad actual.
- Cada medio seleccionado muestra su nivel de cobertura y un acceso a la
  fuente oficial. No encontrar una promoción estructurada no se presenta como
  prueba de que el banco carezca de beneficios.
- Los textos encontrados en páginas oficiales se muestran como referencias
  públicas. Solo las promociones estructuradas, vigentes y compatibles se usan
  para calcular ahorro; una referencia web nunca se aplica automáticamente.
- Cuando una referencia pública contiene comercio, día y porcentaje legibles,
  puede aparecer en amarillo sobre el mapa. Sigue siendo informativa y no se
  utiliza para calcular ahorro hasta tener condiciones estructuradas completas.
- El agente de comercios consulta solamente las cadenas detectadas en el mapa y
  conserva únicamente publicaciones que mencionan alguno de los medios de pago
  elegidos. Las páginas que no exponen condiciones legibles quedan informadas
  como no disponibles, sin inventar una promoción.
- Santander Cuenta Sueldo incluye oportunidades verificadas para ChangoMás,
  Jumbo, Disco, Vea, La Anónima, Carrefour y Día. La app muestra la condición
  de Plan Sueldo y exige confirmar vigencia y adhesión antes de comprar.
- La ubicación requiere permiso explícito, se utiliza para una consulta puntual
  de comercios cercanos y no se persiste en el perfil ni en la memoria.
- El cruce del mapa usa la marca informada por OpenStreetMap. Un marcador con
  descuento indica compatibilidad potencial; la adhesión de esa sucursal debe
  confirmarse en las condiciones oficiales.
- No se deben presentar las recomendaciones nutricionales como asesoramiento
  médico.
- Los alimentos vencidos y las alergias deben seguir teniendo prioridad sobre
  gustos, velocidad o ahorro.
