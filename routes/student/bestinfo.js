var express = require('express');
var router = express.Router();




router.post('/', async (req, res) => {
    console.log(req.body);

    // 현재 없는 부분 pdf 

    const {
        stu_id,
        company_name,
        employment_field,
        field_of_study,
        portfolio_documents,
        comments,
    } = req.body;

    try {
        // Start a transaction
        await req.db.beginTransaction();

        // 회사이름 및 대학원 정보 기입
        await req.db.query(
            'UPDATE bestgraduaterecommendationlist SET company_name = ?, employment_field = ?, field_of_study = ?, portfolio_documents = ? WHERE stu_id = ?',
            [company_name, employment_field, field_of_study, portfolio_documents, stu_id]
        );

        // 비교과 선택한거 저장
        if (Array.isArray(programs) && programs.length > 0) {
            for (let i = 0; i < programs.length; i++) {
                const program_id = programs[i];
                const comment = comments && comments[i] ? comments[i] : ''; //

                console.log('Inserting program:', { program_id, stu_id, comment });

                await req.db.query(
                    `INSERT INTO bestgraduateoptionalextracurricularprograms (program_id, stu_id, comment) 
                     SELECT ?, ?, ? 
                     FROM DUAL
                     WHERE NOT EXISTS (
                         SELECT 1 
                         FROM bestgraduateoptionalextracurricularprograms 
                         WHERE program_id = ? AND stu_id = ?
                     )`,
                    [program_id, stu_id, comment, program_id, stu_id]
                );
            }
        }

  

   
        

        // Commit the transaction
        await req.db.commit();


        // pdf
        // const portfolio_documents = req.file ? req.file.path : null;


    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
})




     // 졸업생 정보 저장
    router.post('/', async (req, res) => {

        const { stu_id } = req.body;
        try{
        const updateinfo = await req.db.query(
            'UPDATE bestgraduaterecommendationlist SET company_name = ?, employment_field = ?, field_of_study = ?, portfolio_documents = ? WHERE stu_id = ?',
            [company_name, employment_field, field_of_study, portfolio_documents, stu_id]
       )


        console.log(updateinfo)
        res.json(updateinfo)

        }
        catch(error)
        {
            console.log(error)
            res.status(500).json({ error: "서버 에러가 발생했습니다." });

        }
        

    
    
});

module.exports = router;
