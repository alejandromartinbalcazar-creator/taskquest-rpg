# ⚔️ FocusMission - Convierte tus tareas en misiones

App para gestionar tu vida, superar la procrastinación y fortalecer a tu héroe mediante tus tareas reales.

## 🚀 Cómo usarla e instalarla en tu Android (Sin sobrecargar tu laptop)

### 📲 Opción 1: Instalación Inmediata como App Nativa (PWA en tu móvil)
1. Con tu laptop y tu teléfono conectados a la misma red WiFi, abre en el navegador de tu celular:
   ```
   http://192.168.18.79:5173/
   ```
2. En el menú de opciones de Chrome / Brave (los 3 puntos `⋮` arriba a la derecha), pulsa **"Añadir a pantalla de inicio"** o **"Instalar aplicación"**.
3. ¡Listo! La app se instalará en tu pantalla principal con su propio ícono, modo de pantalla completa y almacenamiento offline permanente.

### ☁️ Opción 2: Compilación de APK en la Nube con GitHub Actions (0% de CPU/RAM de tu laptop)
El proyecto ya cuenta con el archivo `.github/workflows/build-apk.yml`.
1. Sube este proyecto a tu cuenta de GitHub (puede ser un repositorio privado).
2. GitHub ejecutará automáticamente el flujo de trabajo en sus servidores en la nube.
3. En la pestaña **Actions** de tu repositorio, podrás descargar directamente el archivo `FocusMission-debug.apk` para instalarlo en cualquier Android.

## Cuenta Google y copia en la nube (piloto)

FocusMission conserva el guardado local para jugar sin conexión. La cuenta Google es opcional y sincroniza una copia de personaje, tareas y mazmorras con una fila JSON por usuario en Supabase. Los cambios se agrupan antes de sincronizar y las políticas de Row Level Security limitan cada copia a su dueño.

Para activar el piloto:

1. Crea un proyecto Supabase en el plan Free y ejecuta `supabase/migrations/20261024000000_create_focusmission_saves.sql` desde el SQL Editor.
2. En **Authentication → Providers → Google**, activa Google e ingresa un OAuth Web Client ID y Client Secret creados en Google Cloud. La URI de retorno autorizada de Google será `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.
3. En **Authentication → URL Configuration**, agrega `com.taskquest.rpg://auth-callback` a las URLs permitidas. Para desarrollo web agrega también `http://localhost:5173/**`; cuando exista sitio público, agrega su dominio.
4. Crea `.env.local` a partir de `.env.example` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`. Para compilar con GitHub Actions, guarda esos mismos valores como los secretos `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` del repositorio.
5. En la pantalla de consentimiento de Google, deja la aplicación en modo **Testing** y añade tu cuenta como usuario de prueba mientras FocusMission sea piloto.

Nunca pongas el Google Client Secret ni una clave `service_role` en la app o en GitHub Actions. El cliente solo usa la clave publicable; RLS protege cada partida. Las credenciales aún deben configurarse antes de que el botón de Google pueda iniciar sesión. El plan Free de Supabase sirve para el piloto, aunque los proyectos gratuitos pueden pausarse tras una semana sin actividad.

---

## 🎮 Mecánicas Clave Implementadas

1. **Castigo Anti-Procrastinación:**
   - Cada tarea tiene una fecha y hora límite.
   - Si no la completas antes de que expire, tu héroe sufre **-15 HP de daño directo**.
   - **Cero botones de posponer:** La única forma de no sufrir daño es cumplir tus compromisos.
   - Si tu vida cae a 0, tu héroe queda agotado y no puede entrar a la mazmorra.

2. **Micro-Pasos Anti-Bloqueo:**
   - Botón para desglosar tareas grandes en micro-pasos de 3 a 5 minutos.
   - Temporizador de arranque rápido integrado para romper la inercia.

3. **Árbol de Habilidades & Santuario de Fusión:**
   - 4 Vías elementales: Fuego (Físico), Rayo (Disciplina), Tierra (Constancia) y Hielo (Mente).
   - Combina elementos en el Santuario:
     - 🔥 + ⚡ = **Plasma Tormentoso** (180% Crítico)
     - 🔥 + 🌍 = **Cataclismo de Magma** (Roca fundida + Escudo)
     - 🔥 + ❄️ = **Vapor Abrasador** (Ciega al oponente)
     - ⚡ + 🌍 = **Falla Electromagnética** (Aturdimiento)
     - ⚡ + ❄️ = **Superconductor Ártico** (Congelamiento)
     - 🌍 + ❄️ = **Bastión de Permafrost** (Defensa masiva)

4. **Mazmorras de la Inacción:**
   - Enfréntate al *Duende del "Lo hago luego"*, al *Espectro de las Redes Sociales* y al *Golem de la Indecisión*.
   - Solo puedes entrar con Llaves de Mazmorra, ganadas al completar tareas reales.

5. **Panel de Estadísticas Reales:**
   - Métricas de vida real: Profesional vs. Personal vs. Estudio vs. Salud.
