var express = require('express');
var router = express.Router();

// 메인 우수졸업생 카드
// 메인 우수졸업생 카드
router.get('/', async (req, res) => {
    const { stu_id } = req.body;

    try {

        // 현재 디비에 없는 값도 있어서 left join을 해둔 상태임.
        const grad_list = await req.db.query(

            `SELECT 
s.*,
s.department_name AS student_department_name,
d.department_name AS department_name,
f.faculty_name AS faculty_name,
bgsc.stu_id AS specialty_category_stu_id,
sc.category_name,
GROUP_CONCAT(scd.detailed_name) AS detailed_category_names
FROM 
best_graduate_recommendation_list s
JOIN 
department d ON s.department_name = d.department_name
JOIN 
faculty f ON d.faculty_id = f.faculty_id
LEFT JOIN 
best_graduate_select_specialty_category bgsc ON s.stu_id = bgsc.stu_id
LEFT JOIN 
best_graduate_select_detailed_category bgdc ON s.stu_id = bgdc.stu_id
LEFT JOIN 
specialty_category_details scd ON bgdc.specialty_detail_id = scd.specialty_detail_id
LEFT JOIN 
specialty_category sc ON bgsc.specialty_category_id = sc.specialty_category_id
GROUP BY 
s.stu_id, s.department_name, d.department_name, f.faculty_name, bgsc.stu_id
ORDER BY s.views desc`
        );
        return res.status(200).json(grad_list)



//  `SELECT 
//                     bgr.year_of_recommendation,
//                     bgr.company_name, 
//                     bgr.field_of_study, 
//                     bgr.stu_name, 
//                     bgr.department_name, 
//                     f.faculty_name, 
//                     bgr.views,
//                     sc.category_name AS specialty_category, 
//                     scd.detailed_name AS specialty_detail
//                 FROM best_graduate_recommendation_list bgr
//                 LEFT JOIN student s ON bgr.stu_id = s.stu_id
//                 LEFT JOIN department d ON s.department_name = d.department_name
//                 LEFT JOIN faculty f ON d.faculty_id = f.faculty_id
//                 LEFT JOIN best_graduate_select_specialty_category bgssc ON bgr.stu_id = bgssc.stu_id
//                 LEFT JOIN specialty_category sc ON bgssc.specialty_category_id = sc.specialty_category_id
//                 LEFT JOIN specialty_category_details scd ON sc.specialty_category_id = scd.specialty_category_id
//                 ORDER BY bgr.views DESC;`


        // 조인을 하면 현재 없는 값이 있어서 데이터가 안 날라감 


        // `SELECT 
        //     f.faculty_name, 
        //     bgssc.views, 
        //     bgr.company_name, 
        //     bgr.graduate_school_admission, 
        //     scd.detailed_name, 
        //     sc.category_name
        //  FROM best_graduate_recommendation_list bgr
        //  JOIN student s ON bgr.stu_id = s.stu_id
        //  JOIN department d ON s.department_name = d.department_name  
        //  JOIN faculty f ON d.faculty_id = f.faculty_id 
        //  JOIN bestgraduatesselectspecializationcategories bgssc ON bgr.stu_id = bgssc.stu_id
        //  JOIN bestgraduateselectiondetailedcategory bgd ON bgd.stu_id = bgr.stu_id
        //  JOIN specialtycategorydetails scd ON bgd.specialization_detail_id = scd.specialty_detail_id 
        //  JOIN specialtycategory sc ON scd.specialty_category_id = sc.specialty_category_id
        //  WHERE bgr.stu_id = ?`

        

        // ,[stu_id] 
        // );


        // res.json({
        //     faculty_name,
        //     views,
        //     companyOrGraduate,
        //     studentName,
        //     categorys
        // });
        //             res.json({stu_portfolios : stu_portfolios});
        
        // console.log(stu_portfolios,"!!");

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
}); 

/* 우수 졸업생 선택 비교과 */
router.post('/selectprogram', async (req, res) => {
    const {stu_id} = req.body
    try{

        
        const select_program = await req.db.query(
            `select * from best_graduate_select_programs join programs on best_graduate_select_programs.program_id = programs.program_id where stu_id = ?`,
            [stu_id]
        );
        return res.json(select_program)
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
})



    // 우수 졸업생 리스트 페이지(카드형태)
router.get('/list', async (req, res) => {
    const {stu_id} = req.body

    try{

        
        const grad_list = await req.db.query(
    
            
            `SELECT 
                bgr.company_name, 
                bgr.field_of_study, 
                s.stu_name, 
                d.department_name, 
                f.faculty_name, 
                bgssc.views,
                sc.category_name AS specialty_category, 
                scd.detailed_name AS specialty_detail
            FROM best_graduate_recommendation_list bgr
            LEFT JOIN student s ON bgr.stu_id = s.stu_id
            LEFT JOIN department d ON s.department_name = d.department_name
            LEFT JOIN faculty f ON d.faculty_id = f.faculty_id
            LEFT JOIN best_graduate_select_specialty_category bgssc ON bgr.stu_id = bgssc.stu_id
            LEFT JOIN specialty_category sc ON bgssc.specialty_category_id = sc.specialty_category_id
            LEFT JOIN specialty_category_details scd ON sc.specialty_category_id = scd.specialty_category_id
            ORDER BY bgssc.views DESC;
        `);
        res.json(grad_list)



} catch (error) {
    console.error("Error executing query:", error);
    res.status(500).json({ error: "서버 에러가 발생했습니다." });
}
})




// 우수 졸업생 상세 페이지
// 이렇게 짜면 안된다 -> 프론트가 힘들어함.
    router.get('/list/:stu_id', async (req, res) =>  {
        const {stu_id} = req.body

        try{

    
            // 1. 학부 이름 가져오기
            const [faculty_name] = await req.db.query(
                'select f.faculty_name FROM student s JOIN department d ON s.department_name = d.department_name JOIN faculty f ON d.faculty_id = f.faculty_id WHERE s.stu_id = ?',
                [stu_id]
            );

            // 2. 회사 이름 또는 대학원 분야 가져오기
            const [companyOrGraduate] = await req.db.query(
                'select company_name, employment_field, field_of_study from best_graduate_recommendation_list where stu_id = ?',
                [stu_id]
            );

            // 3. 학생 이름 가져오기
            const [studentName] = await req.db.query(
                'SELECT stu_name FROM student WHERE stu_id = ?',
                [stu_id]
            );

            // 4. 우수졸업생이 선택한 카테고리&상세카테고리
            const [categorys] = await req.db.query(

               ` SELECT sc.category_name, scd.detailed_name        
                FROM best_graduate_select_specialty_category bgssc
                JOIN specialty_category sc ON bgssc.specialty_category_id = sc.specialty_category_id
                JOIN specialty_category_details scd ON bgssc.specialty_category_id = scd.specialty_category_id
                WHERE bgssc.stu_id = ?;`
                , [stu_id]

            )

        // 추천한 비교과 프로그램
        const [choice_program] = await req.db.query(
            'select _program_id, coment from best_graduate_select_programs where stu_id = ?',
            [stu_id]
        );


        res.json(faculty_name, choice_program, views,companyOrGraduate, studentName, categorys);
        


        }catch(error)
        {
            console.log(error);
            res.status(500).json({ error: "서버 에러가 발생했습니다." });
        }
    });


module.exports = router;
    