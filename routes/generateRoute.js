const express = require('express');
const {  generateApplication } = require('../controllers/generateController');

const router = express.Router();

router.post('/', generateApplication); 

module.exports = router;