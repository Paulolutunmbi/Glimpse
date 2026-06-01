import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { feedbackService } from '../services/apiService';

const useQuery = () => new URLSearchParams(useLocation().search);

export default function Goodbye() {
  const navigate = useNavigate();
  const query = useQuery();
  const emailFromQuery = query.get('email') || '';
  const [email, setEmail] = useState(emailFromQuery);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!message.trim()) return setError('Please enter your feedback');
    setSubmitting(true);
    try {
      await feedbackService.submit({ email: email || undefined, message });
      setSuccess('Thanks — your feedback was submitted.');
      setMessage('');
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md p-6">
      <div className="mx-auto max-w-xl">
        <h1 className="font-h2 text-h2 mb-2">Goodbye</h1>
        <p className="text-body-md text-on-surface-variant mb-6">We're sorry to see you go. If you have a moment, tell us why you're leaving.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <div className="mb-1 font-label-md text-label-md">Your email (optional)</div>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2" placeholder="you@example.com" />
          </label>

          <label className="block">
            <div className="mb-1 font-label-md text-label-md">Feedback</div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} className="w-full rounded-lg border border-outline-variant px-3 py-2" placeholder="What could we improve? What disappointed you?" />
          </label>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          {success ? <div className="text-sm text-green-700">{success}</div> : null}

          <div className="flex gap-3">
            <button type="button" onClick={() => navigate('/')} className="rounded-lg px-4 py-2">Back to home</button>
            <button type="submit" disabled={submitting} className="rounded-lg bg-primary-container px-4 py-2 text-white">{submitting ? 'Sending...' : 'Send feedback'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
