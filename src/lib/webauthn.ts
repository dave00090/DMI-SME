// Real WebAuthn Hardware Biometrics Engine
// Interacts with device fingerprint readers, Apple Touch ID / Face ID, Windows Hello, and Android Biometrics

export interface BiometricAuthResult {
  success: boolean;
  message: string;
  credentialId?: string;
}

// Convert string to Uint8Array buffer
function strToBuffer(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

// Convert Uint8Array to base64
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Check if device supports hardware biometrics
export async function isBiometricsAvailable(): Promise<{ available: boolean; reason?: string }> {
  if (typeof window === 'undefined') {
    return { available: false, reason: 'Window is not defined' };
  }

  if (!window.PublicKeyCredential) {
    return {
      available: false,
      reason: 'Web Authentication API (WebAuthn) is not supported in this browser.',
    };
  }

  try {
    const isPlatformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    if (!isPlatformAvailable) {
      return {
        available: false,
        reason: 'No hardware biometric platform authenticator (Touch ID, Windows Hello, or Fingerprint) is enabled on this device.',
      };
    }
    return { available: true };
  } catch (err: any) {
    return {
      available: false,
      reason: err?.message || 'Biometric authenticator check failed.',
    };
  }
}

// Register device biometrics for an employee
export async function registerDeviceBiometrics(
  employeeId: string,
  employeeName: string
): Promise<BiometricAuthResult> {
  const check = await isBiometricsAvailable();
  if (!check.available) {
    return {
      success: false,
      message: check.reason || 'Hardware biometrics not supported on this device.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const userIdBytes = strToBuffer(employeeId);

    const createCredentialOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'DMi Business Terminal',
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: employeeName,
        displayName: employeeName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },  // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60000,
      attestation: 'none',
    };

    const credential = (await navigator.credentials.create({
      publicKey: createCredentialOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      return {
        success: false,
        message: 'Biometric enrollment was cancelled by user.',
      };
    }

    const credId = bufferToBase64(credential.rawId);
    // Store enrolled credential ID in local storage for this device
    localStorage.setItem(`dmi_bio_cred_${employeeId}`, credId);
    localStorage.setItem(`dmi_bio_last_user`, employeeId);

    return {
      success: true,
      message: `Biometrics (Touch ID / Fingerprint) successfully registered for ${employeeName}!`,
      credentialId: credId,
    };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Biometric enrollment request was cancelled or timed out.',
      };
    }
    return {
      success: false,
      message: `Biometric registration error: ${err.message || 'Sensor failure'}`,
    };
  }
}

// Authenticate using real device biometrics
export async function authenticateWithBiometrics(
  employeeId?: string
): Promise<BiometricAuthResult> {
  const check = await isBiometricsAvailable();
  if (!check.available) {
    return {
      success: false,
      message: check.reason || 'Biometric authenticator unavailable.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    window.crypto.getRandomValues(challenge);

    const savedCredId = employeeId ? localStorage.getItem(`dmi_bio_cred_${employeeId}`) : null;

    const allowCredentials: PublicKeyCredentialDescriptor[] = savedCredId
      ? [
          {
            type: 'public-key',
            id: Uint8Array.from(atob(savedCredId), (c) => c.charCodeAt(0)),
            transports: ['internal'],
          },
        ]
      : [];

    const getCredentialOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: allowCredentials.length > 0 ? allowCredentials : undefined,
    };

    // Invokes the device's native OS Biometric prompt (Touch ID / Face ID / Windows Hello / Android Fingerprint)
    const assertion = (await navigator.credentials.get({
      publicKey: getCredentialOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      return {
        success: false,
        message: 'Biometric verification prompt was dismissed.',
      };
    }

    const assertionId = bufferToBase64(assertion.rawId);

    return {
      success: true,
      message: 'Hardware biometric verification succeeded!',
      credentialId: assertionId,
    };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      return {
        success: false,
        message: 'Biometric scan was cancelled or sensor timed out.',
      };
    }
    return {
      success: false,
      message: `Biometric authentication failed: ${err.message || 'Sensor error'}`,
    };
  }
}
