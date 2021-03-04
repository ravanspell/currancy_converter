var express = require('express');
var router = express.Router();
const {convert} = require('../controllers/currancyRateController');


// comments
router.post('/api/convert', async (request, response, next)=> {
  convert(request, response);
});

module.exports = router;
