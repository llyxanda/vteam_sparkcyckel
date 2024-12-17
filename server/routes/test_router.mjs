import express from "express";

const router = express.Router();
router.use(express.json());

router.get('/websockets', (req, res) => {
    res.render('websockets_client_demo.ejs');
});

export default router;