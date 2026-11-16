# Diseño: Dashboard web para el servidor Create+

## Intención y por qué

Dar una forma visual, más cómoda que la terminal, de ver y controlar el
servidor de Minecraft Create+ (que vive en una VM de Oracle Cloud Free
Tier, documentada en el repo hermano `D:\Minecraft Server`): estado,
jugadores, log en vivo, uso de CPU/RAM, y los mismos controles que ya
existen en el CLI `mc-ctl` (start/stop/restart/backups/horario). Sirve
además como pieza de portafolio del usuario, por lo que el repo de este
proyecto es público.

## Goals

- Página única (home) que muestra: estado del servicio, jugadores
  conectados, log en vivo, gráficas de CPU/RAM.
- Botones de control: start, stop, restart, backup-now, backup-offsite,
  activar/desactivar horario automático.
- Login con sesión: un único usuario admin, contraseña hasheada
  (bcrypt), cookie de sesión httponly firmada — sin tokens en
  localStorage, sin proveedores externos de auth.
- Todo alojado en la misma VM que ya corre Minecraft (backend + frontend
  juntos, servidos detrás de Caddy con HTTPS).
- Repo separado (`mc-create-plus-dashboard`), **público**, sin ningún
  secreto ni IP real commiteados — todo lo sensible vive solo en la VM
  como variables de entorno.
- CI/CD con GitHub Actions: cada push a `main` despliega solo el código
  (no la infraestructura) a la VM y reinicia el servicio del dashboard.

## Non-goals

- Gestión de mods desde la web (ya se decidió posponer esa idea).
- Múltiples usuarios/roles — un solo admin por ahora.
- Historial de métricas persistente entre reinicios del propio
  dashboard (v1 guarda solo las últimas ~1-2 horas en memoria).
- Reemplazar el CLI `mc-ctl` — el dashboard es un frente visual
  adicional, el CLI sigue existiendo igual.
- Alojar el frontend en un proveedor externo (Firebase/Vercel/etc.) —
  decidido en conversación: todo vive en la VM.

## Anti-goals

- Que el dashboard degrade el rendimiento o la estabilidad del
  servidor de Minecraft.
- Que el repo público filtre secretos, la IP real de la VM, o
  contraseñas/hashes.
- Que la autenticación sea débil o mal implementada (siendo lo único
  que protege el control del servidor desde internet).

## Constraints

- La VM tiene 4 OCPU / ~19GB RAM totales; el JVM de Minecraft puede
  usar hasta 18GB bajo carga (`-Xmx18G`, ver diseño del proyecto de
  infraestructura). El dashboard debe mantenerse liviano (backend +
  proxy ~150-250MB de RAM) para no competir por memoria.
- HTTPS requiere un nombre de dominio (no se puede sacar certificado
  válido para una IP pelada) — se usa `163-192-138-1.nip.io`, gratis y
  sin registro.
- El repo es público: ningún secreto (usuario/contraseña, IP, tokens)
  puede vivir en el código. Todo se configura vía variables de entorno
  en la VM, fuera de git.
- El workflow de GitHub Actions necesita una llave SSH propia (no la
  que ya usa esta sesión para administrar la VM), guardada como Secret
  de GitHub, con permisos acotados a lo que el deploy necesita.

## Approaches consideradas

1. **Todo en la VM (Caddy + FastAPI + frontend estático), repo público
   separado con CI/CD por Actions** (elegida). Un solo lugar que
   controla el usuario, sin cuentas nuevas de terceros, login propio
   simple y suficiente para 1-2 personas.
2. Frontend en Firebase Hosting/Vercel/Cloudflare Pages + backend en la
   VM — descartada: la sesión por cookie entre dominios distintos
   (`SameSite=None`) es más frágil (navegadores/extensiones la
   bloquean cada vez más), y no aporta nada real dado que ya se
   descartó usar la autenticación nativa de esos proveedores.
3. Backend en Cloud Functions de Firebase que hace SSH a la VM —
   descartada en la conversación: exige sacar la llave SSH de la VM
   hacia un tercero, y el log en vivo no encaja bien con el modelo de
   ejecución de Functions.

## Decisiones ya tomadas (el "cómo")

- **Backend**: FastAPI (Python), reutiliza el Python ya presente en la
  VM. WebSocket para el log en vivo, endpoint REST para status/
  jugadores/métricas, endpoints POST para cada acción de control
  (reusan los mismos scripts `mc-ctl`/`03-backup-local.sh`/etc. del
  repo de infraestructura, invocados vía subprocess con los permisos
  mínimos necesarios).
- **Frontend**: una sola página HTML + JS plano (sin framework), servida
  como estático por el propio backend o por Caddy directamente.
- **Proxy/HTTPS**: Caddy delante del backend, certificado automático
  (Let's Encrypt) sobre `163-192-138-1.nip.io`.
- **Auth**: un usuario admin (username + bcrypt hash de la contraseña,
  ambos como variables de entorno en la VM), sesión via cookie firmada
  httponly+secure (Starlette `SessionMiddleware` o equivalente).
- **Métricas**: proceso en background dentro del propio backend que
  muestrea cada ~10s, vía `psutil`, tanto el uso **global de la VM**
  (CPU/RAM) como el del **proceso Java de Minecraft específicamente**
  (ambos son baratos de leer — no requieren permisos elevados, los
  stats de cualquier proceso en `/proc` son de lectura pública en
  Linux). Se guarda un buffer en memoria de la última ~1-2 horas; se
  pierde al reiniciar el proceso (aceptado como limitación de v1).
- **Permisos del backend sobre el servicio de Minecraft**: el backend
  del dashboard corre como un usuario de sistema propio y sin
  privilegios (`dashboard`, separado de `mcserver`), con una regla de
  `sudoers` acotada (`/etc/sudoers.d/dashboard`) que permite, sin
  contraseña, **únicamente**:
  `systemctl {start,stop,restart,status} mc-create-plus` y
  `journalctl -u mc-create-plus *`. Nunca sudo general. Si el backend
  es comprometido, el radio de daño se limita a esas dos acciones
  sobre ese único servicio.
- **Protección de login**: límite simple de intentos (ej. 5 intentos
  fallidos por IP → bloqueo de 15 minutos), en memoria, suficiente para
  un dashboard de 1 usuario con endpoint de login públicamente
  conocido (repo público).
- **IP de la VM**: ya es una IP pública **reservada** (fija, no
  efímera) — confirmado en el proyecto de infraestructura hermano —
  así que `163-192-138-1.nip.io` no se rompe con un reinicio de la VM.
- **Repo**: `mc-create-plus-dashboard`, público, creado en
  `D:\mc-dashboard`. Contiene backend + frontend + el workflow de
  Actions. No contiene la IP real de la VM, usuario/contraseña, ni
  ninguna llave — esos valores se configuran directamente en la VM
  (archivo `.env` no versionado) y como Secrets de GitHub para el
  workflow de deploy.
- **CI/CD**: GitHub Actions, trigger en push a `main`: conecta por SSH
  (llave dedicada, guardada como Secret) a la VM, copia el código
  nuevo, reinicia el servicio systemd del dashboard. No toca la
  infraestructura de Minecraft en sí.
- **Gestión del proceso en la VM**: servicio systemd propio para el
  dashboard (separado del de Minecraft), igual que el resto del
  proyecto de infraestructura.

## Qué queda para el plan de implementación

- Estructura exacta de archivos del repo (backend/frontend/workflow).
- Lista exacta de endpoints de la API y su contrato.
- Esquema exacto de la página (layout del home: dónde van botones, log,
  gráficas).
- Nombre y contenido exacto de las variables de entorno.
- Contenido exacto del Caddyfile y del unit de systemd del dashboard.
- Contenido exacto del workflow de GitHub Actions (pasos, secrets
  usados, qué copia y cómo reinicia el servicio).
- Cómo se genera y registra la llave SSH dedicada para Actions en la
  VM (`authorized_keys` con restricciones si aplica).
- Pruebas end-to-end: login, cada botón de control, log en vivo,
  gráficas actualizándose, y un push de prueba disparando el deploy
  por Actions.
