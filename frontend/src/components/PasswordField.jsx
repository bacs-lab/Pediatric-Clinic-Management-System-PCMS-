import { useState } from "react";

function PasswordField(props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-input-wrap">
      <input
        {...props}
        type={visible ? "text" : "password"}
      />
      <button
        className="password-toggle-btn"
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
      >
        <span className={visible ? "ti ti-eye-off" : "ti ti-eye"} />
      </button>
    </div>
  );
}

export default PasswordField;
