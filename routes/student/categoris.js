var express = require('express');
const { error } = require('winston');
var router = express.Router();



router.get('/', async (req, res) => {
    try{
        const categoris = await req.db.query( 
            `SELECT 
                sc.specialty_category_id, 
                sc.category_name, 
                scd.detailed_name AS detailed_category_name
            FROM specialty_category sc
            INNER JOIN specialty_category_details scd 
                ON sc.specialty_category_id = scd.specialty_category_id;`)
            return res.json(categoris)
    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});



    //  선택한 카테고리를 DB에 저장
    router.post('/', async (req, res)=>{
        const {stu_id} = req.body


        try{

           // 카테고리
           await req.db.query(
            `insert into best_graduate_select_specialty_category(specialty_category_id, stu_id) value(?, ?ß)`
            , [stu_id, specialty_category_id]
        );


            //  상세카테고리
            await req.db.query(
                `insert into best_graduate_select_detailed_category(stu_id, specialization_detail_id) value (?, ?)`
                , [stu_id, specialization_detail_id]
            );
            
        

            }
            catch(error)
            {
                console.log(error)
                res.status(500).json({ error: "서버 에러가 발생했습니다." });

            }

})




module.exports = router;
