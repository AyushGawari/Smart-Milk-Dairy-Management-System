const crypto = require('crypto');
function hashPassword(password){
  const salt=crypto.randomBytes(16).toString('hex');
  const hash=crypto.scryptSync(String(password),salt,64).toString('hex');
  return `scrypt$${salt}$${hash}`;
}
function verifyPassword(password,stored){
  if(!stored || !stored.startsWith('scrypt$')) return false;
  const [,salt,hash]=stored.split('$');
  const candidate=crypto.scryptSync(String(password),salt,64).toString('hex');
  return hash.length===candidate.length && crypto.timingSafeEqual(Buffer.from(hash),Buffer.from(candidate));
}
module.exports={hashPassword,verifyPassword};
