export const authFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/";
      return null;
    }

    return res;
  } catch (error) {
    alert("Network error. Please check your connection or server.");
    return null;
  }
};