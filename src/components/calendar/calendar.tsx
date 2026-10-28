'use client';

import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/react/daygrid';
import timeGridPlugin from '@fullcalendar/react/timegrid';
import listPlugin from '@fullcalendar/react/list';
import interactionPlugin from '@fullcalendar/react/interaction';
import { ChevronLeft, ChevronRight, Settings, X } from 'lucide-react';

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

// Auto-assign schedule colors based on reference palette:
// Purple, Green, Amber, Pink, Blue, Sky, Orange, Teal
const NTH_CHILD_COLORS = [
  '#8b5cf6', // 1st: Purple (Team Meeting)
  '#10b981', // 2nd: Green (Code Review / Design Review)
  '#f59e0b', // 3rd: Amber / Yellow (UI Discussion)
  '#ec4899', // 4th: Pink / Magenta (Client Call)
  '#3b82f6', // 5th: Blue (Project Update)
  '#0ea5e9', // 6th: Sky Blue (Frontend Work)
  '#ff7a45', // 7th: Orange
  '#0c8388', // 8th: Teal
];

export default function Calendar() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calRef = useRef<any>(null);
  const [currentTitle, setCurrentTitle] = useState('October 2026');
  const [currentView, setCurrentView] = useState<'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek'>('dayGridMonth');
  const [activeEvent, setActiveEvent] = useState<SelectedEventState | null>(null);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);

  // New Event Modal State
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

  const handleToday = () => {
    if (calRef.current) {
      calRef.current.getApi().today();
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
        timeRange = `${start} - ${end}`;
      } else {
        timeRange = start;
      }
    }

    setActiveEvent({
      id: event.id,
      title: event.title || 'Untitled Event',
      timeRange,
      meetingUrl: event.extendedProps?.meetingUrl || '',
      guestsCount: event.extendedProps?.guestsCount || 1,
      color: event.backgroundColor || '#8b5cf6',
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

    // Automatically assign color based on nth-child: 1st=Purple, 2nd=Green, 3rd=Amber, etc.
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

  // Custom Event Content: matching Reference UI (Card with accent stripe, dot + title, time underneath)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderEventContent = (eventInfo: any) => {
    const event = eventInfo.event;
    const color = (event.backgroundColor || event.borderColor || '#8b5cf6').toLowerCase();

    // Map color to matching card and dot classes
    let cardClass = styles.cardPurple;
    let dotClass = styles.dotPurple;

    if (color === '#8b5cf6' || color.includes('purple')) {
      cardClass = styles.cardPurple;
      dotClass = styles.dotPurple;
    } else if (color === '#10b981' || color === '#2e8b57' || color.includes('green')) {
      cardClass = styles.cardGreen;
      dotClass = styles.dotGreen;
    } else if (color === '#f59e0b' || color.includes('amber') || color.includes('yellow')) {
      cardClass = styles.cardAmber;
      dotClass = styles.dotAmber;
    } else if (color === '#ec4899' || color.includes('pink') || color.includes('magenta')) {
      cardClass = styles.cardPink;
      dotClass = styles.dotPink;
    } else if (color === '#3b82f6' || color.includes('blue')) {
      cardClass = styles.cardBlue;
      dotClass = styles.dotBlue;
    } else if (color === '#0ea5e9' || color.includes('sky')) {
      cardClass = styles.cardSky;
      dotClass = styles.dotSky;
    } else if (color === '#ff7a45' || color === '#ea8a47' || color.includes('orange')) {
      cardClass = styles.cardOrange;
      dotClass = styles.dotOrange;
    } else if (color === '#0c8388' || color.includes('teal')) {
      cardClass = styles.cardTeal;
      dotClass = styles.dotTeal;
    } else if (color === '#e11d48' || color.includes('rose') || color.includes('red')) {
      cardClass = styles.cardRose;
      dotClass = styles.dotRose;
    }

    // Format time: e.g. 10:00 - 11:00
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

    return (
      <div className={`${styles.eventCard} ${cardClass}`}>
        <div className={styles.eventCardHeader}>
          <span className={`${styles.eventDot} ${dotClass}`} />
          <span className={styles.eventTitleText} title={event.title}>
            {event.title || 'Untitled Event'}
          </span>
        </div>
        <span className={styles.eventTimeText}>{timeText}</span>
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
      {/* Header Toolbar matching Reference UI */}
      <div className={styles.calendarHeader}>
        <div className={styles.navGroup}>
          <div className={styles.navButtons}>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={handlePrev}
              aria-label="Previous Month"
              title="Previous"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              className={styles.arrowButton}
              onClick={handleNext}
              aria-label="Next Month"
              title="Next"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h2 className={styles.dateTitle}>{currentTitle}</h2>

          <button
            type="button"
            className={styles.todayButton}
            onClick={handleToday}
          >
            Today
          </button>
        </div>

        {/* Right Action Section: View Switcher (Month, Week, Day) + Settings Button */}
        <div className={styles.headerActions}>
          <div className={styles.viewSwitcher}>
            <button
              type="button"
              className={`${styles.viewTab} ${currentView === 'dayGridMonth' ? styles.viewTabActive : ''}`}
              onClick={() => handleViewChange('dayGridMonth')}
            >
              Month
            </button>
            <button
              type="button"
              className={`${styles.viewTab} ${currentView === 'timeGridWeek' ? styles.viewTabActive : ''}`}
              onClick={() => handleViewChange('timeGridWeek')}
            >
              Week
            </button>
            <button
              type="button"
              className={`${styles.viewTab} ${currentView === 'timeGridDay' ? styles.viewTabActive : ''}`}
              onClick={() => handleViewChange('timeGridDay')}
            >
              Day
            </button>
          </div>

          <button
            type="button"
            className={styles.settingsButton}
            onClick={() => setModalOpen(true)}
            aria-label="New Event"
            title="Create New Event"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {/* FullCalendar Component */}
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

      {/* Schedule Event Modal Dialog */}
      {modalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Schedule New Event</h3>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setModalOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Code Review"
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

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Start Time</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>End Time</label>
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
                  className={styles.cancelBtn}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.saveBtn}>
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
