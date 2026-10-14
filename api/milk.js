const { ObjectId } = require('mongodb');
const { db, ensureIndexes } = require('./_db');
const { getUser } = require('./_auth');

function send(res, status, data) { return res.status(status).json(data); }
function validObjectId(value) { try { return new ObjectId(value); } catch { return null; } }

module.exports = async (req, res) => {
  const user = getUser(req);
  if (!user) return send(res, 401, { error: 'Please log in again.' });
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed.' });
  if (user.role !== 'company') return send(res, 403, { error: 'Only company administrators can record milk.' });

  try {
    const companyId = String(user.companyId || '');
    if (!validObjectId(companyId)) return send(res, 400, { error: 'Invalid company session. Please log in again.' });
    const body = req.body || {};
    const memberId = String(body.memberId || '').trim().toUpperCase();
    const date = String(body.date || new Date().toISOString().slice(0, 10));
    const shift = body.shift === 'Evening' ? 'Evening' : 'Morning';
    const quantity = Number(body.quantity);
    const fat = Number(body.fat || 0);
    if (!memberId) return send(res, 400, { error: 'Please select a farmer.' });
    if (!Number.isFinite(quantity) || quantity <= 0) return send(res, 400, { error: 'Milk quantity must be greater than zero.' });
    if (!Number.isFinite(fat) || fat < 0 || fat > 20) return send(res, 400, { error: 'Enter a valid fat percentage.' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return send(res, 400, { error: 'Enter a valid collection date.' });

    const database = await db();
    await ensureIndexes(database);
    const farmer = await database.collection('farmers').findOne({ companyId, memberId, status: { $ne: 'Inactive' } });
    if (!farmer) return send(res, 400, { error: `Farmer ${memberId} was not found in this company.` });

    const settings = await database.collection('settings').findOne({ companyId });
    const requestedRate = Number(body.rate);
    const rate = Number.isFinite(requestedRate) && requestedRate >= 0
      ? requestedRate
      : Number(settings?.milkRate ?? 45);
    const amount = Math.round(quantity * rate * 100) / 100;
    const doc = {
      companyId,
      memberId,
      date,
      shift,
      quantity: Math.round(quantity * 100) / 100,
      fat: Math.round(fat * 10) / 10,
      rate,
      amount,
      status: 'Pending',
      createdAt: new Date()
    };
    const result = await database.collection('milkEntries').insertOne(doc);
    return send(res, 201, { message: 'Milk entry saved to MongoDB.', entry: { ...doc, _id: result.insertedId } });
  } catch (error) {
    console.error('Milk entry save failed:', error);
    return send(res, 500, { error: 'Could not save milk entry. Check the Vercel function logs and MongoDB connection.' });
  }
};
