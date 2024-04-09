import { renderHook } from '@testing-library/react-hooks';
import { describe, expect, it } from 'vitest';

import { useMicrophone } from './useMicrophone';

describe('useMicrophone', () => {
  it('is defined', () => {
    expect(useMicrophone).toBeDefined();
  });

  it('getStream function works correctly', async () => {
    const { result } = renderHook(() =>
      useMicrophone({ onAudioCaptured: () => {}, onError: () => {} }),
    );
    const permissionStatus = await result.current.getStream('default');
    expect(['granted', 'denied']).toContain(permissionStatus);
  });
});
