const { Router } = require('express');
const accountsController = require('../controllers/accounts.controller');

const router = Router();

router.get('/:id', accountsController.getById);

module.exports = router;
