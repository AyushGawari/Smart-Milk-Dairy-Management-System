const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI environment variable is not configured.');

  if (cachedClient && cachedDb) return cachedDb;

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  cachedDb = cachedClient.db(process.env.MONGODB_DB || 'digital_milk_dairy');
  return cachedDb;
}

const DEFAULT_STATE = {
  farmers: [
    { id:'FM-001', name:'Ramesh Patel', village:'Khodiyar', phone:'9876543210', bank:'1234567890', ifsc:'SBIN0001234', pass:'1234', status:'Active' },
    { id:'FM-002', name:'Sunita Verma', village:'Nandasan', phone:'9123456789', bank:'9876543210', ifsc:'HDFC0004321', pass:'abcd', status:'Active' },
    { id:'FM-003', name:'Bharat Singh', village:'Unjha', phone:'9988776655', bank:'1122334455', ifsc:'ICIC0005678', pass:'pass3', status:'Active' }
  ],
  entries: [
    { farmerId:'FM-001', date:'2025-06-01', shift:'Morning', qty:12.5, fat:4.2, rate:32, amount:400, status:'Paid' },
    { farmerId:'FM-001', date:'2025-06-01', shift:'Evening', qty:10.0, fat:4.0, rate:32, amount:320, status:'Paid' },
    { farmerId:'FM-002', date:'2025-06-01', shift:'Morning', qty:8.0, fat:3.8, rate:32, amount:256, status:'Pending' },
    { farmerId:'FM-001', date:'2025-06-02', shift:'Morning', qty:13.0, fat:4.3, rate:32, amount:416, status:'Paid' },
    { farmerId:'FM-003', date:'2025-06-02', shift:'Evening', qty:9.5, fat:4.1, rate:32, amount:304, status:'Pending' }
  ],
  currentRate: 32,
  feedInventory: [
    { id:1, name:'Cattle Pellets', unit:'kg', price:18, stock:200 },
    { id:2, name:'Wheat Bran', unit:'kg', price:12, stock:150 },
    { id:3, name:'Mineral Mix', unit:'kg', price:55, stock:50 },
    { id:4, name:'Green Fodder', unit:'kg', price:4, stock:500 }
  ],
  invNextId: 5,
  feedDeductions: [
    { id:1, farmerId:'FM-001', date:'2025-06-01', item:'Cattle Pellets', qty:25, unitPrice:18, amount:450 },
    { id:2, farmerId:'FM-002', date:'2025-06-02', item:'Mineral Mix', qty:2, unitPrice:55, amount:110 }
  ],
  feedNextId: 3
};

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  try {
    const db = await getDb();
    const collection = db.collection('application_state');

    if (req.method === 'GET') {
      let doc = await collection.findOne({ _id: 'milk-dairy-state' });

      if (!doc) {
        await collection.insertOne({ _id: 'milk-dairy-state', ...DEFAULT_STATE, updatedAt: new Date() });
        doc = await collection.findOne({ _id: 'milk-dairy-state' });
      }

      delete doc._id;
      delete doc.updatedAt;
      return res.status(200).json(doc);
    }

    if (req.method === 'PUT') {
      const body = req.body || {};
      const state = {
        farmers: Array.isArray(body.farmers) ? body.farmers : [],
        entries: Array.isArray(body.entries) ? body.entries : [],
        currentRate: typeof body.currentRate === 'number' ? body.currentRate : 32,
        feedInventory: Array.isArray(body.feedInventory) ? body.feedInventory : [],
        invNextId: typeof body.invNextId === 'number' ? body.invNextId : 1,
        feedDeductions: Array.isArray(body.feedDeductions) ? body.feedDeductions : [],
        feedNextId: typeof body.feedNextId === 'number' ? body.feedNextId : 1
      };

      await collection.replaceOne(
        { _id: 'milk-dairy-state' },
        { _id: 'milk-dairy-state', ...state, updatedAt: new Date() },
        { upsert: true }
      );

      return res.status(200).json({ success: true, message: 'Data saved to MongoDB.' });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed.' });
  } catch (error) {
    console.error('MongoDB API error:', error);
    return res.status(500).json({ error: 'Database error.', message: error.message });
  }
};
