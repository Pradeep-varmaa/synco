'use client';

import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import '@fullcalendar/react/skeleton.css';
import '@/styles/fullcalendar-theme.css';
import styles from './calendar.module.css';

interface SelectedEventState {
  id: string;
  title: string;
  timeRange: string;
  meetingUrl: string;
  guestsCount: number;
  color: string;
}

interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  meetingUrl?: string;
  guestsCount?: number;
  description?: string;
}

const plugins = [dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin];

// Auto-assign schedule colors based on nth-child sequence:
// 1st child: Green, 2nd: Orange, 3rd: Purple, 4th: Teal, 5th: Blue, 6th: Rose
const NTH_CHILD_COLORS = [
  '#2e8b57', // 1st child: Green
  '#ea8a47', // 2nd child: Orange
  '#7d6ecf', // 3rd child: Purple
  '#0c8388', // 4th child: Teal
  '#2563eb', // 5th child: Blue
  '#e11d48', // 6th child: Rose
];

export default function Calendar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calRef = useRef<any>(null);
  const [currentTitle, setCurrentTitle] = useState('October 2026');
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [activeEvent, setActiveEvent] = useState<SelectedEventState | null>(null);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);

  // New Event Modal State (auto-colored, no color prompt)
  const [modalOpen, setModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newStartTime, setNewStartTime] = useState('10:00');
  const [newEndTime, setNewEndTime] = useState('11:00');
  const [newMeetingUrl, setNewMeetingUrl] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/events');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEvents(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch calendar events:', e);
    }
  };

  const updateTitleFromApi = () => {
    if (calRef.current) {
      const api = calRef.current.getApi();
      setCurrentTitle(api.view.title);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    setNewDate(new Date().toISOString().split('T')[0]);
    fetchEvents();
    updateTitleFromApi();
  }, []);

  const handlePrev = () => {
    if (calRef.current) {
      calRef.current.getApi().prev();
      updateTitleFromApi();
    }
  };

  const handleNext = () => {
    if (calRef.current) {
      calRef.current.getApi().next();
      updateTitleFromApi();
    }
  };

  const handleViewChange = (view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek') => {
    setCurrentView(view);
    if (calRef.current) {
      calRef.current.getApi().changeView(view);
      updateTitleFromApi();
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;

    let timeRange = 'All Day';
    if (event.start) {
      const start = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      if (event.end) {
        const end = event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        timeRange = `${start} to ${end}`;
      } else {
        timeRange = start;
      }
    }

    setActiveEvent({
      id: event.id,
      title: event.title || 'Untitled Event',
      timeRange,
      meetingUrl: event.extendedProps.meetingUrl || '',
      guestsCount: event.extendedProps.guestsCount || 1,
      color: event.backgroundColor || '#0c8388',
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDateSelect = (selectInfo: any) => {
    setNewDate(selectInfo.startStr.split('T')[0]);
    setModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEventDrop = async (dropInfo: any) => {
    const event = dropInfo.event;
    await fetch(`/api/events/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        start: event.startStr,
        end: event.endStr || event.startStr,
        allDay: event.allDay,
      }),
    });
    fetchEvents();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const startDateTime = `${newDate}T${newStartTime}:00`;
    const endDateTime = `${newDate}T${newEndTime}:00`;

    // Automatically assign color based on nth-child: 1st=Green, 2nd=Orange, 3rd=Purple, etc.
    const autoColor = NTH_CHILD_COLORS[events.length % NTH_CHILD_COLORS.length];

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        start: startDateTime,
        end: endDateTime,
        color: autoColor,
        meetingUrl: newMeetingUrl,
        guestsCount: 1,
      }),
    });

    if (res.ok) {
      setModalOpen(false);
      setNewTitle('');
      setNewMeetingUrl('');
      fetchEvents();
    }
  };

  const handleDeleteEvent = async (id: string) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    setActiveEvent(null);
    fetchEvents();
  };

  // Custom Event Content: Just show the scheduled time on the calendar + hover effect & colors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = (eventInfo: any) => {
    const event = eventInfo.event;
    const color = (event.backgroundColor || event.borderColor || '#0c8388').toLowerCase();

    // Map color to vibrant CSS class (1st child=Green, 2nd=Orange, 3rd=Purple, etc.)
    let colorClass = styles.scheduleGreen;
    if (color === '#2e8b57' || color.includes('green')) {
      colorClass = styles.scheduleGreen;
    } else if (color === '#ea8a47' || color.includes('orange')) {
      colorClass = styles.scheduleOrange;
    } else if (color === '#7d6ecf' || color.includes('purple')) {
      colorClass = styles.schedulePurple;
    } else if (color === '#0c8388' || color.includes('teal')) {
      colorClass = styles.scheduleTeal;
    } else if (color === '#2563eb' || color.includes('blue')) {
      colorClass = styles.scheduleBlue;
    } else if (color === '#e11d48' || color.includes('rose') || color.includes('red')) {
      colorClass = styles.scheduleRose;
    }

    // Format time: only display the scheduled time
    let timeText = 'All Day';
    if (event.start) {
      const startStr = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      if (event.end) {
        const endStr = event.end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        timeText = `${startStr} - ${endStr}`;
      } else {
        timeText = startStr;
      }
    }

    const guests = event.extendedProps?.guestsCount || 1;

    return (
      <div className={styles.schedulePillWrapper}>
        <div className={`${styles.schedulePill} ${colorClass}`}>
          <span className={styles.scheduleTimeText}>{timeText}</span>
        </div>
        <div className={styles.scheduleHoverCard}>
          <span className={styles.hoverCardTitle}>{event.title || 'Event'}</span>
          <span className={styles.hoverCardMeta}>
            {timeText} • {guests} guest{guests > 1 ? 's' : ''}
          </span>
        </div>
      </div>
    );
  };

  if (!isMounted) {
    return (
      <div className={styles.calendarCard}>
        <div className={styles.calendarHeader}>
          <h2 className={styles.dateTitle}>October 2026</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.calendarCard}>
      {/* Improvised Header Toolbar */}
      <div className={styles.calendarHeader}>
        <div className={styles.navGroup}>
          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={handlePrev}
              aria-label="Previous Period"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={handleNext}
              aria-label="Next Period"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <h2 className={styles.dateTitle}>{currentTitle}</h2>
        </div>

        {/* 4 View Pills Switcher */}
        {/* <div className={styles.viewSwitcher}>
          <button
            type="button"
            className={`${styles.viewPill} ${currentView === 'dayGridMonth' ? styles.viewPillActive : ''}`}
            onClick={() => handleViewChange('dayGridMonth')}
          >
            Month
          </button>
          <button
            type="button"
            className={`${styles.viewPill} ${currentView === 'timeGridWeek' ? styles.viewPillActive : ''}`}
            onClick={() => handleViewChange('timeGridWeek')}
          >
            Week
          </button>
          <button
            type="button"
            className={`${styles.viewPill} ${currentView === 'timeGridDay' ? styles.viewPillActive : ''}`}
            onClick={() => handleViewChange('timeGridDay')}
          >
            Day
          </button>
          <button
            type="button"
            className={`${styles.viewPill} ${currentView === 'listWeek' ? styles.viewPillActive : ''}`}
            onClick={() => handleViewChange('listWeek')}
          >
            Agenda
          </button>
        </div> */}
      </div>

      {/* FullCalendar Component (Compressed to screen height) */}
      <div className={styles.calendarWrapper}>
        <FullCalendar
          ref={calRef}
          plugins={plugins}
          initialView="dayGridMonth"
          initialDate="2026-10-01"
          headerToolbar={false}
          events={events}
          eventContent={renderEventContent}
          datesSet={(dateInfo) => setCurrentTitle(dateInfo.view.title)}
          selectable
          editable
          nowIndicator
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleEventDrop}
          eventResize={handleEventDrop}
          height="100%"
        />
      </div>

      {/* Event Details Popover (Join Meet / Edit / Delete) */}
      {activeEvent && (
        <>
          <div className={styles.popoverBackdrop} onClick={() => setActiveEvent(null)} />
          <div className={styles.eventPopover}>
            <h4 className={styles.popoverTitle}>{activeEvent.title}</h4>
            <div className={styles.popoverMeta}>
              <span>{activeEvent.timeRange}</span>
              <span>•</span>
              <span>{activeEvent.guestsCount} guest{activeEvent.guestsCount > 1 ? 's' : ''}</span>
            </div>
            <div className={styles.popoverActions}>
              {activeEvent.meetingUrl && (
                <a
                  href={activeEvent.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.joinMeetButton}
                >
                  Join Meet
                </a>
              )}
              <button
                type="button"
                className={styles.editButton}
                onClick={() => {
                  setNewTitle(activeEvent.title);
                  setNewMeetingUrl(activeEvent.meetingUrl);
                  setActiveEvent(null);
                  setModalOpen(true);
                }}
              >
                Edit
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => handleDeleteEvent(activeEvent.id)}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {/* Schedule Event Modal with 6 Color Swatches */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Schedule New Event</h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className={styles.formGroup}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Design review"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Scheduled Time (Start - End)</label>
                <div className={styles.timeInputsRow}>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className={styles.formInput}
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Meeting Link (Google Meet)</label>
                <input
                  type="url"
                  className={styles.formInput}
                  value={newMeetingUrl}
                  onChange={(e) => setNewMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/xyz"
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.cancelModalButton}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitModalButton}>
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
