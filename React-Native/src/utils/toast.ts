/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

type ToastListener = (title: string, desc?: string, icon?: string, color?: string) => void;

let toastListener: ToastListener | null = null;

export const setToastListener = (listener: ToastListener) => {
  toastListener = listener;
};

export const showToast = (title: string, desc?: string, icon = 'check-circle', color = 'text-primary') => {
  if (toastListener) {
    toastListener(title, desc, icon, color);
  } else {
    console.log(`[Tactical Toast] ${title} — ${desc}`);
  }
};