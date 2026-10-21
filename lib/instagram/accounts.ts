const ACCOUNT_NAME = /^[a-z0-9][a-z0-9-]{0,31}$/;

export type InstagramCredentials = {
  accessToken: string;
  accountId: string;
  account: string;
};

export function readAccountName(value: unknown): { account: string } | { error: string } {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';

  if (!raw || raw === 'default') {
    return { account: '' };
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
  const accessToken = account
    ? process.env[`INSTAGRAM_ACCESS_TOKEN_${accountEnvSuffix(account)}`]?.trim()
    : process.env.INSTAGRAM_ACCESS_TOKEN?.trim();
  const accountId = account
    ? process.env[`INSTAGRAM_BUSINESS_ACCOUNT_ID_${accountEnvSuffix(account)}`]?.trim()
    : (process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID ?? process.env.NEXT_PUBLIC_INSTAGRAM_BUSINESS_ACCOUNT_ID)?.trim();

  if (!accessToken || !accountId) {
    return null;
  }

  return { accessToken, accountId, account };
}

export function missingAccountMessage(account: string) {
  if (!account) {
    return 'Instagram account credentials are not configured.';
  }

  const suffix = accountEnvSuffix(account);
  return `Instagram account "${account}" is not configured. Set INSTAGRAM_ACCESS_TOKEN_${suffix} and INSTAGRAM_BUSINESS_ACCOUNT_ID_${suffix}.`;
}
