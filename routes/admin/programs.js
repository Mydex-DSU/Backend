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
            "SELECT * FROM programs WHERE program_status IN ('대기중', '모집중', '모집완료')"
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
            "SELECT * FROM programs WHERE program_id = ?",
            [program_id]
        );

        //프로그램에 신청 중인 학생 리스트 보내주기
        // const program_student = await req.db.query(
        //     `SELECT ps.*, s.*
        //      FROM studentprogramlist ps
        //      JOIN student s ON ps.stu_id = s.stu_id
        //      WHERE ps.program_id = ?`,
        //     [program_id]
        // );

        //프로그램에 신청중인 학생과 완료학생 묶어서 같이 보내줌
        const program_student = await req.db.query(
            `SELECT ps.*, s.*, sc.*
             FROM studentprogramlist ps
             JOIN student s ON ps.stu_id = s.stu_id
             LEFT JOIN studentcompletesprogram sc ON ps.stu_id = sc.stu_id AND ps.program_id = sc.program_id
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
            `UPDATE studentcompletesprogram SET stu_give_mydex_points = ? WHERE stu_id = ? and program_id = ?`,
            [stu_give_mydex_points, stu_id, program_id]
        );

        //부여되는 mydex 온도 포인트가 양수인지 음수인지
        console.log("awd")
        if (stu_give_mydex_points < 0)
        {
            console.log("1stu_give_mydex_points " + stu_give_mydex_points)
            await req.db.query(
                `UPDATE studentcompletesprogram SET no_show_reason_response_status = ? WHERE stu_id = ? and program_id = ?`,
                [false, stu_id, program_id]
            );
        }
        else 
        {
            console.log("2stu_give_mydex_points " + stu_give_mydex_points)
            await req.db.query(
                `UPDATE studentcompletesprogram SET survey_response_status = ? WHERE stu_id = ? and program_id = ?`,
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
            'select * from studentprogramlist join student on studentprogramlist.stu_id = student.stu_id where program_id = ?',
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
        const programtype = await req.db.query(
            'select * from programtype',
        )

        res.json({programtype: programtype})

    }catch(error){
        console.log(error);
    }
})



module.exports = router;
