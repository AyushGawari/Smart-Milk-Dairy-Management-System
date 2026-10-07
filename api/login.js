const {db,ensureIndexes}=require('./_db');
const {sign}=require('./_auth');
const {verifyPassword}=require('./_security');
function send(res,status,data){res.status(status).json(data)}
module.exports=async(req,res)=>{
  if(req.method!=='POST') return send(res,405,{error:'Method not allowed'});
  try{
    const {type,username,password,companyCode}=req.body||{};
    if(!username||!password) return send(res,400,{error:'Username and password are required'});
    if(type==='developer'){
      if(username!==process.env.DEVELOPER_USERNAME || password!==process.env.DEVELOPER_PASSWORD) return send(res,401,{error:'Invalid developer credentials'});
      return send(res,200,{token:sign({role:'developer',username,exp:Date.now()+8*60*60*1000}),role:'developer',name:'Application Developer'});
    }
    const database=await db(); await ensureIndexes(database);
    if(type==='company'){
      const company=await database.collection('companies').findOne({adminUsername:String(username).trim()});
      if(!company || company.status!=='Active' || !verifyPassword(password,company.adminPasswordHash)) return send(res,401,{error:'Invalid company login'});
      return send(res,200,{token:sign({role:'company',companyId:String(company._id),companyCode:company.code,exp:Date.now()+8*60*60*1000}),role:'company',company:{id:String(company._id),code:company.code,name:company.name}});
    }
    if(type==='farmer'){
      if(!companyCode) return send(res,400,{error:'Company Code is required'});
      const company=await database.collection('companies').findOne({code:String(companyCode).trim().toUpperCase(),status:'Active'});
      if(!company) return send(res,401,{error:'Invalid company code'});
      const farmer=await database.collection('farmers').findOne({companyId:String(company._id),memberId:String(username).trim().toUpperCase(),status:{$ne:'Inactive'}});
      if(!farmer || !verifyPassword(password,farmer.passwordHash)) return send(res,401,{error:'Invalid Member ID or password'});
      return send(res,200,{token:sign({role:'farmer',companyId:String(company._id),memberId:farmer.memberId,exp:Date.now()+8*60*60*1000}),role:'farmer',farmer:{memberId:farmer.memberId,name:farmer.name,companyName:company.name,companyCode:company.code}});
    }
    return send(res,400,{error:'Invalid login type'});
  }catch(e){console.error(e);return send(res,500,{error:e.message||'Server error'});}
};
