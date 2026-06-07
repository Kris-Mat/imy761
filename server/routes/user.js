// routes/user.js

const express = require('express');
const router = express.Router();

/**
* @swagger
* /user:
*   get:
*     summary: Retrieve a list of users
*     responses:
*       200:
*         description: A list of users
*/

router.get('/users', (req, res) => {
    res.status(200).json([{ name: 'John Doe' }, { name: 'Jane Doe' }]);
});

module.exports = router;