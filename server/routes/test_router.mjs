import express from "express";

const router = express.Router();
router.use(express.json());

router.get('/websockets', (req, res) => {
    res.render('demos/websockets_client_demo.ejs');
});

router.get('/graphql', (req, res) => {
    res.render('demos/graphql_client_demo.ejs');
});

export default router;