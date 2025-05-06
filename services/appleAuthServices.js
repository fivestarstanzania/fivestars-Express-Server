import jwksClient from 'jwks-rsa';
import jwt from 'jsonwebtoken';

const appleClient = jwksClient({
  jwksUri: 'https://appleid.apple.com/auth/keys',
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

function getAppleKey(header, callback) {
  appleClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

export const verifyAppleToken = async (identityToken, nonce) => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      identityToken,
      getAppleKey,
      {
        algorithms: ['RS256'],
        audience: process.env.APPLE_BUNDLE_ID,
        issuer: 'https://appleid.apple.com',
        nonce: nonce
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded);
      }
    );
  });
};