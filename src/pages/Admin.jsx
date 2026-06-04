import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext.jsx';
import { adminService } from '../services/apiService';
import { socket } from '../socket';
import StatusMessage from '../components/StatusMessage';
import Avatar from '../components/Avatar';
import VerifiedBadge from '../components/VerifiedBadge';

const ADMIN_EMAIL = 'oluwatunmbipaul@gmail.com';
const isAdminEmail = (email) => String(email || '').trim().toLowerCase() === ADMIN_EMAIL;

const toDateLabel = (value) => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString();
};

const MetricCard = ({ title, value, subtitle, tone = 'default' }) => {
  const toneClass =
    tone === 'danger'
      ? 'from-red-50 to-rose-50 border-red-100'
      : tone === 'accent'
      ? 'from-amber-50 to-orange-50 border-amber-100'
      : 'from-sky-50 to-cyan-50 border-sky-100';

  return (
    <article className={`rounded-2xl border bg-gradient-to-br p-4 shadow-sm ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.12em] text-on-surface-variant">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-on-surface">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-on-surface-variant">{subtitle}</p> : null}
    </article>
  );
};

const BarChart = ({ title, data, color = '#0ea5e9', loading = false }) => {
  const max = useMemo(() => {
    const values = (data || []).map((item) => Number(item.count) || 0);
    return Math.max(1, ...values);
  }, [data]);

  return (
    <section className="rounded-2xl border border-outline-variant/30 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      {loading ? (
        <div className="mt-4 h-44 animate-pulse rounded-xl bg-surface-container" />
      ) : (
        <div className="mt-4 h-52 overflow-x-auto">
          <div className="flex h-full min-w-[560px] items-end gap-2">
            {(data || []).map((item) => {
              const value = Number(item.count) || 0;
              const heightPct = Math.max(6, Math.round((value / max) * 100));
              return (
                <div key={item.date} className="flex flex-1 min-w-[30px] flex-col items-center gap-2">
                  <div className="text-[10px] text-on-surface-variant">{value}</div>
                  <div className="flex h-36 w-full items-end">
                    <div
                      className="w-full rounded-t-md transition-all duration-300"
                      style={{ height: `${heightPct}%`, backgroundColor: color }}
                      title={`${item.date}: ${value}`}
                    />
                  </div>
                  <div className="w-full truncate text-center text-[10px] text-on-surface-variant">{item.date.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};

const AdminActionButton = ({ children, className = '', ...props }) => (
  <button
    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    type="button"
    {...props}
  >
    {children}
  </button>
);

const Admin = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const isAdmin = Boolean(user?.isAdmin) || isAdminEmail(user?.email);
  useEffect(() => {
    if (!isAdmin) {
      navigate('/', { replace: true });
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

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const response = await adminService.getAnalytics({ days: 14 });
      setAnalytics(response?.data || null);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers(page, search);
  }, [isAdmin, page, search, loadUsers]);

  useEffect(() => {
    if (!isAdmin) return;
    loadAnalytics();
  }, [isAdmin, loadAnalytics]);

  const handleSearch = () => {
    if (searchInput !== search) {
      setPage(1);
      setSearch(searchInput);
    }
  };

  const withSuccessToast = (message) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const banUser = async (userId) => {
    setActionLoading(userId);
    try {
      await adminService.banUser(userId, { reason: 'Manual admin action' });
      setConfirmAction(null);
      withSuccessToast('User banned');
      await Promise.all([loadUsers(page, search), loadAnalytics()]);
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
      setConfirmAction(null);
      withSuccessToast('User unbanned');
      await Promise.all([loadUsers(page, search), loadAnalytics()]);
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
      setConfirmAction(null);
      setSelectedUser(null);
      withSuccessToast('User deleted');
      await Promise.all([loadUsers(page, search), loadAnalytics()]);
    } catch (err) {
      setError('Failed to delete user');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const setUserVerification = async (userId, verified) => {
    setActionLoading(userId);
    try {
      const response = await adminService.setUserVerification(userId, verified);
      const updated = response?.data;
      if (updated) {
        setUsers((prev) =>
          prev.map((item) => (String(item.id) === String(updated.id) ? { ...item, ...updated } : item))
        );
        setSelectedUser((prev) =>
          prev && String(prev.id) === String(updated.id) ? { ...prev, ...updated } : prev
        );
      }
      setConfirmAction(null);
      withSuccessToast(verified ? 'User verified' : 'Verification removed');
      await loadUsers(page, search);
    } catch (err) {
      setError('Failed to update verification');
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const openUserDetails = async (rowUser) => {
    setSelectedUser(rowUser);
    setDetailsLoading(true);
    try {
      const response = await adminService.getUser(rowUser.id);
      if (response?.data) {
        setSelectedUser(response.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
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
        prev.map((item) => (String(item.id) === String(updated.id) ? { ...item, ...updated } : item))
      );
      setSelectedUser((prev) =>
        prev && String(prev.id) === String(updated.id) ? { ...prev, ...updated } : prev
      );
    };

    const handleUserDeleted = (payload) => {
      const userId = payload?.userId;
      if (!userId) return;
      setUsers((prev) => prev.filter((item) => String(item.id) !== String(userId)));
      setSelectedUser((prev) => (prev && String(prev.id) === String(userId) ? null : prev));
    };

    const handleAnalyticsUpdated = () => {
      loadAnalytics();
    };

    socket.on('admin:alert', handleAdminAlert);
    socket.on('admin:userUpdated', handleUserUpdated);
    socket.on('admin:userDeleted', handleUserDeleted);
    socket.on('admin:analyticsUpdated', handleAnalyticsUpdated);

    return () => {
      socket.off('admin:alert', handleAdminAlert);
      socket.off('admin:userUpdated', handleUserUpdated);
      socket.off('admin:userDeleted', handleUserDeleted);
      socket.off('admin:analyticsUpdated', handleAnalyticsUpdated);
    };
  }, [loadAnalytics]);

  if (!isAdmin) return null;

  const totals = analytics?.totals || {};
  const usersJoined = analytics?.series?.usersJoined || [];
  const activePosters = analytics?.series?.activePosters || [];

  return (
    <div className="min-h-screen bg-background text-on-background pb-20 md:pb-8">
      <header className="sticky top-0 z-40 border-b border-zinc-100 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <h1 className="text-lg font-semibold text-[#FF5A5F] md:text-xl">Admin Dashboard</h1>
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

      <main className="mx-auto mt-4 max-w-[1200px] px-4 md:px-6">
        {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
        {success ? <StatusMessage tone="success">{success}</StatusMessage> : null}
        {alerts.map((alert, index) => (
          <div key={alert._id || alert.createdAt || `${alert.preview || 'alert'}-${index}`} className="mt-2">
            <StatusMessage tone="info">{alert.preview || 'Admin alert received.'}</StatusMessage>
          </div>
        ))}

        <section className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          <MetricCard title="Total Users" value={totals.totalUsers ?? '-'} />
          <MetricCard title="Total Posts" value={totals.totalPosts ?? '-'} />
          <MetricCard title="Total Reels" value={totals.totalReels ?? '-'} tone="accent" />
          <MetricCard title="DAU" value={totals.dailyActiveUsers ?? '-'} subtitle="Active sessions today" />
          <MetricCard title="Banned Users" value={totals.bannedUsers ?? '-'} tone="danger" />
          <MetricCard title="Page" value={pagination?.page ?? page} subtitle={`of ${pagination?.pages || 1}`} />
        </section>

        <section className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <BarChart
            title="Users Joined Over Time"
            data={usersJoined}
            loading={analyticsLoading}
            color="#0ea5e9"
          />
          <BarChart
            title="Active Posters Over Time"
            data={activePosters}
            loading={analyticsLoading}
            color="#f97316"
          />
        </section>

        <section className="mt-6">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1">
              <span className="text-sm font-medium text-on-surface">Search users</span>
              <input
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-4 py-2 text-body-sm text-on-surface outline-none transition-all placeholder:text-secondary focus:border-primary-container focus:ring-2 focus:ring-primary-container/20"
                placeholder="Name, username, or email..."
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </label>
            <button
              className="rounded-lg border-b-2 border-primary/20 bg-primary-container px-5 py-2 font-medium text-on-primary shadow-sm transition-all active:scale-95 disabled:opacity-50"
              type="button"
              onClick={handleSearch}
              disabled={loading}
            >
              Search
            </button>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-outline-variant/30 bg-white p-8 text-center text-on-surface-variant">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-10 text-center text-on-surface-variant">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-outline-variant/30 bg-white shadow-sm">
              <table className="w-full min-w-[980px] border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-lowest">
                    <th className="w-[220px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Name
                    </th>
                    <th className="w-[260px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Email
                    </th>
                    <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Joined
                    </th>
                    <th className="w-[190px] px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant">
                      Status
                    </th>
                    <th className="sticky right-0 z-10 w-[270px] bg-surface-container-lowest px-4 py-3 text-right text-xs font-semibold uppercase tracking-[0.08em] text-on-surface-variant shadow-[-8px_0_12px_rgba(255,255,255,0.9)]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-outline-variant/20">
                      <td className="px-4 py-3 text-sm text-on-surface">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <span className="truncate">{u.fullName || u.name || 'N/A'}</span>
                          <VerifiedBadge verified={u.verified} size={13} />
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface-variant">
                        <span className="block max-w-[250px] truncate" title={u.email}>{u.email}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-on-surface-variant">{toDateLabel(u.createdAt)}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              u.isBanned
                                ? 'bg-error-container text-on-error-container'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {u.isBanned ? 'Banned' : 'Active'}
                          </span>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${u.verified ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-600'}`}>
                            {u.verified ? 'Verified' : 'Unverified'}
                          </span>
                        </div>
                      </td>
                      <td className="sticky right-0 bg-white px-4 py-3 shadow-[-8px_0_12px_rgba(255,255,255,0.9)]">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <AdminActionButton
                            className="border border-outline-variant/30 text-on-surface"
                            onClick={() => openUserDetails(u)}
                          >
                            Details
                          </AdminActionButton>
                          {u.verified ? (
                            <AdminActionButton
                              className="bg-sky-50 text-sky-700"
                              disabled={actionLoading === u.id || !u.actionPermissions?.canRemoveVerification}
                              onClick={() =>
                                setConfirmAction({
                                  message: `Remove verification from ${u.email}?`,
                                  onConfirm: () => setUserVerification(u.id, false),
                                })
                              }
                            >
                              Remove Tick
                            </AdminActionButton>
                          ) : (
                            <AdminActionButton
                              className="bg-sky-600 text-white"
                              disabled={actionLoading === u.id || !u.actionPermissions?.canVerify}
                              onClick={() =>
                                setConfirmAction({
                                  message: `Verify ${u.email}?`,
                                  onConfirm: () => setUserVerification(u.id, true),
                                })
                              }
                            >
                              Verify
                            </AdminActionButton>
                          )}
                          {u.isBanned ? (
                            <AdminActionButton
                              className="bg-emerald-100 text-emerald-700"
                              disabled={actionLoading === u.id}
                              onClick={() =>
                                setConfirmAction({
                                  message: `Unban ${u.email}?`,
                                  onConfirm: () => unbanUser(u.id),
                                })
                              }
                            >
                              {actionLoading === u.id ? '...' : 'Unban'}
                            </AdminActionButton>
                          ) : (
                            <AdminActionButton
                              className="bg-red-100 text-red-700"
                              disabled={actionLoading === u.id || !u.actionPermissions?.canBan}
                              onClick={() =>
                                setConfirmAction({
                                  message: `Ban ${u.email}?`,
                                  onConfirm: () => banUser(u.id),
                                })
                              }
                            >
                              {actionLoading === u.id ? '...' : 'Ban'}
                            </AdminActionButton>
                          )}
                          <AdminActionButton
                            className="bg-error text-white"
                            disabled={actionLoading === u.id || !u.actionPermissions?.canDelete}
                            onClick={() =>
                              setConfirmAction({
                                message: `Delete ${u.email}? This is permanent.`,
                                onConfirm: () => deleteUser(u.id),
                              })
                            }
                          >
                            Delete
                          </AdminActionButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.pages > 1 ? (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                className="rounded-lg border border-outline-variant/30 px-3 py-2 text-sm disabled:opacity-50"
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                Prev
              </button>
              <span className="text-sm text-on-surface-variant">Page {page} of {pagination.pages}</span>
              <button
                className="rounded-lg border border-outline-variant/30 px-3 py-2 text-sm disabled:opacity-50"
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages || loading}
              >
                Next
              </button>
            </div>
          ) : null}
        </section>
      </main>

      {confirmAction && createPortal(
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="w-full max-w-md min-w-[280px] rounded-2xl bg-white p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
            <p className="mt-2 text-sm text-gray-600 break-words">{confirmAction.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
                type="button"
                onClick={() => setConfirmAction(null)}
                disabled={Boolean(actionLoading)}
              >
                Cancel
              </button>
              <button
                className="rounded-lg bg-[#FF5A5F] hover:bg-[#e04f54] px-4 py-2 text-sm font-medium text-white transition disabled:opacity-60"
                type="button"
                onClick={() => {
                  confirmAction.onConfirm && confirmAction.onConfirm();
                  setConfirmAction(null);
                }}
                disabled={Boolean(actionLoading)}
              >
                {actionLoading ? '...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedUser && createPortal(
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-black/55 p-0 md:items-center md:p-4 backdrop-blur-sm"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="h-[92vh] w-full overflow-hidden rounded-t-3xl bg-white md:h-auto md:max-h-[90vh] md:max-w-2xl md:rounded-3xl shadow-2xl flex flex-col"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-outline-variant/30 bg-white px-4 py-3 md:px-6">
              <h3 className="text-lg font-semibold text-on-surface">User Details</h3>
              <button
                className="rounded-full p-2 hover:bg-surface-container transition text-zinc-500"
                type="button"
                onClick={() => setSelectedUser(null)}
              >
                <span className="material-symbols-outlined text-[#FF5A5F]">close</span>
              </button>
            </div>

            <div className="max-h-[calc(92vh-70px)] overflow-y-auto px-4 py-4 md:max-h-[calc(90vh-70px)] md:px-6">
              {detailsLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-5 w-1/2 rounded bg-surface-container" />
                  <div className="h-4 w-2/3 rounded bg-surface-container" />
                  <div className="h-4 w-3/4 rounded bg-surface-container" />
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center gap-3 border-b border-outline-variant/30 pb-4 sm:flex-row sm:items-start">
                    <Avatar
                      src={selectedUser.avatar}
                      name={selectedUser.username || selectedUser.fullName || selectedUser.name}
                      className="h-20 w-20"
                    />
                    <div className="min-w-0 flex-1 text-center sm:text-left">
                      <p className="inline-flex items-center justify-center gap-1.5 text-lg font-semibold text-on-surface sm:justify-start">
                        {selectedUser.fullName || selectedUser.name || 'N/A'}
                        <VerifiedBadge verified={selectedUser.verified} size={15} />
                      </p>
                      <p className="text-sm text-on-surface-variant">@{selectedUser.username || 'unknown'}</p>
                      <p className="mt-1 text-sm text-on-surface-variant">{selectedUser.email}</p>
                      <p className="mt-1 text-xs text-on-surface-variant">Joined {toDateLabel(selectedUser.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start sm:flex-col sm:items-end">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          selectedUser.isBanned
                            ? 'bg-error-container text-on-error-container'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {selectedUser.isBanned ? 'Banned' : 'Active'}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${selectedUser.verified ? 'bg-sky-100 text-sky-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {selectedUser.verified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <MetricCard title="Posts" value={selectedUser.stats?.postsCount || 0} />
                    <MetricCard title="Followers" value={selectedUser.followersCount || 0} />
                    <MetricCard title="Following" value={selectedUser.followingCount || 0} />
                    <MetricCard title="Violations" value={selectedUser.violations?.length || 0} tone="danger" />
                  </div>

                  <div className="mt-4 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
                    <h4 className="text-sm font-semibold text-on-surface">Recent Activity</h4>
                    <div className="mt-2 space-y-1 text-sm text-on-surface-variant">
                      <p>Last active: {toDateLabel(selectedUser.recentActivity?.lastActiveAt || selectedUser.lastActiveAt)}</p>
                      <p>Last login: {toDateLabel(selectedUser.recentActivity?.lastLoginAt)}</p>
                      <p>Last admin route attempt: {selectedUser.recentActivity?.lastAdminAttemptRoute || 'N/A'}</p>
                    </div>
                  </div>

                  {selectedUser.isBanned && selectedUser.banReason ? (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      Ban reason: {selectedUser.banReason}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-outline-variant/20 pt-4">
                    {selectedUser.verified ? (
                      <button
                        className="rounded-lg bg-sky-50 px-4 py-2 text-sm font-medium text-sky-700 hover:bg-sky-100 transition"
                        type="button"
                        disabled={actionLoading === selectedUser.id || !selectedUser.actionPermissions?.canRemoveVerification}
                        onClick={() =>
                          setConfirmAction({
                            message: `Remove verification from ${selectedUser.email}?`,
                            onConfirm: () => setUserVerification(selectedUser.id, false),
                          })
                        }
                      >
                        Remove Verification
                      </button>
                    ) : (
                      <button
                        className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 transition"
                        type="button"
                        disabled={actionLoading === selectedUser.id || !selectedUser.actionPermissions?.canVerify}
                        onClick={() =>
                          setConfirmAction({
                            message: `Verify ${selectedUser.email}?`,
                            onConfirm: () => setUserVerification(selectedUser.id, true),
                          })
                        }
                      >
                        Verify User
                      </button>
                    )}
                    {selectedUser.isBanned ? (
                      <button
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition"
                        type="button"
                        disabled={actionLoading === selectedUser.id || !selectedUser.actionPermissions?.canUnban}
                        onClick={() =>
                          setConfirmAction({
                            message: `Unban ${selectedUser.email}?`,
                            onConfirm: () => unbanUser(selectedUser.id),
                          })
                        }
                      >
                        Unban
                      </button>
                    ) : (
                      <button
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600 transition"
                        type="button"
                        disabled={actionLoading === selectedUser.id || !selectedUser.actionPermissions?.canBan}
                        onClick={() =>
                          setConfirmAction({
                            message: `Ban ${selectedUser.email}?`,
                            onConfirm: () => banUser(selectedUser.id),
                          })
                        }
                      >
                        Ban
                      </button>
                    )}
                    <button
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition"
                      type="button"
                      disabled={actionLoading === selectedUser.id || !selectedUser.actionPermissions?.canDelete}
                      onClick={() =>
                        setConfirmAction({
                          message: `Delete ${selectedUser.email}? This is permanent.`,
                          onConfirm: () => deleteUser(selectedUser.id),
                        })
                      }
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Admin;
