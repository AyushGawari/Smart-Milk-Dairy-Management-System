const {ObjectId}=require('mongodb');
const {db,ensureIndexes}=require('./_db');
const {getUser}=require('./_auth');
const {hashPassword}=require('./_security');
function send(res,status,data){res.status(status).json(data)}
function oid(id){try{return new ObjectId(id)}catch{return null}}
module.exports=async(req,res)=>{
  const user=getUser(req); if(!user) return send(res,401,{error:'Please log in again'});
  try{
    const database=await db(); await ensureIndexes(database);
    if(user.role==='developer') return send(res,403,{error:'Developer uses the company management API'});
    const companyId=user.companyId;
    if(!companyId || !oid(companyId)) return send(res,400,{error:'Invalid company session'});
    const settings=await database.collection('settings').findOne({companyId})||{companyId,milkRate:45};
    if(req.method==='GET'){
      if(user.role==='company'){
        const [farmers,milkEntries,feedEntries]=await Promise.all([
          database.collection('farmers').find({companyId}).project({passwordHash:0}).sort({memberId:1}).toArray(),
          database.collection('milkEntries').find({companyId}).sort({date:-1}).limit(1000).toArray(),
          database.collection('feedEntries').find({companyId}).sort({date:-1}).limit(1000).toArray()
        ]);
        const company=await database.collection('companies').findOne({_id:oid(companyId)},{projection:{adminPasswordHash:0}});
        return send(res,200,{company:{id:companyId,name:company?.name,code:company?.code},settings,farmers,milkEntries,feedEntries});
      }
      const farmer=await database.collection('farmers').findOne({companyId,memberId:user.memberId},{projection:{passwordHash:0}});
      const [milkEntries,feedEntries]=await Promise.all([
        database.collection('milkEntries').find({companyId,memberId:user.memberId}).sort({date:-1}).toArray(),
        database.collection('feedEntries').find({companyId,memberId:user.memberId}).sort({date:-1}).toArray()
      ]);
      return send(res,200,{company:await database.collection('companies').findOne({_id:oid(companyId)},{projection:{name:1,code:1}}),settings,farmers:farmer?[farmer]:[],milkEntries,feedEntries});
    }
    if(req.method!=='PUT') return send(res,405,{error:'Method not allowed'});
    if(user.role!=='company') return send(res,403,{error:'Company admin access required'});
    const body=req.body||{};
    if(body.settings){await database.collection('settings').updateOne({companyId},{$set:{companyId,milkRate:Number(body.settings.milkRate)||0}},{upsert:true});}
    if(Array.isArray(body.farmers)){
      for(const f of body.farmers){
        const memberId=String(f.memberId||'').trim().toUpperCase();
        if(!memberId||!f.name||!f.password) continue;
        const clean={companyId,memberId,name:String(f.name).trim(),phone:String(f.phone||''),village:String(f.village||''),status:f.status||'Active',passwordHash:hashPassword(f.password)};
        await database.collection('farmers').updateOne({companyId,memberId},{$set:clean},{upsert:true});
      }
    }
    if(Array.isArray(body.milkEntries)){
      for(const e of body.milkEntries){
        const memberId=String(e.memberId||'').trim().toUpperCase(), quantity=Number(e.quantity)||0;
        if(!memberId||!quantity) continue;
        const farmer=await database.collection('farmers').findOne({companyId,memberId}); if(!farmer) return send(res,400,{error:`Farmer ${memberId} does not belong to this company`});
        const doc={companyId,memberId,date:String(e.date||new Date().toISOString().slice(0,10)),shift:e.shift||'Morning',quantity,fat:Number(e.fat)||0,rate:Number(e.rate)||Number(settings.milkRate)||0,amount:Number(e.amount)||quantity*(Number(e.rate)||Number(settings.milkRate)||0),status:e.status||'Pending'};
        const id=oid(e._id); if(id) await database.collection('milkEntries').updateOne({_id:id,companyId},{$set:doc}); else await database.collection('milkEntries').insertOne(doc);
      }
    }
    if(Array.isArray(body.feedEntries)){
      for(const e of body.feedEntries){
        const memberId=String(e.memberId||'').trim().toUpperCase(); if(!memberId||!e.item) continue;
        const farmer=await database.collection('farmers').findOne({companyId,memberId}); if(!farmer) return send(res,400,{error:`Farmer ${memberId} does not belong to this company`});
        const q=Number(e.quantity)||0,p=Number(e.unitPrice)||0;
        const doc={companyId,memberId,date:String(e.date||new Date().toISOString().slice(0,10)),item:String(e.item),quantity:q,unitPrice:p,total:Number(e.total)||q*p};
        const id=oid(e._id); if(id) await database.collection('feedEntries').updateOne({_id:id,companyId},{$set:doc}); else await database.collection('feedEntries').insertOne(doc);
      }
    }
    return module.exports(Object.assign(req,{method:'GET'}),res);
  }catch(e){console.error(e);return send(res,500,{error:e.message||'Database operation failed'});}
};
