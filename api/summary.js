const { ObjectId } = require('mongodb');
const { db, ensureIndexes } = require('./_db');
const { getUser } = require('./_auth');

function send(res, status, data) { return res.status(status).json(data); }
function validObjectId(value) { try { return new ObjectId(value); } catch { return null; } }

module.exports = async (req, res) => {
  const user = getUser(req);
  if (!user) return send(res, 401, { error: 'Please log in again.' });
  if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
  if (!['company', 'farmer'].includes(user.role)) return send(res, 403, { error: 'Company or farmer access required.' });

  try {
    const companyId = String(user.companyId || '');
    if (!validObjectId(companyId)) return send(res, 400, { error: 'Invalid company session.' });
    const database = await db();
    await ensureIndexes(database);
    const filter = { companyId };
    if (user.role === 'farmer') filter.memberId = String(user.memberId || '').trim().toUpperCase();
    const [milk, feed] = await Promise.all([
      database.collection('milkEntries').aggregate([
        { $match: filter },
        { $group: { _id: '$memberId', entries: { $sum: 1 }, liters: { $sum: '$quantity' }, grossAmount: { $sum: '$amount' } } },
        { $sort: { _id: 1 } }
      ]).toArray(),
      database.collection('feedEntries').aggregate([
        { $match: filter },
        { $group: { _id: '$memberId', deductions: { $sum: '$total' } } },
        { $sort: { _id: 1 } }
      ]).toArray()
    ]);
    const deductionsByFarmer = new Map(feed.map(item => [item._id, Number(item.deductions || 0)]));
    const farmers = milk.map(item => ({
      memberId: item._id,
      entries: item.entries,
      liters: Number(item.liters || 0),
      grossAmount: Number(item.grossAmount || 0),
      feedDeductions: deductionsByFarmer.get(item._id) || 0,
      netPayable: Number(item.grossAmount || 0) - (deductionsByFarmer.get(item._id) || 0)
    }));
    return send(res, 200, {
      totals: farmers.reduce((a, f) => ({
        entries: a.entries + f.entries,
        liters: a.liters + f.liters,
        grossAmount: a.grossAmount + f.grossAmount,
        feedDeductions: a.feedDeductions + f.feedDeductions,
        netPayable: a.netPayable + f.netPayable
      }), { entries: 0, liters: 0, grossAmount: 0, feedDeductions: 0, netPayable: 0 }),
      farmers
    });
  } catch (error) {
    console.error('Summary query failed:', error);
    return send(res, 500, { error: 'Could not load summary from MongoDB.' });
  }
};
