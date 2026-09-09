"use client";

import type { ComponentPropsWithoutRef } from "react";

type ConfirmSubmitButtonProps = ComponentPropsWithoutRef<"button"> & {
  message: string;
};

export function ConfirmSubmitButton({
  message,
  onClick,
  type = "submit",
  ...props
}: ConfirmSubmitButtonProps) {
  return (
    <button
      {...props}
      type={type}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    />
  );
}
