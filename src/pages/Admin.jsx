import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { adminService } from '../services/apiService';
import { socket } from '../socket';
import StatusMessage from '../components/StatusMessage';

const ADMIN_EMAIL = 'oluwatunmbipaul@gmail.com';

const Admin = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
      return;
    }
  }, [isAdmin, navigate]);

  const loadUsers = useCallback(
    async (p = 1, s = '') => {
      setLoading(true);
      setError(null);
      try {
        const response = await adminService.listUsers({ page: p, limit: 20, search: s });
        setUsers(response.data || []);
        setPagination(response.pagination);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadUsers(page, search);
  }, [page, search, loadUsers]);

  const handleSearch = () => {
    if (searchInput !== search) {
      setPage(1);
      setSearch(searchInput);
    }
  };

  const banUser = async (userId) => {
    setActionLoading(userId);
    try {
      await adminService.banUser(userId, { reason: 'Manual admin action' });
      setSuccess('User banned');
      setConfirmAction(null);
      await loadUsers(page, search);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to ban user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const unbanUser = async (userId) => {
    setActionLoading(userId);
    try {
      await adminService.unbanUser(userId);
      setSuccess('User unbanned');
      setConfirmAction(null);
      await loadUsers(page, search);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to unban user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteUser = async (userId) => {
    setActionLoading(userId);
    try {
      await adminService.deleteUser(userId);
      setSuccess('User deleted');
      setConfirmAction(null);
      await loadUsers(page, search);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    const handleAdminAlert = (payload) => {
      const alert = payload?.notification || payload;
      if (!alert) return;
      setAlerts((prev) => [alert, ...prev]);
      setTimeout(() => {
        setAlerts((prev) => prev.filter((item) => item._id !== alert._id));
      }, 8000);
    };

    const handleUserUpdated = (payload) => {
      const updated = payload?.user;
      if (!updated) return;
      setUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
    };

    const handleUserDeleted = (payload) => {
      const userId = payload?.userId;
      if (!userId) return;
      setUsers((prev) => prev.filter((item) => item.id !== userId));
    };

    socket.on('admin:alert', handleAdminAlert);
    socket.on('admin:userUpdated', handleUserUpdated);
    socket.on('admin:userDeleted', handleUserDeleted);

    return () => {
      socket.off('admin:alert', handleAdminAlert);
      socket.off('admin:userUpdated', handleUserUpdated);
      socket.off('admin:userDeleted', handleUserDeleted);
    };
  }, []);

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased pt-16 pb-20 md:pb-0">
      <header className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 shadow-[0_20px_20px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 font-['Plus_Jakarta_Sans'] text-[#FF5A5F]">
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <button
            className="rounded-full p-2 text-zinc-500 transition-colors duration-200 hover:bg-zinc-50"
            type="button"
            aria-label="Back"
            onClick={() => navigate('/profile')}
          >
            <span className="material-symbols-outlined text-[#FF5A5F]">close</span>
          </button>
        </div>
      </header>

      <main className="mx-auto mt-xl max-w-[1200px] px-margin_mobile md:px-margin_desktop">
        {error && (
          <div className="mb-md">
            <StatusMessage tone="error">{error}</StatusMessage>
          </div>
        )}
        {success && (
          <div className="mb-md">
            <StatusMessage tone="success">{success}</StatusMessage>
          </div>
        )}

        {alerts.map((alert) => (
          <div key={alert._id} className="mb-md">
            <StatusMessage tone="info">{alert.preview}</StatusMessage>
          </div>
        ))}

        {confirmAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-white p-6 text-center shadow-xl">
              <h3 className="mb-2 font-h3 text-h3 text-on-surface">Confirm Action</h3>
              <p className="mb-6 text-on-surface-variant">{confirmAction.message}</p>
              <div className="flex gap-3 justify-center">
                <button
                  className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-label-md text-label-md text-on-surface transition-all active:scale-95"
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  className="rounded-lg border-b-2 border-error/20 bg-error-container px-4 py-2 font-label-md text-label-md text-on-error transition-all active:scale-95 disabled:opacity-50"
                  type="button"
                  onClick={confirmAction.onConfirm}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-xl">
          <h2 className="mb-md font-h2 text-h2 text-on-surface">Users</h2>

          <div className="mb-lg flex flex-col gap-md md:flex-row md:items-end">
            <label className="flex-1">
              <span className="font-label-md text-label-md text-on-surface">Search users</span>
              <input
                className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 text-body-sm text-on-surface outline-none transition-all placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                placeholder="Name, username, or email..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
            <button
              className="rounded-lg border-b-2 border-primary/20 bg-primary-container px-lg py-sm font-label-md text-label-md text-on-primary shadow-sm transition-all active:scale-95 disabled:opacity-50"
              type="button"
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-on-surface-variant">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
            No users found.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant">
                    <th className="px-4 py-3 text-left font-label-md text-label-md text-on-surface">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left font-label-md text-label-md text-on-surface">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left font-label-md text-label-md text-on-surface">
                      Joined
                    </th>
                    <th className="px-4 py-3 text-left font-label-md text-label-md text-on-surface">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right font-label-md text-label-md text-on-surface">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/30 hover:bg-surface-container-lowest transition-colors">
                      <td className="px-4 py-3 text-body-sm text-on-surface">
                        {u.fullName || u.name}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">{u.email}</td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-body-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full font-label-sm text-label-sm ${
                            u.isBanned
                              ? 'bg-error-container text-on-error-container'
                              : 'bg-tertiary-fixed/30 text-on-tertiary-container'
                          }`}
                        >
                          {u.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            className="rounded px-3 py-1 text-[12px] font-label-md text-label-md text-primary-container transition-all active:scale-95 disabled:opacity-50"
                            type="button"
                            onClick={() => setSelectedUser(u)}
                            disabled={actionLoading}
                          >
                            Details
                          </button>
                          {u.isBanned ? (
                            <button
                              className="rounded px-3 py-1 text-[12px] font-label-md text-label-md text-tertiary transition-all active:scale-95 disabled:opacity-50"
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  message: `Unban ${u.email}?`,
                                  onConfirm: () => unbanUser(u.id),
                                })
                              }
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? '...' : 'Unban'}
                            </button>
                          ) : (
                            <button
                              className="rounded px-3 py-1 text-[12px] font-label-md text-label-md text-error transition-all active:scale-95 disabled:opacity-50"
                              type="button"
                              onClick={() =>
                                setConfirmAction({
                                  message: `Ban ${u.email}?`,
                                  onConfirm: () => banUser(u.id),
                                })
                              }
                              disabled={actionLoading === u.id}
                            >
                              {actionLoading === u.id ? '...' : 'Ban'}
                            </button>
                          )}
                          <button
                            className="rounded px-3 py-1 text-[12px] font-label-md text-label-md text-error transition-all active:scale-95 disabled:opacity-50"
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                message: `Delete ${u.email}? This is permanent.`,
                                onConfirm: () => deleteUser(u.id),
                              })
                            }
                            disabled={actionLoading === u.id}
                          >
                            {actionLoading === u.id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="mt-lg flex justify-center gap-2">
                <button
                  className="rounded px-3 py-2 text-body-sm transition-all active:scale-95 disabled:opacity-50"
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  Prev
                </button>
                <span className="px-3 py-2 text-body-sm text-on-surface-variant">
                  Page {page} of {pagination.pages}
                </span>
                <button
                  className="rounded px-3 py-2 text-body-sm transition-all active:scale-95 disabled:opacity-50"
                  type="button"
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages || loading}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="rounded-xl bg-white p-6 shadow-xl max-w-md w-full mx-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-h3 text-h3 text-on-surface">User Details</h3>
                <button
                  className="rounded-full p-2 text-zinc-500 transition-colors hover:bg-zinc-50"
                  type="button"
                  onClick={() => setSelectedUser(null)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="space-y-3 text-body-sm text-on-surface-variant">
                <div>
                  <span className="font-label-md text-on-surface">Name:</span> {selectedUser.fullName || selectedUser.name}
                </div>
                <div>
                  <span className="font-label-md text-on-surface">Email:</span> {selectedUser.email}
                </div>
                <div>
                  <span className="font-label-md text-on-surface">Username:</span> {selectedUser.username || 'N/A'}
                </div>
                <div>
                  <span className="font-label-md text-on-surface">Joined:</span>{' '}
                  {new Date(selectedUser.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-label-md text-on-surface">Status:</span>{' '}
                  <span
                    className={`inline-block px-2 py-1 rounded-full font-label-sm text-label-sm ${
                      selectedUser.isBanned
                        ? 'bg-error-container text-on-error-container'
                        : 'bg-tertiary-fixed/30 text-on-tertiary-container'
                    }`}
                  >
                    {selectedUser.isBanned ? 'Banned' : 'Active'}
                  </span>
                </div>
                {selectedUser.isBanned && selectedUser.banReason && (
                  <div>
                    <span className="font-label-md text-on-surface">Ban Reason:</span> {selectedUser.banReason}
                  </div>
                )}
                <div>
                  <span className="font-label-md text-on-surface">Posts:</span> {selectedUser.stats?.postsCount || 0}
                </div>
                <div>
                  <span className="font-label-md text-on-surface">Followers:</span> {selectedUser.stats?.followersCount || 0}
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  className="rounded-lg border border-outline-variant bg-surface px-4 py-2 font-label-md text-label-md text-on-surface transition-all active:scale-95"
                  type="button"
                  onClick={() => setSelectedUser(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Admin;
