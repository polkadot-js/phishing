// Copyright 2020 @polkadot/phishing authors & contributors
// SPDX-License-Identifier: Apache-2.0

import retrieveCheckDeny from '.';

describe('retrieveCheckDeny', (): void => {
  it('returns false when host in list', async (): Promise<void> => {
    expect(
      await retrieveCheckDeny('polkadot.network')
    ).toEqual(false);
  });

  it('returns false when host in list (with protocol)', async (): Promise<void> => {
    expect(
      await retrieveCheckDeny('https://polkadot.network')
    ).toEqual(false);
  });

  it('returns true when host in list', async (): Promise<void> => {
    expect(
      await retrieveCheckDeny('polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (protocol)', async (): Promise<void> => {
    expect(
      await retrieveCheckDeny('https://polkawallets.site')
    ).toEqual(true);
  });

  it('returns true when host in list (path)', async (): Promise<void> => {
    expect(
      await retrieveCheckDeny('https://polkawallets.site/something/index.html')
    ).toEqual(true);
  });
});
