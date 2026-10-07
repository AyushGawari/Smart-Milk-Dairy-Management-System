const crypto=require('crypto');
function secret(){if(!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET is not configured'); return process.env.SESSION_SECRET;}
function sign(payload){
  const body=Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  return body+'.'+sig;
}
function verify(token){
  if(!token) return null;
  const [body,sig]=token.split('.'); if(!body||!sig) return null;
  const expected=crypto.createHmac('sha256',secret()).update(body).digest('base64url');
  if(sig.length!==expected.length || !crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected))) return null;
  try{const p=JSON.parse(Buffer.from(body,'base64url').toString()); if(!p.exp||p.exp<Date.now()) return null; return p;}catch{return null;}
}
function getUser(req){const h=req.headers.authorization||''; return verify(h.startsWith('Bearer ')?h.slice(7):'');}
module.exports={sign,verify,getUser};
