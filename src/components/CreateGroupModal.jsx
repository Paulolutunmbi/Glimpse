import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { searchService, messageService } from '../services/apiService';
import Avatar from './Avatar';

export default function CreateGroupModal({ onClose, onGroupCreated }) {
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const response = await searchService.search({ query, limit: 10 });
        setSearchResults(Array.isArray(response?.users) ? response.users : []);
      } catch (err) {
        console.error(err);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  // Prevent background scroll and close on Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const toggleUser = (user) => {
    setSelectedUsers((prev) => {
      const isSelected = prev.some((u) => u._id === user._id || u.id === user.id);
      if (isSelected) {
        return prev.filter((u) => u._id !== user._id && u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    if (selectedUsers.length === 0) {
      setError('Please select at least one member');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const memberIds = selectedUsers.map((u) => u._id || u.id);
      const response = await messageService.createGroupChat({ name: name.trim(), memberIds });
      if (response?.data) {
        onGroupCreated(response.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create group');
      setIsSubmitting(false);
    }
  };

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex h-[min(92dvh,720px)] max-h-[92dvh] w-full max-w-[min(100vw,520px)] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-gray-900 sm:h-auto sm:max-h-[86dvh] sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <header className="flex flex-shrink-0 items-center justify-between border-b border-outline-variant/30 px-4 py-3 sm:px-5">
          <h2 className="truncate text-base font-bold text-on-surface sm:text-lg">Create Group Chat</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {error && (
            <div className="rounded-xl bg-error-container/50 px-4 py-3 text-sm text-on-error-container border border-error/20">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Group Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="E.g., Weekend Trip, Squad..."
              className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-on-surface mb-2">Add Members</label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search users..."
                className="w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-10 pr-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-xl bg-surface-container-lowest p-2">
                {selectedUsers.map((user) => (
                  <div key={user._id || user.id} className="flex max-w-full items-center gap-2 rounded-full border border-primary/20 bg-primary/10 py-1.5 pl-2 pr-2">
                    <Avatar src={user.profile?.avatar || user.avatar} name={user.username} className="w-5 h-5" />
                    <span className="min-w-0 truncate text-xs font-semibold text-primary">{user.username}</span>
                    <button type="button" onClick={() => toggleUser(user)} className="ml-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-primary hover:bg-primary/10 hover:text-primary/70" aria-label={`Remove ${user.username}`}>
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-3 max-h-[min(34dvh,260px)] overflow-y-auto overscroll-contain rounded-xl border border-outline-variant/30 divide-y divide-outline-variant/30">
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some((u) => u._id === user._id || u.id === user.id);
                  return (
                    <button
                      key={user._id || user.id}
                      onClick={() => toggleUser(user)}
                      className="w-full flex items-center justify-between p-3 hover:bg-surface-container-lowest transition-colors text-left"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={user.profile?.avatar || user.avatar} name={user.username} className="w-10 h-10" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-on-surface">{user.username}</p>
                          <p className="truncate text-xs text-on-surface-variant">{user.fullName}</p>
                        </div>
                      </div>
                      <div className={`ml-3 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                        {isSelected && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="flex flex-shrink-0 gap-3 border-t border-outline-variant/30 bg-surface-container-lowest p-4 pb-safe sm:rounded-b-2xl sm:p-5">
          <button
            type="button"
            onClick={onClose}
            className="min-w-0 flex-1 rounded-xl border border-outline-variant px-4 py-3 font-semibold transition-colors hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-outline-variant/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={isSubmitting || !name.trim() || selectedUsers.length === 0}
            className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Creating...
              </>
            ) : (
              'Create Group'
            )}
          </button>
        </footer>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
