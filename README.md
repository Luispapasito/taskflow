# TaskFlow

TaskFlow es una aplicación web sencilla para crear, ver, editar y eliminar tareas.

## ¿Qué permite hacer?

- Crear nuevas tareas con título, descripción y estado.
- Ver todas las tareas en una lista.
- Editar el contenido de una tarea.
- Eliminar tareas que ya no necesites.
- Filtrar tareas por estado: todas, pendientes, en progreso o completadas.

## Cómo ejecutar la aplicación

1. Abre una terminal en la carpeta del proyecto.
2. Ejecuta el comando:

```bash
npm start
```

3. Abre tu navegador en:

http://localhost:3000

## Estructura del proyecto

- `server.js`: servidor local HTTP para API y archivos estáticos.
- `public/index.html`: página principal.
- `public/styles.css`: estilos visuales.
- `public/app.js`: lógica de la interfaz.
- `data/tasks.json`: almacenamiento local de las tareas.
