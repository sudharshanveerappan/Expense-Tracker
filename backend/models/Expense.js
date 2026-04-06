const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
    category: {
      type: String,
      enum: {
        values: ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Shopping', 'Education', 'Other'],
        message: '{VALUE} is not a valid category',
      },
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    date: { type: Date, default: Date.now },
    paymentMethod: {
      type: String,
      enum: {
        values: ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Bank Transfer'],
        message: '{VALUE} is not a valid payment method',
      },
      default: 'Cash',
    },
  },
  { timestamps: true }
);

// Speeds up filtered list queries (user + date range + category)
ExpenseSchema.index({ user: 1, date: -1 });
ExpenseSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Expense', ExpenseSchema);
