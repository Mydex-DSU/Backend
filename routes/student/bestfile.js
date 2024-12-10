var express = require('express');
var router = express.Router();


// 우수 졸업생의 pdf 파일 저장하는 것.
router.post('/', async (req, res) => {

    const { stu_id } = req.body;

   
    try{

        const portfolio_documents = await req.db.query(
            'insert into'
        )









    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }

});



module.exports = router;
