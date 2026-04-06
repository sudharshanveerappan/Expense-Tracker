const router = require('express').Router();
const { getExpenses, createExpense, updateExpense, deleteExpense, getAnalytics } = require('../controllers/expenseController');
const protect = require('../middleware/auth');

router.use(protect);
router.get('/analytics', getAnalytics);
router.route('/').get(getExpenses).post(createExpense);
router.route('/:id').put(updateExpense).delete(deleteExpense);

module.exports = router;
