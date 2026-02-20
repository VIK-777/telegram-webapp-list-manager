import React, { useState, useEffect, useCallback } from "react"
import { Task, AppStatus } from "./types"
import { TaskInput } from "./components/TaskInput"
import Gun from "gun"

// Initialize Gun with public relay peers for real-time sync
// In a production app, you would host your own relay peers.
const gun = Gun({
  peers: [`${import.meta.env.VITE_GUN_URL}`],
})

interface ListMetadata {
  id: string
  name: string
  createdAt: number
}

const TaskItem: React.FC<{
  task: Task & { order?: number }
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, newText: string) => void
}> = ({ task, onToggle, onDelete, onRename }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedText, setEditedText] = useState(task.text)

  const handleSave = () => {
    if (editedText.trim() && editedText !== task.text) {
      onRename(task.id, editedText)
    }
    setIsEditing(false)
  }

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between group">
      <div className="flex items-center flex-1 min-w-0 gap-3">
        <div
          onClick={() => onToggle(task.id)}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-colors flex-shrink-0 ${
            task.completed
              ? "bg-green-500 border-green-500"
              : "border-gray-300 hover:border-[#2481cc]"
          }`}>
          {task.completed && (
            <i className="fas fa-check text-white text-[10px]"></i>
          )}
        </div>

        {isEditing ? (
          <input
            autoFocus
            className="flex-1 bg-transparent border-b-2 border-[#2481cc] focus:outline-none text-gray-800 py-0.5"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            onClick={() => setIsEditing(true)}
            className={`flex-1 truncate cursor-text select-none ${
              task.completed ? "text-gray-400 line-through" : "text-gray-800"
            }`}>
            {task.text}
          </span>
        )}
      </div>

      <div className="flex items-center ml-2">
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditedText(task.text)
              setIsEditing(true)
            }}
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-500 transition-colors">
            <i className="fas fa-pen text-xs"></i>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(task.id)
          }}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
      </div>
    </div>
  )
}

const ListEntry: React.FC<{
  list: ListMetadata
  onSelect: (id: string) => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}> = ({ list, onSelect, onDelete, onRename }) => {
  const [stats, setStats] = useState({ total: 0, completed: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(list.name)

  useEffect(() => {
    const tasksMap = new Map<string, boolean>()
    const node = gun.get(list.id).get("tasks")

    // Subscribe to tasks to count them
    const ev = node.map().on((data, id) => {
      if (data === null) {
        tasksMap.delete(id)
      } else if (data && typeof data === "object") {
        tasksMap.set(id, !!data.completed)
      }

      let total = 0
      let completed = 0
      tasksMap.forEach((isCompleted) => {
        total++
        if (isCompleted) completed++
      })
      setStats({ total, completed })
    })

    return () => {
      ev.off()
    }
  }, [list.id])

  const handleSave = () => {
    if (editedName.trim() && editedName !== list.name) {
      onRename(list.id, editedName)
    }
    setIsEditing(false)
  }

  return (
    <div
      onClick={() => !isEditing && onSelect(list.id)}
      className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
      <div className="flex-1 min-w-0 mr-4">
        {isEditing ? (
          <input
            autoFocus
            className="font-bold text-lg text-gray-800 truncate w-full border-b-2 border-[#2481cc] focus:outline-none bg-transparent"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <h3 className="font-bold text-lg text-gray-800 truncate">
            {list.name}
          </h3>
        )}
        <div className="flex items-center space-x-3 text-xs text-gray-400 mt-1">
          <span>{new Date(list.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center bg-gray-100 px-2 py-0.5 rounded-full text-gray-600 font-medium">
            <i className="fas fa-check-circle mr-1.5 text-[10px] text-green-500"></i>
            {stats.completed} / {stats.total}
          </span>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setEditedName(list.name)
              setIsEditing(true)
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
            title="Rename List">
            <i className="fas fa-pen text-xs"></i>
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(list.id)
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Delete List">
          <i className="fas fa-trash-alt text-xs"></i>
        </button>
        <i className="fas fa-chevron-right text-gray-300 pl-2"></i>
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const [tasks, setTasks] = useState<(Task & { order?: number })[]>([])
  const [title, setTitle] = useState("Shared Collaborative List")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE)
  const [currentUser, setCurrentUser] = useState("Guest User")
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)

  // Navigation & Lists
  const [roomId, setRoomId] = useState<string | null>(null)
  const [availableLists, setAvailableLists] = useState<ListMetadata[]>([])
  const [newListName, setNewListName] = useState("")

  useEffect(() => {
    // 1. Setup Telegram WebApp
    const tg = (window as any).Telegram?.WebApp
    if (tg?.initDataUnsafe?.user?.first_name) {
      setCurrentUser(tg.initDataUnsafe.user.first_name)
    }
    tg?.ready()
    tg?.expand()

    // Handle Back Button
    const handleBack = () => setRoomId(null)
    if (roomId) {
      tg?.BackButton?.show()
      tg?.BackButton?.onClick(handleBack)
    } else {
      tg?.BackButton?.hide()
    }

    return () => {
      tg?.BackButton?.offClick(handleBack)
    }
  }, [roomId])

  // 2. Load Registry (List of Lists)
  useEffect(() => {
    const registry = gun.get("telelist_registry")

    registry.map().on((data, id) => {
      if (!data) {
        setAvailableLists((prev) => prev.filter((l) => l.id !== id))
        return
      }
      if (data.name) {
        setAvailableLists((prev) => {
          const exists = prev.find((l) => l.id === id)
          const newItem = {
            id,
            name: data.name,
            createdAt: data.createdAt || 0,
          }
          if (exists) {
            return prev.map((l) => (l.id === id ? { ...l, ...newItem } : l))
          }
          return [...prev, newItem].sort((a, b) => b.createdAt - a.createdAt)
        })
      }
    })
  }, [])

  // 3. Synchronize with Gun.js (Specific Room)
  useEffect(() => {
    if (!roomId) return

    // Clear previous room data
    setTasks([])
    setTitle("Loading...")

    // Sync Title
    const titleNode = gun.get(roomId).get("title")
    titleNode.on((data) => {
      if (data && typeof data === "string") {
        setTitle(data)
      }
    })

    // Sync Tasks
    const listNode = gun.get(roomId).get("tasks")

    // Listen for changes
    listNode.map().on((data, id) => {
      if (!data) {
        // Handle deletion
        setTasks((prev) => prev.filter((t) => t.id !== id))
        return
      }

      setTasks((prev) => {
        const exists = prev.find((t) => t.id === id)
        if (exists) {
          // Update existing
          return prev.map((t) => (t.id === id ? { ...t, ...data, id } : t))
        } else {
          // Add new
          return [...prev, { ...data, id } as Task & { order?: number }]
        }
      })
    })

    return () => {
      titleNode.off()
      listNode.off()
    }
  }, [roomId])

  const createNewList = () => {
    const name = newListName.trim() || "Untitled List"
    const id = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const metadata = { name, createdAt: Date.now() }

    gun.get("telelist_registry").get(id).put(metadata)
    gun.get(id).get("title").put(name)

    setNewListName("")
    setRoomId(id)
  }

  const deleteList = (id: string) => {
    if (window.confirm("Are you sure you want to delete this list?")) {
      gun
        .get("telelist_registry")
        .get(id)
        .put(null as any)
    }
  }

  const renameList = (id: string, name: string) => {
    gun.get("telelist_registry").get(id).get("name").put(name)
    gun.get(id).get("title").put(name)
  }

  const addTask = useCallback(
    (text: string) => {
      if (!roomId) return
      const now = Date.now()
      const id = now.toString()
      const newTask = {
        text,
        completed: false,
        author: currentUser,
        createdAt: now,
        order: -now,
      }

      // Push to Gun (will sync to all peers)
      gun.get(roomId).get("tasks").get(id).put(newTask)
    },
    [roomId, currentUser],
  )

  const activeTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => (a.order ?? -a.createdAt) - (b.order ?? -b.createdAt))

  const completedTasks = tasks
    .filter((t) => t.completed)
    .sort((a, b) => b.createdAt - a.createdAt)

  const reorderTask = (draggedId: string, targetId: string) => {
    if (!roomId) return

    const draggedIndex = activeTasks.findIndex((t) => t.id === draggedId)
    const targetIndex = activeTasks.findIndex((t) => t.id === targetId)

    if (
      draggedIndex === -1 ||
      targetIndex === -1 ||
      draggedIndex === targetIndex
    )
      return

    const items = [...activeTasks]
    const [draggedItem] = items.splice(draggedIndex, 1)
    items.splice(targetIndex, 0, draggedItem)

    const prevItem = items[targetIndex - 1]
    const nextItem = items[targetIndex + 1]

    const getOrder = (t: Task & { order?: number }) => t.order ?? -t.createdAt

    let newOrder: number
    if (!prevItem && !nextItem) {
      newOrder = getOrder(draggedItem)
    } else if (!prevItem) {
      newOrder = getOrder(nextItem) - 100000
    } else if (!nextItem) {
      newOrder = getOrder(prevItem) + 100000
    } else {
      newOrder = (getOrder(prevItem) + getOrder(nextItem)) / 2
    }

    gun.get(roomId).get("tasks").get(draggedId).put({ order: newOrder })
  }

  const renameTask = (id: string, newText: string) => {
    if (!roomId) return
    gun.get(roomId).get("tasks").get(id).put({ text: newText })
  }

  const toggleTask = (id: string) => {
    if (!roomId) return
    const task = tasks.find((t) => t.id === id)
    if (task) {
      gun.get(roomId).get("tasks").get(id).put({ completed: !task.completed })
    }
  }

  const deleteTask = (id: string) => {
    if (!roomId) return
    // In Gun, putting null effectively deletes/nullifies the node in the map
    gun
      .get(roomId)
      .get("tasks")
      .get(id)
      .put(null as any)
  }

  const clearCompleted = () => {
    tasks.forEach((t) => {
      if (t.completed) {
        deleteTask(t.id)
      }
    })
  }

  // Render Home View (List of Lists)
  if (!roomId) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-[#2481cc] text-white p-6 shadow-lg sticky top-0 z-40">
          <h1 className="text-2xl font-bold">My Lists</h1>
          <p className="text-xs opacity-80 uppercase tracking-widest mt-1">
            Select a list to collaborate
          </p>
        </header>

        <main className="flex-1 p-4 max-w-3xl mx-auto w-full space-y-4">
          <div className="flex space-x-2 mb-6">
            <input
              type="text"
              placeholder="New List Name..."
              className="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2481cc]"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createNewList()}
            />
            <button
              onClick={createNewList}
              className="bg-[#2481cc] text-white px-6 py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform">
              Create
            </button>
          </div>

          <div className="space-y-2">
            {availableLists.map((list) => (
              <ListEntry
                key={list.id}
                list={list}
                onSelect={setRoomId}
                onDelete={deleteList}
                onRename={renameList}
              />
            ))}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-32 flex flex-col">
      {/* Header */}
      <header className="bg-[#2481cc] text-white p-6 pt-10 shadow-lg sticky top-0 z-40">
        <div className="max-w-3xl mx-auto flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            {isEditingTitle ? (
              <input
                autoFocus
                className="bg-transparent border-b-2 border-white text-2xl font-bold focus:outline-none w-full mr-4"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  setIsEditingTitle(false)
                  gun.get(roomId).get("title").put(title)
                  // Update registry name as well
                  gun
                    .get("telelist_registry")
                    .get(roomId)
                    .get("name")
                    .put(title)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false)
                    gun.get(roomId).get("title").put(title)
                    gun
                      .get("telelist_registry")
                      .get(roomId)
                      .get("name")
                      .put(title)
                  }
                }}
              />
            ) : (
              <h1
                className="text-2xl font-bold cursor-pointer flex items-center space-x-2"
                onClick={() => setIsEditingTitle(true)}>
                {/* Back button for non-Telegram environments */}
                <i
                  className="fas fa-arrow-left mr-2 text-xl opacity-70 hover:opacity-100 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    setRoomId(null)
                  }}></i>
                <span>{title}</span>
                <i className="fas fa-pen text-sm opacity-50"></i>
              </h1>
            )}
            <div className="flex items-center">
              <div className="bg-white/20 px-3 py-1 rounded-full flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></div>
                <span className="text-[10px] font-bold uppercase tracking-tighter">
                  Live Sync
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs opacity-80 uppercase tracking-widest">
            <i className="fas fa-users text-[10px]"></i>
            <span>Real-time Peer Session</span>
            <span className="mx-1">•</span>
            <span>{tasks.length} items shared</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 space-y-6">
        {/* Task List */}
        <section>
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                <i
                  className="fas fa-sync-alt text-3xl animate-spin-slow opacity-20"
                  style={{ animationDuration: "10s" }}></i>
              </div>
              <p className="text-lg font-medium">Waiting for items...</p>
              <p className="text-sm text-center px-10">
                Any item added by you or your peers will appear here instantly.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4 px-1">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Shared List
                </span>
                {tasks.some((t) => t.completed) && (
                  <button
                    onClick={clearCompleted}
                    className="text-xs font-bold text-red-500 uppercase hover:underline">
                    Clear Completed
                  </button>
                )}
              </div>
              <div className="space-y-1">
                {activeTasks.map((task) => (
                  <div
                    key={task.id}
                    data-task-id={task.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTaskId(task.id)
                      e.dataTransfer.effectAllowed = "move"
                    }}
                    onDragOver={(e) => {
                      e.preventDefault()
                      e.dataTransfer.dropEffect = "move"
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      if (draggedTaskId) reorderTask(draggedTaskId, task.id)
                      setDraggedTaskId(null)
                    }}
                    className={`flex items-center gap-2 transition-all ${
                      draggedTaskId === task.id ? "opacity-50" : "opacity-100"
                    }`}>
                    <div
                      className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-600 touch-none"
                      onTouchStart={() => setDraggedTaskId(task.id)}
                      onTouchMove={(e) => {
                        e.preventDefault()
                        const touch = e.touches[0]
                        const target = document.elementFromPoint(
                          touch.clientX,
                          touch.clientY,
                        )
                        const taskRow = target?.closest("[data-task-id]")
                        if (taskRow) {
                          const targetId = taskRow.getAttribute("data-task-id")
                          if (targetId && targetId !== task.id) {
                            reorderTask(task.id, targetId)
                          }
                        }
                      }}
                      onTouchEnd={() => setDraggedTaskId(null)}>
                      <i className="fas fa-grip-vertical"></i>
                    </div>
                    <div className="flex-1">
                      <TaskItem
                        task={task}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onRename={renameTask}
                      />
                    </div>
                  </div>
                ))}

                {completedTasks.length > 0 && (
                  <div className="mt-6 mb-2 flex items-center">
                    <div className="h-px bg-gray-200 flex-1"></div>
                    <span className="px-3 text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Completed
                    </span>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                )}

                {completedTasks.map((task) => (
                  <div key={task.id} className="opacity-60">
                    <TaskItem
                      task={task}
                      onToggle={toggleTask}
                      onDelete={deleteTask}
                      onRename={renameTask}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Input Field */}
      <TaskInput onAdd={addTask} />

      {/* User Status Toast (Floating) */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="bg-black/70 text-white text-[10px] px-3 py-1 rounded-full backdrop-blur-sm border border-white/10 flex items-center space-x-2">
          <i className="fas fa-user text-blue-400"></i>
          <span>
            Acting as <strong>{currentUser}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}

export default App
