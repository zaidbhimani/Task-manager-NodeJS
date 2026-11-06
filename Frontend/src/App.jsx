import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL = 'http://localhost:3000/tasks'
const API_BASE_URL = 'http://localhost:3000'
const PAGE_SIZE = 5

async function readMutationResponse(response, fallbackMessage) {
  let result
  try {
    result = await response.json()
  } catch {
    throw new Error('The server returned an invalid response.')
  }

  if (!response.ok || !result?.success) {
    throw new Error(result?.message || fallbackMessage)
  }

  return result
}

function App() {
  const [view, setView] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [title, setTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [deleteCandidate, setDeleteCandidate] = useState(null)
  const [deletingTaskId, setDeletingTaskId] = useState(null)
  const [editingTaskId, setEditingTaskId] = useState(null)
  const [editingTitle, setEditingTitle] = useState('')
  const [updatingTaskId, setUpdatingTaskId] = useState(null)
  const [taskActionError, setTaskActionError] = useState('')
  const deleteTriggerRef = useRef(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [filterTitle, setFilterTitle] = useState('')
  const [filterCompleted, setFilterCompleted] = useState('all')
  const [appliedTitle, setAppliedTitle] = useState('')
  const [appliedCompleted, setAppliedCompleted] = useState('all')
  const [sortBy, setSortBy] = useState('created_at')
  const [order, setOrder] = useState('DESC')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!deleteCandidate) {
      deleteTriggerRef.current?.focus()
    }
  }, [deleteCandidate])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams({
      page: String(page),
      offset: String(PAGE_SIZE),
      sortBy,
      order,
    })

    if (appliedTitle.trim()) {
      params.set('title', appliedTitle.trim())
    }
    if (appliedCompleted !== 'all') {
      params.set('completed', appliedCompleted)
    }

    async function loadTasks() {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_URL}?${params}`, {
          signal: controller.signal,
        })
        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.message || 'Unable to load tasks.')
        }
        if (
          !Array.isArray(result.data) ||
          !Number.isInteger(result.meta?.totalCount) ||
          result.meta.totalCount < 0
        ) {
          throw new Error('The task list response was invalid.')
        }

        setTasks(result.data)
        setTotalCount(result.meta.totalCount)
        const totalPages = Math.max(1, Math.ceil(result.meta.totalCount / PAGE_SIZE))
        if (page > totalPages) {
          setPage(totalPages)
        }
      } catch (requestError) {
        if (requestError.name !== 'AbortError') {
          setError(requestError.message || 'Unable to load tasks.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadTasks()
    return () => controller.abort()
  }, [page, appliedTitle, appliedCompleted, sortBy, order, retryCount])

  async function createTask(event) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle || creating) {
      return
    }

    setCreating(true)
    setCreateError('')
    try {
      const response = await fetch(`${API_BASE_URL}/addTask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: trimmedTitle }),
      })
      const result = await readMutationResponse(response, 'Unable to create task.')

      if (!result.data || typeof result.data !== 'object') {
        throw new Error('The task response was invalid.')
      }

      setTitle('')
      setFilterTitle('')
      setFilterCompleted('all')
      setAppliedTitle('')
      setAppliedCompleted('all')
      setPage(1)
      setView('tasks')
      setRetryCount((count) => count + 1)
    } catch (requestError) {
      setCreateError(requestError.message || 'Unable to create task.')
    } finally {
      setCreating(false)
    }
  }

  async function updateTask(taskId, updates) {
    if (updatingTaskId !== null) {
      return false
    }

    setUpdatingTaskId(taskId)
    setTaskActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/updateTask/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const result = await readMutationResponse(response, 'Unable to update task.')
      if (!result.data || typeof result.data !== 'object') {
        throw new Error('The task response was invalid.')
      }

      setRetryCount((count) => count + 1)
      return true
    } catch (requestError) {
      setTaskActionError(requestError.message || 'Unable to update task.')
      return false
    } finally {
      setUpdatingTaskId(null)
    }
  }

  async function saveTaskTitle(event, taskId) {
    event.preventDefault()
    const trimmedTitle = editingTitle.trim()
    if (!trimmedTitle || updatingTaskId !== null) {
      return
    }

    if (await updateTask(taskId, { title: trimmedTitle })) {
      setEditingTaskId(null)
      setEditingTitle('')
    }
  }

  async function toggleTask(taskId, completed) {
    await updateTask(taskId, { completed })
  }

  async function confirmDeleteTask() {
    if (!deleteCandidate || deletingTaskId !== null) {
      return
    }

    const task = deleteCandidate
    setDeletingTaskId(task.id)
    setTaskActionError('')
    try {
      const response = await fetch(`${API_BASE_URL}/deleteTask/${task.id}`, {
        method: 'DELETE',
      })
      await readMutationResponse(response, 'Unable to delete task.')
      deleteTriggerRef.current = null
      setDeleteCandidate(null)
      setRetryCount((count) => count + 1)
    } catch (requestError) {
      setDeleteCandidate(null)
      setTaskActionError(requestError.message || 'Unable to delete task.')
    } finally {
      setDeletingTaskId(null)
    }
  }

  function applyFilters(event) {
    event.preventDefault()
    setPage(1)
    setAppliedTitle(filterTitle.trim())
    setAppliedCompleted(filterCompleted)
  }

  function clearFilters() {
    setFilterTitle('')
    setFilterCompleted('all')
    setAppliedTitle('')
    setAppliedCompleted('all')
    setPage(1)
  }

  function changeSort(column) {
    setPage(1)
    if (sortBy === column) {
      setOrder((currentOrder) => currentOrder === 'ASC' ? 'DESC' : 'ASC')
      return
    }
    setSortBy(column)
    setOrder(column === 'created_at' ? 'DESC' : 'ASC')
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE))
  const firstVisiblePage = Math.max(1, Math.min(page - 2, totalPages - 4))
  const visiblePages = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => firstVisiblePage + index,
  )
  const hasActiveFilters = Boolean(appliedTitle) || appliedCompleted !== 'all'

  function formatCreatedAt(value) {
    if (!value) {
      return '—'
    }
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#tasks"
          onClick={(event) => {
            event.preventDefault()
            setView('tasks')
          }}
          aria-label="Taskflow home"
        >
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="m5 12.5 4.2 4.2L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>Taskflow</span>
        </a>

        <p className="nav-heading">WORKSPACE</p>
        <nav className="primary-nav" aria-label="Main navigation">
          <button
            className={`nav-item${view === 'tasks' ? ' is-active' : ''}`}
            type="button"
            aria-current={view === 'tasks' ? 'page' : undefined}
            onClick={() => setView('tasks')}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span>Tasks</span>
          </button>
          <button
            className={`nav-item${view === 'create' ? ' is-active' : ''}`}
            type="button"
            aria-current={view === 'create' ? 'page' : undefined}
            onClick={() => setView('create')}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 5v14m-7-7h14"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <span>Create task</span>
          </button>
        </nav>

        <div className="sidebar-footer">A little progress, every day.</div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span className="breadcrumb">Workspace</span>
          <span className="topbar-status">
            <span className="status-dot" aria-hidden="true" />
            Personal space
          </span>
        </header>

        {view === 'tasks' ? (
          <section className="page-section" aria-labelledby="page-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h1 id="page-title">Tasks</h1>
                <p className="page-description">
                  Keep track of what needs to get done.
                </p>
              </div>
              <button
                className="button button-primary"
                type="button"
                onClick={() => setView('create')}
              >
                <span aria-hidden="true">+</span>
                Create task
              </button>
            </div>

            <form className="task-filters" onSubmit={applyFilters}>
              <label className="filter-field" htmlFor="filter-title">
                <span>Title</span>
                <input
                  id="filter-title"
                  type="search"
                  value={filterTitle}
                  onChange={(event) => setFilterTitle(event.target.value)}
                  placeholder="Search task titles"
                />
              </label>
              <label className="filter-field" htmlFor="filter-completed">
                <span>Completion</span>
                <select
                  id="filter-completed"
                  value={filterCompleted}
                  onChange={(event) => setFilterCompleted(event.target.value)}
                >
                  <option value="all">All</option>
                  <option value="true">Completed</option>
                  <option value="false">Pending</option>
                </select>
              </label>
              <div className="filter-actions">
                <button className="button button-primary" type="submit">
                  Apply
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={clearFilters}
                  disabled={!filterTitle && filterCompleted === 'all' && !hasActiveFilters}
                >
                  Clear
                </button>
              </div>
            </form>

            {taskActionError && (
              <div className="mutation-error" role="alert">
                {taskActionError}
              </div>
            )}

            {loading ? (
              <div className="list-message" role="status" aria-live="polite">
                <span className="loading-spinner" aria-hidden="true" />
                Loading tasks…
              </div>
            ) : error ? (
              <div className="list-message list-error" role="alert">
                <p>{error}</p>
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setRetryCount((count) => count + 1)}
                >
                  Retry
                </button>
              </div>
            ) : tasks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-illustration" aria-hidden="true">
                  <svg viewBox="0 0 64 64" fill="none">
                    <rect
                      x="11"
                      y="10"
                      width="42"
                      height="46"
                      rx="10"
                      fill="currentColor"
                      fillOpacity=".08"
                      stroke="currentColor"
                      strokeOpacity=".35"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M22 25h20M22 33h12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="m33 43 4 4 8-9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2>{hasActiveFilters ? 'No matching tasks' : 'No tasks yet'}</h2>
                <p>
                  {hasActiveFilters
                    ? 'Try changing your filters or clear them to see all tasks.'
                    : 'Your list is clear. Add a task to get started.'}
                </p>
                {hasActiveFilters ? (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </button>
                ) : (
                  <button
                    className="button button-secondary"
                    type="button"
                    onClick={() => setView('create')}
                  >
                    Create your first task
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="table-scroll-region" role="region" aria-label="Task results" tabIndex="0">
                  <table className="tasks-table">
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          aria-sort={sortBy === 'id' ? (order === 'ASC' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button
                            className="sort-button"
                            type="button"
                            onClick={() => changeSort('id')}
                          >
                            ID
                            <span aria-hidden="true">{sortBy === 'id' ? (order === 'ASC' ? '↑' : '↓') : '↕'}</span>
                          </button>
                        </th>
                        <th scope="col">Title</th>
                        <th scope="col">Completed</th>
                        <th
                          scope="col"
                          aria-sort={sortBy === 'created_at' ? (order === 'ASC' ? 'ascending' : 'descending') : 'none'}
                        >
                          <button
                            className="sort-button"
                            type="button"
                            onClick={() => changeSort('created_at')}
                          >
                            Created at
                            <span aria-hidden="true">{sortBy === 'created_at' ? (order === 'ASC' ? '↑' : '↓') : '↕'}</span>
                          </button>
                        </th>
                        <th scope="col">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task) => (
                        <tr className={task.completed ? 'is-completed' : ''} key={task.id}>
                          <td>{task.id}</td>
                          <td className="task-title-cell">
                            {editingTaskId === task.id ? (
                              <form
                                className="inline-edit-form"
                                onSubmit={(event) => saveTaskTitle(event, task.id)}
                              >
                                <input
                                  aria-label={`Title for ${task.title}`}
                                  type="text"
                                  value={editingTitle}
                                  onChange={(event) => setEditingTitle(event.target.value)}
                                  required
                                  pattern=".*\S.*"
                                  autoFocus
                                  disabled={updatingTaskId !== null}
                                />
                                <button
                                  className="button button-primary row-action"
                                  type="submit"
                                  disabled={updatingTaskId !== null}
                                >
                                  {updatingTaskId === task.id ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  className="button button-secondary row-action"
                                  type="button"
                                  disabled={updatingTaskId !== null}
                                  onClick={() => {
                                    setEditingTaskId(null)
                                    setEditingTitle('')
                                  }}
                                >
                                  Cancel
                                </button>
                              </form>
                            ) : (
                              <div className="task-title-content">
                                <span>{task.title}</span>
                                <button
                                  className="button button-secondary row-action"
                                  type="button"
                                  aria-label={`Edit ${task.title}`}
                                  disabled={updatingTaskId !== null || deletingTaskId !== null}
                                  onClick={() => {
                                    setTaskActionError('')
                                    setEditingTaskId(task.id)
                                    setEditingTitle(task.title)
                                  }}
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <input
                              id={`task-${task.id}`}
                              className="task-checkbox"
                              type="checkbox"
                              checked={task.completed}
                              onChange={(event) => toggleTask(task.id, event.target.checked)}
                              aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'completed'}`}
                              disabled={updatingTaskId !== null || deletingTaskId !== null}
                            />
                          </td>
                          <td>{formatCreatedAt(task.created_at)}</td>
                          <td>
                            <button
                              className="button button-secondary row-action"
                              type="button"
                              aria-label={`Delete ${task.title}`}
                              onClick={(event) => {
                                setTaskActionError('')
                                deleteTriggerRef.current = event.currentTarget
                                setDeleteCandidate(task)
                              }}
                              disabled={deletingTaskId !== null || updatingTaskId !== null}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <nav className="pagination" aria-label="Task list pages">
                  <span className="page-summary">
                    Page {page} of {totalPages}
                  </span>
                  <div className="page-controls">
                    <button
                      className="button button-secondary page-button"
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </button>
                    {visiblePages.map((pageNumber) => (
                      <button
                        className={`button page-number${pageNumber === page ? ' is-current' : ''}`}
                        key={pageNumber}
                        type="button"
                        aria-label={`Page ${pageNumber}`}
                        aria-current={pageNumber === page ? 'page' : undefined}
                        onClick={() => setPage(pageNumber)}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      className="button button-secondary page-button"
                      type="button"
                      onClick={() => setPage((currentPage) => currentPage + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                </nav>
              </>
            )}

            {deleteCandidate && (
              <div className="dialog-backdrop">
                <section
                  className="delete-dialog"
                  role="alertdialog"
                  aria-modal="true"
                  aria-labelledby="delete-dialog-title"
                  aria-describedby="delete-dialog-description"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape' && deletingTaskId === null) {
                      event.preventDefault()
                      setDeleteCandidate(null)
                      return
                    }
                    if (event.key === 'Tab') {
                      const buttons = event.currentTarget.querySelectorAll('button:not(:disabled)')
                      const firstButton = buttons[0]
                      const lastButton = buttons[buttons.length - 1]
                      if (event.shiftKey && document.activeElement === firstButton) {
                        event.preventDefault()
                        lastButton.focus()
                      } else if (!event.shiftKey && document.activeElement === lastButton) {
                        event.preventDefault()
                        firstButton.focus()
                      }
                    }
                  }}
                >
                  <h2 id="delete-dialog-title">Delete task?</h2>
                  <p id="delete-dialog-description">
                    “{deleteCandidate.title}” will be permanently deleted.
                  </p>
                  <div className="dialog-actions">
                    <button
                      className="button button-secondary"
                      type="button"
                      autoFocus
                      disabled={deletingTaskId !== null}
                      onClick={() => setDeleteCandidate(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className="button button-danger"
                      type="button"
                      disabled={deletingTaskId !== null}
                      onClick={confirmDeleteTask}
                    >
                      {deletingTaskId !== null ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>
                </section>
              </div>
            )}
          </section>
        ) : (
          <section className="page-section create-section" aria-labelledby="page-title">
            <div className="page-heading">
              <div>
                <p className="eyebrow">MAKE IT HAPPEN</p>
                <h1 id="page-title">Create task</h1>
                <p className="page-description">
                  Add one thing you want to get done.
                </p>
              </div>
            </div>

            <form className="create-form" onSubmit={createTask}>
              {createError && (
                <div className="mutation-error" role="alert">
                  {createError}
                </div>
              )}
              <label htmlFor="task-title">Task title</label>
              <input
                id="task-title"
                name="title"
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Plan the week"
                autoComplete="off"
                required
                pattern=".*\S.*"
              />
              <p className="field-hint">Keep it short and clear.</p>
              <div className="form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setView('tasks')}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit" disabled={creating}>
                  {creating ? 'Creating…' : 'Create task'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
