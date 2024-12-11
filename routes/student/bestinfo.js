var express = require('express');
var router = express.Router();



// {
//     stu_id: '20201813',
//     select_programs: [ { program_id: 28, comment: '하이요' } ],
//     category: '디자인 및 크리에이티브',
//     detailed_category: '영상 편집',
//     major: '동서고가'
//   }
router.post('/', async (req, res) => {
    console.log(req.body);
    const {stu_id, select_programs, category, detailed_categories, major} = req.body
    
    try {
        //우주 졸업생 조회
        const bestgraduate = await req.db.query(
            'select employment_status from best_graduate_recommendation_list where stu_id = ?',
            [stu_id]
        )

        const studeniinfo = await req.db.query(
            'select * from student where stu_id = ?',
            [stu_id]
        )

        //1. 학생이 선택한 비교과 프로그램 
        for (const program of select_programs) {
            await req.db.query(
                'insert into best_graduate_select_programs(stu_id, comment, program_id)\
                values (?,?,?)',
                [stu_id, program.comment, program.program_id]
            )
        }

        //2. 학생이 선택한 카테고리
        //먼저 조회
        const checkCategory = await req.db.query(
            'select * from specialty_category where category_name = ?'
            ,[category]
        )


        //우수 졸업생 선택 전문분야 카테고리 부터 넣자.
        await req.db.query(
            'insert into best_graduate_select_specialty_category(specialty_category_id, stu_id)\
            values (?,?)',
            [checkCategory[0].specialty_category_id, stu_id]
        )

        for (const detailed_category of detailed_categories){
            const checkCategoryDetail = await req.db.query(
                'select * from specialty_category_details where detailed_name = ?'
                ,[detailed_category]
            )
            //상세
            await req.db.query(
                'insert into best_graduate_select_detailed_category(specialty_detail_id, stu_id)\
                values (?,?)',
                [checkCategoryDetail[0].specialty_detail_id, stu_id]
            )
        }
   
        
        if (bestgraduate[0].employment_status === 1){ //취직일때
            await req.db.query(
                'update best_graduate_recommendation_list set company_name = ?, stu_name = ?, department_name = ? \
                where stu_id = ?',
                [major, studeniinfo[0].stu_name, studeniinfo[0].department_name, stu_id]
            )
        }
        else {
            await req.db.query(
                'update best_graduate_recommendation_list set field_of_study = ?,stu_name = ?, department_name = ? \
                where stu_id = ?',
                [major, studeniinfo[0].stu_name, studeniinfo[0].department_name,  stu_id]
            )
        }
        //

        //pdf 
        return res.json({message : "우수 졸업생님이 선택한 비교과 프로그램과 카테고리가 등록되었습니다."})


    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
})




    // 졸업생 정보 저장
// router.post('/', async (req, res) => {

//     const { stu_id } = req.body;
//     try{
//     const updateinfo = await req.db.query(
//         'UPDATE best_graduate_recommendation_list SET company_name = ?, employment_field = ?, field_of_study = ?, portfolio_documents = ? WHERE stu_id = ?',
//         [company_name, employment_field, field_of_study, portfolio_documents, stu_id]
//     )


//     console.log(updateinfo)
//     res.json(updateinfo)
//     }
//     catch(error)
//     {
//         console.log(error)
//         res.status(500).json({ error: "서버 에러가 발생했습니다." });

//     }
// });

/* */

router.post('/view', async (req, res) => {
    const {stu_id} = req.body
    try
    {
        await req.db.query(
            'update best_graduate_recommendation_list set views = views + 1 where stu_id = ?', 
            [stu_id]
        )
        res.json({message : "조회수 업데이트 완료"})
    }
    catch(error){
        console.log(error)
    }
})

module.exports = router;
