# LABS · Alcance del MVP

Tres etapas. Cada una se puede mostrar y vender por separado.

## Etapa 0 · Demo para inversores (esta entrega)
Todo se ve y se usa, con datos de ejemplo claramente marcados. Corre en el navegador, sin servidor.

- Laboratorio: panel, escanear paciente, enviar resultado, **firma y sello por foto** (funciona de verdad en el navegador), catálogo con precios y **cuatro tasas** (BCV, USDT, manual y la que elija), facturación y ganancia, meses fuertes y flojos, exámenes más pedidos por edad.
- Paciente: confirmar examen, mi usuario LABS, resultados con **margen normal dibujado**, recomendaciones por reglas, PDF firmado y sellado, compartir.
- Médico: panel de pacientes con permiso con vencimiento.
- Superadministrador: laboratorios clientes, planes, pagos, uso, **reinicio de clave por enlace**, estado del sistema.
- Red: alertas de posibles brotes con grupos mínimos y sin nombres.

Se marca como "ejemplo" todo lo que todavía no es real: tasas en vivo, WhatsApp, cobros, alertas con pocos datos.

## Etapa 1 · Piloto con 1 a 3 laboratorios (lo primero que se construye de verdad)
- Inicio de sesión real, base de datos real, cifrado de campos de salud.
- Flujo por orden completo (QR, últimos 3 dígitos de cédula, confirmación del paciente, etiqueta del tubo).
- El laboratorio sube su PDF ya firmado o usa una plantilla simple. La lectura automática de valores se activa **solo después de medir errores** y siempre con confirmación de cada número.
- Sin conexión en el mostrador. Exportar todo. Registro de accesos.
- Valores críticos con llamada anotada, exámenes delicados retenidos, correcciones con versiones.
- El paciente abre su resultado con un enlace seguro, sin instalar nada.
- Rangos normales que pone el laboratorio. Valores críticos con aviso al laboratorio.
- PDF con firma y sello como imagen + **código QR de verificación** en el PDF.
- Aviso por WhatsApp sin datos de salud.
- Catálogo, precios, tasa BCV (con respaldo manual) y tasa congelada en cada orden.
- Superadministrador con planes y registro de accesos.

## Etapa 2 · Crecer
- Médicos verificados con Colegio de Médicos.
- Firma electrónica certificada (proveedor acreditado ante SUSCERTE) para quien la necesite.
- Conexión con las máquinas / sistemas del laboratorio.
- Estadísticas de red y alertas, cuando haya **5 o más laboratorios** y una persona que revise cada alerta.
- Cobro automático de suscripción.

## Lo que queda fuera por ahora (y por qué)
- **Diagnósticos o "inteligencia" que opine sobre enfermedades.** Solo reglas simples y revisadas por un médico.
- **Pagos entre paciente y laboratorio.** Complica lo legal y los impuestos.
- **Historial clínico completo.** LABS muestra resultados de laboratorio, no es un expediente médico.
- **Alertas a la población.** Solo señales para laboratorios y para quien administra.
