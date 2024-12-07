var express = require('express');
var router = express.Router();

/* application은 프로그램 신청임. 신청을 해보자. */
router.post('/', async (req, res) => {
    const {stu_id, program_id} = req.body
    try 
    {
        const student_info = await req.db.query(
            'select stu_name from student where stu_id = ?',
            [stu_id]
        )
        await req.db.query(
            'insert into studentprogramlist(stu_id, program_id, stu_program_status) values(?,?,?)',
            [stu_id, program_id, '참여중']
        )

        res.json({message : student_info[0].stu_name + "학생이 요청주신 프로그램이 신청되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});



module.exports = router;
