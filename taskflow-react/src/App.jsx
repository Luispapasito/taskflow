import { useMemo, useState } from 'react';
import { CalendarCheck, CheckCircle2, ClipboardEdit, Plus, Trash2, X } from 'lucide-react';

const initialTasks = [
  { id: 1, title: 'Planear sprint', description: 'Definir objetivos y entregables', status: 'pending' },
  { id: 2, title: 'Diseñar UI', description: 'Crear estructura visual', status: 'in-progress' },
  { id: 3, title: 'Revisar documento', description: 'Validar documentación final', status: 'completed' }
];

const emptyTask = {
  id: '',
  title: '',
  description: '',
  status: 'pending'
};

function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [task, setTask] = useState(emptyTask);
  const [filter, setFilter] = useState('all');

  const taskStats = useMemo(() => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === 'pending').length,
      completed: tasks.filter(t => t.status === 'completed').length
    };
  }, [tasks]);

  const visibleTasks = tasks.filter(item => filter === 'all' || item.status === filter);

  function handleSubmit(event) {
    event.preventDefault();

    if (!task.title.trim()) {
      return;
    }

    if (task.id) {
      setTasks(currentTasks =>
        currentTasks.map(item => item.id === task.id ? { ...item, title: task.title.trim(), description: task.description.trim(), status: task.status } : item)
      );
    } else {
      setTasks(currentTasks => [
        {
          id: Date.now(),
          title: task.title.trim(),
          description: task.description.trim(),
          status: task.status
        },
        ...currentTasks
      ]);
    }

    setTask(emptyTask);
  }

  function handleEdit(selectedTask) {
    setTask(selectedTask);
  }

  function handleDelete(taskId) {
    setTasks(currentTasks => currentTasks.filter(item => item.id !== taskId));
    if (task.id === taskId) {
      setTask(emptyTask);
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><CalendarCheck size={30} /></div>
          <span className="brand-name">TaskFlow</span>
        </div>

        <div className="nav-section">
          <div className="nav-label">Workspace</div>
          <div className="nav-item active">
            <CalendarCheck size={18} />
            <span>Mis tareas</span>
          </div>
        </div>

        <div className="stats-card">
          <div className="stats-title">Resumen</div>
          <div className="stats-grid">
            <div>
              <span className="stats-number">{taskStats.total}</span>
              <span className="stats-text">Total</span>
            </div>
            <div>
              <span className="stats-number">{taskStats.pending}</span>
              <span className="stats-text">Pendientes</span>
            </div>
            <div>
              <span className="stats-number">{taskStats.completed}</span>
              <span className="stats-text">Completadas</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <section className="topbar">
          <div>
            <span className="overline">Panel de tareas</span>
            <h1>TaskFlow</h1>
          </div>
          <button className="primary-button" onClick={() => setTask(emptyTask)}>
            <Plus size={18} /> Nueva tarea
          </button>
        </section>

        <section className="form-card">
          <div className="form-title">
            <span>{task.id ? 'Editar tarea' : 'Crear tarea'}</span>
            {task.id && (
              <button className="icon-button" onClick={() => setTask(emptyTask)}>
                <X size={16} />
              </button>
            )}
          </div>

          <form className="task-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <span className="field-label">Título</span>
                <input
                  type="text"
                  value={task.title}
                  placeholder="Ej. Revisar proyecto"
                  onChange={event => setTask({ ...task, title: event.target.value })}
                  required
                />
              </label>

              <label className="field">
                <span className="field-label">Estado</span>
                <select value={task.status} onChange={event => setTask({ ...task, status: event.target.value })}>
                  <option value="pending">Pendiente</option>
                  <option value="in-progress">En progreso</option>
                  <option value="completed">Completada</option>
                </select>
              </label>

              <label className="field full-field">
                <span className="field-label">Descripción</span>
                <textarea
                  rows="4"
                  value={task.description}
                  placeholder="Añade una descripción..."
                  onChange={event => setTask({ ...task, description: event.target.value })}
                />
              </label>
            </div>

            <div className="form-actions">
              {task.id && (
                <button type="button" className="secondary-button" onClick={() => setTask(emptyTask)}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="primary-button">
                <CheckCircle2 size={16} /> {task.id ? 'Actualizar tarea' : 'Guardar tarea'}
              </button>
            </div>
          </form>
        </section>

        <section className="tasks-section">
          <div className="tasks-heading">
            <div>
              <span className="section-kicker">Lista</span>
              <h2>Tareas</h2>
            </div>
            <div className="filters">
              {['all', 'pending', 'in-progress', 'completed'].map(filterName => (
                <button
                  key={filterName}
                  className={`filter-button ${filter === filterName ? 'active' : ''}`}
                  onClick={() => setFilter(filterName)}
                >
                  {filterName === 'all' ? 'Todas' : filterName === 'pending' ? 'Pendientes' : filterName === 'in-progress' ? 'En progreso' : 'Completadas'}
                </button>
              ))}
            </div>
          </div>

          <div className="task-list">
            {visibleTasks.length > 0 ? visibleTasks.map(item => (
              <article className="task-card" key={item.id}>
                <div className="task-content">
                  <div className="task-head">
                    <span className={`status-badge ${item.status}`}>{statusLabel(item.status)}</span>
                    <h3>{item.title}</h3>
                  </div>
                  <p>{item.description || 'Sin descripción'}</p>
                </div>

                <div className="task-actions">
                  <button className="edit-button" onClick={() => handleEdit(item)}>
                    <ClipboardEdit size={16} /> Editar
                  </button>
                  <button className="delete-button" onClick={() => handleDelete(item.id)}>
                    <Trash2 size={16} /> Eliminar
                  </button>
                </div>
              </article>
            )) : (
              <div className="empty-state">
                <CalendarCheck size={38} />
                <span>No hay tareas en esta vista</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function statusLabel(status) {
  return {
    pending: 'Pendiente',
    'in-progress': 'En progreso',
    completed: 'Completada'
  }[status] || 'Pendiente';
}

export default App;
