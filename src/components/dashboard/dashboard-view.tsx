'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  Calendar,
  Users,
  FileText,
} from 'lucide-react';
import { TaskItem } from '@/app/api/tasks/route';
import { CalendarEventItem } from '@/app/api/events/route';
import styles from './dashboard.module.css';

export default function DashboardView() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [notesCount, setNotesCount] = useState(0);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setTasks(data);
      })
      .catch((e) => console.error(e));

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data);
      })
      .catch((e) => console.error(e));

    fetch('/api/notes')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotesCount(data.length);
      })
      .catch((e) => console.error(e));
  }, []);

  const pendingTasks = tasks.filter((t) => t.status !== 'COMPLETED');
  const delegatedTasks = tasks.filter((t) => t.assigneeName !== 'Praveen Kumar');

  return (
    <div className={styles.dashboardContainer}>
      {/* 4 Metric Cards */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconTeal}`}>
            <CheckSquare size={22} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNumber}>{pendingTasks.length}</span>
            <span className={styles.metricLabel}>Pending Tasks</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconOrange}`}>
            <Calendar size={22} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNumber}>{events.length}</span>
            <span className={styles.metricLabel}>Scheduled Events</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>
            <Users size={22} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNumber}>{delegatedTasks.length}</span>
            <span className={styles.metricLabel}>Delegated to Team</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>
            <FileText size={22} />
          </div>
          <div className={styles.metricDetails}>
            <span className={styles.metricNumber}>{notesCount}</span>
            <span className={styles.metricLabel}>Active Notes</span>
          </div>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className={styles.contentGrid}>
        {/* Recent Tasks */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>High Priority Tasks</h3>
            <Link href="/tasks" className={styles.viewAllLink}>
              View All Tasks →
            </Link>
          </div>

          <div className={styles.taskList}>
            {tasks.length === 0 ? (
              <p className={styles.emptyNotice}>No tasks created yet. Click Tasks in the sidebar to add your first task.</p>
            ) : (
              tasks.slice(0, 5).map((task) => (
                <div key={task.id} className={styles.taskRow}>
                  <div className={styles.taskInfo}>
                    <CheckSquare size={16} color="#0c8388" />
                    <span className={styles.taskTitleText}>{task.title}</span>
                  </div>

                  <div className={styles.taskAssignee}>
                    <div className={styles.assigneeMiniAvatar}>
                      {task.assigneeName.slice(0, 2).toUpperCase()}
                    </div>
                    <span>{task.assigneeName}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className={styles.sectionCard}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>Today's Schedule</h3>
            <Link href="/calendar" className={styles.viewAllLink}>
              Open Calendar →
            </Link>
          </div>

          <div className={styles.eventsList}>
            {events.length === 0 ? (
              <p className={styles.emptyNotice}>No events scheduled today. Click Calendar to schedule an event.</p>
            ) : (
              events.slice(0, 4).map((evt) => (
                <div key={evt.id} className={styles.eventItem}>
                  <div className={styles.eventDetails}>
                    <span className={styles.eventItemTitle}>{evt.title}</span>
                    <span className={styles.eventItemTime}>
                      {new Date(evt.start).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {evt.guestsCount || 1} guests
                    </span>
                  </div>

                  {evt.meetingUrl && (
                    <a
                      href={evt.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.meetButton}
                    >
                      Join
                    </a>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
