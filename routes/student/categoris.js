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
        FROM specialtycategory sc
        INNER JOIN specialtycategorydetails scd 
            ON sc.specialty_category_id = scd.specialty_category_id;
            `)

            console.log(categoris)

        res.json(categoris)


    } catch (error) {
        console.error("Error executing query:", error);
        res.status(500).json({ error: "서버 에러가 발생했습니다." });
    }
});



    //  선택한 카테고리를 DB에 저장
    router.post('/', async (req, res)=>{
        const {stu_id,specialty_category_id ,specialization_detail_id } = req.body


        try{

            if (!stu_id || !specialty_category_id || !specialization_detail_id) {
                return res.status(400).json({ error: "필수 데이터(stu_id, specialty_category_id, specialization_detail_id)가 누락되었습니다." });
            }

          // 카테고리 저장
          const categoryInsertResult = await req.db.query(
            `INSERT INTO bestgraduatesselectspecializationcategories (specialty_category_id, stu_id) 
             VALUES (?, ?)`,
            [specialty_category_id, stu_id]
        );

        console.log("Category inserted:", categoryInsertResult);

        // 상세 카테고리 저장
        const detailInsertResult = await req.db.query(
            `INSERT INTO bestgraduateselectiondetailedcategory (stu_id, specialization_detail_id) 
             VALUES (?, ?)`,
            [stu_id, specialization_detail_id]
        );
        
        console.log("Detailed category inserted:", detailInsertResult);


            }
            catch(error)
            {
                console.log(error)
                res.status(500).json({ error: "서버 에러가 발생했습니다." });

            }

})




module.exports = router;
