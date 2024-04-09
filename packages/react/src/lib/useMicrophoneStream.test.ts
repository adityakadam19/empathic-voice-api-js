import { renderHook } from '@testing-library/react-hooks';
import { describe, expect, it } from 'vitest';

import { useMicrophoneStream } from './useMicrophoneStream';

describe('useMicrophoneStream', () => {
  it('is defined', () => {
    expect(useMicrophoneStream).toBeDefined();
  });

  it('getStream function works correctly', async () => {
    const { result } = renderHook(() => useMicrophoneStream());
    const permissionStatus = await result.current.getStream('default');
    expect(['granted', 'denied']).toContain(permissionStatus);
  });
});
