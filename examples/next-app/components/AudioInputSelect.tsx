import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/Select';
import { useVoice } from '@humeai/voice-react';
import { FC, memo } from 'react';

type AudioInputSelectProps = {
  inputDevices: ReturnType<typeof useVoice>['inputDevices'];
  selectedInputDevice: ReturnType<typeof useVoice>['selectedInputDevice'];
  changeInputDevice: ReturnType<typeof useVoice>['changeInputDevice'];
};

export const AudioInputSelect: FC<AudioInputSelectProps> = memo((props) => {
  const { inputDevices, selectedInputDevice, changeInputDevice } = props;
  return (
    <Select
      value={selectedInputDevice?.deviceId}
      onValueChange={(value: string) => {
        changeInputDevice(value);
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="Select microphone input" />
      </SelectTrigger>
      <SelectContent className="bg-tan-200">
        {inputDevices.map((device) => {
          console.log('inputDevices', device);
          return (
            <SelectItem
              key={device.deviceId || 'unknown'}
              value={device.deviceId || 'unknown'}
            >
              {device.label ?? 'unknown'} {device.deviceId ?? '[?]'}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
});
