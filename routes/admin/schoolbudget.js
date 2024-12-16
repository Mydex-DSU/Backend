var express = require('express');
var router = express.Router();

var logger = require('../../logger');


/* 학교 예산과 학부 돈 나누기*/
router.post('/', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const { start_date, school_total_budget_amount, end_date } = req.body;

    // start_date를 Date 객체로 변환
    const date = new Date(start_date);
    const month = date.getMonth(); 
    let semester = "";
    req.session.end_date = new Date(end_date)
    req.session.start_date = new Date(start_date)

    if (month >= 0 && month <= 5) {  // 1~6월이면 1학기
        semester = "1학기";
    } else if (month >= 6 && month <= 11) {  // 7~12월이면 2학기
        semester = "2학기";
    }

    try
    {
        //예산 먼저 지급
        const InsertBudget = await req.db.query(
            'INSERT INTO schoolbudget (school_total_budget_amount) VALUES (?);',
            [school_total_budget_amount]
        )

        const faculty = await req.db.query(
            'select * from faculty;',
        )
        console.log(faculty)

        //학부별 예산 지급으로 돈 나누기
        for (const row of faculty) {
            console.log(`Faculty ID: ${row.faculty_id}`);
            console.log(`Faculty Name: ${row.faculty_name}`);
        
            // 외래키인 schoolbudget_id 업데이트
            await req.db.query(
                'UPDATE faculty SET schoolbudget_id = ? WHERE faculty_name = ?;',
                [InsertBudget.insertId, row.faculty_name]
            );

            const percent = parseInt(row.budget_percentage);
            const faculty_budget_amount = school_total_budget_amount * (percent * 0.01);
    
            // 예산 분배하기 

            await req.db.query(
                'UPDATE faculty SET faculty_budget_amount = ? WHERE faculty_name = ?;',
                [row.faculty_budget_amount + faculty_budget_amount, row.faculty_name]
            );
    
            const faculty_mydex_points = faculty_budget_amount / 5000;
    
            // MyDex 포인트 업데이트
            await req.db.query(
                'UPDATE faculty SET faculty_mydex_points = ? WHERE faculty_name = ?;',
                [row.faculty_mydex_points + faculty_mydex_points, row.faculty_name]
            );

            //개강일, 종강일 업데이트
            await req.db.query(
                'UPDATE faculty SET start_date = ?, end_date = ? WHERE faculty_name = ?',
                [start_date, end_date, row.faculty_name]
            );

            //학부별 예산 처리 거래 내역 
            await req.db.query(
                'insert into faculty_budget_transactions(faculty_id, faculty_semester, faculty_used_budget, faculty_used_mydex_points, faculty_transaction_details) \
                values (?, ?, ?, ?, ?)',
                [row.faculty_id, semester, faculty_budget_amount, faculty_mydex_points, InsertBudget.insertId]
            )
        }
        res.json({message : "성공적으로 진행되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
});


module.exports = router;
