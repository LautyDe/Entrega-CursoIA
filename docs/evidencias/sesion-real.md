# Registro reproducible de la sesión autenticada

Fecha de documentación: 19 de agosto de 2026.

La evidencia se obtuvo en la aplicación publicada con el único usuario registrado,
cuya identidad fue autorizada para esta entrega. El correo se recortó u ocultó en
las figuras destinadas al informe.

## Recorrido observado

1. La sesión autenticada cargó presupuesto, vencimientos, ahorro, calendario,
   estado de cocción y seguimiento nutricional.
2. El usuario abrió **Generar con agentes** y eligió la categoría
   **Fit / proteico**.
3. La interfaz recordó que alergias, alimentos vencidos y restricciones siempre
   tienen prioridad sobre la categoría.
4. Los nueve agentes generaron una propuesta de 14 comidas con estimaciones de
   compra y ahorro.
5. La propuesta mostró la traza `Observó / Decidió / Entregó` para cada agente.
6. Los agentes de beneficios, compras y evaluación informaron fuentes públicas,
   faltantes, ahorro y validación final.
7. La interfaz mantuvo separados **Cancelar** y **Confirmar calendario**.
8. Se canceló la propuesta para no modificar el calendario persistido.
9. Se abrió una comida planificada y luego **Marcar como cocinada**.
10. La confirmación permitió corregir productos y cantidades, quitar filas o no
    descontar ingredientes ausentes del inventario.
11. Se cerró la ventana sin usar **Confirmar y descontar**, por lo que el
    inventario tampoco fue modificado.

## Archivos de evidencia

- `02-dashboard-autenticado.png`: panel real con correo fuera del recorte.
- `03-categorias-seguridad.png`: selector de categorías y prioridad de seguridad.
- `04-traza-agentes.png`: resumen y primeros agentes de la propuesta.
- `05-evaluacion-confirmacion.png`: agentes finales y confirmación humana.
- `06-confirmacion-inventario.png`: corrección previa al descuento de stock.

La evidencia automatizada complementaria se reproduce con `npm test`, que ejecuta
35 casos sobre orquestación, alergias, categorías, pagos, promociones,
persistencia, inventario y nutrición.
