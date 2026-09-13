import { useEffect } from 'react';

export function useReleaseObjectUrl(url) {
  useEffect(() => () => {
    if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
  }, [url]);
}
