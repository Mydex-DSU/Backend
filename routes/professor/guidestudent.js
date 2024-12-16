var express = require('express');
var router = express.Router();

var logger = require('../../logger');
const e = require('cors');


/* 지도 학생 조회 */
router.post('/', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    
    const {pro_id} = req.body
    console.log(pro_id)
    try{
        const guidestudent = await req.db.query(
            'select * from student where pro_id = ?'
            ,[pro_id]
        )
        res.status(200).json({ guidestudent: guidestudent });
          
        // res.json(stu_id.length === 0 ? { stu_id : "학생 로그인에 실패하였습니다." } : { login: true, stu_id: stu_id });
    }
    catch(error)
    {
        console.log(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});
//stu_reset_available_count, stu_reset_date
router.post('/reset', async (req, res) => {
    const {stu_id} = req.body
    try{
        const date = new Date();
        const formattedDate = date.toISOString().slice(0, 19).replace('T', ' ');
        
        // 실행 예시
        await req.db.query(
            'update student set stu_reset_available_count = 0, stu_reset_date = ?, stu_current_warning_count = 0 where stu_id = ?',
            [formattedDate, stu_id]
        );
        

        return res.json({message : "지도학생의 경고횟수를 초기화하였습니다."})
    }
    catch(error){
        console.log(error)
    }
})

/* 지도 교수가 추천을 이번 년도에 했나 안 했나 확인*/
router.post('/recommend/check', async (req, res) => {
    const { pro_id, year } = req.body;

    try {
        const currentYear = new Date().getFullYear(); // 현재 년도 가져오기

        const check = await req.db.query(
            'SELECT * FROM best_graduate_recommendation_list WHERE pro_id = ? AND year_of_recommendation = ?',
            [pro_id, year]
        );

        console.log(check);

        // 조건: 해당 데이터가 없거나, 입력된 year가 현재 년도보다 이전일 경우
        if (check.length === 0 || parseInt(year) < currentYear) {
            res.json({ check: false });
        } else {
            res.json({ check: true, student: check });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
