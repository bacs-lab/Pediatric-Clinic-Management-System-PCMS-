export const notify = (message, type = "info") => {
  window.dispatchEvent(
    new CustomEvent("pcms:notify", {
      detail: { message, type },
    })
  );
};

export const notifySuccess = (message) => notify(message, "success");
export const notifyError = (message) => notify(message, "error");
