# IA local y co-work de desarrollo

## IAs usadas

| Herramienta | Uso real | Evaluación crítica |
|---|---|---|
| ChatGPT Work | Inicio conceptual, definición del producto y primeras iteraciones | Aceleró la exploración, pero varias ideas debieron verificarse en código. |
| Codex en VS Code | Implementación, pruebas, autenticación, D1, documentación y despliegue | Fue eficaz para recorrer todo el repositorio; necesitó supervisión en OAuth, fuentes externas y datos reales. |
| Gemini | Consultas puntuales y contraste de explicaciones durante la configuración | Útil como segunda perspectiva, sin quedar integrado al runtime de MealBoard. |

Sin el co-work con IA, la integración completa entre frontend, nueve agentes,
persistencia, autenticación, mapa, promociones, pruebas y despliegues hubiera tomado
al menos el doble de tiempo. La IA fue especialmente útil para proponer estructuras,
detectar relaciones entre módulos y automatizar verificaciones. También se equivocó:
hubo búsquedas de bancos que dejaron de funcionar, supuestos demasiado optimistas
sobre promociones públicas y documentación que quedó desactualizada. Esos problemas
se corrigieron con pruebas, fuentes oficiales, revisión humana y decisiones explícitas
sobre privacidad y seguridad alimentaria.

## 1. Papel de un LLM/SLM local

Un SLM local podría actuar como componente de soporte, no como autoridad sobre
alergias o vencimientos. Interpretaría descripciones libres de inventario, resumiría
feedback semanal y explicaría recetas con lenguaje más flexible. Los nueve agentes
determinísticos conservarían las decisiones críticas porque son auditables y
reproducibles. No reemplazaría una API externa actual, ya que MealBoard no consume
un LLM en producción; agregaría comprensión de lenguaje sin costo por token.

## 2. Aporte al usuario

El usuario podría escribir “me queda medio paquete de arroz y algo de pollo” o pedir
una explicación adaptada a su experiencia. El procesamiento local mejoraría la
privacidad y podría funcionar sin internet para tareas de texto. El mapa y las
promociones seguirían requiriendo conexión. La experiencia sería más conversacional,
pero cualquier propuesta pasaría por las reglas de alergias, vencimientos y stock.

## 3. Aporte profesional

Como profesional permitiría analizar localmente logs anonimizados, dificultades
frecuentes y patrones de abandono sin enviar datos sensibles fuera de la
organización. Facilitaría clasificar feedback, preparar reportes y probar nuevos
flujos aun sin conexión. También obligaría a diseñar evaluaciones propias para medir
calidad, sesgos y errores del modelo en el dominio alimentario.

## 4. Limitaciones frente a la nube

La calidad depende de la memoria, CPU o GPU disponible. Un modelo pequeño comprende
menos matices y puede inventar información, por lo que no debería calcular alergias,
nutrición ni promociones sin reglas posteriores. Además hay que descargar, versionar,
actualizar y monitorear el modelo. Una API en la nube suele ofrecer modelos más
capaces y mantenimiento centralizado, aunque con costo, conexión obligatoria y mayor
exposición de datos.

## Opcional para subir la nota

Instalar Ollama, ejecutar `ollama run llama3.2` y preguntar: “Explicá en lenguaje
simple cómo adaptar una receta sin usar un ingrediente rechazado, sin decidir sobre
alergias”. Capturar terminal, modelo, pregunta y respuesta. Este experimento no forma
parte del runtime publicado.

