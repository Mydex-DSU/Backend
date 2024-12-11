var express = require('express');
var router = express.Router();

/* 구제프로그램 신청 내역 전체 조회 */
router.get('/', async (req, res) => {
    try 
    {
        const remedial_program_application_list = await req.db.query(
            `SELECT r.*, s.stu_name
             FROM remedial_program_application_list r
             JOIN student s ON r.stu_id = s.stu_id
             `,
        );
        res.json({remedial_program_application_list : remedial_program_application_list})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 신청이 온 구제프로그램 조회 */
router.post('/select', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const remedial_program_application_list = await req.db.query(
            `SELECT r.*, s.stu_name
             FROM remedial_program_application_list r
             JOIN student s ON r.stu_id = s.stu_id
             where r.stu_id = ?`,
             [stu_id]
        );
        res.json({remedial_program_application_list : remedial_program_application_list})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 신청 온 구제프로그램 처리 */
router.post('/application', async (req,res) => {
    const {remedialprogram_application_id, stu_id, rejection_reason, granted_mydex_points, processing_result} = req.body
    try 
    {
        if (processing_result === 1) //승인
        {
            await req.db.query(
                'UPDATE remedial_program_application_list SET granted_mydex_points = ?, processing_result = ?,  processing_datetime = NOW() WHERE stu_id = ? and remedialprogram_application_id = ?;',
                [granted_mydex_points, processing_result, stu_id, remedialprogram_application_id]
            )
            //승인 되었으니 학생의 mydex 온도 포인트 업데이트 해주고 거래내역 업데이트 
            await req.db.query(
                `UPDATE student 
                    SET stu_current_mydex_points = GREATEST(stu_current_mydex_points + ?, 1)
                    WHERE stu_id = ?`,
                [granted_mydex_points, stu_id]
                );
            
            await req.db.query(
            'insert into mydex_point_history(stu_id, mydexpointshistory_reason_name, mydexpointshistory_recv_count, mydexpointshistory_reason_number) values (?, ?, ?, ?)',
            [stu_id, "구제프로그램", granted_mydex_points, remedialprogram_application_id]
            )

            res.json({message : "학생이 신청한 구제프로그램이 승인 되었습니다."})
        }
        else if (processing_result === 0) //거절
        {
            await req.db.query(
                'UPDATE remedial_program_application_list SET granted_mydex_points = ?, processing_result = ?,  processing_datetime = NOW(), rejection_reason = ? WHERE stu_id = ? and remedialprogram_application_id = ?;',
                [granted_mydex_points, processing_result,  rejection_reason, stu_id, remedialprogram_application_id]
            )
            res.json({message : "학생이 신청한 구제프로그램이 거절 되었습니다."})
        }
    }
    catch(error){
        console.log(error)
    }


})



module.exports = router;
