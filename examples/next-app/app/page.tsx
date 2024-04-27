import { fetchAccessToken } from '@humeai/voice';
import dynamic from 'next/dynamic';
import type { FC, PropsWithChildren } from 'react';

import { Voice } from '@/components/Voice';

const NoOp: FC<PropsWithChildren<Record<never, never>>> = ({ children }) => (
  <>{children}</>
);

const NoSSR = dynamic(
  () => new Promise<typeof NoOp>((resolve) => resolve(NoOp)),
  { ssr: false },
);

export default async function Home() {
  const accessToken = await fetchAccessToken({
    apiKey: process.env.HUME_API_KEY || 'PjvoDvF8nuoNGMmYuDixAm0sOK7EbiJGx33oH5Xx0rzlYADX',
    clientSecret: process.env.HUME_CLIENT_SECRET || 'wJoAgmCs043gWD9EGyq83hYCl6uOvdBmg3IHms0kdQxHN3tuJJ1IszY4xk0TAtyY',
  });

  return (
    <div className={'p-6'}>
      <h1 className={'my-4 text-lg font-medium'}>Hume EVI React Example</h1>

      <NoSSR>
        {accessToken ? (
          <Voice accessToken={accessToken} />
        ) : (
          <div>Missing API Key</div>
        )}
      </NoSSR>
    </div>
  );
}
