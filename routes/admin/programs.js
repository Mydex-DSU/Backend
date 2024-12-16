var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var router = express.Router();
const moment = require('moment'); 
var logger = require('../../logger');



/* 프로그램 전체 목록 조회(대기중, 모집중, 모집완료)*/
router.get('/', async (req, res) => {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    try {
        // 원하는 상태를 필터링하는 쿼리
        const programs = await req.db.query(
            "SELECT * FROM programs WHERE program_status IN ('대기중', '모집중', '모집완료', '운영중')"
        );
        res.json({ programs: programs });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});


// multer 설정 (이미지 저장 경로와 파일 이름 설정)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // 이미지가 저장될 디렉터리 설정
        const uploadDir = path.join(__dirname, '../../upload');  // 상대 경로로 지정
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);  // 디렉토리가 없으면 생성
        }
        cb(null, uploadDir);  // 디렉터리 지정
    },
    filename: (req, file, cb) => {
        // 파일 이름 설정 (파일명이 겹치지 않도록 timestamp와 원본 파일명 사용)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));  // 파일 확장자 유지
    }
});


const upload = multer({ storage: storage });

/* 프로그램 등록 */
router.post('/registration',  upload.single('program_poster_image'), async (req, res) =>  {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {
        department_name,
        programtype_name, // 속성 x
        program_money,
        program_name,
        program_description,
        program_application_start_time,
        program_application_end_time,
        program_operation_start_time,
        program_operation_end_time,
        program_survey_start_time,
        program_survey_end_time,
        program_max_participants,
        program_year,
        program_semester,
        program_mydex_points } = req.body;
        console.log('Request Body:', req.body);  // 텍스트 데이터 (폼 필드)

        // const program_poster_image = req.file ? `/uploads/${req.file.filename}` : null;
        const program_poster_image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`
        console.log(program_poster_image)
    try {
        if (req.file) {
            console.log('Uploaded File:', req.file);  // 업로드된 파일의 정보
        } else {
            console.log('No file uploaded.');
        }

        //1. 먼저 프로그램 종류의 번호를 가지고 와야됨
        const programtype= await req.db.query(
            'select programtype_id from programtype where programtype_name = ?'
            ,[programtype_name]
        )
        console.log(programtype[0].programtype_id)

        //2. 값 넣기
        const insertProgram = await req.db.query(
            ' INSERT INTO programs ( \
            department_name, adm_id, programtype_id, program_money, \
            program_name, program_description,\
            program_application_start_time, program_application_end_time,\
            program_operation_start_time, program_operation_end_time,\
            program_survey_start_time, program_survey_end_time,\
            program_max_participants, program_poster_image,\
            program_year, program_semester,\
            program_mydex_points, program_status\ ) \
            VALUES (?,?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [   department_name, 1, programtype[0].programtype_id, program_money, 
                program_name, program_description,
                program_application_start_time, program_application_end_time,
                program_operation_start_time, program_operation_end_time,
                program_survey_start_time, program_survey_end_time,
                program_max_participants, program_poster_image,
                program_year, program_semester,
                program_mydex_points, '대기중'
            ]
        )

        //학부별 예산 처리 내역 업데이트
          const facultyInfo = await req.db.query(
            `SELECT 
                d.department_name, 
                f.faculty_name,
                f.faculty_id,
                f.faculty_mydex_points
            FROM 
                department d
            JOIN 
                faculty f
            ON 
                d.faculty_id = f.faculty_id 
            WHERE 
                d.department_name = ?`,
            [department_name]
        );

        console.log(facultyInfo)

        const date = new Date();
        const month = date.getMonth(); 
        let semester = "";
    
        if (month >= 0 && month <= 5) {  // 1~6월이면 1학기
            semester = "1학기";
        } else if (month >= 6 && month <= 11) {  // 7~12월이면 2학기
            semester = "2학기";
        }

        //학부 예산 처리
        await req.db.query(
            'UPDATE faculty SET faculty_budget_amount = faculty_budget_amount - ?, faculty_mydex_points = faculty_mydex_points - ? WHERE faculty_id = ?;',
            [program_money, program_money/5000, facultyInfo[0].faculty_id]
        );

        //학부 예산 처리 거래 내역
        await req.db.query(
            'insert into faculty_budget_transactions(faculty_id, faculty_semester, faculty_used_budget, faculty_used_mydex_points, faculty_transaction_details) \
            values (?, ?, ?, ?, ?)',
            [facultyInfo[0].faculty_id, semester, -program_money, -(program_money / 5000), insertProgram.insertId]
        )


        res.status(200).json({
            message: 'Program registered successfully!',
        })
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).json({
            message: 'Failed to process request',
            error: error.message
        });
    }
});


/* 프로그램 완료 목록 전체 조회(평가중, 설문조사, 종료)*/
router.get('/fin', async (req, res) => {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    try {
        // 원하는 상태를 필터링하는 쿼리
        const programs = await req.db.query(
            "SELECT * FROM programs WHERE program_status IN ('평가중', '설문조사', '종료')"
        );
        res.json({ programs: programs });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/* 비교과 프로그램 완료 목록 중 하나 상세 조회 */
router.post('/fin/detail', async (req, res) => {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {program_id} = req.body
    try {
        // 원하는 상태를 필터링하는 쿼리
        const programs = await req.db.query(
            "SELECT * FROM programs join programtype on programs.programtype_id = programtype.programtype_id WHERE program_id = ?",
            [program_id]
        );

        //프로그램에 신청 중인 학생 리스트 보내주기
        // const program_student = await req.db.query(
        //     `SELECT ps.*, s.*
        //      FROM student_application_program_list ps
        //      JOIN student s ON ps.stu_id = s.stu_id
        //      WHERE ps.program_id = ?`,
        //     [program_id]
        // );

        //프로그램에 신청중인 학생과 완료학생 묶어서 같이 보내줌
        const program_student = await req.db.query(
            `SELECT ps.*, s.*, sc.* , nrc.*
             FROM student_application_program_list ps
             JOIN student s ON ps.stu_id = s.stu_id
             LEFT JOIN student_completes_program sc ON ps.stu_id = sc.stu_id AND ps.program_id = sc.program_id
            LEFT JOIN noshow_reason_category nrc ON sc.noshowreasoncategories_id = nrc.noshowreasoncategories_id
             WHERE ps.program_id = ?`,
            [program_id]
        );

        res.json({ programs: programs, program_student : program_student });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/* 비교과 프로그램 완료 목록 중인 프로그램 상태가 평가중에서 학생들을 평가하기 버튼을 눌러 mydex 온도 포인트 부여 */ 
router.post('/fin/evaluation', async (req, res) => {
    logger.info(`Request received for URL: ${req.originalUrl}`);
    const {stu_id, stu_give_mydex_points, program_id} = req.body
    try {

        //프로그램에 신청 중인 학생 리스트 보내주기
        const stu_name = await req.db.query(
            'select stu_name from student where stu_id = ?',
            [stu_id, program_id]
        )

        await req.db.query(
            `UPDATE student_completes_program SET stu_give_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
            [stu_give_mydex_points, stu_id, program_id]
        );

        //부여되는 mydex 온도 포인트가 양수인지 음수인지
        console.log("awd")
        if (stu_give_mydex_points < 0)
        {
            console.log("1stu_give_mydex_points " + stu_give_mydex_points)
            await req.db.query(
                `UPDATE student_completes_program SET no_show_reason_response_status = ? WHERE stu_id = ? and program_id = ?`,
                [false, stu_id, program_id]
            );
        }
        else 
        {
            console.log("2stu_give_mydex_points " + stu_give_mydex_points)
            await req.db.query(
                `UPDATE student_completes_program SET survey_response_status = ? WHERE stu_id = ? and program_id = ?`,
                [false, stu_id, program_id]
            );
        }

        res.json({ message: stu_name[0].stu_name + "에게 " +stu_give_mydex_points + "의 mydex 온도 포인트를 부여하였습니다." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

/* 프로그램 신청 학생 목록 조회 */
router.post('/application/detail', async (req,res) => {
    const {program_id} = req.body

    try{
        const program = await req.db.query(
            'select * from programs where program_id = ?',
            [program_id]
        )
        const programdetail = await req.db.query(
            'select * from student_application_program_list join student on student_application_program_list.stu_id = student.stu_id where program_id = ?',
            [program_id]
        )

         // application_datetime을 현재 시간에 맞추어 포맷팅
         const formattedDetails = programdetail.map(detail => {
            return {
                ...detail,
                application_datetime: moment().format('YYYY-MM-DD') // 현재 시간 포맷팅
            };
        });


        res.json({program: program, programdetail : formattedDetails})

    }catch(error){
        console.log(error);
    }
})

/* 프로그램 종류별 노쇼 비율 그래프 */
router.get('/noshowgraph', async (req,res) => {

    try{
        const allProgramTypes = await req.db.query(
            'SELECT programtype_id, programtype_name FROM programtype'
          );

        const programtype = await req.db.query(
            'SELECT sc.programtype_name, pt.programtype_name as program_name, COUNT(sc.program_id) AS 전체_참여_인원, \
            SUM(CASE WHEN sc.stu_give_mydex_points < 0 AND sc.stu_give_mydex_points IS NOT NULL THEN 1 ELSE 0 END) AS 노쇼_인원, \
            pt.*  \
            FROM programs p JOIN student_completes_program sc ON p.program_id = sc.program_id \
            JOIN programtype pt ON p.programtype_id = pt.programtype_id \
            where p.program_status = "종료" \
            GROUP BY pt.programtype_name \
            ORDER BY pt.programtype_name\
            ',
        )
        console.log(programtype)


     // 3. 결과를 매핑하여 없는 프로그램 종류 채우기
     const programTypeMap = programtype.reduce((acc, item) => {
        acc[item.program_name] = {
            programtype_id : item.programtype_id,
          program_name: item.program_name,
          전체_참여_인원: item.전체_참여_인원,
          노쇼_인원: item.노쇼_인원
        };
        return acc;
      }, {});
  
      // 4. 모든 프로그램 종류를 기준으로 기본 데이터 생성
      const filledProgramTypes = allProgramTypes.map((type) => {
        if (programTypeMap[type.programtype_name]) {
          // 기존 데이터가 있는 경우 그대로 사용
          return programTypeMap[type.programtype_name];
        } else {
          // 데이터가 없는 경우 기본값 추가
          return {
            programtype_id : type.programtype_id,
            program_name: type.programtype_name,
            전체_참여_인원: 0,
            노쇼_인원: 0
          };
        }
      });
  
      // 5. 전체 노쇼 인원의 합 계산
    const totalNoShow = filledProgramTypes.reduce((sum, type) => sum + Number(type.노쇼_인원), 0); // 명시적으로 숫자 변환
    console.log("총 노쇼 인원:", totalNoShow); // 확인: 명확하게 출력

      console.log(totalNoShow)
      // 6. 노쇼 비율 계산 및 정규화
      const normalizedProgramTypes = filledProgramTypes.map((type) => {
        const 노쇼_비율 = totalNoShow > 0 ? (type.노쇼_인원 / totalNoShow) * 100 : 0;
        return {
          ...type,
          노쇼_비율: parseFloat(노쇼_비율.toFixed(2)) // 소수점 두 자리로 제한
        };
      });
      console.log(normalizedProgramTypes)
  

        

        res.json({normalizedProgramTypes : normalizedProgramTypes})

    }catch(error){
        console.log(error);
    }
})

/* 프로그램 각 종류에 대한 노쇼 응답*/
router.post('/noshowstickgraph', async (req, res) => {
    console.log("here")

    const {programtype_id} = req.body
    console.log(programtype_id)
    try {
        const programtype = await req.db.query(
            'select * from programtype where programtype_id = ?',
            [programtype_id]
        )
        console.log(programtype)
        const program_name = await req.db.query(
            'SELECT n.noshowreasoncategories_name,COUNT(scp.noshowreasoncategories_id) AS selected_count \
            FROM noshow_reason_category AS n LEFT JOIN student_completes_program AS scp \
            ON scp.noshowreasoncategories_id = n.noshowreasoncategories_id \
            AND scp.programtype_name = ? \
            GROUP BY n.noshowreasoncategories_name;\
            ',
            [programtype[0].programtype_name]
        )
        return res.json({program_name : program_name})
    }
    catch(error){
        console.log(error)
    }
})

/* 프로그램별 노쇼 list*/
router.get('/noshowgraph/list', async (req,res) => {
    try{

        const programlist = await req.db.query(
            `
            SELECT 
                p.*,
                p.program_id,
                p.program_name,
                COUNT(scp.program_id) AS total_program_count, -- 전체 program_id 레코드 수
                SUM(CASE WHEN scp.noshowreasoncategories_id IS NOT NULL THEN 1 ELSE 0 END) AS no_show_count, -- NULL이 아닌 경우 카운트
                CASE 
                    WHEN COUNT(scp.program_id) > 0 THEN 
                        ROUND(SUM(CASE WHEN scp.noshowreasoncategories_id IS NOT NULL THEN 1 ELSE 0 END) * 100 / COUNT(scp.program_id), 2)
                    ELSE 0 
                END AS no_show_rate -- NULL이 아닌 비율 계산
            FROM 
                programs AS p
            LEFT JOIN 
                student_completes_program AS scp 
            ON 
                p.program_id = scp.program_id
            WHERE 
                p.program_status = '종료'
            GROUP BY 
                p.program_id, p.program_name
            ORDER BY 
                p.program_id;
            `
        )
        return res.json({programlist : programlist});
    }catch(error){
        console.log(error);
    }
})



/* 프로그램 상세 노쇼 인원 */
router.post('/noshowgraph/detail', async (req,res) => {
    const {program_id}=req.body
    try{

        const programDetails = await req.db.query(
            'SELECT p.* , sc.programtype_name, COUNT(sc.program_id) AS 전체_참여_인원, \
            SUM(CASE WHEN sc.stu_give_mydex_points < 0 AND sc.stu_give_mydex_points IS NOT NULL THEN 1 ELSE 0 END) AS 노쇼_인원 \
            FROM programs p JOIN student_completes_program sc ON p.program_id = sc.program_id \
            where p.program_id = ? and p.program_status = "종료" \
            ',[program_id]
        )
        console.log(programDetails)

        // 프로그램 데이터 확인
        if (programDetails.length === 0) {
            return res.json({
            message: '해당 프로그램에 대한 데이터가 없습니다.',
            program: {
                전체_참여_인원: 0,
                노쇼_인원: 0,
                노쇼_비율: 0,
                노쇼_아닌_비율: 0
            }
            });
        }

        const programData = programDetails[0];
        const { 전체_참여_인원, 노쇼_인원 } = programData;

           // 비율 계산
        const 노쇼_비율 = 전체_참여_인원 > 0 ? (노쇼_인원 / 전체_참여_인원) * 100 : 0;
        const 노쇼_아닌_비율 = 전체_참여_인원 > 0 ? ((전체_참여_인원 - 노쇼_인원) / 전체_참여_인원) * 100 : 0;


          // 모든 노쇼 이유 가져오기
        const allReasons = await req.db.query(
        'SELECT noshowreasoncategories_id, noshowreasoncategories_name FROM noshow_reason_category'
      );

        const noShowReasons = await req.db.query(
            `SELECT nrc.noshowreasoncategories_name AS 노쇼_이유, 
                    COUNT(sc.noshowreasoncategories_id) AS 횟수 
             FROM student_completes_program sc
             LEFT JOIN noshow_reason_category nrc 
             ON sc.noshowreasoncategories_id = nrc.noshowreasoncategories_id
             WHERE sc.program_id = ?
             GROUP BY nrc.noshowreasoncategories_name
             ORDER BY 횟수 DESC`,
            [program_id]
          );

           // 응답 데이터 구성
        const noshowGraph = {
            programData: programData,
            전체_참여_인원,
            노쇼_인원,
            노쇼_비율: parseFloat(노쇼_비율.toFixed(2)),
            노쇼_아닌_비율: parseFloat(노쇼_아닌_비율.toFixed(2))
        };

         // 기존 결과를 맵 형태로 변환
    const reasonMap = noShowReasons.reduce((acc, reason) => {
        acc[reason.노쇼_이유] = reason.횟수;
        return acc;
      }, {});
  
      // 모든 이유를 기준으로 결과 매핑
      const filledReasons = allReasons.map((reason) => {
        return {
          노쇼_이유: reason.noshowreasoncategories_name,
          횟수: reasonMap[reason.noshowreasoncategories_name] || 0 // 기존에 없으면 0으로 설정
        };
      });
  
        

        return res.json({noshowGraph : noshowGraph, filledReasons : filledReasons});


    }catch(error){
        console.log(error);
    }
})



module.exports = router;
