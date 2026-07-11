const { Router } = require('express');
const ordersController = require('../controllers/orders.controller');
const validate = require('../middleware/validate');
const { orderSchema } = require('../validators/order.validator');

const router = Router();

router.post('/buy', validate(orderSchema), ordersController.buy);

module.exports = router;
