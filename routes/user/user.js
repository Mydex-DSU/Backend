var express = require('express');
var router = express.Router();

var logger = require('../../logger');


/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post('/login', async (req,res) => {
  logger.info(`Request received for URL: ${req.originalUrl}`);
  const {student_num, user_password} = req.body;

  try
  {
    const check = await req.db.query(
      'select * from user where student_num = ? and user_password = ?',
      [student_num, user_password]
    );
    console.log(check);

    if (check.length > 0) {
      // 로그인 성공, 해당 사용자 정보 반환
      res.status(200).json({
        message: '로그인 성공',
        user_id: check[0].user_id,
        student_num: '20201813',
        user_password: '1234'
      });
    } else {
      // 로그인 실패
      res.status(401).json({
        message: '잘못된 비밀번호와 아이디입니다.'
      });
    }

  }
  catch(error)
  {
    console.error(error);
    res.status(500).json({
      message: '서버 에러가 발생했습니다.'
    });
  }
})

module.exports = router;
