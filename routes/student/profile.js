var express = require('express');
var router = express.Router();

router.post('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        let student_profile = await req.db.query(
            'select * from student where stu_id = ?',
            [stu_id]
        )
        console.log(student_profile[0].stu_current_loan_points)

        // //대출 가능 한 포인트 
        // const loan_possible_point = 5 - student_profile[0].stu_current_loan_points
        // student_profile = {...student_profile, loan_possible_point}
        // // res.json({student_profile : student_profile[0], loan_possible_point})
        // res.json({student_profile : student_profile})
           // 대출 가능 포인트 계산
        const loan_possible_point = 5 - student_profile[0].stu_current_loan_points;

        // student_profile과 loan_possible_point를 합침
        const combinedProfile = {
            ...student_profile[0],
            loan_possible_point
        };

        res.json({ student_profile: combinedProfile });
    }
    catch(error)
    {
        console.log(error)
    }
});

        // 데이터 처리
        // const processedPrograms = student_join_programs.map(program => {
        //     // 날짜를 합친 문자열 생성
        //     const applicationPeriod = `${new Date(program.program_application_start_time).toISOString().slice(0, 10)} ~ ${new Date(program.program_application_end_time).toISOString().slice(0, 10)}`;
        //     const operationPeriod = `${new Date(program.program_operation_start_time).toISOString().slice(0, 10)} ~ ${new Date(program.program_operation_end_time).toISOString().slice(0, 10)}`;

        //     // 프로그램 정보를 새 객체로 반환
        //     return {
        //         ...program,
        //         applicationPeriod, // 추가된 결합된 신청 기간 문자열
        //         operationPeriod,   // 추가된 결합된 운영 기간 문자열
        //     };
        // });

/* 학생 전체 노쇼 내역 */
router.post('/noshowhistory', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const studentnoshowhistory = await req.db.query(
            'select * from studentnoshowhistory where stu_id = ?',
            [stu_id]
        )
        console.log(studentnoshowhistory)

        res.json({studentnoshowhistory : studentnoshowhistory})
    }
    catch(error)
    {
        console.log(error)
    }
});



module.exports = router;
