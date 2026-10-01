const apiUrl = '/api/tasks';

const form = document.getElementById('taskForm');
const formTitle = document.getElementById('formTitle');
const titleInput = document.getElementById('title');
const descriptionInput = document.getElementById('description');
const statusInput = document.getElementById('status');
const taskIdInput = document.getElementById('taskId');
const tasksList = document.getElementById('tasksList');
const totalTasks = document.getElementById('totalTasks');
const pendingTasks = document.getElementById('pendingTasks');
const cancelEditBtn = document.getElementById('cancelEdit');
const newTaskBtn = document.getElementById('newTaskBtn');
const filterButtons = Array.from(document.querySelectorAll('[data-filter]'));

let tasks = [];
let currentFilter = 'all';

function statusLabel(status) {
  return {
    'pending': 'Pendiente',
    'in-progress': 'En progreso',
    'completed': 'Completada'
  }[status] || 'Pendiente';
}

function statusClass(status) {
  return status;
}

async function fetchTasks() {
  const response = await fetch(apiUrl);
  tasks = await response.json();
  renderTasks();
  updateSummary();
}

function updateSummary() {
  totalTasks.textContent = tasks.length;
  pendingTasks.textContent = tasks.filter(task => task.status === 'pending').length;
}

function renderTasks() {
  const filteredTasks = tasks.filter(task => {
    return currentFilter === 'all' || task.status === currentFilter;
  });

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = `<div class="empty-state"><span>No hay tareas en esta vista</span></div>`;
    return;
  }

  tasksList.innerHTML = filteredTasks.map(task => `
    <article class="task-card ${statusClass(task.status)}">
      <div class="task-main">
        <div class="task-top">
          <span class="status-tag ${task.status}">${statusLabel(task.status)}</span>
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
        </div>
        <p class="task-description">${escapeHtml(task.description || 'Sin descripción')}</p>
        <div class="task-meta">Creada: ${new Date(task.createdAt).toLocaleDateString()}</div>
      </div>
      <div class="task-actions">
        <button class="edit-btn" data-action="edit" data-id="${task.id}">Editar</button>
        <button class="delete-btn" data-action="delete" data-id="${task.id}">Eliminar</button>
      </div>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return value.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(item => item.classList.toggle('active', item === button));
    currentFilter = button.dataset.filter;
    renderTasks();
  });
});

newTaskBtn.addEventListener('click', () => {
  clearForm();
});

cancelEditBtn.addEventListener('click', () => {
  clearForm();
});

form.addEventListener('submit', async event => {
  event.preventDefault();

  const payload = {
    title: titleInput.value.trim(),
    description: descriptionInput.value.trim(),
    status: statusInput.value
  };

  if (!payload.title) {
    alert('El título es obligatorio');
    return;
  }

  const isEditing = Boolean(taskIdInput.value);

  if (isEditing) {
    const response = await fetch(`${apiUrl}/${taskIdInput.value}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'No se pudo actualizar la tarea');
      return;
    }
  } else {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'No se pudo crear la tarea');
      return;
    }
  }

  clearForm();
  await fetchTasks();
});

tasksList.addEventListener('click', async event => {
  const target = event.target;
  if (!target.matches('button')) {
    return;
  }

  const taskId = target.dataset.id;
  const action = target.dataset.action;

  if (action === 'delete') {
    if (!confirm('¿Deseas eliminar esta tarea?')) {
      return;
    }

    const response = await fetch(`${apiUrl}/${taskId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const error = await response.json();
      alert(error.message || 'No se pudo eliminar la tarea');
      return;
    }

    await fetchTasks();
  }

  if (action === 'edit') {
    const task = tasks.find(item => item.id === taskId);
    if (!task) {
      return;
    }

    taskIdInput.value = task.id;
    titleInput.value = task.title;
    descriptionInput.value = task.description || '';
    statusInput.value = task.status;
    formTitle.textContent = 'Editar tarea';
    cancelEditBtn.classList.remove('hidden');
  }
});

function clearForm() {
  form.reset();
  taskIdInput.value = '';
  statusInput.value = 'pending';
  formTitle.textContent = 'Crear tarea';
  cancelEditBtn.classList.add('hidden');
}

fetchTasks();
