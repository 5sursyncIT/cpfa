'use client';

import { useEffect } from 'react';

// Warns the editor before they leave (tab close, reload, back/forward) while
// there are unsaved edits. Used by the CMS page/article editors. In-app
// navigation via next/link isn't intercepted by `beforeunload`; the visible
// "Modifications non enregistrées" badge covers that case.
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Legacy browsers need returnValue set to trigger the native prompt.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);
}
