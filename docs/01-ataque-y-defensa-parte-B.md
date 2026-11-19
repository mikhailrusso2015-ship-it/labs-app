# LABS · Ataque y defensa (parte B: lo que encontraron los dos auditores)

Dos auditores atacaron el diseño por separado: uno de seguridad y otro de producto y negocio. Esto es lo que cambia el plan. Se marca [C] crítico, [A] alto.

## Decisiones que cambian el diseño

### Cuentas y poder del superadministrador
1. [C] **El superadministrador no reinicia claves.** Solo envía un enlace de recuperación al contacto ya registrado de la persona. No existe "entrar como usuario". En laboratorios, el reinicio lo aprueban 2 personas y espera 24 horas con aviso al correo y teléfono anteriores. Nunca se reinicia por llamada o chat.
2. [C] **El superadministrador no ve resultados médicos.** Solo negocio: planes, pagos, conteos. Acceso de emergencia temporal, aprobado por una segunda persona y anotado. Mínimo 2 cuentas de superadministrador, con llave física o passkey.
3. [A] **Registro de auditoría que nadie puede borrar** (solo se añade, con copia fuera). Alertas automáticas ante reinicios, descargas masivas o médicos que abren muchos pacientes.
4. [A] **Un usuario por empleado** en el laboratorio: recepción (crea órdenes), bioanalista (valida y firma), administrador (precios y finanzas). El dueño da de baja a quien se va.

### Pacientes y QR
5. [C] **El resultado nunca llega a la persona equivocada.** El destino (WhatsApp o correo) sale del perfil confirmado del paciente, nunca lo escribe el laboratorio.
6. [C] **El QR es de un solo uso** y lo valida el servidor. La pantalla del paciente muestra laboratorio, ciudad y hora. Para aprobar, el paciente escribe un número de 2 dígitos que ve en la pantalla del laboratorio (así no aprueba por costumbre).
7. [A] **Límites contra adivinar:** máximo 3 intentos de cédula por QR y 3 solicitudes por hora. Los 3 últimos dígitos son una comprobación extra, no un secreto.
8. [A] **"No soy yo" no borra:** pone el resultado en cuarentena y avisa al laboratorio. Si un laboratorio acumula muchos, lo revisa una persona.
9. [C] **El paciente puede abrir su resultado sin instalar nada**: recibe un enlace seguro, lo abre en el navegador. La cuenta y el QR único se ofrecen después. Un enlace sirve para pocas aperturas, vence pronto (2 h por defecto) y pide un segundo dato.
10. [A] **Perfiles dependientes:** hijos menores, adultos mayores, "mi mamá". Cada perfil con su historial. Documento alterno si no hay cédula (pasaporte, extranjero). Nunca se bloquea un examen por no tener cédula.
11. [A] **Teléfono robado o cambiado:** biometría o PIN propio, cierre de sesiones viejas, espera de 24 horas al cambiar de dispositivo, y no depender del SMS como único segundo factor (cambios de SIM). Los resultados guardados sin internet van cifrados y vencen.
12. [A] **Notificaciones neutras:** "tienes un documento nuevo". Sin nombre del examen ni valores, y con opción de modo discreto.

### Resultados y clínica
13. [C] **Valores críticos** son un estado propio: el laboratorio debe anotar que llamó al paciente o al médico antes de liberarlos. LABS no es canal de urgencias, y la pantalla lo dice.
14. [C] **Exámenes delicados** (VIH, embarazo, biopsias, pruebas genéticas): por defecto quedan retenidos hasta que el laboratorio los libere o el paciente los retire en persona. Nunca salen en avisos ni en enlaces compartidos.
15. [C] **Correcciones con versiones.** Nada se sobrescribe. La versión vieja queda "reemplazada" y se avisa al paciente y a los médicos con permiso.
16. [C] **La lectura de PDF o foto es asistida:** se muestra la imagen al lado de lo leído y el bioanalista confirma cada número. No se envía sin esa confirmación. Se rechazan valores imposibles. Se activa en el piloto solo después de medir errores con documentos reales.
17. [A] **LABS nunca decide el margen normal.** Muestra el que trae el resultado. Las unidades no se convierten solas. Un historial solo junta valores con la misma unidad.
18. [A] **Los resultados no numéricos** ("positivo ++", "reactivo", títulos, cultivos) se muestran como vienen, sin barra y sin explicación automática.
19. [C] **Recomendaciones:** textos fijos y revisados por un médico, con versión guardada en cada resultado. Nada de diagnósticos. Para valores graves, mensaje fijo de urgencia. Hace falta un bioanalista y un médico asesor desde el principio.

### Firma, sello y PDF
20. [A] **La firma y el sello solo los sube el propio bioanalista**, con su cuenta verificada. Se guardan cifrados, no se pueden descargar, y se estampan solo cuando él valida el resultado con una confirmación extra. Los puede revocar el laboratorio.
21. [A] **El PDF lleva código QR y huella.** El QR abre una página de LABS que dice solo "válido / no válido / reemplazado" y laboratorio y fecha. No muestra nombre ni valores.
22. [A] **No decir "firma electrónica equivalente a la manuscrita"** hasta tener certificado de un proveedor acreditado ante SUSCERTE. Mientras tanto: "validación electrónica de LABS, verificable por QR". Confirmar con un abogado.

### Dinero
23. [A] **Todo se guarda en dólares** y se muestra en bolívares según la tasa elegida. Cada orden **congela** la tasa, la fuente y la hora. Nunca se recalcula una venta vieja.
24. [A] **Tasas con dos fuentes y tope de cambio:** si las fuentes difieren más de 5 % o la tasa salta más de 10 % en un día, no se actualiza sola y se avisa. La tasa manual la cambia solo el dueño, con motivo y límite.
25. [A] **LABS no emite factura fiscal.** Los comprobantes lo dicen. Se consulta con un contador (SENIAT, impuesto a divisas).
26. [M] **Los reportes de rentabilidad dicen "estimado"** y muestran "sin costo cargado" cuando falta el costo.
27. [A] **Si un laboratorio deja de pagar**, pierde la capacidad de crear órdenes nuevas, pero los resultados ya entregados siguen siendo del paciente.

### Estadísticas y alertas de brotes
28. [A] **Mínimos de privacidad:** 10 casos por celda (en el piloto, 20), solo por municipio o estado, edades en rangos, y solo con **5 o más laboratorios** aportando.
29. [A] **Contra la resta de informes:** solo períodos fijos de calendario, datos con 7 días de retraso, ruido fijo por celda, límite de consultas y registro de cada una.
30. [A] **Contra alertas falsas o inventadas:** solo cuentan órdenes confirmadas por el paciente, un laboratorio nuevo pesa 0 los primeros 60 días, mínimo 3 laboratorios y revisión humana. Redacción: "posible aumento, por confirmar".
31. [A] **Nunca se nombra a un laboratorio** ni se hacen rankings. Sin mapas públicos de casos.
32. [A] **No reemplaza la notificación obligatoria al MPPS.** El resumen es una ayuda, nunca "notificado automáticamente".

### Seguridad técnica
33. [C] **Aislamiento entre laboratorios:** identificadores aleatorios, el laboratorio sale de la sesión del servidor y no de la petición, reglas de acceso por fila en la base, y una prueba automática que intenta leer datos del otro laboratorio en cada endpoint.
34. [C] **Cifrado por campo** (cédula, nombre, valores) con claves por laboratorio. Respaldos cifrados con otra clave, en otro lugar, con restauración probada cada mes.
35. [A] **Subida de imágenes:** solo JPG y PNG verificados por contenido, 5 MB como máximo, y se vuelven a codificar en el servidor (quita metadatos y código escondido).
36. [A] **Sin datos reales en pruebas, ni en logs, ni pegados en herramientas de IA.** Llaves solo en el servidor. Revisión humana de todo lo de acceso y permisos.
37. [A] **Contra el abuso de costos:** tope diario de mensajes por laboratorio, límites por usuario e IP, informes calculados de noche.

### Negocio
38. [C] **El laboratorio no puede gastar más de 30 segundos extra por examen.** El camino mínimo: subir el PDF que ya hacen, escanear o escribir la cédula, enviar. Los datos estructurados para las gráficas son opcionales.
39. [A] **Competir con WhatsApp no sirve; apoyarse en él.** LABS genera el enlace seguro y el laboratorio lo comparte. Lo que WhatsApp no da: verificar al paciente, historial ordenado, documento auténtico, correcciones controladas.
40. [A] **Posición:** capa de entrega al paciente para laboratorios pequeños y medianos (Word, Excel, papel), no un reemplazo de los sistemas grandes.
41. [A] **Precio:** preguntar a 10 laboratorios cuánto pagarían y cómo. Calcular el costo real por paciente (almacenamiento, mensajes) antes de fijar el precio. Piloto con precio de fundador, nunca gratis para siempre.
42. [M] **Exportar todo** (CSV y PDFs) desde el primer día, para que el laboratorio confíe en entrar.
43. [M] **Soporte:** un solo canal, horario escrito, y máximo 3 laboratorios en el piloto.
44. [M] **Sin conexión en el mostrador:** el laboratorio crea órdenes y carga resultados sin internet y se envía al volver.
45. [M] **El diseño de cristal se prueba con adultos mayores y en un Android barato.** Si cansa o no se lee, se simplifica.

## Lo que los auditores recomiendan dejar para después del piloto
Lectura automática de PDF sin doble revisión, alertas de brotes (hasta tener 5 laboratorios), panel completo del médico, gráficas animadas y 3D, rentabilidad con nómina y reactivos, facturación fiscal, firma certificada, conversión de unidades, conexión con máquinas y cuentas de menores.

**El demo para inversores sí los muestra todos**, claramente marcados como ejemplo. La separación es entre "lo que se muestra" y "lo que se construye primero".

## Lo que ningún código puede resolver (necesita personas)
1. Un abogado venezolano: datos de salud, firma electrónica, contrato con laboratorios, términos de uso.
2. Un contador: facturación, impuesto a divisas, cómo cobrar desde otra jurisdicción.
3. Un médico y un bioanalista asesores: textos de recomendaciones, lista de valores críticos y de exámenes delicados.
4. Diez laboratorios entrevistados: precio, forma de trabajo actual y qué les haría cambiar.
5. Una prueba de seguridad externa antes del piloto.
