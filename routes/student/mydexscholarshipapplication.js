var express = require('express');
var router = express.Router();

/* 학생이 mydex 온도 포인트 장학금 기간에 맞게 신청을 하는 거임. application은 신청*/

/* 이거는 학생 자기 자신의 mydex 온도 포인트 장학금 신청한 거 조회 */
router.get('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const mydexpointsscholarshipapplicationlist = await req.db.query(
            'select * from mydexpointsscholarshipapplicationlist where stu_id = ?',
            [stu_id]
        )
        res.json({mydexpointsscholarshipapplicationlist : mydexpointsscholarshipapplicationlist})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 학생 mydex 온도 포인트 장학금 신청 */
router.post('/application', async (req, res) => {
    const {stu_id, mydex_scholarship_application_period_id, requested_scholarship_points} = req.body
    try 
    {
        await req.db.query(
            'insert into mydexpointsscholarshipapplicationlist(mydex_scholarship_application_period_id, stu_id, requested_scholarship_points, scholarship_approval_status) values (?,?,?,?)',
            [mydex_scholarship_application_period_id, stu_id, requested_scholarship_points, "신청 완료"]
        )
        
        // 온도 포인트 신청했으면 학생 mydex 온도 포인트 차감.
        await req.db.query(
            `UPDATE student 
             SET stu_current_mydex_points = GREATEST(stu_current_mydex_points - ?, 0)
             WHERE stu_id = ?`,
            [requested_scholarship_points, stu_id]
        );
        
        res.json({message : "mydex 온도 포인트 장학금이 신청되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});


module.exports = router;
