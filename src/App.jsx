import React, { useState, useEffect } from 'react';
import TaskStats from './components/TaskStats';
import TaskCalendar from './components/TaskCalendar';

const styles = {
  appContainer: {
    padding: '40px 20px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  title: {
    fontSize: '3rem',
    margin: '24px 0',
    textAlign: 'center'
  },
  controlsContainer: {
    margin: '24px 0',
    padding: '20px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    margin: '24px 0'
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    margin: '24px 0'
  },
  todoItem: {
    padding: '20px',
    marginBottom: '16px',
    fontSize: '1.1rem',
    minHeight: '80px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
  },
  tasksSummary: {
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: '1200px',
    margin: '32px auto',
    padding: '24px 32px',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(33, 53, 85, 0.1)',
    border: '1px solid #D8C4B6',
    fontSize: '1.2rem'
  }
};

const App = () => {
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
  const [importError, setImportError] = useState("");
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

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
        if (permission === 'granted') {
          setShowNotificationPrompt(false);
        }
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
      createdAt: new Date().toISOString(),
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

  const handleImportTasks = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (!Array.isArray(imported)) throw new Error("Invalid file format");
        // Optionally validate each task object here
        setTasks(prev => [...prev, ...imported]);
        setImportError("");
      } catch (err) {
        setImportError("Failed to import tasks: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  const handleExportICS = () => {
    const pad = (num) => (num < 10 ? "0" + num : num);
    const formatICSDate = (dateStr, timeStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr + (timeStr ? 'T' + timeStr : 'T00:00'));
      return (
        date.getUTCFullYear().toString() +
        pad(date.getUTCMonth() + 1) +
        pad(date.getUTCDate()) +
        'T' +
        pad(date.getUTCHours()) +
        pad(date.getUTCMinutes()) +
        pad(date.getUTCSeconds()) + 'Z'
      );
    };

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'CALSCALE:GREGORIAN',
      'PRODID:-//TaskManager//EN',
    ];

    tasks.forEach(task => {
      if (!task.dueDate) return;
      const start = formatICSDate(task.dueDate, task.dueTime);
      // Default duration: 1 hour if time is set, all day if not
      let end;
      if (task.dueTime) {
        const startDate = new Date(task.dueDate + 'T' + task.dueTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        end = formatICSDate(
          endDate.toISOString().split('T')[0],
          endDate.toTimeString().slice(0, 8)
        );
      } else {
        end = formatICSDate(task.dueDate, '23:59:59');
      }
      icsContent.push(
        'BEGIN:VEVENT',
        'UID:' + task.id + '@taskmanager',
        'DTSTAMP:' + formatICSDate(new Date().toISOString().split('T')[0], new Date().toTimeString().slice(0, 8)),
        'DTSTART:' + start,
        'DTEND:' + end,
        'SUMMARY:' + (task.todoText || 'Task'),
        'DESCRIPTION:Priority: ' + (task.priority || 'Medium') + (task.recurrence && task.recurrence !== 'None' ? '\nRecurs: ' + task.recurrence : ''),
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');
    const blob = new Blob([icsContent.join('\n')], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.ics';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  };

  const formatDueDate = (dateStr) => {
    const date = new Date(dateStr);
    const options = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="app-container" style={styles.appContainer}>
      {showNotificationPrompt && notifPermission !== 'granted' && (
        <div className="notification-permission">
          <div className="notification-content">
            <p style={{ fontSize: '1.1rem' }}>Enable notifications for task reminders</p>
            <button
              onClick={async () => {
                const permission = await Notification.requestPermission();
                setNotifPermission(permission);
                if (permission === 'granted') {
                  setShowNotificationPrompt(false);
                }
              }}
              className="futuristic-button"
              style={{ padding: '12px 24px', fontSize: '1.1rem' }}
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
      <h1 className="title" style={styles.title}>Task Manager</h1>
      <TaskStats tasks={tasks} completedTasks={completedTasks} />
      <div className="controls-container" style={styles.controlsContainer}>
        <div className="sort-filter-controls">
          <button
            className="futuristic-button"
            onClick={() => setShowFilters(!showFilters)}
            style={{ padding: '12px 24px', fontSize: '1.1rem' }}
          >
            {showFilters ? "Hide Filters" : "Show Filters"}
          </button>

          <button
            className="futuristic-button"
            onClick={() => setShowReminderSettings(!showReminderSettings)}
            style={{ padding: '12px 24px', fontSize: '1.1rem' }}
          >
            {showReminderSettings ? "Hide Reminder Settings" : "Reminder Settings"}
          </button>

          <label className="futuristic-button" style={{ cursor: "pointer", marginLeft: 8 }}>
            Import Tasks
            <input
              type="file"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleImportTasks}
            />
          </label>
          {importError && <div style={{ color: "red", marginTop: 8 }}>{importError}</div>}

          {showReminderSettings && (
            <div className="reminder-settings" style={{
              padding: '24px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 15px rgba(0, 0, 0, 0.05)',
              margin: '20px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div className="setting-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.enableNotifications}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      enableNotifications: e.target.checked
                    }))}
                    style={{ width: '20px', height: '20px' }}
                  />
                  Enable Notifications
                </label>
              </div>

              <div className="setting-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Reminder Before (minutes):
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
                    style={{ padding: '12px', fontSize: '1.1rem', width: '100px' }}
                  />
                </label>
              </div>

              <div className="setting-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input
                    type="checkbox"
                    checked={reminderSettings.soundEnabled}
                    onChange={(e) => setReminderSettings(prev => ({
                      ...prev,
                      soundEnabled: e.target.checked
                    }))}
                    style={{ width: '20px', height: '20px' }}
                  />
                  Enable Sound
                </label>
              </div>
            </div>
          )}

          {showFilters && (
            <div className="filter-options" style={{
              padding: '24px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 2px 15px rgba(0, 0, 0, 0.05)',
              margin: '20px 0',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              <div className="filter-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Filter By:
                  <select
                    value={filterBy}
                    onChange={(e) => setFilterBy(e.target.value)}
                    className="futuristic-input"
                    style={{ padding: '12px', fontSize: '1.1rem' }}
                  >
                    <option value="all">All Tasks</option>
                    <option value="today">Today</option>
                    <option value="thisWeek">This Week</option>
                    <option value="overdue">Overdue</option>
                    <option value="highPriority">High Priority</option>
                    <option value="withReminders">With Reminders</option>
                    <option value="completed">Completed Tasks</option>
                  </select>
                </label>
              </div>

              <div className="filter-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Sort By:
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="futuristic-input"
                    style={{ padding: '12px', fontSize: '1.1rem' }}
                  >
                    <option value="creationDate">Creation Date</option>
                    <option value="priority">Priority</option>
                    <option value="dueDate">Due Date</option>
                  </select>
                </label>
              </div>

              <div className="filter-group" style={{ fontSize: '1.1rem' }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  Sort Order:
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="futuristic-input"
                    style={{ padding: '12px', fontSize: '1.1rem' }}
                  >
                    <option value="desc">Newest/High Priority First</option>
                    <option value="asc">Oldest/Low Priority First</option>
                  </select>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="input-container" style={styles.inputContainer}>
        <input
          type="text"
          value={taskInput}
          onChange={handleInput}
          placeholder="Enter your task here..."
          className="futuristic-input"
          style={{ padding: '16px', fontSize: '1.2rem', height: '50px' }}
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

      <div className="todo-list" style={styles.todoList}>
        <div className="todo-header">
          <h2 className="sub-title" style={{ fontSize: '2rem', marginBottom: '24px' }}>📋 Your Tasks</h2>
          <div className="header-buttons">
            {tasks.length > 0 && (
              <>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="history-button"
                >
                  {showHistory ? "Hide History" : "Show History"}
                </button>
                <button onClick={handleShare} className="futuristic-button share-button" title="Share Task Manager">
                  📤 Share
                </button>
                <button onClick={handleExportICS} className="futuristic-button export-ics-button" title="Export tasks to calendar">
                  📅 Export
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
              style={{
                ...styles.todoItem,
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`
              }}
            >
              <div className="todo-content">
                <span className="task-text">{task.todoText}</span>
                {task.dueDate && (
                  <span className="due-date" style={{ marginLeft: '12px' }}>
                    Due: {formatDueDate(task.dueDate + (task.dueTime ? 'T' + task.dueTime : 'T00:00'))}
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
      <TaskCalendar tasks={tasks} completedTasks={completedTasks} />
      <div className="tasks-summary" style={styles.tasksSummary}>
        <div className="pending-tasks" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#213555',
          fontWeight: '500'
        }}>
          <span>⏳ Pending Tasks:</span>
          <span style={{ fontWeight: '600' }}>{tasks.length}</span>
        </div>
        <div className="completed-tasks" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#4CAF50',
          fontWeight: '500'
        }}>
          <span>✅ Completed Tasks:</span>
          <span style={{ fontWeight: '600' }}>{completedTasks.length}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
