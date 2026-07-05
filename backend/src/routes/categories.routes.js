const express = require('express');
const ctrl = require('../controllers/categories.controller');
const { requireAuth, requireAdmin } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', requireAuth, ctrl.list);
router.post('/', requireAuth, requireAdmin, ctrl.create);
router.patch('/:id', requireAuth, requireAdmin, ctrl.update);
router.delete('/:id', requireAuth, requireAdmin, ctrl.remove);

module.exports = router;
