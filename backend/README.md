# Backend TaskFlow

Este backend simple de TaskFlow permite crear, consultar, actualizar y eliminar tareas usando Node.js, Express y SQLite.

## Requisitos

- Node.js instalado en tu equipo.
- Una terminal para ejecutar comandos.

## Instalación

1. Abre una terminal dentro de la carpeta `backend`.
2. Ejecuta:

```bash
npm install
```

## Ejecutar la API

1. En la misma terminal, ejecuta:

```bash
npm start
```

2. La API quedará disponible en:

http://localhost:3001

## Endpoints

### Crear tarea

```http
POST /api/tasks
```

Cuerpo:

```json
{
  "title": "Estudiar Express",
  "description": "Leer la documentación",
  "status": "pending"
}
```

### Consultar tareas

```http
GET /api/tasks
```

### Actualizar tarea

```http
PUT /api/tasks/:id
```

Cuerpo:

```json
{
  "title": "Estudiar Express",
  "description": "Leer la documentación",
  "status": "completed"
}
```

### Eliminar tarea

```http
DELETE /api/tasks/:id
```

## Estructura

- `server.js`: crea el servidor Express y conecta SQLite.
- `data/taskflow.db`: base de datos local.
- `package.json`: dependencias y scripts.
