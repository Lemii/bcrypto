/*!
 * dsa.js - DSA generation for javascript
 * Copyright (c) 2018, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcrypto
 */

'use strict';

const assert = require('bsert');
const crypto = require('crypto');
const BN = require('../../vendor/bn.js');
const pkcs1 = require('../encoding/pkcs1');
const base = require('../js/dsa');
const dsa = Object.setPrototypeOf(exports, base);
const {constants} = crypto;

/**
 * Whether the backend is a binding.
 * @const {Number}
 */

dsa.native = 1;

/**
 * Test primality for number.
 * @private
 * @param {BN} x
 * @param {Number} n
 * @returns {Boolean}
 */

dsa.probablyPrime = function probablyPrime(x, n) {
  assert(x instanceof BN);
  assert((n >>> 0) === n);

  const dh = crypto.createDiffieHellman(toBuffer(x), null, 2, null);

  if (dh.verifyError & constants.DH_CHECK_P_NOT_PRIME)
    return false;

  return true;
};

/**
 * Compute modular exponentiation.
 * @private
 * @param {BN} x
 * @param {BN} y
 * @param {BN} m
 * @returns {BN}
 */

dsa.modPow = function modPow(x, y, m) {
  assert(x instanceof BN);
  assert(y instanceof BN);
  assert(m instanceof BN);

  try {
    return publicEncrypt(x, y, m);
  } catch (e) {
    return x.toRed(BN.red(m)).redPow(y).fromRed();
  }
};

/**
 * Compute modular inverse.
 * @private
 * @param {BN} k
 * @param {BN} p
 * @returns {BN}
 */

dsa.invm = function invm(k, p) {
  assert(k instanceof BN);
  assert(p instanceof BN);
  try {
    return publicEncrypt(k, p.subn(2), p);
  } catch (e) {
    return k.invm(p);
  }
};

/*
 * Helpers
 */

function publicEncrypt(x, y, m) {
  const n = toBuffer(m);
  const e = toBuffer(y);
  const msg = toBuffer(x, n.length);
  const pub = new pkcs1.RSAPublicKey(n, e);

  const c = crypto.publicEncrypt({
    key: pub.toPEM(),
    padding: constants.RSA_NO_PADDING
  }, msg);

  return new BN(c);
}

function toBuffer(n, size) {
  return n.toArrayLike(Buffer, 'be', size);
}