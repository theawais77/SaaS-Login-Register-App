var express = require('express');
var router = express.Router();
var User = require('../models/user');
/* GET home page. */
router.get('/', async function(req, res, next) {
  // Create test user
  const newUser = new User({ name: 'Awais', email: 'awais@example.com' });
  await newUser.save();

  res.send('✅ User added to MongoDB Atlas!');
});

module.exports = router;
