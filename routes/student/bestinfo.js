var express = require('express');
var router = express.Router();



    // 현재 없는 부분 pdf 





     // 우수졸업생 취업 정보 및 대학원 정보 기입
    router.post('/', async (req, res) => {

        const { stu_id, company_name, field_of_study, portfolio_documents, employment_status  } = req.body;
        try{
            if (employment_status === 1) {
                // 취업 상태일 때
                await req.db.query(
                    `
                    UPDATE bestgraduaterecommendationlist
                    SET company_name = ?, portfolio_documents = ?
                    WHERE stu_id = ?;
                    `,
                    [company_name, portfolio_documents, stu_id]
                );
            } else {
                // 대학원 상태일 때
                await req.db.query(
                    `
                    UPDATE bestgraduaterecommendationlist
                    SET field_of_study = ?, portfolio_documents = ?
                    WHERE stu_id = ?;
                    `,
                    [field_of_study, portfolio_documents, stu_id]
                );
                console.log(req.body) 
                console.log("employment_status:", employment_status);
            }            
            
        }
        catch(error)
        {
            console.log(error)
            res.status(500).json({ error: "서버 에러가 발생했습니다." });

        }
        

    
    
});

module.exports = router;
