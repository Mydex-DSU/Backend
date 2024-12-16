var express = require('express');
var router = express.Router();

var logger = require('../../logger');


/* 학생 */
router.post('/', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {stu_id} = req.body

    try{
        const stu_check = await req.db.query(
            'select * from student where stu_id = ?'
            ,[stu_id]
        )
        if (stu_check.length === 0) {
            res.status(500).json({ stu_id: "학생 로그인에 실패하였습니다." });
        } else {
            req.session.stu_id = stu_id;
            console.log(req.session.stu_id)
            res.status(200).json({ stu_id: stu_id });
        }        
        // res.json(stu_id.length === 0 ? { stu_id : "학생 로그인에 실패하였습니다." } : { login: true, stu_id: stu_id });
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});


/* 교수 로그인 */
router.post('/professor', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {pro_name} = req.body

    try{
        const pro_check = await req.db.query(
            'select * from professor where pro_name = ?'
            ,[pro_name]
        )
        console.log(pro_check);
        if (pro_check.length === 0) {
            res.json({ message: "교수 로그인에 실패하였습니다." });
        } else {
            req.session.pro_id = pro_check[0].pro_id;
            console.log( req.session.pro_id)
            res.json({ pro_id: req.session.pro_id });
        }        
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});


/* 관리자 로그인 */
router.post('/admin', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {adm_name} = req.body
    try{
        
        const adm_check = await req.db.query(
            'select * from admin where adm_name = ?'
            ,[adm_name]
        )
        console.log(adm_check);
        if (adm_check.length === 0) {
            res.status(500).json({ adm_id: "관리자 로그인에 실패하였습니다." });
        } else {
            req.session.adm_id = adm_check[0].adm_id;
            console.log( req.session.adm_id)
            res.status(200).json({ adm_id: req.session.adm_id });
        }        
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});

module.exports = router;
