const {db,ensureIndexes}=require('./_db');
module.exports=async(req,res)=>{try{const database=await db();await database.command({ping:1});await ensureIndexes(database);res.status(200).json({ok:true,database:database.databaseName});}catch(e){res.status(500).json({ok:false,error:e.message});}};
