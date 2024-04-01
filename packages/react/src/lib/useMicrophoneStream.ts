// cspell:ignore dataavailable
import {
  checkForAudioTracks,
  getAudioInputDevices,
  getAudioStream,
} from '@humeai/voice';
import { useCallback, useRef, useState } from 'react';

type PermissionStatus = 'prompt' | 'granted' | 'denied';

function getDefaultDevice(devices: MediaDeviceInfo[]) {
  const defaultDevice = devices.filter(
    ({ deviceId }) => deviceId === 'default',
  )[0];
  return defaultDevice ?? devices[0];
}

export const useMicrophoneStream = () => {
  const [inputDevices, setInputDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState<
    MediaDeviceInfo | undefined
  >();

  const [permission, setPermission] = useState<PermissionStatus>('prompt');

  const streamRef = useRef<MediaStream | null>(null);

  const getInputDevices = useCallback(async () => {
    try {
      const devices = await getAudioInputDevices();
      const defaultDevice = getDefaultDevice(devices ?? []);
      setInputDevices(devices);
      setSelectedInputDevice(defaultDevice);
      return { defaultDevice };
    } catch (e) {}
  }, []);

  const getStream = useCallback(async () => {
    try {
      const inputDevices = await getInputDevices();
      const stream = await getAudioStream(inputDevices?.defaultDevice);

      setPermission('granted');
      streamRef.current = stream;

      checkForAudioTracks(stream);

      return 'granted' as const;
    } catch (e) {
      setPermission('denied');
      return 'denied' as const;
    }
  }, []);

  return {
    streamRef,
    getStream,
    permission,
    getInputDevices,
    inputDevices,
    selectedInputDevice,
  };
};
