const mongoose = require('mongoose');
const Expense = require('../models/Expense');

// Formats Mongoose validation errors into a readable object
const formatValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => e.message);
  return { message: 'Validation failed', errors };
};

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// GET /expenses?category=&startDate=&endDate=&page=&limit=
exports.getExpenses = async (req, res) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit))); // cap at 100

    const filter = { user: req.user._id };

    if (category) {
      const validCategories = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'];
      if (!validCategories.includes(category))
        return res.status(400).json({ message: `Invalid category: ${category}` });
      filter.category = category;
    }

    if (startDate || endDate) {
      const dateFilter = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start)) return res.status(400).json({ message: 'Invalid startDate format' });
        dateFilter.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end)) return res.status(400).json({ message: 'Invalid endDate format' });
        end.setHours(23, 59, 59, 999); // include the full end day
        dateFilter.$lte = end;
      }
      filter.date = dateFilter;
    }

    const [expenses, total] = await Promise.all([
      Expense.find(filter)
        .sort({ date: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum),
      Expense.countDocuments(filter),
    ]);

    res.json({
      expenses,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch expenses', error: err.message });
  }
};

// POST /expenses
exports.createExpense = async (req, res) => {
  try {
    const { amount, category, date, description, paymentMethod } = req.body;

    if (amount === undefined || !category)
      return res.status(400).json({ message: 'amount and category are required' });

    const expense = await Expense.create({
      amount,
      category,
      date,
      description,
      paymentMethod,
      user: req.user._id,
    });

    res.status(201).json(expense);
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json(formatValidationError(err));
    res.status(500).json({ message: 'Failed to create expense', error: err.message });
  }
};

// PUT /expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid expense ID' });

    // Prevent user field from being overwritten
    const { user: _user, ...updateData } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: id, user: req.user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) return res.status(404).json({ message: 'Expense not found' });
    res.json(expense);
  } catch (err) {
    if (err.name === 'ValidationError')
      return res.status(400).json(formatValidationError(err));
    res.status(500).json({ message: 'Failed to update expense', error: err.message });
  }
};

// DELETE /expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return res.status(400).json({ message: 'Invalid expense ID' });

    const expense = await Expense.findOneAndDelete({ _id: id, user: req.user._id });
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    res.json({ message: 'Expense deleted successfully', id });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete expense', error: err.message });
  }
};

// GET /expenses/analytics?month=&year=
exports.getAnalytics = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year)
      return res.status(400).json({ message: 'month and year query params are required' });

    const m = parseInt(month);
    const y = parseInt(year);

    if (isNaN(m) || m < 1 || m > 12)
      return res.status(400).json({ message: 'month must be between 1 and 12' });
    if (isNaN(y) || y < 2000 || y > 2100)
      return res.status(400).json({ message: 'Invalid year' });

    const start = new Date(y, m - 1, 1);
    const end = new Date(y, m, 0, 23, 59, 59, 999);

    const [categoryBreakdown, monthlyTrend] = await Promise.all([
      Expense.aggregate([
        { $match: { user: req.user._id, date: { $gte: start, $lte: end } } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      Expense.aggregate([
        {
          $match: {
            user: req.user._id,
            date: { $gte: new Date(y, 0, 1), $lte: new Date(y, 11, 31, 23, 59, 59) },
          },
        },
        { $group: { _id: { month: { $month: '$date' } }, total: { $sum: '$amount' } } },
        { $sort: { '_id.month': 1 } },
      ]),
    ]);

    res.json({ categoryBreakdown, monthlyTrend });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message });
  }
};
