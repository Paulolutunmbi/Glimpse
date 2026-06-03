import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { useUser } from '../context/UserContext.jsx';
import { postService } from '../services/apiService';

const formatTimestamp = (isoString) => {
  if (!isoString) return '';
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function PostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, savedPosts } = useUser();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadPost = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await postService.getPost(postId);
        const likes = Array.isArray(response?.likes) ? response.likes : [];
        const id = response?._id || response?.id;
        setPost({
          ...response,
          _id: id,
          id,
          likes,
          likesCount: likes.length || response?.likesCount || response?.likes || 0,
          isLiked: user?._id || user?.id ? likes.includes(user?._id || user?.id) : false,
          isSaved: (savedPosts || []).some((item) => String(item._id || item.id) === String(id)),
          timestamp: formatTimestamp(response?.createdAt),
        });
      } catch (err) {
        console.error(err);
        setError(err?.response?.data?.error || 'This post could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    if (postId) loadPost();
  }, [postId, savedPosts, user]);

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Navbar currentUser={user} />
      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-6 pb-24 md:px-6">
        <button
          className="w-fit rounded-full border border-outline-variant/30 px-4 py-2 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          type="button"
          onClick={() => navigate(-1)}
        >
          Back
        </button>
        {loading ? (
          <div className="rounded-xl bg-surface-container-lowest p-6 text-center text-on-surface-variant">
            Loading post...
          </div>
        ) : null}
        {error ? (
          <div className="rounded-xl border border-error/30 bg-error-container p-6 text-center text-on-error-container">
            {error}
          </div>
        ) : null}
        {post ? <PostCard post={post} currentUser={user} /> : null}
      </main>
    </div>
  );
}
