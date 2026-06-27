'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

// ── Toasts ──────────────────────────────────────────────────────────────────
// Lightweight success/error feedback so admins always know an action landed.

type ToastType = 'success' | 'error' | 'info';
type Toast = { id: number; message: string; type: ToastType };

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  // Fail soft: if used outside the provider, no-op rather than crash.
  return ctx ?? { toast: () => {} };
}

// ── Confirm dialog ──────────────────────────────────────────────────────────
// Promise-based replacement for window.confirm / window.prompt, with an
// optional reason field. Always shows the affected item in the message.

type ConfirmOptions = {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  // When set, a text field is shown and its value is returned as `reason`.
  reasonLabel?: string;
  reasonPlaceholder?: string;
  reasonMinLength?: number;
  // Pre-fill the text field (e.g. the current value when renaming).
  reasonDefault?: string;
  // Single-line input instead of a textarea.
  reasonSingleLine?: boolean;
};

type ConfirmResult = { confirmed: boolean; reason: string };

type ConfirmContextValue = (opts: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside <AdminUiProvider>');
  return ctx;
}

export function AdminUiProvider({ children }: { children: ReactNode }) {
  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = nextId.current++;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  // Confirm state
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState('');
  const resolver = useRef<((r: ConfirmResult) => void) | null>(null);

  const confirm = useCallback<ConfirmContextValue>((opts) => {
    setReason(opts.reasonDefault ?? '');
    setConfirmState(opts);
    return new Promise<ConfirmResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.({ confirmed, reason: reason.trim() });
    resolver.current = null;
    setConfirmState(null);
    setReason('');
  }, [reason]);

  const toastValue = useMemo(() => ({ toast }), [toast]);

  const needsReason = confirmState?.reasonLabel != null;
  const reasonTooShort =
    needsReason && reason.trim().length < (confirmState?.reasonMinLength ?? 1);

  return (
    <ToastContext.Provider value={toastValue}>
      <ConfirmContext.Provider value={confirm}>
        {children}

        {confirmState ? (
          <div
            className="modal-backdrop"
            role="presentation"
            onClick={() => settle(false)}
          >
            <div
              className="modal"
              role="dialog"
              aria-modal="true"
              aria-label={confirmState.title}
              style={{ maxWidth: 440 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-head">
                <h3 style={{ margin: 0 }}>{confirmState.title}</h3>
              </div>
              {confirmState.message ? (
                <p className="text-mid" style={{ margin: 0 }}>
                  {confirmState.message}
                </p>
              ) : null}

              {needsReason ? (
                <div>
                  <label className="label" htmlFor="confirm-reason">
                    {confirmState.reasonLabel}
                  </label>
                  {confirmState.reasonSingleLine ? (
                    <input
                      id="confirm-reason"
                      className="input"
                      autoFocus
                      value={reason}
                      placeholder={confirmState.reasonPlaceholder}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  ) : (
                    <textarea
                      id="confirm-reason"
                      className="textarea"
                      rows={3}
                      autoFocus
                      value={reason}
                      placeholder={confirmState.reasonPlaceholder}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  )}
                </div>
              ) : null}

              <div className="row gap-2" style={{ justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => settle(false)}
                >
                  {confirmState.cancelLabel ?? 'Annuler'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={
                    confirmState.danger
                      ? { background: 'var(--danger)', borderColor: 'var(--danger)' }
                      : undefined
                  }
                  disabled={reasonTooShort}
                  onClick={() => settle(true)}
                >
                  {confirmState.confirmLabel ?? 'Confirmer'}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {toasts.length > 0 ? (
          <div className="toast-stack" role="status" aria-live="polite">
            {toasts.map((t) => (
              <div key={t.id} className={'toast toast-' + t.type}>
                {t.message}
              </div>
            ))}
          </div>
        ) : null}
      </ConfirmContext.Provider>
    </ToastContext.Provider>
  );
}
