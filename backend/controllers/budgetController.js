const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

exports.getBudgets = async (req, res) => {
  try {
    const { month, year } = req.query;
    const budgets = await Budget.find({ user: req.user._id, month: +month, year: +year });

    const spent = await Expense.aggregate([
      {
        $match: {
          user: req.user._id,
          date: { $gte: new Date(year, month - 1, 1), $lte: new Date(year, month, 0, 23, 59, 59) },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]);

    const spentMap = Object.fromEntries(spent.map((s) => [s._id, s.total]));
    const result = budgets.map((b) => ({
      ...b.toObject(),
      spent: spentMap[b.category] || 0,
      remaining: b.limit - (spentMap[b.category] || 0),
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.upsertBudget = async (req, res) => {
  try {
    const { category, limit, month, year } = req.body;
    const budget = await Budget.findOneAndUpdate(
      { user: req.user._id, category, month, year },
      { limit },
      { upsert: true, new: true, runValidators: true }
    );
    res.json(budget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteBudget = async (req, res) => {
  try {
    await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
