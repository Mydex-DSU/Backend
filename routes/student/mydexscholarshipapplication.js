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

/* 학생 mydex 온도 포인트 장학금 신청인데 신청하면 급액이 바로 지급 됨.*/
router.post('/application', async (req, res) => {
    let {stu_id, mydex_scholarship_application_period_id, requested_scholarship_points} = req.body
    try 
    {
        const student_faculty = await req.db.query(
            'SELECT student.stu_id, student.department_name, department.faculty_id FROM student JOIN department ON student.department_name = department.department_name \
            JOIN faculty ON department.faculty_id = faculty.faculty_id \
            WHERE student.stu_id = ?;'
            ,[stu_id]
        )

        const insertmydexpoints = await req.db.query(
            'insert into mydexpointsscholarshipapplicationlist(mydex_scholarship_application_period_id, stu_id, requested_scholarship_points) values (?,?,?)',
            [mydex_scholarship_application_period_id, stu_id, requested_scholarship_points]
        )
        
        // 온도 포인트 신청했으면 학생 mydex 온도 포인트 차감.
        await req.db.query(
            `UPDATE student 
             SET stu_current_mydex_points = GREATEST(stu_current_mydex_points - ?, 0)
             WHERE stu_id = ?`,
            [requested_scholarship_points, stu_id]
        );

        // <= 학부별 거래 내역에 누구에게 온도 포인트가 지급 되엇는지 값 삽입 =>

        // start_date를 Date 객체로 변환
        const date = new Date();
        const month = date.getMonth(); 
        let semester = "";

        if (month >= 0 && month <= 5) {  // 1~6월이면 1학기
            semester = "1학기";
        } else if (month >= 6 && month <= 11) {  // 7~12월이면 2학기
            semester = "2학기";
        }

        requested_scholarship_points = requested_scholarship_points * -1;

        //학부별 예산 처리 거래 내역에 값 기입
        await req.db.query(
            'insert into faculty_budget_transactions(faculty_id, faculty_semester, faculty_used_budget, faculty_used_mydex_points, faculty_transaction_details) \
            values (?, ?, ?, ?, ?)',
            [student_faculty[0].faculty_id, semester, requested_scholarship_points * 5000, requested_scholarship_points, insertmydexpoints.insertId]
        )

        //학부별 예산 처리 거래 내역에서 이제 그만 큼 돈을 차감 해야됨
        await req.db.query(
            'UPDATE faculty SET faculty_mydex_points = faculty_mydex_points + ?, faculty_budget_amount = faculty_budget_amount + ? WHERE faculty_id = ?',
            [requested_scholarship_points, requested_scholarship_points * 5000, student_faculty[0].faculty_id]
        );

        //마지막으로 학생이 한 거 mydex 온도 포인트 거래 내역에 기입
        await req.db.query(
            'insert into mydexpointhistory(stu_id, mydexpointshistory_reason_name, mydexpointshistory_recv_count, mydexpointshistory_reason_number) values (?, ?, ?, ?)',
            [stu_id, "온도 포인트 장학금", requested_scholarship_points, insertmydexpoints.insertId]
        )

        res.json({message : "mydex 온도 포인트 장학금이 신청과 학부별 예산 처리가 완료되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});


module.exports = router;
