# MealBoard

Aplicación web para personas que viven solas y necesitan organizar sus comidas,
aprovechar ingredientes, controlar el presupuesto y encontrar el mejor momento
para comprar.

## Proyecto publicado

[Abrir MealBoard](https://mealboard-ai.lauty-d-p.chatgpt.site)

## Funciones principales

- Calendario semanal configurable.
- Ocho agentes locales coordinados:
  captura, memoria, análisis, comunidad, planificación, recetas, compras y
  evaluación.
- Inventario con cantidades, precios y vencimientos.
- Lista de compras y promociones precargadas.
- Comunidad de calendarios para guardar, seguir, publicar y adaptar.
- Memoria persistente en `localStorage`, editable por el usuario.
- Confirmación humana antes de aplicar una planificación.

La versión actual no usa una API paga ni un LLM. Los agentes son módulos
determinísticos con reglas de dominio y una traza visible de sus decisiones.

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

## Crear el repositorio Git

Desde la terminal integrada:

```bash
git init
git add .
git commit -m "Primera versión funcional de MealBoard"
git branch -M main
```

Después de crear un repositorio vacío en GitHub:

```bash
git remote add origin https://github.com/TU-USUARIO/mealboard.git
git push -u origin main
```

Reemplazar `TU-USUARIO` por el nombre real de la cuenta.

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
  page.tsx                Interfaz y estado del MVP
  globals.css             Diseño visual
lib/agents/
  orchestrator.ts         Secuencia de agentes
  *-agent.ts              Agentes independientes
  catalog.ts              Recetas y precios de demostración
  types.ts                Contratos del dominio
tests/
  rendered-html.test.mjs  Pruebas de integración
```

## Datos y limitaciones

- El perfil y la memoria se guardan en el navegador bajo
  `mealboard-state`.
- Los precios, promociones y calendarios sociales son demostrativos.
- No se deben presentar las recomendaciones nutricionales como asesoramiento
  médico.
- Los alimentos vencidos y las alergias deben seguir teniendo prioridad sobre
  gustos, velocidad o ahorro.
