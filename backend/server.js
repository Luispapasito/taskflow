const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

const dbPath = path.join(__dirname, 'data', 'taskflow.db');
const db = new sqlite3.Database(dbPath);

app.use(express.json());

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )`);
  });
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'TaskFlow API funcionando' });
});

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY id DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'No se pudieron consultar las tareas' });
    }

    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, description, status } = req.body;

  if (!title || String(title).trim() === '') {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  const now = new Date().toISOString();
  const task = {
    title: String(title).trim(),
    description: String(description || '').trim(),
    status: ['pending', 'in-progress', 'completed'].includes(status) ? status : 'pending',
    createdAt: now,
    updatedAt: now
  };

  db.run(
    `INSERT INTO tasks (title, description, status, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [task.title, task.description, task.status, task.createdAt, task.updatedAt],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'No se pudo crear la tarea' });
      }

      res.status(201).json({ id: this.lastID, ...task });
    }
  );
});

app.put('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, status } = req.body;

  if (!title || String(title).trim() === '') {
    return res.status(400).json({ message: 'El título es obligatorio' });
  }

  const updatedTask = {
    title: String(title).trim(),
    description: String(description || '').trim(),
    status: ['pending', 'in-progress', 'completed'].includes(status) ? status : 'pending',
    updatedAt: new Date().toISOString()
  };

  db.run(
    `UPDATE tasks
     SET title = ?, description = ?, status = ?, updatedAt = ?
     WHERE id = ?`,
    [updatedTask.title, updatedTask.description, updatedTask.status, updatedTask.updatedAt, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: 'No se pudo actualizar la tarea' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Tarea no encontrada' });
      }

      res.json({ id: Number(id), ...updatedTask });
    }
  );
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tasks WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ message: 'No se pudo eliminar la tarea' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Tarea no encontrada' });
    }

    res.json({ message: 'Tarea eliminada', id: Number(id) });
  });
});

initDb();

app.listen(PORT, () => {
  console.log(`TaskFlow API running at http://localhost:${PORT}`);
});
