import { useEffect, useState, useCallback } from "react";
import "./App.css";

const VIEWS = {
  DASHBOARD: "dashboard",
  ADD_TASK: "add_task",
  SETTINGS: "settings",
  ABOUT: "about",
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState(VIEWS.DASHBOARD);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [addForm, setAddForm] = useState({ time: "", message: "" });
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchTasks = useCallback(() => {
    setIsRefreshing(true);
    return fetch("/tasks")
      .then((res) => res.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
      })
      .finally(() => {
        setTimeout(() => setIsRefreshing(false), 400);
      });
  }, []);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, [fetchTasks]);

  const handleDeleteTask = (id) => {
    fetch(`/tasks/${id}`, { method: "DELETE" })
      .then(() => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        setDeleteConfirm(null);
      })
      .catch((err) => console.error("Error deleting task:", err));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!addForm.time.trim() || !addForm.message.trim()) {
      setFormError("Please fill in all fields.");
      return;
    }

    fetch("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ time: addForm.time, message: addForm.message }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to create task");
        return res.json();
      })
      .then(() => {
        setFormSuccess("Task created successfully!");
        setAddForm({ time: "", message: "" });
        fetchTasks();
      })
      .catch(() => {
        setFormError("Failed to create task. Please try again.");
      });
  };

  const filteredTasks = tasks.filter(
    (t) =>
      t.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.message?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: tasks.length,
    running: tasks.filter((t) => t.status === "running").length,
    paused: tasks.filter((t) => t.status === "paused").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  return (
    <div className="app-layout">
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-header-title">Options</span>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${view === VIEWS.DASHBOARD ? "nav-item--active" : ""}`}
            onClick={() => setView(VIEWS.DASHBOARD)}
          >
            <MenuIcon />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-item ${view === VIEWS.ADD_TASK ? "nav-item--active" : ""}`}
            onClick={() => setView(VIEWS.ADD_TASK)}
          >
            <PlusIcon />
            <span>Add Task</span>
          </button>

          <button
            className={`nav-item ${view === VIEWS.SETTINGS ? "nav-item--active" : ""}`}
            onClick={() => setView(VIEWS.SETTINGS)}
          >
            <GearIcon />
            <span>Settings</span>
          </button>

          <button
            className={`nav-item ${view === VIEWS.ABOUT ? "nav-item--active" : ""}`}
            onClick={() => setView(VIEWS.ABOUT)}
          >
            <StarIcon />
            <span>About</span>
          </button>
        </nav>

        <button className="logout-btn" onClick={() => alert("Logged out")}>
          <LogoutIcon />
          <span>LOG OUT</span>
        </button>
      </aside>

      {/* ─── Main Content ─── */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div className="topbar-titles">
            {view === VIEWS.DASHBOARD && (
              <>
                <h1 className="page-title">DASHBOARD</h1>
                <p className="page-subtitle">Overview of all your scheduled tasks.</p>
              </>
            )}
            {view === VIEWS.ADD_TASK && <h1 className="page-title">ADD TASK</h1>}
            {view === VIEWS.SETTINGS && <h1 className="page-title">SETTINGS</h1>}
            {view === VIEWS.ABOUT && <h1 className="page-title">ABOUT</h1>}
          </div>
          <div className="topbar-actions">
            <button className="icon-circle-btn" title="Notifications">
              <BellIcon />
            </button>
            <button className="icon-circle-btn" title="Profile">
              <UserIcon />
            </button>
            <button
              className="add-task-topbar-btn"
              onClick={() => setView(VIEWS.ADD_TASK)}
            >
              <PlusIcon />
              <span>Add Task</span>
            </button>
          </div>
        </header>

        {/* ── DASHBOARD VIEW ── */}
        {view === VIEWS.DASHBOARD && (
          <>
            {/* Stats row */}
            <div className="stats-row">
              <div className="stat-card stat-card--blue">
                <div className="stat-icon-box stat-icon-box--blue">
                  <CalendarIcon />
                </div>
                <div className="stat-details">
                  <span className="stat-label">TOTAL TASKS</span>
                  <span className="stat-number stat-number--blue">{stats.total}</span>
                  <span className="stat-desc">All scheduled tasks</span>
                </div>
              </div>

              <div className="stat-card stat-card--green">
                <div className="stat-icon-box stat-icon-box--green">
                  <PlayIcon />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Running</span>
                  <span className="stat-number stat-number--green">{stats.running}</span>
                  <span className="stat-desc">Tasks currently running</span>
                </div>
              </div>

              <div className="stat-card stat-card--yellow">
                <div className="stat-icon-box stat-icon-box--yellow">
                  <PauseIcon />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Paused</span>
                  <span className="stat-number stat-number--yellow">{stats.paused}</span>
                  <span className="stat-desc">Tasks paused</span>
                </div>
              </div>

              <div className="stat-card stat-card--red">
                <div className="stat-icon-box stat-icon-box--red">
                  <StopIcon />
                </div>
                <div className="stat-details">
                  <span className="stat-label">Completed</span>
                  <span className="stat-number stat-number--red">{stats.completed}</span>
                  <span className="stat-desc">Tasks completed</span>
                </div>
              </div>
            </div>

            {/* Task List Panel */}
            <section className="task-panel">
              <div className="task-panel-banner">
                <span className="task-panel-banner-text">TASK LIST</span>
              </div>

              <div className="task-panel-toolbar">
                <h3 className="task-panel-title">Scheduled Tasks</h3>
                <div className="toolbar-controls">
                  <button
                    className={`refresh-btn${isRefreshing ? " refresh-btn--spinning" : ""}`}
                    onClick={fetchTasks}
                    title="Refresh tasks"
                  >
                    <RefreshIcon />
                    <span>Refresh</span>
                  </button>
                  <div className="search-box">
                    <SearchIcon />
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="task-table-wrapper">
                <table className="task-table">
                  <thead>
                    <tr className="task-table-header-row">
                      <th>ID</th>
                      <th>Time</th>
                      <th>Message</th>
                      <th>Counter</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          {searchQuery ? "No tasks match your search" : "No tasks yet"}
                        </td>
                      </tr>
                    ) : (
                      filteredTasks.map((task, i) => (
                        <tr
                          key={task.id}
                          className={`task-row ${i % 2 !== 0 ? "task-row--highlight" : ""}`}
                        >
                          <td className="task-cell task-cell--id">{task.id}</td>
                          <td className="task-cell task-cell--time">{task.time}</td>
                          <td className="task-cell task-cell--message">
                            {task.message?.length > 30
                              ? task.message.substring(0, 30) + "..."
                              : task.message}
                          </td>
                          <td className="task-cell task-cell--counter">{task.counter}</td>
                          <td className="task-cell task-cell--status">
                            <span className={`status-badge status-badge--${task.status}`}>
                              &lt;{task.status}&gt;
                            </span>
                          </td>
                          <td className="task-cell task-cell--action">
                            {deleteConfirm === task.id ? (
                              <div className="delete-confirm">
                                <button
                                  className="delete-confirm-yes"
                                  onClick={() => handleDeleteTask(task.id)}
                                >
                                  Yes
                                </button>
                                <button
                                  className="delete-confirm-no"
                                  onClick={() => setDeleteConfirm(null)}
                                >
                                  No
                                </button>
                              </div>
                            ) : (
                              <button
                                className="delete-btn"
                                onClick={() => setDeleteConfirm(task.id)}
                                title="Delete task"
                              >
                                <TrashIcon />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {/* ── ADD TASK VIEW ── */}
        {view === VIEWS.ADD_TASK && (
          <section className="task-panel">
            <div className="task-panel-banner">
              <span className="task-panel-banner-text">NEW TASK</span>
            </div>
            <div className="add-task-wrapper">
              <form className="add-task-form" onSubmit={handleAddTask}>
                <div className="form-group">
                  <label className="form-label">Interval</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 5s, 10m, 1h"
                    value={addForm.time}
                    onChange={(e) => setAddForm({ ...addForm, time: e.target.value })}
                  />
                  <span className="form-hint">
                    Format: 5s (seconds) · 10m (minutes) · 1h (hours)
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="Enter task message..."
                    value={addForm.message}
                    onChange={(e) =>
                      setAddForm({ ...addForm, message: e.target.value })
                    }
                  />
                </div>

                {formError && <p className="form-feedback form-feedback--error">{formError}</p>}
                {formSuccess && <p className="form-feedback form-feedback--success">{formSuccess}</p>}

                <div className="form-btn-row">
                  <button
                    type="button"
                    className="form-btn form-btn--cancel"
                    onClick={() => {
                      setView(VIEWS.DASHBOARD);
                      setFormError("");
                      setFormSuccess("");
                      setAddForm({ time: "", message: "" });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="form-btn form-btn--submit">
                    <PlusIcon />
                    <span>Create Task</span>
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        {/* ── SETTINGS VIEW ── */}
        {view === VIEWS.SETTINGS && (
          <section className="task-panel">
            <div className="task-panel-banner">
              <span className="task-panel-banner-text">SETTINGS</span>
            </div>
            <div className="placeholder-view">
              <GearIcon size={64} />
              <p className="placeholder-text">Settings panel coming soon.</p>
            </div>
          </section>
        )}

        {/* ── ABOUT VIEW ── */}
        {view === VIEWS.ABOUT && (
          <section className="task-panel">
            <div className="task-panel-banner">
              <span className="task-panel-banner-text">ABOUT</span>
            </div>
            <div className="placeholder-view">
              <StarIcon size={64} />
              <p className="placeholder-text">Task Scheduler Dashboard</p>
              <p className="placeholder-subtext">v1.0 · Cyberpunk Edition</p>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

/* ─── SVG Icon Components ─── */

function MenuIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="8" x2="21" y2="8" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="16" x2="21" y2="16" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function GearIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function StarIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1734F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00FF6A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFCC00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <rect x="9" y="9" width="6" height="6" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9D9D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9D9D9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF0016" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

export default App;
