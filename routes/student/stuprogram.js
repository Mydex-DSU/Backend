var express = require('express');
var router = express.Router();

/* 학생 참여중인 비교과 프로그래ㅑㅁ */
router.post('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const student_join_programs = await req.db.query(
            `SELECT sp.*, p.program_application_start_time, p.program_application_end_time, p.program_operation_start_time, p.program_operation_end_time, p.program_poster_image, p.program_mydex_points, p.program_status, p.program_name
             FROM student_application_program_list sp
             JOIN programs p ON sp.program_id = p.program_id
             WHERE sp.stu_id = ? and stu_program_status = "참여중"`,
            [stu_id]
        );

        // 데이터 처리
        const processedPrograms = student_join_programs.map(program => {
            // 날짜를 합친 문자열 생성
            const applicationPeriod = `${new Date(program.program_application_start_time).toISOString().slice(0, 10)} ~ ${new Date(program.program_application_end_time).toISOString().slice(0, 10)}`;
            const operationPeriod = `${new Date(program.program_operation_start_time).toISOString().slice(0, 10)} ~ ${new Date(program.program_operation_end_time).toISOString().slice(0, 10)}`;

            // 프로그램 정보를 새 객체로 반환
            return {
                ...program,
                applicationPeriod, // 추가된 결합된 신청 기간 문자열
                operationPeriod,   // 추가된 결합된 운영 기간 문자열
            };
        });


        // 결과 반환
        res.status(200).json({
            student_join_programs: processedPrograms
        });
        // res.json({student_join_programs : student_join_programs})
    }
    catch(error)
    {
        console.log(error)
    }
});



module.exports = router;
