const PUBLIC_KEY = '【从HSM或Worker环境变量中获取】';

export async function verifySignedTime(data: any, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const keyData = await crypto.subtle.importKey(
      'raw',
      encoder.encode(PUBLIC_KEY),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const sigBytes = Uint8Array.from(signature.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    return await crypto.subtle.verify('HMAC', keyData, sigBytes, encoder.encode(JSON.stringify(data)));
  } catch (e) {
    console.error('[Signature] Verification failed:', e);
    return false;
  }
}
