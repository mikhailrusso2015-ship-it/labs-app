# LABS · Privacidad y estadísticas sin exponer a nadie

Venezuela no tiene una ley general de protección de datos personales. Solo existe el derecho de la Constitución (artículo 28) a conocer y corregir los datos propios. Por eso LABS se obliga a sí mismo a un nivel alto, que además es lo que pedirá cualquier inversor o laboratorio serio.

## Reglas de oro

1. **El superadministrador no ve datos de pacientes.** Su panel solo muestra laboratorios, planes, pagos y conteos. Quien programa tampoco ve resultados: los campos de salud van cifrados y la clave no la tiene la cuenta de superadministrador.
2. **Cada laboratorio ve solo lo suyo.** Un laboratorio nunca ve nombres, órdenes ni cifras de otro laboratorio.
3. **Las estadísticas de la red salen de una tabla aparte**, sin nombre, sin cédula, sin teléfono. Solo: grupo de edad (rangos de 5 años), sexo, zona (municipio), semana, examen, y si el resultado fue bajo / normal / alto.
4. **Nunca se muestra un grupo pequeño.** Si un grupo tiene menos de 10 personas, no se muestra (en el piloto, menos de 20). Para exámenes sensibles (VIH, embarazo, drogas, pruebas genéticas) el mínimo es 30 y solo a nivel nacional.
5. **Solo informes fijos y períodos de calendario.** No hay buscador libre sobre los datos de la red, y los datos salen con 7 días de retraso. Así nadie puede restar dos consultas para descubrir a una persona.
6. **Los números chicos se redondean** (de 5 en 5) en lo que ve el laboratorio sobre la red.
7. **Los informes de la red solo se activan con 5 o más laboratorios**, para que nadie pueda deducir cuánto hace otro. Antes de eso cada laboratorio ve solo lo suyo.
8. **Todo acceso queda anotado** (quién, cuándo, qué). El paciente puede ver quién abrió sus resultados.
9. **Nada de datos de salud en WhatsApp ni en correo.** El aviso dice "tienes un resultado nuevo". El resultado se abre con enlace seguro de 24 horas.
10. **El paciente puede decir que no** a que sus datos (ya sin nombre) cuenten en las estadísticas de la red.

## Alertas de posibles brotes

- Se calculan sobre conteos semanales por zona y por tipo de examen, comparados con lo normal de esa misma zona y época.
- Una alerta solo sale si coinciden: al menos 3 laboratorios distintos, un aumento claro frente a lo normal, y un mínimo de casos.
- **No es un diagnóstico ni un aviso a la población.** Es una señal para vigilar. Una persona de confianza (asesor de salud) la revisa antes de enviarla.
- Nunca dice el nombre de un laboratorio ni de un paciente.
- **No reemplaza la notificación obligatoria al Ministerio de Salud (MPPS).** Los laboratorios siguen notificando como hoy. LABS puede preparar el resumen para que les sea más fácil.
- Se explica el límite: solo vemos a quienes se hacen exámenes en laboratorios de LABS. No es toda la población.

## Qué ve cada rol

| Rol | Ve | No ve |
|---|---|---|
| Paciente | Sus resultados y quién los abrió | Nada de otros |
| Médico | Lo que el paciente le compartió, mientras dure el permiso | Nada más |
| Laboratorio | Sus órdenes, sus ventas, su catálogo, informes de la red (con mínimos) | Pacientes de otro laboratorio |
| Superadministrador | Laboratorios, planes, pagos, uso, estado del sistema | Resultados, nombres de pacientes |
