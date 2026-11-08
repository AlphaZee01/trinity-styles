"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react";

export function Toaster({ ...props }: ToasterProps) {
  const { resolvedTheme } = useTheme();
  return (
    <Sonner
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      className="ts-status-toaster"
      position="top-center"
      closeButton
      visibleToasts={3}
      expand={false}
      gap={10}
      offset={{ top: "max(12px, env(safe-area-inset-top))" }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: "ts-status-toast",
          title: "ts-status-title",
          description: "ts-status-description",
          content: "ts-status-content",
          icon: "ts-status-icon",
          closeButton: "ts-status-close",
          actionButton: "ts-status-action",
          cancelButton: "ts-status-cancel",
        },
      }}
      icons={{
        success: <CircleCheckIcon className="size-4" strokeWidth={2.25} />,
        info: <InfoIcon className="size-4" strokeWidth={2.25} />,
        warning: <TriangleAlertIcon className="size-4" strokeWidth={2.25} />,
        error: <OctagonXIcon className="size-4" strokeWidth={2.25} />,
        loading: <Loader2Icon className="size-4 animate-spin" strokeWidth={2.25} />,
      }}
      {...props}
    />
  );
}
