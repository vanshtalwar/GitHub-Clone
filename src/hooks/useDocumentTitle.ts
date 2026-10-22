import { useEffect } from 'react';

/** Sets the browser tab title while `title` is defined. */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);
}
