'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, X, Calendar, Trash2 } from 'lucide-react';
import { TaskItem } from '@/app/api/tasks/route';
import { TeamMember } from '@/app/api/team/route';
import styles from './tasks.module.css';

export default function TasksBoard() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'MY_TASKS' | 'ASSIGNED_TO_OTHERS'>('ALL');
  const [modalOpen, setModalOpen] = useState(false);

  const currentUserName = session?.user?.name || '';
  const currentUserEmail = session?.user?.email || '';

  // Form State for New Task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('General');
  const [syncToCalendar, setSyncToCalendar] = useState(true);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to load tasks', e);
    }
  };

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTeam(data);
        if (data.length > 0 && !assigneeId) {
          const me = data.find((m) => m.email?.toLowerCase() === currentUserEmail.toLowerCase());
          setAssigneeId(me ? me.id : data[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load team', e);
    }
  };

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDueDate(d.toISOString().slice(0, 16));
    fetchTasks();
    fetchTeam();
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedMember = team.find((m) => m.id === assigneeId);

    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        priority,
        dueDate,
        assigneeId,
        assigneeName: selectedMember?.name || 'Unassigned',
        assigneeAvatar: selectedMember?.avatar || '',
        category,
        syncToCalendar,
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      setTitle('');
      setDescription('');
      fetchTasks();
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    fetchTasks();
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'MY_TASKS') {
      return (
        t.assigneeName === currentUserName ||
        t.assigneeName === 'Assigned to me' ||
        (t.assigneeName && currentUserName && t.assigneeName.toLowerCase().includes(currentUserName.toLowerCase()))
      );
    }
    if (filter === 'ASSIGNED_TO_OTHERS') {
      return (
        t.assigneeName !== currentUserName &&
        t.assigneeName !== 'Assigned to me' &&
        (!currentUserName || !t.assigneeName.toLowerCase().includes(currentUserName.toLowerCase()))
      );
    }
    return true;
  });

  const todoTasks = filteredTasks.filter((t) => t.status === 'TODO');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'IN_PROGRESS');
  const completedTasks = filteredTasks.filter((t) => t.status === 'COMPLETED');

  const getPriorityClass = (pri: string) => {
    switch (pri) {
      case 'LOW':
        return styles.priorityLow;
      case 'HIGH':
        return styles.priorityHigh;
      case 'URGENT':
        return styles.priorityUrgent;
      default:
        return styles.priorityMedium;
    }
  };

  const renderColumn = (colTitle: string, taskList: TaskItem[], statusKey: string) => (
    <div className={styles.column}>
      <div className={styles.columnHeader}>
        <div className={styles.columnTitleGroup}>
          <span className={styles.columnTitle}>{colTitle}</span>
          <span className={styles.columnCount}>{taskList.length}</span>
        </div>
      </div>

      <div className={styles.taskList}>
        {taskList.length === 0 ? (
          <div className={styles.emptyTaskList}>No {colTitle.toLowerCase()} tasks</div>
        ) : (
          taskList.map((task) => (
            <div key={task.id} className={styles.taskCard}>
              <div className={styles.taskTop}>
                <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                  {task.priority}
                </span>
                <div className={styles.taskActions}>
                  <select
                    className={styles.statusChangeSelect}
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value)}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                  <button
                    type="button"
                    className={styles.deleteTaskButton}
                    onClick={() => handleDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <h4 className={styles.taskTitle}>{task.title}</h4>
              {task.description && (
                <p className={styles.taskDescription}>{task.description}</p>
              )}

              <div className={styles.taskFooter}>
                <div className={styles.assigneeBadge}>
                  <div className={styles.assigneeAvatar}>
                    {task.assigneeAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={task.assigneeAvatar}
                        alt={task.assigneeName}
                        className={styles.assigneeImage}
                      />
                    ) : (
                      task.assigneeName.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <span className={styles.assigneeName}>{task.assigneeName}</span>
                </div>

                <div className={styles.taskMeta}>
                  {task.syncToCalendar && (
                    <span className={styles.calendarSyncBadge} title="Synced with Google Calendar">
                      <Calendar size={13} />
                    </span>
                  )}
                  <span>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'No date'}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className={styles.tasksContainer}>
      <div className={styles.tasksHeader}>
        <div className={styles.filterGroup}>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'ALL' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Tasks
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'MY_TASKS' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('MY_TASKS')}
          >
            My Tasks
          </button>
          <button
            type="button"
            className={`${styles.filterButton} ${filter === 'ASSIGNED_TO_OTHERS' ? styles.filterButtonActive : ''}`}
            onClick={() => setFilter('ASSIGNED_TO_OTHERS')}
          >
            Assigned to Others
          </button>
        </div>

        <button
          type="button"
          className={styles.addTaskButton}
          onClick={() => setModalOpen(true)}
        >
          <Plus size={16} />
          <span>Add & Assign Task</span>
        </button>
      </div>

      <div className={styles.boardGrid}>
        {renderColumn('To Do', todoTasks, 'TODO')}
        {renderColumn('In Progress', inProgressTasks, 'IN_PROGRESS')}
        {renderColumn('Completed', completedTasks, 'COMPLETED')}
      </div>

      {/* Add Task Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create & Assign Task</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className={styles.formGroup}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Task Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Complete responsive calendar UI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Detailed requirements or deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Assign To Person</label>
                  <select
                    className={styles.formSelect}
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                  >
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Priority</label>
                  <select
                    className={styles.formSelect}
                    value={priority}
                    onChange={(e) =>
                      setPriority(e.target.value as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Due Date & Time</label>
                  <input
                    type="datetime-local"
                    className={styles.formInput}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department / Category</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                </div>
              </div>

              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={syncToCalendar}
                  onChange={(e) => setSyncToCalendar(e.target.checked)}
                />
                <span className={styles.checkboxLabel}>
                  Sync this deadline directly to Google Calendar
                </span>
              </label>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalButton}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitModalButton}>
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
