import Sha256 from 'sha256';
import RIPEMD160 from 'ripemd160';

/**
 * Convert public key into bitcoin address
 *
 * @param {Buffer} publicKey
 * @returns {Buffer}
 */
export default (publicKey) => (new RIPEMD160().update(
    Buffer.from(Sha256(publicKey, {asBytes: true})),
)).digest();