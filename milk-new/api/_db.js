const {MongoClient}=require('mongodb');
let clientPromise;
function getClient(){
  if(!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  if(!clientPromise) clientPromise=new MongoClient(process.env.MONGODB_URI).connect();
  return clientPromise;
}
async function db(){return (await getClient()).db(process.env.MONGODB_DB||'digital_milk_dairy');}
async function ensureIndexes(database){
  await Promise.all([
    database.collection('companies').createIndex({code:1},{unique:true}),
    database.collection('companies').createIndex({adminUsername:1},{unique:true}),
    database.collection('farmers').createIndex({companyId:1,memberId:1},{unique:true}),
    database.collection('milkEntries').createIndex({companyId:1,date:-1}),
    database.collection('feedEntries').createIndex({companyId:1,date:-1}),
    database.collection('settings').createIndex({companyId:1},{unique:true})
  ]);
}
module.exports={db,ensureIndexes};
