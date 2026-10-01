const { createClient } = window.supabase;
const { url, publishableKey } = window.TASKFLOW_SUPABASE;
const supabaseClient = createClient(url, publishableKey);

const authPanel = document.getElementById('authPanel');
const appShell = document.getElementById('appShell');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubmit = document.getElementById('authSubmit');
const authToggle = document.getElementById('authToggle');
const authMessage = document.getElementById('authMessage');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const currentUserEmail = document.getElementById('currentUserEmail');
const signOutButton = document.getElementById('signOutButton');
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
let authMode = 'signin';
let currentUser = null;

function statusLabel(status) {
  return {
    pending: 'Pendiente',
    'in-progress': 'En progreso',
    completed: 'Completada'
  }[status] || 'Pendiente';
}

function setAuthMessage(message, isError = false) {
  authMessage.textContent = message;
  authMessage.classList.toggle('error', isError);
}

function renderAuthMode() {
  const isSignUp = authMode === 'signup';
  authTitle.textContent = isSignUp ? 'Crear cuenta' : 'Iniciar sesión';
  authSubmit.textContent = isSignUp ? 'Registrarme' : 'Entrar';
  authToggle.textContent = isSignUp ? 'Ya tengo una cuenta' : 'Crear cuenta';
  authPassword.autocomplete = isSignUp ? 'new-password' : 'current-password';
  setAuthMessage('');
}

function showSession(user) {
  const signedIn = Boolean(user);
  currentUser = user || null;
  authPanel.classList.toggle('hidden', signedIn);
  appShell.classList.toggle('hidden', !signedIn);
  currentUserEmail.textContent = user?.email || '';

  if (!signedIn) {
    tasks = [];
    renderTasks();
    updateSummary();
    clearForm();
  }
}

async function fetchTasks() {
  const { data, error } = await supabaseClient
    .from('tasks')
    .select('id, title, description, status, created_at, updated_at')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  tasks = data;
  renderTasks();
  updateSummary();
}

function updateSummary() {
  totalTasks.textContent = tasks.length;
  pendingTasks.textContent = tasks.filter(task => task.status === 'pending').length;
}

function renderTasks() {
  const filteredTasks = tasks.filter(task => currentFilter === 'all' || task.status === currentFilter);

  if (filteredTasks.length === 0) {
    tasksList.innerHTML = '<div class="empty-state"><span>No hay tareas en esta vista</span></div>';
    return;
  }

  tasksList.innerHTML = filteredTasks.map(task => `
    <article class="task-card ${task.status}">
      <div class="task-main">
        <div class="task-top">
          <span class="status-tag ${task.status}">${statusLabel(task.status)}</span>
          <h3 class="task-title">${escapeHtml(task.title)}</h3>
        </div>
        <p class="task-description">${escapeHtml(task.description || 'Sin descripción')}</p>
        <div class="task-meta">Creada: ${new Date(task.created_at).toLocaleDateString()}</div>
      </div>
      <div class="task-actions">
        <button class="edit-btn" data-action="edit" data-id="${task.id}">Editar</button>
        <button class="delete-btn" data-action="delete" data-id="${task.id}">Eliminar</button>
      </div>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;')
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

authToggle.addEventListener('click', () => {
  authMode = authMode === 'signin' ? 'signup' : 'signin';
  renderAuthMode();
});

authForm.addEventListener('submit', async event => {
  event.preventDefault();
  authSubmit.disabled = true;
  setAuthMessage('Conectando...');

  try {
    const credentials = {
      email: authEmail.value.trim(),
      password: authPassword.value
    };
    const result = authMode === 'signup'
      ? await supabaseClient.auth.signUp({
        ...credentials,
        options: { emailRedirectTo: window.location.origin }
      })
      : await supabaseClient.auth.signInWithPassword(credentials);

    if (result.error) {
      throw result.error;
    }

    if (authMode === 'signup' && !result.data.session) {
      setAuthMessage('Cuenta creada. Revisa tu correo para confirmar el registro.');
      return;
    }

    authForm.reset();
    setAuthMessage('');
  } catch (error) {
    setAuthMessage(error.message || 'No se pudo iniciar sesión.', true);
  } finally {
    authSubmit.disabled = false;
  }
});

signOutButton.addEventListener('click', async () => {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    alert(error.message || 'No se pudo cerrar la sesión.');
  }
});

newTaskBtn.addEventListener('click', clearForm);
cancelEditBtn.addEventListener('click', clearForm);

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

  const taskId = taskIdInput.value;
  const query = taskId
    ? supabaseClient.from('tasks').update(payload).eq('id', taskId)
    : supabaseClient.from('tasks').insert({ ...payload, user_id: currentUser.id });
  const { error } = await query;

  if (error) {
    alert(error.message || 'No se pudo guardar la tarea.');
    return;
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

    const { error } = await supabaseClient.from('tasks').delete().eq('id', taskId);
    if (error) {
      alert(error.message || 'No se pudo eliminar la tarea.');
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

async function initialize() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    setAuthMessage(error.message, true);
  }

  showSession(data.session?.user);
  if (data.session?.user) {
    await fetchTasks();
  }

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    showSession(session?.user);
    if (session?.user) {
      fetchTasks().catch(error => alert(error.message || 'No se pudieron cargar las tareas.'));
    }
  });
}

renderAuthMode();
initialize().catch(error => setAuthMessage(error.message || 'No se pudo conectar con Supabase.', true));
