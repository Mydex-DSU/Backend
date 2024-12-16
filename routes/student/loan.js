var express = require('express');
var router = express.Router();

/* 학생 자신 -> 학생 대출 포인트 거래 내역 조회 */
router.post('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        if ( -2 > -1){
            console.log("here")
        }
        else
        {
            console.log("hhh")
        }
        const loan_all = await req.db.query(
            'select * from loan_point_transaction_history where stu_id = ?',
            [stu_id]
        )
        res.json({loan_all : loan_all})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 학생 대출 포인트 신청 */
// 전체 대출은 true(1), 추가 대출은 false → 구분인자 값은 loan_type_status
router.post('/application', async (req, res) => {
    const {stu_id, loan_type_status, loan_transaction_points} = req.body
    try 
    {
        console.log(req.body)

        const student = await req.db.query(
            'select * from student where stu_id = ?',
            [stu_id]
        )
        //먼저 대출인지 아닌지를 구분
        if (loan_type_status === 1) // 전체 대출 
        {
            //student 테이블에서 학생 대출 포인트 업데이트
            await req.db.query(
                'UPDATE student SET stu_current_loan_points = ?, stu_additonal_loan_count = 3 WHERE stu_id = ?;',
                [loan_transaction_points, stu_id]
            )

            //대출 포인트 거래 내역 업데이트
            await req.db.query(
                'insert into loan_point_transaction_history(stu_id, loan_type, loan_transaction_points, loan_remaining_points) values (?,?,?,?)'
                ,[stu_id, "전체 대출", loan_transaction_points, student[0].stu_current_loan_points + loan_transaction_points]
            )
            return res.json({loan : student[0].stu_name + "의 전체 대출이 완료되었습니다."})
        }
        else if (loan_type_status === 0) // 추가 대출
        {
            if (student[0].stu_additonal_loan_count === 0){
                return res.json({loan : "추가대출 횟수가 0이라 추가대출이 진행되지 않습니다."})
            }

            //student 테이블에서 학생 대출 포인트 업데이트
            await req.db.query(
                'UPDATE student SET stu_current_loan_points = stu_current_loan_points + ?, stu_additonal_loan_count = stu_additonal_loan_count - 1 WHERE stu_id = ?;',
                [loan_transaction_points, stu_id]
            )

            //대출 포인트 거래 내역 업데이트
            await req.db.query(
                'insert into loan_point_transaction_history(stu_id, loan_type, loan_transaction_points, loan_remaining_points) values (?,?,?,?)'
                ,[stu_id, "추가 대출", loan_transaction_points, student[0].stu_current_loan_points + loan_transaction_points]
            )

            //학생 추가 대출 업데이트
            return res.json({loan : student[0].stu_name + "의 추가 대출이 완료되었습니다."})
        }
    }
    catch(error)
    {
        console.log(error)
    }
});




module.exports = router;
