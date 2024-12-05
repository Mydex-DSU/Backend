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


module.exports = router;
