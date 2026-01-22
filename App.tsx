import React, { useState, useEffect, useCallback } from "react"
import { Task, AppStatus } from "./types"
import { TaskItem } from "./components/TaskItem"
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

const App: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [title, setTitle] = useState("Shared Collaborative List")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE)
  const [currentUser, setCurrentUser] = useState("Guest User")

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
          return [...prev, { ...data, id } as Task].sort(
            (a, b) => b.createdAt - a.createdAt,
          )
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

  const addTask = useCallback(
    (text: string) => {
      if (!roomId) return
      const id = Date.now().toString()
      const newTask: Omit<Task, "id"> = {
        text,
        completed: false,
        author: currentUser,
        createdAt: Date.now(),
      }

      // Push to Gun (will sync to all peers)
      gun.get(roomId).get("tasks").get(id).put(newTask)
    },
    [roomId, currentUser],
  )

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
              <div
                key={list.id}
                onClick={() => setRoomId(list.id)}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {list.name}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {new Date(list.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <i className="fas fa-chevron-right text-gray-300"></i>
              </div>
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
                {tasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggle={toggleTask}
                    onDelete={deleteTask}
                  />
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
