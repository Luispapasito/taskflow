const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const publicDir = path.join(__dirname, 'public');
const dataFile = path.join(__dirname, 'data', 'tasks.json');

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

function readTasks() {
  try {
    const raw = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
}

function writeTasks(tasks) {
  fs.writeFileSync(dataFile, JSON.stringify(tasks, null, 2));
}

function serveStatic(res, url) {
  const normalizedUrl = url === '/' ? '/index.html' : url;
  const safePath = path.normalize(normalizedUrl).replace(/^\.\.(\/|\\|$)/, '');
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { message: 'Acceso prohibido' });
    return;
  }

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8'
  };

  fs.readFile(filePath, (error, content) => {
    if (error) {
      sendJson(res, 404, { message: 'Archivo no encontrado' });
      return;
    }

    res.writeHead(200, {
      'Content-Type': contentTypes[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  if (req.url.startsWith('/api/tasks')) {
    if (req.url === '/api/tasks' && req.method === 'GET') {
      sendJson(res, 200, readTasks());
      return;
    }

    if (req.url === '/api/tasks' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const tasks = readTasks();
          const title = String(data.title || '').trim();
          const description = String(data.description || '').trim();
          const status = ['pending', 'in-progress', 'completed'].includes(data.status) ? data.status : 'pending';

          if (!title) {
            sendJson(res, 400, { message: 'El título es obligatorio' });
            return;
          }

          const task = {
            id: crypto.randomUUID(),
            title,
            description,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };

          tasks.push(task);
          writeTasks(tasks);
          sendJson(res, 201, task);
        } catch (error) {
          sendJson(res, 400, { message: 'Datos inválidos' });
        }
      });
      return;
    }

    const urlParts = req.url.split('/');
    const taskId = urlParts[3];

    if (req.method === 'PUT' && taskId) {
      let body = '';
      req.on('data', chunk => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = JSON.parse(body || '{}');
          const tasks = readTasks();
          const index = tasks.findIndex(task => task.id === taskId);

          if (index === -1) {
            sendJson(res, 404, { message: 'Tarea no encontrada' });
            return;
          }

          const title = String(data.title || '').trim();
          if (!title) {
            sendJson(res, 400, { message: 'El título es obligatorio' });
            return;
          }

          tasks[index] = {
            ...tasks[index],
            title,
            description: String(data.description || '').trim(),
            status: ['pending', 'in-progress', 'completed'].includes(data.status) ? data.status : tasks[index].status,
            updatedAt: new Date().toISOString()
          };

          writeTasks(tasks);
          sendJson(res, 200, tasks[index]);
        } catch (error) {
          sendJson(res, 400, { message: 'Datos inválidos' });
        }
      });
      return;
    }

    if (req.method === 'DELETE' && taskId) {
      const tasks = readTasks();
      const index = tasks.findIndex(task => task.id === taskId);

      if (index === -1) {
        sendJson(res, 404, { message: 'Tarea no encontrada' });
        return;
      }

      const [deleted] = tasks.splice(index, 1);
      writeTasks(tasks);
      sendJson(res, 200, { message: 'Tarea eliminada', task: deleted });
      return;
    }

    sendJson(res, 404, { message: 'Endpoint no encontrado' });
    return;
  }

  serveStatic(res, req.url);
});

server.listen(PORT, () => {
  console.log(`TaskFlow is running at http://localhost:${PORT}`);
});
