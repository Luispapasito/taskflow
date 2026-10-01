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
const resendConfirmation = document.getElementById('resendConfirmation');
const authEmailField = document.getElementById('authEmailField');
const forgotPassword = document.getElementById('forgotPassword');
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

function authErrorMessage(error) {
  const message = error.message || '';
  if (/email not confirmed/i.test(message)) {
    resendConfirmation.classList.remove('hidden');
    return 'Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada o solicita otro enlace.';
  }
  if (/invalid login credentials/i.test(message)) {
    return 'Correo o contraseña incorrectos. Si acabas de registrarte, confirma primero el correo.';
  }
  return message || 'No se pudo completar la solicitud.';
}

function renderAuthMode() {
  const isSignUp = authMode === 'signup';
  const isRecovery = authMode === 'recovery';
  authTitle.textContent = isRecovery ? 'Cambiar contraseña' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión';
  authSubmit.textContent = isRecovery ? 'Actualizar contraseña' : isSignUp ? 'Registrarme' : 'Entrar';
  authToggle.textContent = isSignUp ? 'Ya tengo una cuenta' : 'Crear cuenta';
  authPassword.autocomplete = isSignUp || isRecovery ? 'new-password' : 'current-password';
  authEmailField.classList.toggle('hidden', isRecovery);
  authEmail.required = !isRecovery;
  authToggle.classList.toggle('hidden', isRecovery);
  forgotPassword.classList.toggle('hidden', authMode !== 'signin');
  resendConfirmation.classList.add('hidden');
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
    const result = authMode === 'recovery'
      ? await supabaseClient.auth.updateUser({ password: authPassword.value })
      : authMode === 'signup'
      ? await supabaseClient.auth.signUp({
        email: authEmail.value.trim(),
        password: authPassword.value,
        options: { emailRedirectTo: window.location.origin }
      })
      : await supabaseClient.auth.signInWithPassword({
        email: authEmail.value.trim(),
        password: authPassword.value
      });

    if (result.error) {
      throw result.error;
    }

    if (authMode === 'signup' && !result.data.session) {
      setAuthMessage('Cuenta creada. Confirma tu correo con el enlace que te enviamos antes de iniciar sesión.');
      resendConfirmation.classList.remove('hidden');
      return;
    }

    authForm.reset();
    if (authMode === 'recovery') {
      authMode = 'signin';
      renderAuthMode();
      showSession(result.data.user);
      await fetchTasks();
    } else {
      setAuthMessage('');
    }
  } catch (error) {
    setAuthMessage(authErrorMessage(error), true);
  } finally {
    authSubmit.disabled = false;
  }
});

forgotPassword.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  if (!email) {
    setAuthMessage('Escribe tu correo para recibir el enlace de recuperación.', true);
    authEmail.focus();
    return;
  }

  forgotPassword.disabled = true;
  try {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin
    });
    if (error) {
      throw error;
    }
    setAuthMessage('Si existe una cuenta con ese correo, enviaremos un enlace para cambiar la contraseña.');
  } catch (error) {
    setAuthMessage(authErrorMessage(error), true);
  } finally {
    forgotPassword.disabled = false;
  }
});

resendConfirmation.addEventListener('click', async () => {
  const email = authEmail.value.trim();
  if (!email) {
    setAuthMessage('Escribe tu correo para reenviar la confirmación.', true);
    authEmail.focus();
    return;
  }

  resendConfirmation.disabled = true;
  try {
    const { error } = await supabaseClient.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: window.location.origin }
    });
    if (error) {
      throw error;
    }
    setAuthMessage('Si la cuenta requiere confirmación, enviaremos un nuevo enlace al correo indicado.');
  } catch (error) {
    setAuthMessage(authErrorMessage(error), true);
  } finally {
    resendConfirmation.disabled = false;
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

  const recoveryRequested = window.location.hash.includes('type=recovery')
    || new URLSearchParams(window.location.search).get('type') === 'recovery';

  if (recoveryRequested) {
    authMode = 'recovery';
    showSession(null);
    renderAuthMode();
    setAuthMessage('Escribe una contraseña nueva para tu cuenta.');
  } else {
    showSession(data.session?.user);
  }

  if (data.session?.user && !recoveryRequested) {
    await fetchTasks();
  }

  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
      authMode = 'recovery';
      showSession(null);
      renderAuthMode();
      setAuthMessage('Escribe una contraseña nueva para tu cuenta.');
      return;
    }

    showSession(session?.user);
    if (session?.user) {
      fetchTasks().catch(error => alert(error.message || 'No se pudieron cargar las tareas.'));
    }
  });
}

renderAuthMode();
initialize().catch(error => setAuthMessage(error.message || 'No se pudo conectar con Supabase.', true));
