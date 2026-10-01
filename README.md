# TaskFlow

TaskFlow es una aplicación web sencilla para crear, ver, editar y eliminar tareas.

## ¿Qué permite hacer?

- Crear nuevas tareas con título, descripción y estado.
- Ver todas las tareas en una lista.
- Editar el contenido de una tarea.
- Eliminar tareas que ya no necesites.
- Filtrar tareas por estado: todas, pendientes, en progreso o completadas.

## Cómo ejecutar la aplicación

La app principal guarda las tareas en Supabase y requiere conexión a internet.

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta:

```bash
npm start
```

3. Abre tu navegador en:

http://localhost:3000

## Persistencia y cuentas

Las tareas se guardan en `public.tasks` en Supabase. Para usarlas, crea una cuenta desde la página o inicia sesión. Cada cuenta solo puede consultar, editar y eliminar sus propias tareas mediante Row Level Security (RLS).

La configuración del proyecto está en `public/supabase-config.js`. Contiene la URL y la clave publicable de Supabase, que puede estar en el cliente porque las políticas RLS protegen los datos. No agregues claves secretas ni `service_role` al navegador.

Supabase Auth tiene habilitada la confirmación de correo. Tras registrarte, confirma el enlace recibido antes de iniciar sesión; la página permite solicitar que lo reenvíen. Si no recuerdas la contraseña, usa “Olvidé mi contraseña”. En producción, agrega tanto el dominio público como `http://localhost:3000/**` a Authentication > URL Configuration > Redirect URLs.

## Otras variantes

- `backend/`: API Express con base de datos SQLite local.
- `taskflow-react/`: prototipo React/Vite independiente; todavía no usa la autenticación de Supabase.

## Estructura del proyecto

- `server.js`: servidor local HTTP para API y archivos estáticos.
- `public/index.html`: página principal.
- `public/styles.css`: estilos visuales.
- `public/app-supabase.js`: autenticación y lógica de tareas conectada a Supabase.
- `data/tasks.json`: archivo local de la versión anterior, excluido de Git.
