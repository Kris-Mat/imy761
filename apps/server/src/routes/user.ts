// routes/user.js

import express, { Request, Response }  from 'express';
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

router.get('/users', (req: Request, res: Response) => {
  res.status(200).json([{ name: 'John Doe' }, { name: 'Jane Doe' }]);
});

export default router;