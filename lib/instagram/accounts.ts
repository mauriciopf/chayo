const ACCOUNT_NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;

export type InstagramCredentials = {
  accessToken: string;
  accountId: string;
  account: string;
};

export function readAccountName(value: unknown): { account: string } | { error: string } {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!raw) {
    return { error: 'An account is required. Use "titi" or "sunny-isles-one".' };
  }

  if (!ACCOUNT_NAME.test(raw)) {
    return { error: 'Account must be a short name such as titi or sunny-isles-one.' };
  }

  return { account: raw };
}

export function accountEnvSuffix(account: string) {
  return account.toUpperCase().replace(/-/g, '_');
}

export function instagramCredentials(account: string): InstagramCredentials | null {
  const original = account === 'titi';
  const accessToken = original
    ? process.env.INSTAGRAM_ACCESS_TOKEN?.trim()
    : process.env[`INSTAGRAM_ACCESS_TOKEN_${accountEnvSuffix(account)}`]?.trim();
  const accountId = original
    ? (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID)?.trim()
    : process.env[`INSTAGRAM_BUSINESS_ACCOUNT_ID_${accountEnvSuffix(account)}`]?.trim();

  if (!accessToken || !accountId) {
    return null;
  }

  return { accessToken, accountId, account };
}

export function missingAccountMessage(account: string) {
  if (account === 'titi') {
    return 'Instagram account "titi" is not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID.';
  }

  const suffix = accountEnvSuffix(account);
  return `Instagram account "${account}" is not configured. Set INSTAGRAM_ACCESS_TOKEN_${suffix} and INSTAGRAM_BUSINESS_ACCOUNT_ID_${suffix}.`;
}
