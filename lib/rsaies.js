/*!
 * rsaies.js - rsaies for javascript
 * Copyright (c) 2018-2019, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcrypto
 */

'use strict';

const assert = require('bsert');
const rsa = require('./rsa');
const random = require('./random');
const box = require('./secretbox');

/*
 * RSAIES
 */

const RSAIES = {
  encrypt(hash, msg, pub, size = null, label = null) {
    assert(hash && typeof hash.id === 'string');
    assert(Buffer.isBuffer(msg));

    const key = random.randomBytes(32);

    let ct = rsa.encryptOAEP(hash, key, pub, label);

    if (size != null)
      ct = rsa.veil(ct, size, pub);

    const nonce = random.randomBytes(24);
    const sealed = box.seal(msg, key, nonce);

    return Buffer.concat([ct, nonce, sealed]);
  },

  decrypt(hash, msg, priv, size = null, label = null) {
    assert(hash && typeof hash.id === 'string');
    assert(Buffer.isBuffer(msg));
    assert(priv instanceof rsa.RSAPrivateKey);

    if (size == null)
      size = priv.bits();

    assert((size >>> 0) === size);

    const bytes = (size + 7) >>> 3;

    if (msg.length < bytes + 24)
      throw new Error('Invalid ciphertext.');

    const ct = rsa.unveil(msg.slice(0, bytes), size, priv);
    const key = rsa.decryptOAEP(hash, ct, priv, label);
    const nonce = msg.slice(bytes, bytes + 24);
    const sealed = msg.slice(bytes + 24);

    return box.open(sealed, key, nonce);
  }
};

/*
 * Expose
 */

module.exports = RSAIES;
