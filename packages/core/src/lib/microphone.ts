/**
 * @name getAudioStream
 * @description
 * Get a MediaStream with audio tracks.
 * @returns
 * A new MediaStream with audio tracks.
 */
export const getAudioStream = async (
  inputDevice: MediaDeviceInfo | undefined,
): Promise<MediaStream> => {
  const audioOptions: Partial<MediaStreamConstraints['audio']> = {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  };

  if (inputDevice) {
    audioOptions.deviceId = {
      exact: inputDevice.deviceId,
    };
  }

  console.log('audioOptions', audioOptions);

  return navigator.mediaDevices.getUserMedia({
    audio: audioOptions,
    video: false,
  });
};

/**
 * @name getAudioInputDevices
 * @description
 * Enumerate all of the user's available audio input devices
 * @returns
 * A list of audio input devices
 */
export const getAudioInputDevices = async () => {
  return navigator.mediaDevices.enumerateDevices().then((devices) => {
    const inputDevices = devices.filter((device) => {
      return device.kind === 'audioinput';
    });
    return inputDevices;
  });
};

/**
 * @name checkForAudioTracks
 * @description
 * Check if a MediaStream has audio tracks.
 * @param stream
 * The MediaStream to check
 */
export const checkForAudioTracks = (stream: MediaStream) => {
  const tracks = stream.getAudioTracks();

  if (tracks.length === 0) {
    throw new Error('No audio tracks');
  }
  if (tracks.length > 1) {
    throw new Error('Multiple audio tracks');
  }
  const track = tracks[0];
  if (!track) {
    throw new Error('No audio track');
  }
};
