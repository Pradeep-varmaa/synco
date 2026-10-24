'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Pin, Trash2, Pencil, Search, X } from 'lucide-react';
import { NoteItem } from '@/app/api/notes/route';
import styles from './notes.module.css';

export default function NotesGrid() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Ideas');
  const [isPinned, setIsPinned] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await fetch('/api/notes');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotes(data);
      }
    } catch (e) {
      console.error('Failed to load notes', e);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const openCreateModal = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setCategory('Ideas');
    setIsPinned(false);
    setModalOpen(true);
  };

  const openEditModal = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category || 'General');
    setIsPinned(note.isPinned);
    setModalOpen(true);
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingNoteId) {
      // Update existing note
      const res = await fetch(`/api/notes/${editingNoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          isPinned,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setEditingNoteId(null);
        setTitle('');
        setContent('');
        fetchNotes();
      }
    } else {
      // Create new note
      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          category,
          isPinned,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setTitle('');
        setContent('');
        setIsPinned(false);
        fetchNotes();
      }
    }
  };

  const handleDeleteNote = async (id: string) => {
    await fetch(`/api/notes/${id}`, { method: 'DELETE' });
    fetchNotes();
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.notesContainer}>
      <div className={styles.notesHeader}>
        <div className={styles.searchBar}>
          <Search size={16} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search notes by keyword or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <button
          type="button"
          className={styles.addNoteButton}
          onClick={openCreateModal}
        >
          <Plus size={16} />
          <span>New Note</span>
        </button>
      </div>

      {filteredNotes.length === 0 ? (
        <div className={styles.emptyNotesNotice}>
          No notes created yet. Click &quot;New Note&quot; to write your first note.
        </div>
      ) : (
        <div className={styles.notesGrid}>
          {filteredNotes.map((note) => (
            <div key={note.id} className={styles.noteCard}>
              <div className={styles.noteTop}>
                <span className={styles.categoryBadge}>{note.category}</span>
                {note.isPinned && <Pin size={16} className={styles.notePin} />}
              </div>

              <h3 className={styles.noteTitle}>{note.title}</h3>
              <p className={styles.noteContent}>{note.content}</p>

              <div className={styles.noteFooter}>
                <span>
                  {note.createdAt
                    ? new Date(note.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : ''}
                </span>
                <div className={styles.noteActions}>
                  <button
                    type="button"
                    className={styles.editNoteButton}
                    onClick={() => openEditModal(note)}
                    aria-label="Edit note"
                    title="Edit note"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.deleteNoteButton}
                    onClick={() => handleDeleteNote(note.id)}
                    aria-label="Delete note"
                    title="Delete note"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingNoteId ? 'Edit Note' : 'Create New Note'}
              </h3>
              <button
                type="button"
                className={styles.closeButton}
                onClick={() => setModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className={styles.formGroup}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Title</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Note title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Category / Tag</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g. Design, Sprint, Reference"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Content</label>
                <textarea
                  className={styles.formTextarea}
                  placeholder="Write your note here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  required
                />
              </div>

              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                />
                <span className={styles.checkboxLabel}>Pin this note to the top</span>
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
                  {editingNoteId ? 'Update Note' : 'Save Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
