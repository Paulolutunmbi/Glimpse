import { useState, useEffect, useRef } from 'react';
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col h-[95dvh] sm:h-auto sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        <header className="flex items-center justify-between border-b border-outline-variant/30 px-6 py-4 flex-shrink-0">
          <h2 className="text-lg font-bold text-on-surface">Create Group Chat</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-surface-container transition-colors text-on-surface-variant hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </header>

        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5">
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
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div key={user._id || user.id} className="flex items-center gap-2 rounded-full bg-primary/10 pl-2 pr-3 py-1.5 border border-primary/20">
                    <Avatar src={user.profile?.avatar || user.avatar} name={user.username} className="w-5 h-5" />
                    <span className="text-xs font-semibold text-primary">{user.username}</span>
                    <button onClick={() => toggleUser(user)} className="text-primary hover:text-primary/70 ml-1">
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 border border-outline-variant/30 rounded-xl overflow-hidden divide-y divide-outline-variant/30 max-h-48 sm:max-h-60 overflow-y-auto">
                {searchResults.map((user) => {
                  const isSelected = selectedUsers.some((u) => u._id === user._id || u.id === user.id);
                  return (
                    <button
                      key={user._id || user.id}
                      onClick={() => toggleUser(user)}
                      className="w-full flex items-center justify-between p-3 hover:bg-surface-container-lowest transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={user.profile?.avatar || user.avatar} name={user.username} className="w-10 h-10" />
                        <div>
                          <p className="font-semibold text-sm text-on-surface">{user.username}</p>
                          <p className="text-xs text-on-surface-variant">{user.fullName}</p>
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-primary border-primary' : 'border-outline-variant'}`}>
                        {isSelected && <span className="material-symbols-outlined text-white text-[16px]">check</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <footer className="border-t border-outline-variant/30 p-4 sm:p-5 flex gap-3 flex-shrink-0 bg-surface-container-lowest sm:rounded-b-2xl pb-safe">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-outline-variant font-semibold hover:bg-surface-container transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isSubmitting || !name.trim() || selectedUsers.length === 0}
            className="flex-1 px-4 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
