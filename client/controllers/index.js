import express from 'express';
const router = express.Router();

router.get('/', (req, res)=>{
	res.redirect('/api/v1/user');
});

export default router