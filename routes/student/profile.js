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

        const loan_possible_point = 5 - student_profile[0].stu_current_loan_points;

        // student_profile과 loan_possible_point를 합침
      
        student_profile[0].loan_possible_point = loan_possible_point;

        const combinedProfile = {
                    ...student_profile[0],

                };

        res.json({ student_profile: combinedProfile });
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 학생 전체 노쇼 내역 */
router.post('/noshowhistory', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const student_noshow_history = await req.db.query(
            'SELECT * FROM student_noshow_history WHERE stu_id = ?',
            [stu_id]
        );
        
        // 프로그램 정보를 가져옴
        // 프로그램 정보를 가져옴
        const programIds = student_noshow_history.map(h => h.noshowhistory_reason_number);
        let program_check = [];
        let loan_check = [];
        if (programIds.length > 0) {
            // programIds가 비어 있지 않은 경우에만 쿼리 실행
            program_check = await req.db.query(
                'SELECT * FROM programs WHERE program_id IN (?)',
                [programIds]
            );

            // 대출 거래 정보를 가져옴
            loan_check = await req.db.query(
                'SELECT * FROM loan_point_transaction_history WHERE loan_id IN (?)',
                [programIds]
            );
        } else {
            // programIds가 비어 있으면 빈 배열 반환 또는 기본 처리
            const program_check = [];
            console.log("No programs to fetch.");
        }

        

        
        // student_noshow_history에 history_reason 추가
        student_noshow_history.forEach((history) => {
            const matchedProgram = program_check.find(
                (program) => program.program_id === history.noshowhistory_reason_number
            );
        
            const matchedLoan = loan_check.find(
                (loan) => loan.loan_id === history.noshowhistory_reason_number
            );
        
            if (matchedProgram) {
                // programs에서 값 매칭
                history.history_reason = matchedProgram.program_name;
            } else if (matchedLoan) {
                // loan_point_transaction_history에서 값 매칭
                history.history_reason = matchedLoan.loan_type;
            } else {
                // 매칭되지 않은 경우
                history.history_reason = null;
            }
        });
        
        return res.json({ student_noshow_history: student_noshow_history });
        

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
            'select * from programs join admin on admin.adm_id = programs.adm_id \
            join programtype on programs.programtype_id = programtype.programtype_id where program_id = ?',
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

/* 학생 비교과 프로그램 신청 목록 */
router.post('/application/programlist', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const applicationProgramList = await req.db.query(
            'select * from student_application_program_list join \
            programs on student_application_program_list.program_id = programs.program_id \
            join admin on programs.adm_id = admin.adm_id\
            where student_application_program_list.stu_id = ? and \
            student_application_program_list.stu_program_status = "참여중" and (programs.program_status = "모집중" or programs.program_status = "모집완료" or programs.program_status = "운영중")\
            ', [stu_id]
        )
        // s join programs r on s.program_id and r.program_id 
        // console.log(applicationProgramList)

        return res.json({applicationProgramList : applicationProgramList})
    }
    catch(error){
        console.log(error)
    }
})

/* 학생 참여 목록 비교과 프로그램 */
router.post('/participation/programlist', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const participationProgramList = await req.db.query(
            `
                SELECT 
                    *
                FROM 
                    student_application_program_list
                JOIN 
                    student_completes_program 
                ON 
                    student_application_program_list.stu_id = student_completes_program.stu_id 
                    AND student_application_program_list.program_id = student_completes_program.program_id
                LEFT JOIN 
                    programs 
                ON 
                    student_completes_program.program_id = programs.program_id
                LEFT JOIN 
                    noshow_reason_category 
                ON 
                    student_completes_program.noshowreasoncategories_id = noshow_reason_category.noshowreasoncategories_id
                WHERE 
                    student_application_program_list.stu_id = ?
                    AND (programs.program_status = "평가중" 
                        OR programs.program_status = "설문조사" 
                        OR programs.program_status = "종료");

            `
            ,[stu_id]
        )

        // 'select * from student_completes_program join \
        // programs on student_completes_program.program_id = programs.program_id \
        // left join student_application_program_list on student_completes_program.stu_id = student_application_program_list.stu_id and student_completes_program.program_id = student_application_program_list.program_id\
        // LEFT join noshow_reason_category on student_completes_program.noshowreasoncategories_id  = noshow_reason_category.noshowreasoncategories_id\
        // where student_completes_program.stu_id = ? and (programs.program_status = "평가중" or programs.program_status = "설문조사" or programs.program_status = "종료")\
        // ', [stu_id]
        // s join programs r on s.program_id and r.program_id 
        // console.log(participationProgramList)

        return res.json({participationProgramList : participationProgramList})
    }
    catch(error){
        console.log(error)
    }
})


module.exports = router;
