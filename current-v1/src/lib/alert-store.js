let listener = null;

export function subscribeAlert(l) {
  listener = l;
  return () => {
    if (listener === l) listener = null;
  };
}

export function showAlert(message, title = "Alert") {
  return new Promise((resolve) => {
    if (listener) {
      listener({
        type: "alert",
        title,
        message,
        onClose: resolve,
      });
    } else {
      // Fallback if component is not mounted yet
      alert(message);
      resolve();
    }
  });
}

export function showConfirm(message, title = "Confirm") {
  return new Promise((resolve) => {
    if (listener) {
      listener({
        type: "confirm",
        title,
        message,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
      });
    } else {
      // Fallback if component is not mounted yet
      const res = confirm(message);
      resolve(res);
    }
  });
}
