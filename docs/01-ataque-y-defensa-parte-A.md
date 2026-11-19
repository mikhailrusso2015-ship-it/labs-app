# LABS · Ataque y defensa (parte A: lo que encontré yo)

Formato: **PERO** (lo que podría romper el proyecto) → **Solución** (lo que haremos).

## 1. Resultados y lectura de exámenes (riesgo clínico)

1. **PERO:** al leer un PDF o una foto, el sistema puede leer mal un número (un 1,08 que pasa a 108). → **Solución:** el laboratorio siempre revisa lado a lado (imagen y valor leído) y confirma antes de enviar. Los valores fuera de lo posible (glucosa 10.800) se bloquean solos.
2. **PERO:** cada laboratorio tiene sus propios márgenes normales, según equipo, método, edad y sexo. → **Solución:** LABS **nunca inventa el margen**; muestra el que trae el resultado del laboratorio. La tabla propia de LABS solo se usa si el laboratorio la carga.
3. **PERO:** el mismo examen viene en unidades distintas (mg/dL, mmol/L). → **Solución:** la unidad se guarda con cada valor. El sistema convierte solo cuando las dos unidades son conocidas y lo marca.
4. **PERO:** hay valores críticos que no pueden esperar a que el paciente abra la app. → **Solución:** el laboratorio define cuáles son críticos. Al cargarlos, LABS exige que el laboratorio llame al paciente o al médico y anote que lo hizo antes de enviar.
5. **PERO:** hay resultados que no deben llegar de golpe al teléfono (VIH, embarazo, biopsias, pruebas genéticas). → **Solución:** lista de exámenes "delicados". Se entregan solo con aviso de "pasa por el laboratorio" o por un médico, según decida el laboratorio. El paciente no ve el valor en la pantalla de aviso.
6. **PERO:** resultados cualitativos ("positivo", "trazas", "negativo") no encajan en una barra. → **Solución:** se muestran como etiqueta con color y texto, no como barra.
7. **PERO:** un resultado se corrige después de enviado. → **Solución:** versiones. La nueva versión avisa al paciente y al médico, y la anterior queda marcada "reemplazada" (nunca se borra).

## 2. Recomendaciones automáticas

8. **PERO:** una recomendación equivocada puede dañar a alguien. → **Solución:** son **reglas escritas y aprobadas por un médico**, no texto libre inventado en el momento. Cada regla tiene dueño, fecha y versión.
9. **PERO:** "elimina rápido el colesterol" suena a promesa o a tratamiento. → **Solución:** el tono es educado y prudente: "baja las frituras", "camina 30 minutos". Nada de medicinas, dosis ni dietas estrictas. Nada de "estás tranquilo" cuando hay un valor crítico.
10. **PERO:** la persona está embarazada, es niño o tiene una enfermedad y el consejo general no aplica. → **Solución:** si el laboratorio indica niño, embarazo o paciente de riesgo, la recomendación cambia a "habla con tu médico" y no da consejos de dieta.
11. **PERO:** alguien dice "la app me dijo que estaba bien y no fui al médico". → **Solución:** el texto legal y el de la pantalla dicen siempre que no reemplaza al médico. Los valores graves dicen "ve hoy al médico", no "puedes estar tranquilo". El laboratorio acepta esto en el contrato.

## 3. Firma y sello

12. **PERO:** una foto de la firma y del sello no es una firma electrónica certificada. En Venezuela, la firma electrónica equivale a la firma manuscrita cuando la certifica un proveedor acreditado ante SUSCERTE (Decreto 1.204, 2001). → **Solución:** en el MVP la imagen sirve de presentación. El PDF lleva además un **código QR de verificación** que abre una página de LABS: "este resultado es auténtico, lo emitió el laboratorio X, lo firmó el bioanalista Y el día Z". En la Etapa 2 se ofrece firma certificada. Esto se consulta con un abogado.
13. **PERO:** alguien puede robar la imagen de la firma y el sello. → **Solución:** la firma y el sello se guardan cifrados, no se pueden descargar, y solo se estampan en un resultado **con el bioanalista dentro de su sesión, con clave extra** y la orden confirmada. Cada estampado queda anotado.
14. **PERO:** un PDF puede editarse después. → **Solución:** el PDF lleva un código y una huella; si cambia, el QR de verificación muestra "documento modificado". El paciente comparte el enlace de verificación, no solo el archivo.
15. **PERO:** la firma sale mal recortada o con fondo. → **Solución:** vista previa obligatoria antes de guardar, botón para repetir la foto, y consejos simples: hoja blanca, buena luz, firma y sello separados.
16. **PERO:** el bioanalista se va del laboratorio. → **Solución:** la firma y el sello pertenecen a la persona dentro del laboratorio. Se pueden desactivar y los resultados viejos conservan la firma de quien los firmó.

## 4. Dinero, tasas y precios

17. **PERO:** el BCV no ofrece una interfaz oficial para programas. → **Solución:** se lee de una fuente externa con respaldo, siempre se muestra "actualizada el [fecha y hora]" y siempre existe la tasa manual. Si la fuente falla, se queda la última tasa buena y se avisa.
18. **PERO:** la brecha entre el BCV y el USDT es grande (cerca de 17 % en septiembre de 2026). → **Solución:** cada orden **congela la tasa usada** al crearse. Si la tasa cambia al día siguiente, la venta de ayer no se mueve.
19. **PERO:** el precio en dólares es el real, pero el cliente paga en bolívares. → **Solución:** el catálogo guarda el precio en **dólares** y el sistema lo convierte. El laboratorio elige qué tasa aplicar a cada método de pago.
20. **PERO:** "rentabilidad" sin costos es una mentira. → **Solución:** el laboratorio carga el **costo por examen** (reactivos y materiales). La ganancia sale de venta menos costo. Si falta el costo, el sistema dice "sin costo cargado" en vez de inventar.
21. **PERO:** hay descuentos, convenios con empresas, exámenes anulados, pagos parciales. → **Solución:** descuento por orden, anulación con motivo, y estado de pago (pagado / pendiente / parcial).
22. **PERO:** el SENIAT exige facturas fiscales. → **Solución:** LABS **no emite facturas fiscales** en el MVP. Se puede exportar el listado para la máquina fiscal o el sistema de facturación del laboratorio. Se consulta con un contador.
23. **PERO:** cobrar la suscripción en Venezuela es difícil. → **Solución:** el superadministrador registra el pago a mano (dólares, Pago Móvil, USDT, transferencia) con comprobante y vencimiento. Cobro automático después.

## 5. Laboratorios (adopción)

24. **PERO:** los laboratorios pequeños usan Word, Excel o papel y no querrán cambiar. → **Solución:** no tienen que cambiar su forma de trabajar. Suben el PDF o la foto que ya generan; LABS llena los valores; ellos revisan y envían.
25. **PERO:** se cae el internet en el mostrador. → **Solución:** el laboratorio puede crear órdenes y cargar resultados sin conexión y todo se envía al volver la conexión.
26. **PERO:** el laboratorio teme que LABS le "robe" sus pacientes. → **Solución:** el paciente es del laboratorio. El paciente decide con qué laboratorios comparte, pero LABS no recomienda ni reparte pacientes. Ningún laboratorio ve a los clientes de otro.
27. **PERO:** si el laboratorio se va de LABS, pierde sus datos. → **Solución:** puede **exportar todo** (órdenes, resultados, catálogo) y sus pacientes conservan lo que ya recibieron.
28. **PERO:** el personal cambia mucho. → **Solución:** roles: dueño, bioanalista, recepción. Cada uno con su propia entrada y permisos distintos (solo el bioanalista firma).

## 6. Pacientes

29. **PERO:** adultos mayores sin teléfono inteligente o sin datos. → **Solución:** el resultado también se puede imprimir con firma, sello y código QR de verificación. El teléfono es una ventaja, no una obligación.
30. **PERO:** una familia comparte un teléfono; un padre pide los resultados de un hijo. → **Solución:** el usuario LABS puede tener **perfiles dependientes** (hijos menores, adultos a cargo) bajo la cuenta del representante.
31. **PERO:** extranjeros sin cédula venezolana. → **Solución:** documento de identidad alternativo (pasaporte); la verificación de "últimos 3 dígitos" funciona con cualquier documento.
32. **PERO:** cambio o robo del teléfono. → **Solución:** recuperación con documento en el laboratorio o clave extra. El teléfono perdido se desactiva y los resultados quedan protegidos.
33. **PERO:** dos personas con los mismos 3 últimos dígitos de cédula. → **Solución:** son una verificación extra, no la única. El paciente confirma en su teléfono, y la etiqueta del tubo debe coincidir con la orden.
34. **PERO:** el paciente ve un valor feo y entra en pánico a las 2 a. m. → **Solución:** el texto es claro y calmado, con un siguiente paso concreto. Para valores graves, el lenguaje es "ve al médico hoy", sin dramatismo.

## 7. Médicos

35. **PERO:** un médico falso consigue acceso. → **Solución:** verificación humana (cédula, título, Colegio de Médicos y MPPS, selfie) + el permiso real lo da el paciente, con vencimiento. Aun con un falso, solo ve lo que el paciente le mostró.
36. **PERO:** el paciente comparte con un médico y se olvida. → **Solución:** los permisos vencen solos (por defecto, 90 días) y el paciente ve una lista de "quién me ve".
37. **PERO:** un médico pide "ver todo" sin permiso. → **Solución:** no existe esa función. Solo ve lo que el paciente comparte.

## 8. Estadísticas y brotes

38. **PERO:** pocos datos = falsas alarmas. → **Solución:** mínimo de laboratorios, mínimo de casos y revisión humana. Se marca como "señal" con nivel de confianza.
39. **PERO:** quien se hace exámenes no representa a toda la población. → **Solución:** el informe lo dice abiertamente.
40. **PERO:** una alerta falsa puede dañar a un laboratorio o a una zona. → **Solución:** nunca se nombra a un laboratorio, y no se envían alertas automáticas. Una persona revisa.
41. **PERO:** duplicar el trabajo del Ministerio de Salud. → **Solución:** LABS **no reemplaza la notificación obligatoria**. Prepara un resumen que el laboratorio puede usar, y mantiene el canal con el MPPS como meta de la Etapa 2.
