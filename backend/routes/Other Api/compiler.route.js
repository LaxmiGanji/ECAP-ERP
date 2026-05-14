const express = require('express');
const router = express.Router();
const { executeCode } = require('../../controllers/Other/compiler.controller');

router.post('/execute', executeCode);

module.exports = router;