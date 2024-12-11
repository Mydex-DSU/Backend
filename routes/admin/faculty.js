var express = require('express');
var router = express.Router();

var logger = require('../../logger');


/* 학부 조회*/
router.get('/', async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    try 
    {
        const faculty = await req.db.query(
            'select * from faculty'
        )
        res.json({faculty : faculty});
    }
    catch(error)
    {
        console.log(error);
    }
});

/* 학부별 예산 거래 내역 */
//1. 비교과 프로그램 전체
router.get('/transactions/program', async (req,res) => {
    try
    {
        console.log("here")
        // const transaction = await req.db.query(
        //     'select s.*, r.program_mydex_points, a.department_name, r.program_id from faculty_budget_transactions s join programs r on s.faculty_transaction_details = r.program_id\
        //     join department a on r.department_name = a.department_name'
        // )

        // const remain_money = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name, sum() from faculty join faculty_budget_transactions on faculty.facutly_id = faculty_budget_transactions.faculty_id'
        // )

        // const transaction_use_money_program = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name from faculty'
        // )
        const transaction = await req.db.query(
            `SELECT 
                s.faculty_transaction_details, \
                s.faculty_payment_date, \
                s.faculty_used_budget, \
                r.program_mydex_points, \
                s.faculty_id, \
                a.department_name, \
                r.program_id,\
                r.program_name\
             FROM faculty_budget_transactions s\
             JOIN programs r ON s.faculty_transaction_details = r.program_id\
             JOIN department a ON r.department_name = a.department_name\
             GROUP BY s.faculty_transaction_details, r.program_mydex_points, a.department_name, r.program_id`
        );

        const transaction_use_money = await req.db.query(
            `SELECT 
                s.faculty_id, \
                sum(s.faculty_used_budget) as faculty_type_sum \
             FROM faculty_budget_transactions s\
             JOIN programs r ON s.faculty_transaction_details = r.program_id \
             GROUP BY s.faculty_id`
        );

        const transaction_remian_money = await req.db.query(
            `SELECT 
                faculty_budget_amount, faculty_id, faculty_name\
             FROM faculty`
        );
        console.log(transaction)

        return res.json({transaction : transaction, transaction_use_money : transaction_use_money, transaction_remian_money : transaction_remian_money})
    }
    catch(error){
        console.log(error)
    }
})


//2, 비교과 프로그램 상세 거래 내역 조회 학부별 
router.post('/transactions/program/detail', async (req,res) => {
    const {faculty_id} = req.body
    try
    {
        console.log("here")
        // const transaction = await req.db.query(
        //     'select s.*, r.program_mydex_points, a.department_name, r.program_id from faculty_budget_transactions s join programs r on s.faculty_transaction_details = r.program_id\
        //     join department a on r.department_name = a.department_name'
        // )

        // const remain_money = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name, sum() from faculty join faculty_budget_transactions on faculty.facutly_id = faculty_budget_transactions.faculty_id'
        // )

        // const transaction_use_money_program = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name from faculty'
        // )
        const transaction = await req.db.query(
            `SELECT
                s.faculty_transaction_details, \
                s.faculty_payment_date, \
                s.faculty_used_budget, \
                r.program_mydex_points, \
                s.faculty_id, \
                a.department_name, \
                r.program_id,\
                r.program_name\
             FROM faculty_budget_transactions s\
             JOIN programs r ON s.faculty_transaction_details = r.program_id\
             JOIN department a ON r.department_name = a.department_name\
             where s.faculty_id = ?`,
             [faculty_id]
        );

        const transaction_use_money = await req.db.query(
            `SELECT 
                s.faculty_id, \
                sum(s.faculty_used_budget) as faculty_type_sum \
             FROM faculty_budget_transactions s\
             JOIN programs r ON s.faculty_transaction_details = r.program_id \
             where s.faculty_id = ?`,
             [faculty_id]
        );

        const transaction_remian_money = await req.db.query(
            `SELECT 
                faculty_budget_amount, faculty_id, faculty_name\
             FROM faculty
             where faculty_id = ?`,
             [faculty_id]
        );
        console.log(transaction)

        return res.json({transaction : transaction, transaction_use_money : transaction_use_money, transaction_remian_money : transaction_remian_money})
    }
    catch(error){
        console.log(error)
    }
})


//3, mydex 온도 포인트 상세 거래 내역 조회 학부별 
router.post('/transactions/mydexpoint/detail', async (req,res) => {
    const {faculty_id} = req.body
    try
    {
        console.log("here")
        // const transaction = await req.db.query(
        //     'select s.*, r.program_mydex_points, a.department_name, r.program_id from faculty_budget_transactions s join programs r on s.faculty_transaction_details = r.program_id\
        //     join department a on r.department_name = a.department_name'
        // )

        // const remain_money = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name, sum() from faculty join faculty_budget_transactions on faculty.facutly_id = faculty_budget_transactions.faculty_id'
        // )

        // const transaction_use_money_program = await req.db.query(
        //     'select faculty_budget_amount, facutly_id, facutly_name from faculty'
        // )
        const transaction = await req.db.query(
            `SELECT
                s.faculty_transaction_details, \
                s.faculty_payment_date, \
                s.faculty_used_budget, \
                r.requested_scholarship_points, \
                s.faculty_id,
                r.scholarship_id,\
                student.stu_id,
                student.stu_name,
                department.department_name
             FROM faculty_budget_transactions s\
             JOIN mydex_point_scholarship_application_list r ON s.faculty_transaction_details = r.scholarship_id
             JOIN student on r.stu_id = student.stu_id
             JOIN department on student.department_name = department.department_name
             where s.faculty_id = ?`,
             [faculty_id]
        );

        const transaction_use_money = await req.db.query(
            `SELECT 
                s.faculty_id, \
                sum(s.faculty_used_budget) as faculty_type_sum \
             FROM faculty_budget_transactions s\
             JOIN mydex_point_scholarship_application_list r ON s.faculty_transaction_details = r.scholarship_id \
             where s.faculty_id = ?`,
             [faculty_id]
        );

        const transaction_remian_money = await req.db.query(
            `SELECT 
                faculty_budget_amount, faculty_id, faculty_name\
             FROM faculty
             where faculty_id = ?`,
             [faculty_id]
        );
        console.log(transaction)

        return res.json({transaction : transaction, transaction_use_money : transaction_use_money, transaction_remian_money : transaction_remian_money})
    }
    catch(error){
        console.log(error)
    }
})
module.exports = router;
