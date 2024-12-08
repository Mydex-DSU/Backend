var express = require('express');
var router = express.Router();

var logger = require('../../logger');


/* 지도 학생 조회 */
router.post('/', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {pro_id} = req.body

    try{
        const guidestudent = await req.db.query(
            'select * from student where pro_id = ?'
            ,[pro_id]
        )
        if (guidestudent.length === 0) {
            res.status(500).json({ guidestudent : "학생 로그인에 실패하였습니다." });
        } else {
            res.status(200).json({ guidestudent: guidestudent });
        }        
        // res.json(stu_id.length === 0 ? { stu_id : "학생 로그인에 실패하였습니다." } : { login: true, stu_id: stu_id });
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});



module.exports = router;
