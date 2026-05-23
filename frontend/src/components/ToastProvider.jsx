import { useEffect, useState } from "react";

function ToastProvider() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleNotify = (event) => {
      const id = crypto.randomUUID();
      const nextToast = {
        id,
        type: event.detail?.type || "info",
        message: event.detail?.message || "Action completed",
      };

      setToasts((current) => [...current, nextToast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((toast) => toast.id !== id));
      }, 3600);
    };

    window.addEventListener("pcms:notify", handleNotify);
    return () => window.removeEventListener("pcms:notify", handleNotify);
  }, []);

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.type}`} key={toast.id}>
          <span className="toast-dot" />
          <p>{toast.message}</p>
        </div>
      ))}
    </div>
  );
}

export default ToastProvider;
