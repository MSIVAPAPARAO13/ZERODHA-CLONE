const express = require('express');
const { getAccountBalance, getTransactions } = require('../controllers/accountController');
const router = express.Router();

router.get('/balance', getAccountBalance);
router.get('/transactions', getTransactions);

module.exports = router;
