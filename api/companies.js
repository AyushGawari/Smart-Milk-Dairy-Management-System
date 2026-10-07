const {ObjectId}=require('mongodb');
const {db,ensureIndexes}=require('./_db');
const {getUser}=require('./_auth');
const {hashPassword}=require('./_security');
function send(res,status,data){res.status(status).json(data)}
function cleanCompany(c){return {id:String(c._id),code:c.code,name:c.name,adminUsername:c.adminUsername,status:c.status,createdAt:c.createdAt};}
module.exports=async(req,res)=>{
  const user=getUser(req); if(!user || user.role!=='developer') return send(res,403,{error:'Developer access required'});
  try{
    const database=await db(); await ensureIndexes(database);
    if(req.method==='GET'){
      const companies=await database.collection('companies').find({}).sort({createdAt:-1}).toArray();
      return send(res,200,{companies:companies.map(cleanCompany)});
    }
    if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
    const {name,code,adminUsername,adminPassword}=req.body||{};
    const normalizedCode=String(code||'').trim().toUpperCase().replace(/[^A-Z0-9_-]/g,'');
    if(!name||!normalizedCode||!adminUsername||!adminPassword) return send(res,400,{error:'Company name, code, admin username and password are required'});
    if(adminPassword.length<6) return send(res,400,{error:'Company admin password must be at least 6 characters'});
    const now=new Date();
    const doc={name:String(name).trim(),code:normalizedCode,adminUsername:String(adminUsername).trim(),adminPasswordHash:hashPassword(adminPassword),status:'Active',createdAt:now};
    try{const r=await database.collection('companies').insertOne(doc);return send(res,201,{company:cleanCompany({...doc,_id:r.insertedId})});}
    catch(e){if(e.code===11000)return send(res,409,{error:'Company code or admin username already exists'});throw e;}
  }catch(e){console.error(e);return send(res,500,{error:e.message||'Company operation failed'});}
};
