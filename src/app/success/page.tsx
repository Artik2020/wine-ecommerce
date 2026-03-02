import { Suspense } from 'react';

import SuccessClient from './success-client';

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessClient />
    </Suspense>
  );
}
