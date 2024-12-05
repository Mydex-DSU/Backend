var createError = require('http-errors');
var cors = require('cors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

const { DateTime } = require("luxon");
const cron = require('node-cron');

var indexRouter = require('./routes/index');
var loginRotuer = require('./routes/login/login');
var schoolbudget = require('./routes/admin/schoolbudget');
var faculty = require('./routes/admin/faculty');
var programs = require('./routes/admin/programs');

const util = require('util');


var app = express();
// Enable CORS

app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../../upload')));



var mysql = require('mysql2');

var db = mysql.createConnection({
  host: 'localhost',
  user: 'master',
  password: '1111',
  database: 'mydex',
  port: 3306
})

db.connect(function(err) {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to database.');
});

// 세션 미들웨어 설정
app.use(session({
  secret: '1234', // 비밀 키 설정
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: false,
    expires: new Date(Date.now() + (1000 * 60 * 60 * 24 * 7)) // 7일 동안 유효한 쿠키 설정
   } // HTTPS 사용 시 secure: true
}));

// Promisify the query function
db.query = util.promisify(db.query);
// MySQL 연결을 모든 라우터에서 사용할 수 있도록 설정
app.use((req, res, next) => {
  req.db = db;
  next();
});




const updateProgramStates = async () => {
  console.log("업데이트 프로그램 상태")


  const currentTime = new Date();  // 현재 시스템 시간(로컬 시간)을 그대로 가져옵니다.
  console.log(currentTime)
    
  try {
    const programs = await db.query('SELECT * FROM programs');
    // console.log(programs)
    for (const program of programs) {
      // console.log(program.program_application_start_time)
      const applicationStartTime = new Date(program.program_application_start_time);
      const applicationEndTime = new Date(program.program_application_end_time);
      const operationStartTime = new Date(program.program_operation_start_time);
      const operationEndTime = new Date(program.program_operation_end_time);
      const surveyStartTime = new Date(program.program_survey_start_time);
      const surveyEndTime = new Date(program.program_survey_end_time);
      

      // console.log(applicationStartTime)

      // 학생 프로그램 리스트 조회 (비동기 처리)
      const studentProgram = await db.query('SELECT * FROM studentprogramlist WHERE program_id = ?', [program.program_id]);

      // 프로그램 최대 인원 확인 (비동기 처리 필요)
      if (program.program_max_participants && studentProgram.length >= program.program_max_participants) {
          program.program_status = '모집완료';  
      } else if (currentTime >= applicationStartTime){
          // 상태 변경 로직
          if (currentTime >= applicationStartTime && currentTime <= applicationEndTime) {
              program.program_status = '모집중'; 
          } else if (currentTime >= operationStartTime && currentTime <= operationEndTime) {
              program.program_status = '운영중';
          } else if (currentTime > operationEndTime && currentTime < surveyStartTime) {
              program.program_status = '평가중';

              //평가 중으로 된 거는 studentcompletesprogram에 학생의 값이 생기게 해야됨.
              // const program_student = await db.query(
              //   `SELECT ps.*, s.*
              //    FROM studentprogramlist ps
              //    JOIN student s ON ps.stu_id = s.stu_id
              //    WHERE ps.program_id = ?`,
              //   [program.program_id]
              // );

              const programtype_name = await db.query(
                'select programtype_name from programtype where programtype_id = ?',
                [program.programtype_id]
              )
  
              for (const student of studentProgram){
                const studentcompletecheck = await db.query(
                  'select stu_id from studentcompletesprogram where stu_id = ?'
                  ,[student.stu_id]
                )
                if (studentcompletecheck.length === 0)
                {
                  await db.query(
                    ` Insert into studentcompletesprogram(
                    stu_id, program_id, programtype_name) 
                    values (?,?,?)`,
                    [student.stu_id, student.program_id, programtype_name[0].programtype_name ]);
                  }
                }
                
          } else if (currentTime >= surveyStartTime && currentTime <= surveyEndTime) {
              program.program_status = '설문조사';
          } else if (currentTime > surveyEndTime) {
              program.program_status = '종료';  // 신청 전 상태
          }
        }
        else 
        {
          program.program_status = '대기중';  // 신청 전 상태
        }
          // 상태가 변경된 프로그램을 DB에 업데이트 (비동기 처리)
        await db.query('UPDATE programs SET program_status = ? WHERE program_id = ?', [program.program_status, program.program_id]);
      }
      console.log('Program states updated successfully');
    } catch (error) {
      console.error('Error updating program states:', error);
    }
};


// cron.schedule('*/1 * * * *', updateProgramStates); // 매 1분마다 실행
setInterval(updateProgramStates, 5000); // 30초 = 30000ms


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/login', loginRotuer);
app.use('/schoolbudget', schoolbudget);
app.use('/faculty', faculty);
app.use('/programs', programs);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
