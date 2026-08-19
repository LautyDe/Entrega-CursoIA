# Evaluación UX/UI y ciberseguridad de MealBoard

## Heurísticas de Nielsen

| Heurística | Estado | Evidencia concreta |
|---|---|---|
| Visibilidad del estado | Cumple | La generación muestra el ciclo de nueve agentes, estados de carga, resultados y notificaciones. |
| Coincidencia con el mundo real | Cumple | Usa conceptos cotidianos: alacena, vencimiento, lista de compras, comidas y medios de pago argentinos. |
| Control y libertad | Cumple | El usuario confirma planes, corrige inventario e ingredientes consumidos, elimina memoria y cancela modales. |
| Consistencia y estándares | Cumple | Botones primarios, secundarios, campos y estados mantienen patrones visuales en toda la aplicación. |
| Prevención de errores | Cumple | Alergias y vencimientos se validan antes y después del plan; no se descuenta más inventario del disponible. |
| Reconocimiento sobre recuerdo | Cumple | Selectores, chips, categorías y etiquetas visibles reducen la necesidad de memorizar comandos. |
| Flexibilidad y eficiencia | Parcial | La PWA funciona en escritorio y móvil; todavía no hay atajos avanzados ni importación masiva completa. |
| Diseño estético y minimalista | Cumple | Paleta crema, bordo y verde, jerarquía clara y contenido agrupado por tareas. |
| Ayuda para reconocer errores | Cumple | Los mensajes explican incompatibilidades, falta de stock, entidades desconocidas y fallas externas. |
| Ayuda y documentación | Parcial | README y textos contextuales cubren el uso principal; falta una ayuda integrada paso a paso. |

## Evaluación para el público objetivo

MealBoard está pensado para personas que viven solas, con distintos niveles de
experiencia culinaria y sin conocimientos técnicos. El lenguaje utiliza acciones
concretas y evita términos de programación. La interfaz pide confirmación antes de
modificar el calendario o descontar inventario y explica por qué una promoción no
es compatible. La navegación responsive y la instalación PWA facilitan el uso
desde el celular durante la compra o la cocina.

La revisión informal durante el desarrollo detectó que el selector de medios de
pago se había vuelto visualmente más atractivo pero menos confiable. El feedback
fue que búsquedas como Galicia crédito/débito no devolvían resultados. Se restauró
la búsqueda funcional, se separaron banco y tipo de tarjeta y se añadieron alias,
validación y pruebas. También se incorporaron onboarding, comunidad real y
confirmación del consumo a partir de pedidos concretos de uso.

## Log de riesgos

| Riesgo | Tipo | Medida implementada o decisión |
|---|---|---|
| Exposición de secretos OAuth y correo | Secretos | `.env` está ignorado; los secretos se configuran como variables privadas en producción. |
| Acceso a datos de otro usuario | Acceso / OWASP | Las rutas obtienen la identidad desde la cookie de sesión; nunca aceptan un `userId` del cliente. |
| Contraseñas comprometidas | Autenticación | Better Auth administra hashes; la aplicación no guarda contraseñas en su estado. |
| Publicación de datos privados | Privacidad | Comunidad comparte nombre público, descripción y comidas; excluye correo, inventario, alergias y pagos. |
| Ubicación persistida sin consentimiento | Privacidad | Se solicita permiso explícito, se usa para una consulta puntual y no se guarda. |
| Promociones falsas o vencidas | Integridad | Solo datos estructurados compatibles calculan ahorro; referencias web quedan informativas y enlazan fuente. |
| Scraping ilimitado o salida de dominio | SSRF / disponibilidad | Lista de fuentes oficiales, HTTPS, mismo dominio, profundidad, cantidad de páginas y timeout acotados. |
| Recomendación alimentaria insegura | Seguridad de dominio | Alergias, rechazos y vencimientos se revisan antes y después de planificar y nuevamente al publicar. |
| Cantidades negativas o exceso de consumo | Validación | Se validan unidades y stock; no se permite descontar más de lo registrado. |
| Inyección de prompt | IA | El planificador no usa LLM ni ejecuta prompts. Las entradas se tratan como datos y se normalizan. |

