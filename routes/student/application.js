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
            'insert into student_application_program_list(stu_id, program_id, stu_program_status) values(?,?,?)',
            [stu_id, program_id, '참여중']
        )

        res.json({message : student_info[0].stu_name + "학생이 요청주신 프로그램이 신청되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 프로그램 신청 취소 */
router.post('/delete', async (req, res) => {
    const {stu_id, program_id} = req.body
    try 
    {
        const result = await req.db.query(
            'DELETE FROM student_application_program_list WHERE stu_id = ? AND program_id = ?',
            [stu_id, program_id]
        );

        if (result.affectedRows > 0) {
            res.json({ message: `학생 ID: ${stu_id}, 프로그램 ID: ${program_id} 신청이 취소되었습니다.` });
        } else {
            res.status(404).json({ message: '취소할 신청을 찾을 수 없습니다.' });
        }
    }
    catch(error)
    {
        console.log(error)
    }
});



module.exports = router;
