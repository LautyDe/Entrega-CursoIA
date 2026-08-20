# Registro reproducible de la sesión autenticada

Fecha de documentación: 19 de agosto de 2026.

La evidencia se obtuvo en la aplicación publicada con una cuenta de prueba
autorizada para esta entrega. El correo se recortó u ocultó en las figuras del
informe.

## Recorrido confirmado

1. La sesión autenticada cargó presupuesto, vencimientos, ahorro, calendario,
   estado de cocción y seguimiento nutricional.
2. Se abrió **Generar con agentes**, se eligió **Fit / proteico** y se ejecutó el
   ciclo completo de nueve agentes.
3. La propuesta conservó la prioridad de alergias, alimentos vencidos y demás
   restricciones, y mostró la traza `Observó / Decidió / Entregó`.
4. Se usó **Confirmar calendario**. El presupuesto disponible pasó de $75.000 a
   $70.000 y se creó una lista de cuatro productos por $5.000.
5. En **Ensalada de lentejas** se confirmó el consumo de 100 g. El stock de
   lentejas pasó de 500 g a 400 g y el seguimiento registró 245 kcal.
6. Se marcaron los cuatro productos y se confirmó la compra. Los pendientes
   pasaron de cuatro a cero, el inventario de ocho a doce productos y el ahorro
   registrado aumentó $1.500.
7. Se guardó una evaluación semanal con una comida preparada y $5.000 gastados.
8. Se corrigió un dato aprendido y se verificó su persistencia en memoria.
9. Se publicó **Mi semana organizada** en la comunidad, se calificó con cinco
   estrellas y se publicó el comentario “Recorrido de prueba confirmado”.
10. Se guardaron cuatro medios de pago y se consultaron únicamente sus fuentes
    públicas oficiales.
11. Se solicitó geolocalización para el mapa. El navegador negó el permiso; la
    aplicación informó el resultado, continuó funcionando y no guardó la
    ubicación.

## Archivos de evidencia

- `02-dashboard-autenticado.png`: panel real con correo fuera del recorte.
- `03-categorias-seguridad.png`: selector de categorías y prioridad de seguridad.
- `04-traza-agentes.png`: resumen y primeros agentes de la propuesta.
- `05-evaluacion-confirmacion.png`: agentes finales y confirmación humana.
- `06-confirmacion-inventario.png`: corrección previa al descuento de stock.
- `recorridos-confirmados.md`: resultados antes/después del recorrido persistido.

La evidencia automatizada complementaria se reproduce con `npm test`. Incluye
casos específicos sobre confirmación, descuento de inventario, compra y ahorro,
además de orquestación, alergias, categorías, pagos, promociones, persistencia y
nutrición.
