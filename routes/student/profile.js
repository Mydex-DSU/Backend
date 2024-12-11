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
        const student_noshow_history = await req.db.query(
            'select * from student_noshow_history where stu_id = ?',
            [stu_id]
        )
        console.log(student_noshow_history)

        res.json({student_noshow_history : student_noshow_history})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 학생 학부 남은 온도 포인트 */
router.post('/remainfacultypoints', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        // 학생의 학부 정보 조회
        const facultyInfo = await req.db.query(
            `SELECT 
                s.stu_id, 
                d.department_name, 
                f.faculty_name,
                f.faculty_mydex_points
            FROM 
                student s 
            JOIN 
                department d 
            ON 
                s.department_name = d.department_name 
            JOIN 
                faculty f 
            ON 
                d.faculty_id = f.faculty_id 
            WHERE 
                s.stu_id = ?`,
            [stu_id]
        );

        res.json({facultyInfo : facultyInfo[0]})
    }
    catch(error)
    {
        console.log(error)
    }   
})

/* 학생이 보는 비교과프로그램 */
router.get('/program', async (req,res) => {
    try
    {
        const all_program = await req.db.query(
            'select * from programs'
        )
        res.json({all_program : all_program})
    }catch(error){
        console.log(error)
    }
})

/* 학생 입장 비교과 프로그램 상세 */
router.post('/program/detail', async (req,res) => {
    const {program_id} = req.body
    try
    {
        const program_detail = await req.db.query(
            'select * from programs join admin on admin.adm_id = programs.adm_id where program_id = ?',
            [program_id]
        )

        const program_detail_all = await Promise.all(
            program_detail.map(async (detail) => {
                // 프로그램 현재 신청한 인원
                const [program_application_student] = await req.db.query(
                    'SELECT COUNT(*) AS program_application_student FROM student_application_program_list WHERE program_id = ?;',
                    [program_id]
                );
        
                return {
                    ...detail,
                    program_application_student: program_application_student.program_application_student,
                };
            })
        );
        
        
        res.json({program_detail_all : program_detail_all})
    }catch(error){
        console.log(error)
    }
})


module.exports = router;
