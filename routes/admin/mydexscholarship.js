var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var router = express.Router();

var logger = require('../../logger');



/* mydex 온도 포인트 장학금 신청 조회*/
router.get('/', async (req, res) => {
    try{
        const mydexscholarship = await req.db.query(
            'select * from mydex_scholarship_application_notice'
        )
        res.json({mydexscholarship : mydexscholarship});
    }
    catch(error){
        console.log(error)
    }
})

/* mydex 온도 포인트 장학금 신청 등록*/
router.post('/registration', async (req, res) => {
    const {mydex_scholarship_application_period_year, mydex_application_start_dateTime, mydex_application_end_dateTime} = req.body

    try{
        await req.db.query(
            'insert into mydex_scholarship_application_notice(mydex_scholarship_application_period_year, mydex_application_start_dateTime, mydex_application_end_dateTime) values (?,?,?)',
            [mydex_scholarship_application_period_year, mydex_application_start_dateTime, mydex_application_end_dateTime]
        )

        res.json({message : "mydex 온도 포인트 장학금 신청 기간이 등록되었습니다."})
    }
    catch(error)
    {
        console.log(error)
    }
})



module.exports = router;
