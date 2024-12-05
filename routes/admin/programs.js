var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var router = express.Router();

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

        const program_poster_image = req.file ? `/uploads/${req.file.filename}` : null;
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
        await req.db.query(
            ' INSERT INTO programs ( \
            adm_id, programtype_id, program_money, \
            program_name, program_description,\
            program_application_start_time, program_application_end_time,\
            program_operation_start_time, program_operation_end_time,\
            program_survey_start_time, program_survey_end_time,\
            program_max_participants, program_poster_image,\
            program_year, program_semester,\
            program_mydex_points, program_status\ ) \
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [   1, programtype[0].programtype_id, program_money, 
                program_name, program_description,
                program_application_start_time, program_application_end_time,
                program_operation_start_time, program_operation_end_time,
                program_survey_start_time, program_survey_end_time,
                program_max_participants, program_poster_image,
                program_year, program_semester,
                program_mydex_points, '대기중'
            ]
            // [req.session.adm_id, programtype.programtype_id, program_money, 
            //     program_name, program_description,
            //     program_application_start_time, program_application_end_time,
            //     program_operation_start_time, program_operation_end_time,
            //     program_survey_start_time, program_survey_end_time,
            //     program_max_participants, program_poster_image,
            //     program_year, program_semester,
            //     program_mydex_points, '대기중'
            // ]
        )
        res.status(200).json({
            message: 'Program registered successfully!',
        })
        // res.status(200).json({
        //     message: 'Program registered successfully!',
        //     program_name: req.body.program_name, // 예시로 보냄
        //     program_description: req.body.program_description, // 예시로 보냄
        //     program_poster_image: program_poster_image // 저장된 이미지 URL 반환
        // })
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
router.get('/fin/detail', async (req, res) => {
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
    const {stu_id, stu_give_mydex_points} = req.body
    try {

        //프로그램에 신청 중인 학생 리스트 보내주기
        const stu_name = await req.db.query(
            'select stu_name from student where stu_id = ?',
            [stu_id]
        )

        await req.db.query(
            `UPDATE studentcompletesprogram SET stu_give_mydex_points = ? WHERE stu_id = ?`,
            [stu_give_mydex_points, stu_id]
        );

        res.json({ message: stu_name[0].stu_name + "에게 " +stu_give_mydex_points + "의 mydex 온도 포인트를 부여하였습니다." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});



module.exports = router;
