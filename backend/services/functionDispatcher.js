const { getContext, setContext } = require('./chatContextStore');

// ---------------------------------------------------------------------------
// 🔥 ADD EXPENSE
// ---------------------------------------------------------------------------
async function add_expense(params, userId) {
  const { amount, category } = params || {};

  if (!amount || amount <= 0) {
    return { success: false, message: 'Please specify a valid amount.' };
  }

  if (!category) {
    return { success: false, message: 'Please specify a category.' };
  }

  return {
    success: true,
    message: `Added ₹${amount} for ${category}`,
    data: {
      _id: "demo-id",
      amount,
      category,
      date: new Date()
    }
  };
}

// ---------------------------------------------------------------------------
// 🔥  GET EXPENSES
// ---------------------------------------------------------------------------
async function get_expenses(params, userId) {
  return {
    success: true,
    message: "Here are your expenses",
    data: {
      expenses: [
        { _id: "1", amount: 100, category: "Food" },
        { _id: "2", amount: 200, category: "Transport" }
      ]
    }
  };
}

// ---------------------------------------------------------------------------
// 🔥  UPDATE EXPENSE
// ---------------------------------------------------------------------------
async function update_expense(params, userId) {
  const amount = params?.updates?.amount || 0;

  return {
    success: true,
    message: amount
      ? `Updated last expense to ₹${amount}`
      : "Updated last expense",
    data: { _id: "demo-id" }
  };
}

// ---------------------------------------------------------------------------
// 🔥  DELETE EXPENSE
// ---------------------------------------------------------------------------
async function delete_expense(params, userId) {
  return {
    success: true,
    message: "Deleted last expense",
    data: { deletedId: "demo-id" }
  };
}

// ---------------------------------------------------------------------------
// FUNCTION MAP
// ---------------------------------------------------------------------------
const FUNCTION_MAP = {
  add_expense,
  get_expenses,
  update_expense,
  delete_expense
};

// ---------------------------------------------------------------------------
// SINGLE DISPATCH
// ---------------------------------------------------------------------------
async function dispatch(intent, userId) {
  const fn = intent?.function;
  const params = intent?.parameters || {};

  if (!fn || fn === 'unknown') {
    return {
      success: false,
      message: intent?.reply || "Try: I spent 50 on food",
      intent
    };
  }

  const handler = FUNCTION_MAP[fn];

  if (!handler) {
    return {
      success: false,
      message: `Unknown function: ${fn}`,
      intent
    };
  }

  try {
    const result = await handler(params, userId);
    return { ...result, intent };
  } catch (error) {
    console.error("❌ DISPATCH ERROR:", error);

    return {
      success: false,
      message: "Something went wrong",
      intent
    };
  }
}

// ---------------------------------------------------------------------------
// MULTI DISPATCH
// ---------------------------------------------------------------------------
async function dispatchAll(intents, userId) {
  const results = [];

  for (const intent of intents) {
    const result = await dispatch(intent, userId);
    results.push(result);
  }

  // 🔥 SAFE CONTEXT UPDATE
  try {
    const last = results.find(r => r.success);

    setContext(userId, {
      lastAction: last?.intent?.function || null,
      lastExpenseId: last?.data?._id || null
    });

  } catch (err) {
    console.log("Context update skipped");
  }

  return results;
}

module.exports = {
  dispatch,
  dispatchAll,
  add_expense,
  get_expenses,
  update_expense,
  delete_expense
};