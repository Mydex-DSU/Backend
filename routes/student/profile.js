var express = require('express');
var router = express.Router();

/* application은 프로그램 신청임. 신청을 해보자. */
router.post('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const student_profile = await req.db.query(
            'select * from student where stu_id = ?',
            [stu_id]
        )
        res.json({student_profile : student_profile[0]})
    }
    catch(error)
    {
        console.log(error)
    }
});



module.exports = router;
