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

//관리자
var mydexscholarship = require('./routes/admin/mydexscholarship');
var remedialprogram = require('./routes/admin/remedialprogram');

//학생
var profile = require('./routes/student/profile')
var programapplication = require('./routes/student/application');
var survey = require('./routes/student/survey');
var mydexscholarshipapplication = require('./routes/student/mydexscholarshipapplication')
var remedialprogramapplication = require('./routes/student/remedialprogramapplication')
var loan = require('./routes/student/loan')
var stuprogram = require('./routes/student/stuprogram');
var bestinfo = require('./routes/student/bestinfo');
var portfolios = require('./routes/student/portfolios');
var categoris =require('./routes/student/categoris');

//교수 
var recommend = require('./routes/professor/recommend')


const util = require('util');


var app = express();
// Enable CORS

app.use(cors());
// app.use('/uploads', express.static(path.join(__dirname, '../../upload')));
app.use('/uploads', express.static(path.join(__dirname, './upload')));

//구제 프로그램 pdf
// app.use('/pdf_uploads', express.static(path.join(__dirname, '../../pdf_uploads')));
app.use('/pdf_uploads', express.static(path.join(__dirname, './pdf_uploads')));



var mysql = require('mysql2');

var db = mysql.createConnection({
  host: '100.94.142.127',
  user: 'JYP',
  password: '1234',
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
      // console.log(studentProgram)
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
              // console.log("here")

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
                  'select * from studentcompletesprogram where stu_id = ? and program_id = ?'
                  ,[student.stu_id, program.program_id]
                )
                // console.log(studentcompletecheck)
                  //프로그램이 평가중이 되면 학생들 평가해야하니 insert
                  if (studentcompletecheck.length === 0)
                  {
                    
                    const insertcomple = await db.query(
                      ` Insert into studentcompletesprogram(
                      stu_id, program_id, programtype_name) 
                      values (?,?,?)`,
                      [student.stu_id, student.program_id, programtype_name[0].programtype_name ]);
                  }
                  else{
                    //랜덤으로 학생의 프로그램 종류에 따라 얼마인지
                    const anyNotNull =
                    studentcompletecheck[0].attendance_rate === null &&
                    studentcompletecheck[0].award_status === null &&
                    studentcompletecheck[0].participation_status === null &&
                    studentcompletecheck[0].report_submission_status === null;
                    if (anyNotNull)
                    {
                      //각 프로그램에 따른 참여율 기입
                      if (programtype_name[0].programtype_name === "특강") //출석률
                      {
                        // 0~100 사이 난수 생성
                        const randomNumber = Math.floor(Math.random() * 101); // 0에서 100까지의 정수
                        console.log("Generated Random Number: ", randomNumber);
                        //attendance_rate
                        await db.query(
                          `UPDATE studentcompletesprogram SET attendance_rate = ? WHERE stu_id = ? and program_id = ?`,
                          [randomNumber, student.stu_id, program.program_id]
                        );
                      }
                      else if (programtype_name[0].programtype_name === "학습공동체활동") // 보고서 제출 여부
                      {
                        const randomBoolean = Math.random() < 0.5; // 50% 확률로 true 또는 false
                        await db.query(
                          `UPDATE studentcompletesprogram SET report_submission_status = ? WHERE stu_id = ? and program_id = ?`,
                          [randomBoolean, student.stu_id, program.program_id]
                        );
                      }
                      else if (programtype_name[0].programtype_name === "캠프및워크숍" || programtype_name[0].programtype_name === "클리닉참여" ||programtype_name[0].programtype_name === "견학") // 참여여부
                      {
                        const randomBoolean = Math.random() < 0.5; // 50% 확률로 true 또는 false
                        await db.query(
                          `UPDATE studentcompletesprogram SET participation_status = ? WHERE stu_id = ? and program_id = ?`,
                          [randomBoolean, student.stu_id, program.program_id]
                        );
                      }
                    }
                  }

                 
              }
                
          } else if (currentTime >= surveyStartTime && currentTime <= surveyEndTime) {
              program.program_status = '설문조사';
          } else if (currentTime > surveyEndTime) {
              program.program_status = '종료';
              //1. 학생, 완료 프로그램에서 각 해당하는 어떤 설문조사에서 이 설문조사를 했는지 안 했는지에 대해 알아야됨
              //프로그램 아이디오 신청 목록에 있는 학생들 전부 순회
              for (const student of studentProgram){
                // console.log(student);
                // console.log('-----------------------');
                
                //학생의 완료 프로그램 테이블 studentcompletesprogram에 기입
                const studentcompletecheck = await db.query(
                  'select stu_give_mydex_points,response_status_change_mydex_points,survey_response_status,no_show_reason_response_status from studentcompletesprogram where stu_id = ? and program_id = ?'
                  ,[student.stu_id, program.program_id]
                )
                // console.log("studentcompletecheck[0].stu_give_mydex_points : " + studentcompletecheck[0].stu_give_mydex_points)

             
                if (studentcompletecheck[0].response_status_change_mydex_points === null)
                {
                  console.log("설문조사 판별 시작")
                  let fin_mydex_points = null;
                  //완료 프로그램에 해당하고 그 학생이 평가를 다 받은 상황 studentcompletecheck
                  if (studentcompletecheck[0].stu_give_mydex_points !== null && parseInt(studentcompletecheck[0].stu_give_mydex_points) > 0)
                  {
                    console.log("일반 설문조사 했어?")
                    console.log(studentcompletecheck[0].survey_response_status)
                    console.log("----------------------------")
                    if (studentcompletecheck[0].survey_response_status === 1) // 일반 설문조사 참여
                    {
                      console.log("일반 설문조사 안 했어")
                      //학생의 mydex 온도 포인트에 기입
                      await db.query(
                        `UPDATE studentcompletesprogram SET response_status_change_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
                        [studentcompletecheck[0].stu_give_mydex_points, student.stu_id, program.program_id]
                      );
                      fin_mydex_points = parseInt(studentcompletecheck[0].stu_give_mydex_points);
                    }
                    else { // 일반 설문조사 참여 안함
                      console.log("일반 설문조사 안 했어")
                      await db.query(
                        `UPDATE studentcompletesprogram SET response_status_change_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
                        [0, student.stu_id, program.program_id]
                      );
                      fin_mydex_points = 0;
                    }
                  }
                  else if(studentcompletecheck[0].stu_give_mydex_points !== null && parseInt(studentcompletecheck[0].stu_give_mydex_points) < 0) // 노쇼인 학생
                  {
                    console.log("노쇼 설문조사 판별 시작")
                    console.log("herereh")
                    console.log(studentcompletecheck[0])
                    console.log(studentcompletecheck)
                    console.log(studentcompletecheck[0].no_show_reason_response_status)
                    console.log("--------------------------------------------------------")
                    if (studentcompletecheck[0].no_show_reason_response_status === 1) // 노쇼 설문조사 참여
                    {
                      console.log("참여 In")
                      //학생의 mydex 온도 포인트에 기입
                      await db.query(
                        `UPDATE studentcompletesprogram SET response_status_change_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
                        [studentcompletecheck[0].stu_give_mydex_points + 1, student.stu_id, program.program_id]
                      );
                      fin_mydex_points = studentcompletecheck[0].stu_give_mydex_points + 1;
                    }
                    else { // 일반 설문조사 참여 안함
                      console.log("참여 out")
                      await db.query(
                        `UPDATE studentcompletesprogram SET response_status_change_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
                        [studentcompletecheck[0].stu_give_mydex_points, student.stu_id, program.program_id]
                      );
                      fin_mydex_points = studentcompletecheck[0].stu_give_mydex_points;
                    }


                    //학생 노쇼 카운트 증가 and 학생 노쇼 횟수가 2나누기 나머지 0일때 경고 횟수 +1 증가
                    await db.query(
                      `UPDATE student 
                       SET 
                         stu_no_show_count = stu_no_show_count + 1,
                         stu_current_warning_count = LEAST(stu_current_warning_count + CASE 
                           WHEN (stu_no_show_count + 1) % 2 = 0 THEN 1 ELSE 0 END, 4)
                       WHERE stu_id = ?`,
                      [student.stu_id]
                    );

                    //학생 전체 노쇼 내역 업데이트 비교과에서는 노쇼가 1씩 더해지는 게 맞음.
                    await db.query(
                      'insert into studentnoshowhistory(stu_id, noshowhistory_recv_count, noshowhistory_reason_number) values(?,?,?)',
                      [student.stu_id, 1, program.program_id]
                    )

                    //학생 경고 포인트가 1,2가 있을 떄 -1씩 더 부여
                    const stu_current_warning_count = await db.query(
                      'select stu_current_warning_count from student where stu_id = ?',
                      [student.stu_id]
                    )
                    if (stu_current_warning_count[0].stu_current_warning_count === 1 || stu_current_warning_count[0].stu_current_warning_count === 2){
                      fin_mydex_points = fin_mydex_points + -1;
                    }
                  }

                    //3. 학생 mydex 온도 포인트 부여하구 거래 내역
                    if (fin_mydex_points !== null)
                    {
                      console.log(fin_mydex_points)

                      //대출 포인트가 있냐 없냐 체크
                      const student_select = await db.query(
                        'select stu_current_loan_points from student where stu_id = ?',
                        [student.stu_id]
                      )

                      if (student_select[0].stu_current_loan_points > 0) //대출 포인트 있음
                      {
                        if (fin_mydex_points > 0) // P > 0
                        {
                          if (student_select[0].stu_current_loan_points >= fin_mydex_points) // D >= P
                          {
                            fin_mydex_points = fin_mydex_points * -1;
                            
                            //student 테이블에서 학생 대출 포인트 업데이트
                            await db.query(
                                'UPDATE student SET stu_current_loan_points = stu_current_loan_points + ?, WHERE stu_id = ?;',
                                [fin_mydex_points, student.stu_id]
                            )

                            //대출 포인트 거래 내역 업데이트
                            await db.query(
                                'insert into loanpointtransactionhistory(stu_id, loan_type, loan_transaction_points, loan_remaining_points) values (?,?,?,?)'
                                ,[student.stu_id, "상환", fin_mydex_points, student_select[0].stu_current_loan_points + fin_mydex_points]
                            )
                          }
                          else // D < P
                          {
                            // 1 = 3 - 2
                            const finDP = fin_mydex_points - student_select[0].stu_current_loan_points;
                            //student 테이블에서 학생 대출 포인트 업데이트
                            await db.query(
                              'UPDATE student SET stu_current_loan_points = 0, stu_current_mydex_points = stu_current_mydex_points + ? WHERE stu_id = ?;',
                              [finDP, student.stu_id]
                            )

                            //대출 포인트 거래 내역 업데이트
                            await db.query(
                                'insert into loanpointtransactionhistory(stu_id, loan_type, loan_transaction_points, loan_remaining_points) values (?,?,?,?)'
                                ,[student.stu_id, "상환", -student_select[0].stu_current_loan_points, 0]
                            )

                            //Mydex 온도 포인트 거래 내역
                            await db.query(
                              'insert into mydexpointhistory(stu_id, mydexpointshistory_reason_name, mydexpointshistory_recv_count, mydexpointshistory_reason_number) values (?, ?, ?, ?)',
                              [student.stu_id, "비교과프로그램", finDP, program.program_id]
                            )
                          }
                        }
                        else if (fin_mydex_points < 0) // P < 0
                        {
                          const status = student_select[0].stu_current_loan_points + fin_mydex_points
                          if (status > 0) // M + P > 0 
                          {

                          }
                          else if (status <= 0)  // M + P <= 0 
                          {

                          }
                        }
                      }
                      else // 대출 포인트 없음
                      {
                        await db.query(
                          `UPDATE student 
                           SET stu_current_mydex_points = GREATEST(stu_current_mydex_points + ?, 1)
                           WHERE stu_id = ?`,
                          [fin_mydex_points, student.stu_id]
                        );

                        //4. 학생 mydex 온도 포인트 거래 내역에 값 삽입.
                        await db.query(
                          'insert into mydexpointhistory(stu_id, mydexpointshistory_reason_name, mydexpointshistory_recv_count, mydexpointshistory_reason_number) values (?, ?, ?, ?)',
                          [student.stu_id, "비교과프로그램", fin_mydex_points, program.program_id]
                        )
                      }
                    }

                }
              }
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
// setInterval(updateProgramStates, 5000); // 30초 = 30000ms


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
app.use('/application', programapplication);
app.use('/survey', survey)
app.use('/mydexscholarship', mydexscholarship);
app.use('/mydexscholarshipapplication', mydexscholarshipapplication);
app.use('/remedialprogramapplication', remedialprogramapplication)
app.use('/remedialprogram', remedialprogram);
app.use('/loan', loan)
app.use('/profile', profile)
app.use('/stuprogram', stuprogram)
app.use('/recommend', recommend)
app.use('/bestinfo', bestinfo)
app.use('/portfolios', portfolios)
app.use('/categoris',categoris)

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
