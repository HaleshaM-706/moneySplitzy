import * as Keychain from 'react-native-keychain';
import type { AuthResponseDTO } from '../../services/api/types';

const AUTH_STORAGE_SERVICE = 'money-splitzy.auth';

function isAuthResponse(value: unknown): value is AuthResponseDTO {
  if (typeof value !== 'object' || value === null) return false;

  const session = value as Partial<AuthResponseDTO>;
  return (
    typeof session.access === 'string' &&
    typeof session.refresh === 'string' &&
    typeof session.user?.id === 'string' &&
    typeof session.user.email === 'string'
  );
}

export async function saveAuthSession(session: AuthResponseDTO): Promise<void> {
  const result = await Keychain.setGenericPassword('money-splitzy', JSON.stringify(session), {
    service: AUTH_STORAGE_SERVICE,
  });

  if (!result) {
    throw new Error('Could not securely save the authentication session.');
  }
}

export async function loadAuthSession(): Promise<AuthResponseDTO | null> {
  const credentials = await Keychain.getGenericPassword({ service: AUTH_STORAGE_SERVICE });
  if (!credentials) return null;

  let session: unknown;
  try {
    session = JSON.parse(credentials.password);
  } catch {
    await clearAuthSession();
    return null;
  }

  if (!isAuthResponse(session)) {
    await clearAuthSession();
    return null;
  }

  return session;
}

export async function clearAuthSession(): Promise<void> {
  await Keychain.resetGenericPassword({ service: AUTH_STORAGE_SERVICE });
}
