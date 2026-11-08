/**
 * Status-bar toasts (JDStatusBarNotification-style pill banners).
 * @see https://calimarkus.github.io/JDStatusBarNotification/documentation/jdstatusbarnotification/
 */
import { toast, type ExternalToast } from "sonner";

const defaults: ExternalToast = {
  duration: 3800,
};

export const notify = {
  message(title: string, options?: ExternalToast) {
    return toast(title, { ...defaults, ...options });
  },
  success(title: string, options?: ExternalToast) {
    return toast.success(title, { ...defaults, ...options });
  },
  error(title: string, options?: ExternalToast) {
    return toast.error(title, { ...defaults, ...options });
  },
  info(title: string, options?: ExternalToast) {
    return toast.info(title, { ...defaults, ...options });
  },
  warning(title: string, options?: ExternalToast) {
    return toast.warning(title, { ...defaults, ...options });
  },
  loading(title: string, options?: ExternalToast) {
    return toast.loading(title, { ...options, duration: Infinity });
  },
  promise: toast.promise,
  dismiss: toast.dismiss,
};
