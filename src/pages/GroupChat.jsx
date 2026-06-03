import { useState, useEffect, useCallback, useRef, useMemo, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { messageService } from '../services/apiService';
import { socket } from '../socket';
import Avatar from '../components/Avatar';
import Navbar from '../components/Navbar';
import { shareToClipboard } from '../utils/share';

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString();
};

const formatDayLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - messageDay) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 6) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function GroupChat() {
  const navigate = useNavigate();
  const { groupId } = useParams();
  const { user } = useUser();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const messagesEndRef = useRef(null);
  const currentUserId = user?.id || user?._id || null;

  const appendMessage = useCallback((incoming) => {
    if (!incoming) return;
    const incomingId = incoming?._id || incoming?.id;
    setMessages((prev) => {
      if (!incomingId) return [...prev, incoming];
      if (prev.some((item) => String(item._id || item.id) === String(incomingId))) return prev;
      return [...prev, incoming];
    });
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const loadGroupChat = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await messageService.getGroupChat(groupId);
        setGroup(response.data);
        setNewGroupName(response.data.name);

        const messagesResponse = await messageService.getGroupMessages(groupId, { limit: 40 });
        const list = Array.isArray(messagesResponse?.data) ? messagesResponse.data : [];
        const seen = new Set();
        const deduped = [];
        list.reverse().forEach((msg) => {
          const msgId = msg?._id || msg?.id;
          if (!msgId) {
            deduped.push(msg);
            return;
          }
          const key = String(msgId);
          if (seen.has(key)) return;
          seen.add(key);
          deduped.push(msg);
        });
        setMessages(deduped);

        socket.emit('joinGroupChat', groupId);
      } catch (err) {
        setError('Failed to load group chat');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) loadGroupChat();
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;

    const handleMessageCreated = (payload) => {
      const message = payload?.message || payload;
      if (payload?.groupId && payload.groupId !== groupId) return;
      appendMessage(message);
    };

    const handleMessageDeleted = (payload) => {
      const messageId = payload?.messageId || payload?.id;
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId && msg.id !== messageId));
    };

    const handleUserTyping = (payload) => {
      if (payload?.groupId && payload.groupId !== groupId) return;
      const userId = payload?.userId;
      if (userId && String(userId) !== String(currentUserId)) {
        setTypingUsers((prev) => new Set([...prev, userId]));
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(userId);
            return next;
          });
        }, 3000);
      }
    };

    socket.on('message:created', handleMessageCreated);
    socket.on('message:deleted', handleMessageDeleted);
    socket.on('user:typing', handleUserTyping);

    return () => {
      socket.emit('leaveGroupChat', groupId);
      socket.off('message:created', handleMessageCreated);
      socket.off('message:deleted', handleMessageDeleted);
      socket.off('user:typing', handleUserTyping);
    };
  }, [groupId, currentUserId, appendMessage]);

  const handleSendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !groupId || isSending) return;

    setIsSending(true);
    setSendError('');
    setText('');
    try {
      const response = await messageService.sendGroupMessage(groupId, { text: trimmed });
      const message = response?.data;
      if (message) {
        appendMessage(message);
      }
    } catch (err) {
      console.error(err);
      setSendError(err?.response?.data?.error || 'Failed to send message.');
      setText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleShareGroup = async () => {
    if (!groupId || isSharing) return;
    setIsSharing(true);
    setShareMessage('');
    try {
      await shareToClipboard({ type: 'group', id: groupId });
      setShareMessage('Group link copied!');
      setTimeout(() => setShareMessage(''), 2200);
    } catch (err) {
      console.error(err);
      setShareMessage('Failed to copy group link');
      setTimeout(() => setShareMessage(''), 2200);
    } finally {
      setIsSharing(false);
    }
  };

  const handleUpdateGroupName = async () => {
    if (!newGroupName.trim() || newGroupName === group.name) {
      setEditingGroupName(false);
      return;
    }

    try {
      await messageService.updateGroupChat(groupId, { name: newGroupName.trim() });
      setGroup((prev) => ({ ...prev, name: newGroupName.trim() }));
      setEditingGroupName(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this group?')) return;

    try {
      await messageService.leaveGroupChat(groupId);
      navigate('/messages');
    } catch (err) {
      console.error(err);
    }
  };

  const isAdmin = group && String(group.admin?._id || group.admin) === String(currentUserId);

  const groupedMessages = useMemo(() => {
    const grouped = {};
    messages.forEach((message) => {
      const dayKey = getDayKey(message.createdAt);
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      grouped[dayKey].push(message);
    });
    return grouped;
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary-container border-t-primary rounded-full mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading group chat...</p>
        </div>
      </div>
    );
  }

  if (error || !group) {
    return (
      <div className="min-h-screen bg-background text-on-background font-body-md flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-5xl text-error mb-4 block">error_outline</span>
          <p className="text-lg font-semibold text-on-surface mb-2">{error || 'Group not found'}</p>
          <button
            onClick={() => navigate('/messages')}
            className="mt-4 px-4 py-2 bg-primary-container text-white rounded-lg font-medium hover:bg-primary transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background text-on-background font-body-md flex flex-col">
      <Navbar currentUser={user} />
      
      {/* Group Header */}
      <header className="sticky top-16 z-20 border-b border-outline-variant/30 bg-white dark:bg-gray-900 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => navigate('/messages')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-on-surface truncate">{group.name}</h1>
              <p className="text-xs text-on-surface-variant">{group.members?.length || 0} members</p>
            </div>
          </div>
          <button
            onClick={handleShareGroup}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            aria-label="Share group"
            disabled={isSharing}
          >
            <span className="material-symbols-outlined">{isSharing ? 'progress_activity' : 'share'}</span>
          </button>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors flex-shrink-0"
            aria-label="Group info"
          >
            <span className="material-symbols-outlined">info</span>
          </button>
        </div>
      </header>
      {shareMessage ? (
        <div className={`px-4 py-2 text-sm font-semibold sm:px-6 ${
          shareMessage.includes('Failed') ? 'text-error' : 'text-green-600'
        }`}>
          {shareMessage}
        </div>
      ) : null}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {Object.entries(groupedMessages).map(([dayKey, dayMessages]) => (
          <Fragment key={dayKey}>
            <div className="flex justify-center py-2">
              <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {formatDayLabel(dayMessages[0].createdAt)}
              </span>
            </div>
            {dayMessages.map((message) => {
              const isMine = String(message.sender?._id || message.sender) === String(currentUserId);
              const sender = message.sender;
              return (
                <div key={message._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMine && (
                    <Avatar
                      src={sender?.profile?.avatar || sender?.avatar}
                      name={sender?.username}
                      className="h-8 w-8 flex-shrink-0"
                    />
                  )}
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1`}>
                    {!isMine && (
                      <p className="text-xs font-semibold text-on-surface-variant">{sender?.username}</p>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm break-words ${
                        isMine
                          ? 'bg-primary-container text-white'
                          : 'bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      {message.text}
                    </div>
                    <p className="text-xs text-on-surface-variant">{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            })}
          </Fragment>
        ))}
        {typingUsers.size > 0 && (
          <div className="flex gap-2 items-center text-xs text-on-surface-variant italic">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-on-surface-variant rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            Someone is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-outline-variant/30 bg-white dark:bg-gray-900 px-4 sm:px-6 py-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex gap-2 items-end">
          <input
            type="text"
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isSending}
            className="flex-1 rounded-full border border-outline-variant px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-container/50 focus:border-primary-container transition-all"
          />
          <button
            onClick={handleSendMessage}
            disabled={!text.trim() || isSending}
            className="p-3 rounded-full bg-primary-container text-white hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-container/50 flex-shrink-0"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined">{isSending ? 'progress_activity' : 'send'}</span>
          </button>
        </div>
        {sendError ? (
          <p className="mt-2 text-xs font-semibold text-error">{sendError}</p>
        ) : null}
      </div>

      {/* Group Info Panel */}
      {showInfo && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-4 md:p-0">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-white dark:bg-gray-900 p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Group Info</h2>
              <button
                onClick={() => setShowInfo(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                aria-label="Close"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Group Name */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-on-surface mb-2 block">Group Name</label>
              {editingGroupName ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="flex-1 rounded-lg border border-outline-variant px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-container/50"
                  />
                  <button
                    onClick={handleUpdateGroupName}
                    className="px-4 py-2 bg-primary-container text-white rounded-lg font-semibold hover:bg-primary transition-colors"
                  >
                    Save
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg">
                  <p className="font-semibold">{group.name}</p>
                  {isAdmin && (
                    <button
                      onClick={() => setEditingGroupName(true)}
                      className="text-primary hover:text-primary/90 transition-colors"
                      aria-label="Edit group name"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Members */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-on-surface mb-3">Members ({group.members?.length || 0})</h3>
              <div className="space-y-2">
                {group.members?.map((member) => (
                  <div key={member._id} className="flex items-center justify-between p-3 bg-surface-container-lowest rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={member.profile?.avatar || member.avatar}
                        name={member.username}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-semibold text-sm">{member.username}</p>
                        {String(group.admin?._id || group.admin) === String(member._id) && (
                          <p className="text-xs text-on-surface-variant">Admin</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leave Group */}
            <button
              onClick={handleLeaveGroup}
              className="w-full px-4 py-3 bg-error text-white rounded-lg font-semibold hover:bg-error/90 transition-colors"
            >
              Leave Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
