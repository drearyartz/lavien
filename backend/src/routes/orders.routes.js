const express = require('express');
const ctrl = require('../controllers/orders.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, ctrl.list);
router.get('/:id', requireAuth, ctrl.getOne);
router.post('/', requireAuth, ctrl.create);
router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);
router.post('/:id/items', requireAuth, ctrl.addItem);
router.patch('/:id/items/:itemId', requireAuth, ctrl.updateItem);
router.delete('/:id/items/:itemId', requireAuth, ctrl.removeItem);
router.patch('/:id/discount', requireAuth, ctrl.setDiscount);
router.patch('/:id/close', requireAuth, ctrl.close);
router.post('/:id/print', requireAuth, ctrl.print);

module.exports = router;
