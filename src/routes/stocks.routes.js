const { Router } = require('express');
const stocksController = require('../controllers/stocks.controller');

const router = Router();

router.get('/', stocksController.getAll);

module.exports = router;
