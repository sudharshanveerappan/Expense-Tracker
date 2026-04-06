const router = require('express').Router();
const { getBudgets, upsertBudget, deleteBudget } = require('../controllers/budgetController');
const protect = require('../middleware/auth');

router.use(protect);
router.route('/').get(getBudgets).post(upsertBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
