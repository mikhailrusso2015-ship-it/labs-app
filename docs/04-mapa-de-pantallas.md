# Mapa de pantallas del MVP (demo para inversores)

Regla de este MVP: **ninguna pantalla vacía y ningún botón que no haga nada**. Todo funciona con datos de ejemplo guardados en el navegador (no hay servidor todavía).

## Cuentas de ejemplo (clave de todas: `demo1234`, código de seguridad: `123456`)

| Quién | Correo | Qué puede hacer |
|---|---|---|
| Dueña y bioanalista del laboratorio | lab@demo.com | Todo el laboratorio, incluida la firma |
| Recepción del laboratorio | recep@demo.com | Crear órdenes y cobrar. No ve resultados ni dinero ni firma |
| Paciente | pat@demo.com | Sus resultados, QR, permisos |
| Médico | doc@demo.com | Pacientes que le dieron acceso |
| Superadministrador | adm@demo.com | Negocio de LABS. Nunca ve datos médicos |

## 0. Entrada (todos)

1. **Iniciar sesión**: correo + clave. 5 intentos malos bloquean 30 segundos.
2. **Código de seguridad** (segundo paso, 6 números). Se puede reenviar.
3. **Olvidé mi clave**: pide el correo, “envía” un enlace, pantalla para escribir la clave nueva (con medidor de fuerza).
4. **Crear cuenta de paciente**: datos, clave, aceptar términos y privacidad, código de verificación. Menores de 18 no pueden registrarse solos (se crean como dependientes).
5. **Atajos de demostración**: entrar como cada rol con un toque.
6. **Cabecera**: nombre y rol, campana de avisos, ayuda, cerrar sesión.
7. **Aviso de mantenimiento** (lo activa el superadmin y lo ven todos).

## 1. Laboratorio

Menú (según permisos): Resumen · **Nueva orden** · **Órdenes** · **Pacientes** · Exámenes y precios · Reportes · Red de laboratorios · Firma y sello · Mi equipo · **Mi suscripción** · **Configuración** · **Avisos** · **Soporte**

- **Nueva orden**: buscar paciente por cédula/nombre o con el **código QR** del paciente (se acepta una sola vez y vence en 5 minutos); elegir exámenes; ver total en dólares y en bolívares con las 4 tasas; método de pago; marcar pagado; crear. Sin QR, la orden queda “esperando confirmación del paciente”, que la confirma en su teléfono.
- **Órdenes**: filtros por estado y buscador. Por fila: cargar resultados, cobrar, ver resultado, anular (con motivo).
- **Cargar resultados**: un campo por examen, el sistema marca normal/alto/crítico al instante, bloquea valores imposibles, botones para rellenar casos de ejemplo. Revisar, llamar si es crítico, código del bioanalista, **firmar, sellar y enviar**. El paciente lo recibe de verdad en su cuenta.
- **Pacientes**: lista de los pacientes del laboratorio, historial de órdenes, nota interna. Nunca valores de otros laboratorios.
- **Exámenes y precios**: editar precios y costos, 4 formas de ver el precio, tasa propia. Agregar y quitar exámenes.
- **Reportes**: patrones por edad, meses, rentabilidad, descargar en archivo.
- **Red**: alertas aprobadas por LABS, participar o no en la red.
- **Firma y sello**: subir foto, detección, guardar.
- **Mi equipo**: invitar, cambiar rol, dar de baja y reactivar, reiniciar código del bioanalista.
- **Mi suscripción**: plan, vencimiento, historial de pagos, **reportar un pago** (referencia) que confirma el superadmin, cambiar plan, cancelar.
- **Configuración**: datos del laboratorio, sedes, horario, métodos de pago, aviso por WhatsApp (vista previa), exportar datos.

## 2. Paciente

Menú: Mis resultados · Mi código QR · Quién me vio · **Avisos** · **Mi perfil** · **Soporte**

- **Mis resultados** → detalle (barras, historial, recomendaciones con aviso de que decide un médico) → documento firmado, compartir con enlace temporal, **descargar**.
- **Mi QR**: cambia cada 5 minutos, un solo uso. Permisos del médico (dar/quitar). Dependientes (agregar, ver como).
- **Quién me vio**: registro que nadie puede borrar.
- **Avisos**: documento nuevo, **confirmar o rechazar una orden**, solicitudes de médicos (aceptar/rechazar).
- **Mi perfil**: datos y contacto, cambiar clave, preferencias de aviso, **modo discreto** (oculta los valores hasta tocar), descargar mis datos, borrar mi cuenta (se escribe BORRAR).

## 3. Médico

Menú: Mis pacientes · Solicitudes · **Pedir acceso** · **Avisos** · **Mi perfil** · **Soporte**

- **Pedir acceso**: cédula del paciente → le llega la solicitud; si la acepta, aparece en la lista.
- **Mi perfil**: datos, MPPS (estado “verificado”), clave, avisos. **Modo paciente** y volver.

## 4. Superadmin

Menú: Resumen · Laboratorios · **Usuarios** · **Pagos** · Claves · Alertas de la red · Planes · **Ajustes** · **Soporte (bandeja)** · Registro · **Avisos**

- **Usuarios**: buscar por cédula/correo, ver ficha sin datos médicos, enviar enlace de clave, suspender, reactivar.
- **Pagos**: pagos reportados por laboratorios; confirmar (lab pasa a “Al día”) o rechazar con motivo.
- **Planes**: editar precio y texto.
- **Ajustes**: tasas BCV y USDT con hora de actualización, aviso de mantenimiento, segundo aprobador, versión de términos.
- **Soporte (bandeja)**: todos los tickets, responder, respuestas rápidas, cambiar estado, cerrar.

## 5. Soporte técnico (todos los roles, una sola pantalla con pestañas)

- **Ayuda**: preguntas frecuentes por rol con buscador.
- **Chat**: asistente con respuestas de la ayuda; “hablar con una persona” crea un ticket.
- **Mis tickets**: crear (asunto, categoría, mensaje, aviso de no escribir datos médicos), ver hilo, responder, cerrar.
- **Estado del sistema**: servicios y últimos incidentes.
- **Legal**: términos, privacidad, versión de la aplicación.

## Lo que sigue siendo de ejemplo en este MVP

Los datos se guardan solo en el navegador, los códigos y los avisos por WhatsApp o correo son simulados, la lectura de PDF no existe, y la firma no es todavía una firma electrónica certificada. Todo esto se cambia por servicios reales en la versión de 6 a 8 semanas.

## 6. Tipos de resultado y catálogo del piloto

Cinco formas de entregar un resultado, que cubren todo el catálogo médico:

1. **Número con rango normal** (química, hormonas, hematología): semáforo y consejo básico. Siempre dice que el médico decide.
2. **Positivo / negativo / no concluyente** (infecciones, pruebas rápidas): con detalle opcional (especie, título, dilución).
3. **Cultivo con antibiograma**: bacteria y tabla de antibióticos (sirve / a veces / no sirve).
4. **Informe del especialista** con imagen (rayos X, eco, resonancia, tomografía, electros, EEG).
5. **Texto** (examen de orina, heces, grupo sanguíneo).

Reglas:
- **Notificación obligatoria** (dengue, malaria, Chagas, leishmaniasis, leptospirosis, tuberculosis, hepatitis A, sarampión…): si el resultado es positivo, el laboratorio debe marcar que avisó al Ministerio de Salud antes de enviar. LABS no avisa por él.
- **Resultado sensible** (VIH, hepatitis B y C, sífilis, clamidia, CD4, cultivo de flujo): el laboratorio marca que ofreció orientación al paciente. El aviso nunca dice el nombre del examen.
- **Paquetes** (perfiles): 14 de ejemplo con 15 % de descuento sobre la suma suelta; el laboratorio cambia el precio y crea los suyos.
- **Enfermedades tropicales en la red**: conteos juntos por zona y semana, con mínimo de 10 casos para mostrar el número y una etiqueta de tendencia (estable, subiendo, subiendo mucho).

Pantallas nuevas o ampliadas: Nueva orden (paquetes + buscador), Exámenes y precios (buscador, grupos, paquetes, alta de examen), Cargar resultados (positivo/negativo y cultivo), Red de laboratorios y Alertas de la red (tarjeta de enfermedades tropicales), vista del paciente (pruebas de infecciones y cultivos).

## 7. Camino completo del laboratorio y registro de pacientes

**Atender pacientes** (laboratorio y recepción), 6 pasos en orden: 1 Recibir al paciente (registrar, buscar, nueva orden) → 2 Esperando confirmación → 3 Tomar la muestra (tipo y rótulo confirmado) → 4 Cargar resultados (solo el bioanalista) → 5 Enviados (en el teléfono del paciente o entrega impresa si no tiene cuenta) → 6 Cobros pendientes.
Cada orden muestra su avance: Paciente, Orden y cobro, Confirmación, Muestra, Resultados, Firma y envío. No se pueden cargar resultados sin registrar la toma de muestra.

**Mis pacientes** (registro propio del laboratorio):
- Se guarda solo nombre, apellido y cédula. Edad y sexo son opcionales.
- Exige la casilla de autorización del paciente.
- La cédula sale oculta; "Ver cédula" la muestra y queda anotado en el registro de auditoría.
- Si la cédula ya tiene cuenta en LABS, no se revela quién es: se indica buscarla en Nueva orden y el paciente confirma desde su teléfono.
- Corregir datos (recepción y dueño) y Borrar datos (solo dueño; las órdenes quedan sin nombre).
- Historial de órdenes por paciente y nota interna. Solo ve su lista el personal de ese laboratorio.

**Teléfono:** cada rol abre un menú de botones; cada opción es una pantalla nueva con botón Atrás. Las pantallas largas se dividen en secciones que se abren al tocarlas. La hoja de resultados es tamaño carta y se ajusta al ancho.

## 8. Configuración, métodos de pago y atajos
- **Mi suscripción** ahora está dentro de **Configuración** (plan, vencimiento, reportar pago, cambiar plan, cancelar, historial). Ya no es una opción aparte del menú.
- **Métodos de pago del laboratorio**: agregar, editar, activar/apagar y quitar. Cada dato tiene un icono de dos hojas para copiarlo y un botón "Copiar todo". El paciente los ve en **Cómo pagar**.
- **Métodos de pago del superadmin** (Ajustes): los laboratorios los ven en Configuración, en "Cómo pagar mi suscripción a LABS", también con copiar.
- **Atajos de demostración**: cada rol tiene su tarjeta con una línea que explica qué hace (Recepción = atiende al paciente, crea la orden y cobra).

## 9. Inicio con gráficas, barra inferior y códigos QR

**Al entrar, cada usuario ve un panel con gráficas** (ya no una lista de botones):
- Laboratorio: ventas y costos por mes, exámenes más pedidos, estado de las órdenes, por cobrar.
- Recepción: solo conteos (órdenes de hoy, sin cobrar, esperando al paciente). No ve dinero.
- Paciente: su último examen (normal / a vigilar), su línea de glucosa, lo que tiene en curso y por pagar.
- Médico: pacientes con avisos, avisos por paciente, a quién atender primero.
- Superadmin: ingreso mensual, estado de los laboratorios, laboratorios con más exámenes, pendientes del día.

**Barra inferior (5 botones):** Inicio · botón de la izquierda según el rol · **QR al centro (flotando sobre una curva de la barra)** · **Menú** · **Yo**.
- **Menú** guarda todas las opciones de antes, agrupadas.
- **Yo** abre el perfil (y desde ahí, Configuración).
- **QR:** paciente = muestra su QR; laboratorio y recepción = abre la cámara y la planilla se llena con nombre, apellido, cédula, teléfono, correo y dirección; médico = escanea al paciente (recibe acceso) o muestra su QR. Superadmin = Pagos.
- Si no hay cámara: subir foto del QR o elegir a quién "escanear" (demostración).

**Pagos con QR:** el laboratorio sube un QR por método de pago. El paciente lo toca, se abre en su ventana con "Descargar QR" y "Escanear QR". Si espera resultados de varios laboratorios, en "Cómo pagar" elige primero el laboratorio.

**Plan:** un solo plan de $20 al mes.

## 10. Cambios de esta ronda (teléfono primero)

- **Catálogo y precios**: categorías que se abren y cierran; cada examen es una tarjeta que se abre al tocar su nombre (precio, costo, ganancia, moneda, entrega, quitar). Botones nuevos, más finos.
- **Selectores como pestañita desplegable** (misma idea en los tres): período del resumen (Hoy, Semana, Mes…), moneda para ver precios (Dólares, Bs·BCV, Bs·USDT, tasa propia) y tipo de orden en Órdenes (solo en teléfono).
- **Menú** rediseñado en filas con ícono. En teléfono las tablas son tarjetas que se abren al tocar: no hay scroll lateral. En PC no hay barra inferior, solo el menú lateral.
- **Atender pacientes** (laboratorio): 1 Recibir, 2 Cobrar, 3 Tomar la muestra, 4 Cargar resultados, 5 Enviados. **Primero se cobra y después se toma la muestra** (así funciona en Venezuela). Sin cobro no se puede tomar la muestra ni cargar resultados.
- **Mis pacientes** (laboratorio): lista simple; al tocar un nombre se abre su pantalla con Nueva orden, Historial, Ver cédula, Nota, Corregir y Borrar, más botón Atrás.
- **Médico → Mis pacientes → paciente**: cada examen va por separado (se abre al tocar). Desde ahí el médico puede **pedir repetir** un examen, **pedir otro examen** según el resultado y **recetar tratamiento** (varios medicamentos, dosis, cada cuánto, días, indicaciones). El paciente recibe un aviso en el teléfono, ve “Tu médico te pidió” en su Inicio y las recetas en **Menú → Mis recetas**.

### Ronda siguiente
- **Récipe del médico**: nuevo menú del médico **Firma y sello** (se carga una sola vez, igual que en el laboratorio: foto con firma y sello con el MPPS, LABS los detecta). Sin eso no se puede enviar una receta. El récipe sale en hoja carta con número RX, datos del paciente, diagnóstico, medicamentos (Rp/), firma, sello con MPPS y QR de verificación. El paciente lo ve en **Mis recetas → Ver récipe** y lo imprime o guarda en PDF. Los récipes ya enviados conservan la firma que tenían.
- **Selectores de pestañas en teléfono**: todos pasan a ser una sola pestañita desplegable (Soporte técnico, Mi perfil del paciente y del médico, opciones del QR del médico, además de período, moneda y tipo de orden). En PC siguen como botones. Cualquier selector nuevo hecho con la clase `seg` se convierte solo.
- **Pie "BY INSANITY MEDIA LLC® · All rights reserved"** en la pantalla de entrada, en Configuración y en Ajustes de LABS.
- **Órdenes**: al abrir una orden se ve la ficha completa del paciente (nombre, apellido, cédula, teléfono, correo, dirección, edad y sexo).
