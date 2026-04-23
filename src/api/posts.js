import axios from "axios";

const API = import.meta.env.VITE_API_URL;

export const getPosts = async () => {
  const res = await axios.get(`${API}/api/posts`);
  return res.data;
};

export const likePost = async (id) => {
  const res = await axios.put(`${API}/api/posts/${id}/like`);
  return res.data;
};
