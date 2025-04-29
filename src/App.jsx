import React, { useState, useEffect } from 'react';

const App = () => {
  // State management with localStorage initialization
  const [taskInput, setTaskInput] = useState("");
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [recurrence, setRecurrence] = useState("None");
  const [suggestions, setSuggestions] = useState([]);
  const [sortOrder, setSortOrder] = useState(() => {
    const savedSortOrder = localStorage.getItem('sortOrder');
    return savedSortOrder || "desc";
  });
  const [showShareMsg, setShowShareMsg] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isCursorActive, setIsCursorActive] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notifPermission, setNotifPermission] = useState("default");
  const [filterBy, setFilterBy] = useState(() => {
    const savedFilterBy = localStorage.getItem('filterBy');
    return savedFilterBy || "all";
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState(() => {
    const savedSortBy = localStorage.getItem('sortBy');
    return savedSortBy || "creationDate";
  });
  const [showHistory, setShowHistory] = useState(false);
  const [taskHistory, setTaskHistory] = useState(() => {
    const savedHistory = localStorage.getItem('taskHistory');
    return savedHistory ? JSON.parse(savedHistory) : [];
  });
  const [completedTasks, setCompletedTasks] = useState(() => {
    const savedCompletedTasks = localStorage.getItem('completedTasks');
    return savedCompletedTasks ? JSON.parse(savedCompletedTasks) : [];
  });
  const [reminderSettings, setReminderSettings] = useState(() => {
    const savedSettings = localStorage.getItem('reminderSettings');
    return savedSettings ? JSON.parse(savedSettings) : {
      enableNotifications: true,
      reminderBefore: 15,
      soundEnabled: true
    };
  });
  const [showReminderSettings, setShowReminderSettings] = useState(false);

  const priorities = ["Low", "Medium", "High"];

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('taskHistory', JSON.stringify(taskHistory));
  }, [taskHistory]);

  useEffect(() => {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  }, [completedTasks]);

  useEffect(() => {
    localStorage.setItem('reminderSettings', JSON.stringify(reminderSettings));
  }, [reminderSettings]);

  useEffect(() => {
    localStorage.setItem('sortOrder', sortOrder);
  }, [sortOrder]);

  useEffect(() => {
    localStorage.setItem('filterBy', filterBy);
  }, [filterBy]);

  useEffect(() => {
    localStorage.setItem('sortBy', sortBy);
  }, [sortBy]);

  // Mouse tracking effect
  useEffect(() => {
    const handleMouseMove = (e) => setCursorPos({ x: e.clientX, y: e.clientY });
    const handleMouseDown = () => setIsCursorActive(true);
    const handleMouseUp = () => setIsCursorActive(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Enhanced notification setup
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        setNotifPermission(permission);
      });
    }

    const checkDueTasks = () => {
      const now = new Date();
      tasks.forEach(task => {
        if (task.dueDate && task.dueTime && !task.notified) {
          const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
          const reminderTime = new Date(dueDateTime);
          reminderTime.setMinutes(reminderTime.getMinutes() - reminderSettings.reminderBefore);

          if (now >= reminderTime && now < dueDateTime) {
            sendNotification(task, "reminder");
          } else if (dueDateTime <= now) {
            sendNotification(task, "due");
          }
        }
      });
    };

    const interval = setInterval(checkDueTasks, 60000);
    return () => clearInterval(interval);
  }, [tasks, reminderSettings]);

  // Enhanced notification function
  const sendNotification = (task, type) => {
    if (notifPermission === "granted" && reminderSettings.enableNotifications) {
      const notificationOptions = {
        body: type === "reminder"
          ? `${task.todoText} is due in ${reminderSettings.reminderBefore} minutes!`
          : `${task.todoText} is due now!`,
        icon: "/favicon.ico",
        tag: `task-${task.id}`,
        requireInteraction: true,
        data: {
          taskId: task.id,
          type: type
        }
      };

      if (reminderSettings.soundEnabled) {
        notificationOptions.silent = false;
      }

      const notification = new Notification("Task Reminder", notificationOptions);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      // Mark task as notified
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, notified: true } : t));
    }
  };

  const handleInput = (e) => {
    const input = e.target.value;
    setTaskInput(input);
    const parsedDate = parseNaturalDate(input);
    if (parsedDate) setDueDate(parsedDate);
    generateSuggestions(input);
  };

  const generateSuggestions = (input) => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const uniqueTasks = [...new Set(tasks.map(t => t.todoText))];
    const matchingTasks = uniqueTasks.filter(task =>
      task.toLowerCase().includes(input.toLowerCase())
    );

    const recurringTasks = tasks.reduce((acc, task) => {
      if (task.recurrence !== "None") {
        acc[task.todoText] = (acc[task.todoText] || 0) + 1;
      }
      return acc;
    }, {});

    const taskSuggestions = [
      ...matchingTasks,
      ...Object.entries(recurringTasks)
        .filter(([_, count]) => count > 1)
        .map(([task]) => task)
    ].filter((task, index, self) => self.indexOf(task) === index)
      .slice(0, 3);

    setSuggestions(taskSuggestions);
  };

  const parseNaturalDate = (input) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (input.toLowerCase().includes("tomorrow")) {
      const timeMatch = input.toLowerCase().match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
      if (timeMatch) {
        const [_, hours, minutes, meridiem] = timeMatch;
        tomorrow.setHours(
          meridiem.toLowerCase() === 'pm' ? (parseInt(hours) % 12) + 12 : parseInt(hours) % 12
        );
        tomorrow.setMinutes(minutes ? parseInt(minutes) : 0);
        tomorrow.setSeconds(0);
      }
      return formatDate(tomorrow);
    }

    const weekDays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const nextDayMatch = input.toLowerCase().match(/next (\w+)/);
    if (nextDayMatch) {
      const nextDay = nextDayMatch[1].toLowerCase();
      const currentDayIndex = today.getDay();
      const targetDayIndex = weekDays.indexOf(nextDay);
      const daysUntilNext = (targetDayIndex - currentDayIndex + 7) % 7;
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + daysUntilNext);
      return formatDate(nextDate);
    }

    const timeMatch = input.toLowerCase().match(/at (\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
    if (timeMatch) {
      const [_, hours, minutes, meridiem] = timeMatch;
      const dueTime = new Date(today);
      dueTime.setHours(
        meridiem.toLowerCase() === 'pm' ? (parseInt(hours) % 12) + 12 : parseInt(hours) % 12
      );
      dueTime.setMinutes(minutes ? parseInt(minutes) : 0);
      dueTime.setSeconds(0);
      return formatDate(dueTime);
    }

    return null;
  };

  const formatDate = (date) => date.toISOString().split("T")[0];

  const handleTaskSubmit = async () => {
    if (taskInput.trim() === "") return;

    const newTask = {
      id: Date.now(),
      todoText: taskInput,
      priority: taskPriority,
      dueDate,
      dueTime,
      recurrence,
      notified: false,
      createdAt: new Date().toISOString()
    };

    if (editingTaskId !== null) {
      const oldTask = tasks.find(t => t.id === editingTaskId);
      setTaskHistory(prev => [...prev, {
        type: 'edit',
        oldTask,
        newTask: { ...newTask, id: editingTaskId },
        timestamp: new Date().toISOString()
      }]);
      setTasks(prev => prev.map(t => t.id === editingTaskId ? { ...newTask, id: editingTaskId } : t));
      setEditingTaskId(null);
    } else {
      setTaskHistory(prev => [...prev, {
        type: 'add',
        task: newTask,
        timestamp: new Date().toISOString()
      }]);
      setTasks(prev => [...prev, newTask]);
    }

    if (recurrence !== "None") {
      const nextDueDate = calculateNextDueDate(dueDate, recurrence);
      const recurringTask = {
        ...newTask,
        id: Date.now() + 1,
        dueDate: nextDueDate
      };
      setTaskHistory(prev => [...prev, {
        type: 'add',
        task: recurringTask,
        timestamp: new Date().toISOString()
      }]);
      setTasks(prev => [...prev, recurringTask]);
    }

    resetForm();
  };

  const resetForm = () => {
    setTaskInput("");
    setTaskPriority("Medium");
    setDueDate("");
    setDueTime("");
    setRecurrence("None");
  };

  const handleEdit = (id) => {
    const taskToEdit = tasks.find(t => t.id === id);
    setTaskInput(taskToEdit.todoText);
    setTaskPriority(taskToEdit.priority || "Medium");
    setDueDate(taskToEdit.dueDate || "");
    setDueTime(taskToEdit.dueTime || "");
    setRecurrence(taskToEdit.recurrence || "None");
    setEditingTaskId(id);
  };

  const handleDelete = (id) => {
    const taskToDelete = tasks.find(t => t.id === id);
    setTaskHistory(prev => [...prev, {
      type: 'delete',
      task: taskToDelete,
      timestamp: new Date().toISOString()
    }]);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const calculateNextDueDate = (currentDate, recurrenceType) => {
    const date = new Date(currentDate);
    const increments = {
      Daily: () => date.setDate(date.getDate() + 1),
      Weekly: () => date.setDate(date.getDate() + 7),
      Monthly: () => date.setMonth(date.getMonth() + 1)
    };
    increments[recurrenceType]();
    return formatDate(date);
  };

  const getPriorityColor = (level) => ({
    High: "#ff4d4d",
    Medium: "#ffaa00",
    Low: "#4dff88"
  }[level] || "#aaa");

  const handleTaskComplete = (id) => {
    const taskToComplete = tasks.find(t => t.id === id);
    setCompletedTasks(prev => [...prev, { ...taskToComplete, completedAt: new Date().toISOString() }]);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const getFilteredAndSortedTasks = () => {
    let filteredTasks = [...tasks];

    // Apply filters
    const filters = {
      all: () => filteredTasks,
      today: () => {
        const today = new Date().toISOString().split("T")[0];
        return filteredTasks.filter(t => t.dueDate === today);
      },
      thisWeek: () => {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return filteredTasks.filter(t => {
          const dueDate = new Date(t.dueDate);
          return dueDate >= weekStart && dueDate <= weekEnd;
        });
      },
      overdue: () => {
        const now = new Date();
        return filteredTasks.filter(t => t.dueDate && new Date(t.dueDate) < now);
      },
      highPriority: () => filteredTasks.filter(t => t.priority === "High"),
      withReminders: () => filteredTasks.filter(t => t.dueTime),
      completed: () => completedTasks
    };

    if (filters[filterBy]) {
      filteredTasks = filters[filterBy]();
    }

    // Apply sorting
    const sorters = {
      priority: () => {
        const priorityOrder = { High: 3, Medium: 2, Low: 1 };
        return filteredTasks.sort((a, b) => {
          const comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          return sortOrder === "asc" ? -comparison : comparison;
        });
      },
      dueDate: () => filteredTasks.sort((a, b) => {
        if (!a.dueDate) return sortOrder === "asc" ? -1 : 1;
        if (!b.dueDate) return sortOrder === "asc" ? 1 : -1;
        const comparison = new Date(a.dueDate) - new Date(b.dueDate);
        return sortOrder === "asc" ? comparison : -comparison;
      }),
      creationDate: () => filteredTasks.sort((a, b) => {
        const comparison = new Date(a.createdAt) - new Date(b.createdAt);
        return sortOrder === "asc" ? comparison : -comparison;
      })
    };

    if (sorters[sortBy]) {
      filteredTasks = sorters[sortBy]();
    }

    return filteredTasks;
  };

  const handleShare = async () => {
    const shareData = {
      title: 'My Task Manager',
      text: 'Check out my task manager!',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setShowShareMsg(true);
        setTimeout(() => setShowShareMsg(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="app-container">
      {notifPermission === "default" && (
        <div className="notification-permission">
          <div className="notification-content">
            <p>Enable notifications for task reminders</p>
            <button
              onClick={() => {
                Notification.requestPermission().then(permission => {
                  setNotifPermission(permission);
                });
              }}
              className="futuristic-button"
            >
              Enable Notifications
            </button>
          </div>
        </div>
      )}
      <div
        className={`cursor ${isCursorActive ? 'active' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
      <div
        className={`cursor-follower ${isCursorActive ? 'active' : ''}`}
        style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
      />
      <h1 className="title">Task Manager</h1>

      <div className="controls-container">
        <div className="sort-filter-controls">
          <button
            className="futuristic-button"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            className="futuristic-button"
            onClick={() => setShowReminderSettings(!showReminderSettings)}
          >
            {showReminderSettings ? "Hide Reminder Settings" : "Reminder Settings"}
          </button>

          {showReminderSettings && (
            <div className="reminder-settings">
              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enableNotifications}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      enableNotifications: e.target.checked
                    }))}
                  />
                  Enable Notifications
                </label>
              </div>

              <div className="setting-group">
                <label>Reminder Before (minutes):</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={reminderSettings.reminderBefore}
                  onChange={(e) => setReminderSettings(prev => ({
                    ...prev,
                    reminderBefore: parseInt(e.target.value)
                  }))}
                  className="futuristic-input"
                />
              </div>

              <div className="setting-group">
                <label>
                  <input
                    type="checkbox"
                    checked={reminderSettings.soundEnabled}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      soundEnabled: e.target.checked
                    }))}
                  />
                  Enable Sound
                </label>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="filter-options">
              <div className="filter-group">
                <label>Filter By:</label>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value)}
                  className="futuristic-input"
                >
                  <option value="all">All Tasks</option>
                  <option value="today">Today</option>
                  <option value="thisWeek">This Week</option>
                  <option value="overdue">Overdue</option>
                  <option value="highPriority">High Priority</option>
                  <option value="withReminders">With Reminders</option>
                  <option value="completed">Completed Tasks</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort By:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="futuristic-input"
                >
                  <option value="creationDate">Creation Date</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort Order:</label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="futuristic-input"
                >
                  <option value="desc">Newest/High Priority First</option>
                  <option value="asc">Oldest/Low Priority First</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="input-container">
        <input
          type="text"
          value={taskInput}
          onChange={handleInput}
          placeholder="Enter your task here..."
          className="futuristic-input"
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && (
          <div className="suggestions-container">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="suggestion-item"
                onClick={() => {
                  setTaskInput(suggestion);
                  setShowSuggestions(false);
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
        <select
          value={taskPriority}
          onChange={(e) => setTaskPriority(e.target.value)}
          className="futuristic-input"
          style={{ width: "120px" }}
        >
          <option>High</option>
          <option>Medium</option>
          <option>Low</option>
        </select>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="futuristic-input"
        />
        <input
          type="time"
          value={dueTime}
          onChange={(e) => setDueTime(e.target.value)}
          className="futuristic-input"
        />
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value)}
          className="futuristic-input"
          style={{ width: "120px" }}
        >
          <option>None</option>
          <option>Daily</option>
          <option>Weekly</option>
          <option>Monthly</option>
        </select>
        <button onClick={handleTaskSubmit} className="futuristic-button">
          {editingTaskId !== null ? "Update" : "Add"}
        </button>
      </div>

      <div className="todo-list">
        <div className="todo-header">
          <h2 className="sub-title">📋 Your Tasks</h2>
          <div className="header-buttons">
            {tasks.length > 0 && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="history-button"
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
                <button onClick={handleShare} className="share-button" title="Share Task Manager">
                  📤 Share
                </button>
              </>
            )}
          </div>
        </div>
        {showShareMsg && (
          <div className="share-message">
            Link copied to clipboard!
          </div>
        )}
        {showHistory && (
          <div className="history-container">
            <h3 className="history-title">Task History</h3>
            <div className="history-list">
              {taskHistory.length === 0 ? (
                <p className="empty">No history yet...</p>
              ) : (
                taskHistory.map((entry, index) => (
                  <div key={index} className="history-item">
                    <div className="history-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="history-action">
                      {entry.type === 'add' && `Added task: ${entry.task.todoText}`}
                      {entry.type === 'edit' && `Edited task: ${entry.oldTask.todoText} → ${entry.newTask.todoText}`}
                      {entry.type === 'delete' && `Deleted task: ${entry.task.todoText}`}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {getFilteredAndSortedTasks().length === 0 ? (
          <p className="empty">No tasks match your current filter...</p>
        ) : (
          getFilteredAndSortedTasks().map((task) => (
            <div
              key={task.id}
              className={`todo-item ${task.dueTime ? 'task-with-reminder' : ''} ${completedTasks.some(t => t.id === task.id) ? 'completed' : ''}`}
              style={{ borderLeft: `4px solid ${getPriorityColor(task.priority)}` }}
            >
              <div className="todo-content">
                <span>{task.todoText}</span>
                {task.dueDate && (
                  <span className="due-date">
                    Due: {task.dueDate} {task.dueTime && `at ${task.dueTime}`}
                  </span>
                )}
                {task.recurrence !== "None" && (
                  <span className="recurrence">Recurs: {task.recurrence}</span>
                )}
                {completedTasks.some(t => t.id === task.id) && (
                  <span className="completed-badge">Completed</span>
                )}
              </div>
              <div className="todo-actions">
                {!completedTasks.some(t => t.id === task.id) && (
                  <>
                    <button onClick={() => handleEdit(task.id)}>Edit</button>
                    <button onClick={() => handleTaskComplete(task.id)}>Complete</button>
                    <button onClick={() => handleDelete(task.id)}>Delete</button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default App;
