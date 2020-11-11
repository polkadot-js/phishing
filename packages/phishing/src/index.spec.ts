// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { checkIfDenied } from '.';

describe('checkIfDenied', (): void => {
  it('returns false when host in list', async (): Promise<void> => {
    expect(
      await checkIfDenied('polkadot.network')
    ).toEqual(false);
  });

  it('returns false when host in list (with protocol)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkadot.network')
    ).toEqual(false);
  });

  it('returns true when host in list', async (): Promise<void> => {
    expect(
      await checkIfDenied('polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (protocol)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (path)', async (): Promise<void> => {
    expect(
      await checkIfDenied('https://polkawallets.site/something/index.html')
    ).toEqual(true);
  });
});
