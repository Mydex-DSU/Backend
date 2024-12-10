var express = require('express');
var router = express.Router();


// 교수 -> 졸업생 추천
// 전화번호 없는 상태
router.post('/', async (req, res) =>  {
    console.log(req.body)
    const { stu_id, name, employmentStatus, graduateStudy, department, pro_id, year, phone } = req.body;

    const employmentStatusValue = employmentStatus === 'Y' ? 1 : 0;
    const graduateSchoolAdmissionValue = graduateStudy === 'Y' ? 1 : 0;
    
    const { part1, part2, part3 } = phone;

    // 문자열로 결합하여 phone_number로 대입
    const phone_number = `${part1}-${part2}-${part3}`;
    
    const query = `
        INSERT INTO bestgraduaterecommendationlist 
        (stu_id, stu_name, stu_phone, department_name, year_of_recommendation, employment_status, graduate_school_admission, pro_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    try {
        await req.db.query(query, [
            stu_id, 
            name,
            phone_number,
            department,
            year, 
            employmentStatusValue,
            graduateSchoolAdmissionValue,
            pro_id
        ]);
        res.json(`${name} 학생이 추천되었습니다.`);

    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
    
});

/* 우수 졸업생이 참여하고 종료된 비교과 프로그램*/
router.get('/graduateapplicationfin', async (req, res) => {
    console.log(req.body)
    const {stu_id} = req.body
    // const programs = await req.db.query(
    //     "SELECT * FROM programs WHERE program_status IN ('대기중', '모집중', '모집완료')"
    // );
    try{
        const graduateapplicationfin = await req.db.query(
            'select * from programs join studentprogramlist on programs.program_id = studentprogramlist.program_id where stu_id = ? and studentprogramlist.stu_program_status = "참여완료" and programs.program_status = "종료"',
            [stu_id]
        )
        res.json({graduateapplicationfin : graduateapplicationfin})
    }
    catch(error){
        console.log(error)
    }
})


module.exports = router;
