const express = require('express');
const ctrl = require('../controllers/reports.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, ctrl.summary);
router.get('/by-product', requireAuth, requireAdmin, ctrl.byProduct);
router.get('/by-category', requireAuth, requireAdmin, ctrl.byCategory);
router.get('/orders', requireAuth, requireAdmin, ctrl.ordersForDay);

module.exports = router;
