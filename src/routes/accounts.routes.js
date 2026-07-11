const { Router } = require('express');
const accountsController = require('../controllers/accounts.controller');

const router = Router();

router.get('/:id', accountsController.getById);
router.get('/:id/portfolio', accountsController.getPortfolio);
router.get('/:id/transactions', accountsController.getTransactions);

module.exports = router;
