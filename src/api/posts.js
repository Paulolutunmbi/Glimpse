import API from "./axios";

export const getPosts = async () => {
  const res = await API.get("/api/posts");
  return res.data;
};

export const likePost = async (id) => {
  const res = await API.put(`/api/posts/${id}/like`);
  return res.data;
};
