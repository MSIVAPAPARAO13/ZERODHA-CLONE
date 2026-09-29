const express = require('express');
const { tradeReview, portfolioReview, patternReview, dailyDebrief, whatChangedToday, behaviorReview } = require('../controllers/aiController');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const router = express.Router();

router.use(aiRateLimiter);

router.get('/trade-review/:journalId', tradeReview);
router.get('/portfolio-review', portfolioReview);
router.get('/pattern-review', patternReview);
router.get('/daily-debrief', dailyDebrief);
router.get('/what-changed-today', whatChangedToday);
router.get('/behavior-review', behaviorReview);
router.post('/playbook-suggestions', playbookSuggestion);
router.get('/playbook-review', playbookReview);

module.exports = router;
