var express = require('express');
var router = express.Router();

/* 일반 설문조사 */
router.post('/', async (req, res) => {
    const {stu_id, program_id} = req.body
    try 
    {
        const student_info = await req.db.query(
            'select stu_name from student where stu_id = ?',
            [stu_id]
        )

        await req.db.query(
            `UPDATE student_completes_program SET survey_response_status = ? WHERE stu_id = ? and program_id = ?`,
            [1, stu_id, program_id]
        )
        res.json({message : student_info[0].stu_name + "학생이 설문조사를 완료하였습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* noshow 설문조사 응답 */
router.post('/noshow', async (req, res) => {
    const {noshowreasoncategories_id, stu_id, program_id} = req.body
    try 
    {
        const student_info = await req.db.query(
            'select stu_id, stu_name from student where stu_id = ?',
            [stu_id]
        )

        await req.db.query(
            `UPDATE student_completes_program SET noshowreasoncategories_id = ?, no_show_reason_response_status = ? WHERE stu_id = ? and program_id = ?`,
            [noshowreasoncategories_id, 1, stu_id, program_id]
        )
        res.json({message : student_info[0].stu_name + "학생이 노쇼 설문조사를 응답하였습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 노쇼 카테고리 설문조사 조회 */
router.get('/noshow_reason_category', async (req, res) => {
    try 
    {
        const noshow_reason_category = await req.db.query(
            'select * from noshow_reason_category',
        )
        res.json({noshow_reason_category : noshow_reason_category})
    }
    catch(error)
    {
        console.log(error)
    }
});


module.exports = router;
