# Guía de trabajo para Codex

## Objetivo

MealBoard ayuda a personas que viven solas a planificar comidas, aprovechar el
inventario y los descuentos, reducir desperdicios y controlar el presupuesto.

## Arquitectura

- `app/page.tsx`: interfaz React, estado del MVP y persistencia del navegador.
- `app/api/plan/route.ts`: entrada HTTP del orquestador.
- `lib/agents/orchestrator.ts`: ejecuta ocho agentes en orden.
- `lib/agents/types.ts`: contratos compartidos.
- `lib/agents/catalog.ts`: recetas y precios de demostración.
- `tests/rendered-html.test.mjs`: integración del frontend y del ciclo agéntico.

Orden del ciclo:

1. Captura.
2. Memoria.
3. Análisis.
4. Comunidad.
5. Planificación.
6. Recetas.
7. Compras y promociones.
8. Evaluación.

## Reglas que deben preservarse

- Excluir alimentos vencidos.
- No recomendar ingredientes incompatibles con alergias o rechazos.
- Respetar los electrodomésticos y el nivel de cocina.
- Advertir si la compra supera el presupuesto.
- Pedir confirmación antes de aplicar cambios importantes.
- Conservar la traza `Observó / Decidió / Entregó`.
- Mantener el control para consultar, corregir y eliminar memoria.
- No afirmar que precios o promociones precargados están actualizados.
- No agregar servicios pagos ni claves de API sin una solicitud explícita.

## Convenciones de implementación

- Mantener TypeScript estricto y reutilizar los tipos de `lib/agents/types.ts`.
- Cada agente recibe y devuelve `WorkingState`; no debe mutarlo directamente.
- La seguridad se valida antes y después de planificar.
- Mantener el diseño moderno y minimalista en crema, bordo, blanco y verde.
- Conservar accesibilidad, etiquetas visibles y navegación por teclado.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm test
```

Antes de cerrar un cambio funcional, ejecutar como mínimo `npm run lint` y las
pruebas relacionadas. Si se modifica la orquestación, ejecutar `npm test`.
