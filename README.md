# LABS

Resultados de laboratorio para pacientes, laboratorios y médicos. Piloto en Venezuela.

**Demo en vivo (sirve en Android, Windows, Mac y iPhone):** https://mikhailrusso2015-ship-it.github.io/labs-app/demo/

## Cuentas de la demo

| Quién | Correo | Clave |
|---|---|---|
| Laboratorio (dueña y bioanalista) | lab@demo.com | demo1234 |
| Recepción del laboratorio | recep@demo.com | demo1234 |
| Paciente | pat@demo.com | demo1234 |
| Médico | doc@demo.com | demo1234 |
| Superadministrador | adm@demo.com | demo1234 |

Código de seguridad (segundo paso): `123456`. También hay botones de atajo en la pantalla de entrada.

## Qué trae

- 5 tipos de resultado: números con rango normal, positivo/negativo, cultivo con antibiograma, informe del especialista (rayos X, eco, resonancia, tomografía, electros) y texto.
- Catálogo del piloto en Venezuela: enfermedades tropicales (dengue, malaria, Chagas, leishmaniasis, leptospirosis, tuberculosis, hongos, parásitos) y 14 paquetes (Perfil 20, prenatal, preoperatorio, dengue, fiebre tropical, ITS…).
- Alertas de la red por zona con conteos juntos, sin nombres (mínimo 10 casos para mostrar un número).
- Todo funciona con datos de ejemplo: nada es real y nada sale del navegador.

## Documentos

- `demo/`: la demo para inversores. Se abre en el navegador.
- `docs/01-ataque-y-defensa-parte-A.md` y `parte-B.md`: los "peros" encontrados y cómo se resuelven.
- `docs/02-privacidad-y-estadisticas.md`: cómo se protege la identidad en las estadísticas.
- `docs/03-alcance-del-mvp.md`: qué se muestra y qué se construye primero.
- `docs/04-mapa-de-pantallas.md`: mapa de todas las pantallas y botones.

- Inicio con gráficas por tipo de usuario, barra inferior con botón QR (escáner con cámara), QR en métodos de pago y plan único de $20.
