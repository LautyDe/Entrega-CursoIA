# Registro reproducible de una sesión completa

Fecha de documentación: 19 de agosto de 2026.

1. El usuario se autentica y completa nombre, ciudad, presupuesto, nivel, gustos,
   alergias, electrodomésticos, comidas y medio de pago.
2. La API guarda el estado inicial en Cloudflare D1 y la interfaz deja de mostrar
   datos personales ficticios.
3. El usuario registra inventario y solicita un calendario “Fit / proteico”.
4. Captura normaliza entradas y detecta vencimientos.
5. Memoria recupera señales de semanas anteriores.
6. Análisis elimina recetas incompatibles con alergias, rechazos, equipos y categoría.
7. Comunidad transfiere la categoría o una fuente comunitaria real.
8. Planificación ordena recetas por seguridad, afinidad, proteína, costo y tiempo.
9. Recetas genera pasos; beneficios consulta solo fuentes oficiales seleccionadas.
10. Compras calcula faltantes y aplica únicamente banco y tipo compatibles.
11. Evaluación vuelve a revisar restricciones y presupuesto.
12. El usuario revisa `Observó / Decidió / Entregó` y confirma el calendario.
13. Al cocinar, confirma productos y cantidades; el inventario se descuenta.
14. Los totales nutricionales cocinados se actualizan.
15. El usuario publica título, descripción y categoría; D1 guarda únicamente el
    calendario y el nombre público.

Evidencia automatizada asociada: `npm test` ejecuta 35 casos sobre orquestación,
alergias, categorías, pagos, promociones, persistencia, inventario y nutrición.

