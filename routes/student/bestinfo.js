var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var router = express.Router();



// PDF 저장 경로 및 파일 이름 설정
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../../pdf_uploads'); // PDF 파일 저장 디렉토리
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir); // 디렉토리가 없으면 생성
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname)); // 파일 이름 설정
    }
});

// PDF 파일 필터링 (PDF 파일만 허용)
const pdfFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

// Multer 설정
const upload = multer({ storage: pdfStorage, fileFilter: pdfFilter });


// [Object: null prototype] {
//     stu_id: '20201813',
//     select_programs: '[{"program_id":48,"comment":"ㅈㄷㄹ"}]',
//     category: 'IT 및 소프트웨어 개발',
//     detailed_category: 'null',
//     employmentStatus: 'Y',
//     detailed_categories: '["웹 개발"]',
//     graduate: '{"major":"동"}',
//     major: '동'
//   }
//   20201813
//   IT 및 소프트웨어 개발
//   동
//   [ { program_id: 48, comment: 'ㅈㄷㄹ' } ]
//   [ '웹 개발' ]
//   http://100.94.142.127:3000/pdf_uploads/1734163147313-551057726.pdf

// router.post('/', upload.single('pdf_gradutestudent'), async (req, res) => {
//     console.log(req.body);
//     const {stu_id, category, select_programs, detailed_categories, major} = req.body
//     // const select_programs = JSON.parse(req.body.select_programs);
    
//     return
//     try {
//         //Pdf 
//         // 업로드된 파일 정보 확인
//         let pdf_gradutestudent = req.file
//         ? `/pdf_uploads/${req.file.filename}` // 저장된 PDF 파일 경로
//         : null;

//         //우주 졸업생 조회
//         const bestgraduate = await req.db.query(
//             'select employment_status from best_graduate_recommendation_list where stu_id = ?',
//             [stu_id]
//         )

//         const studeniinfo = await req.db.query(
//             'select * from student where stu_id = ?',
//             [stu_id]
//         )
//         console.log('Uploaded PDF file path:', pdf_gradutestudent);
//         if (pdf_gradutestudent !== null){
//             pdf_gradutestudent = `${req.protocol}://${req.get('host')}/pdf_uploads/${req.file.filename}`

//         }
        

//         //1. 학생이 선택한 비교과 프로그램 
//         for (const program of select_programs) {
//             await req.db.query(
//                 'insert into best_graduate_select_programs(stu_id, comment, program_id)\
//                 values (?,?,?)',
//                 [stu_id, program.comment, program.program_id]
//             )
//         }

//         //2. 학생이 선택한 카테고리
//         //먼저 조회
//         const checkCategory = await req.db.query(
//             'select * from specialty_category where category_name = ?'
//             ,[category]
//         )


//         //우수 졸업생 선택 전문분야 카테고리 부터 넣자.
//         await req.db.query(
//             'insert into best_graduate_select_specialty_category(specialty_category_id, stu_id)\
//             values (?,?)',
//             [checkCategory[0].specialty_category_id, stu_id]
//         )

//         for (const detailed_category of detailed_categories){
//             const checkCategoryDetail = await req.db.query(
//                 'select * from specialty_category_details where detailed_name = ?'
//                 ,[detailed_category]
//             )
//             //상세
//             await req.db.query(
//                 'insert into best_graduate_select_detailed_category(specialty_detail_id, stu_id)\
//                 values (?,?)',
//                 [checkCategoryDetail[0].specialty_detail_id, stu_id]
//             )
//         }
   
        
//         if (bestgraduate[0].employment_status === 1){ //취직일때
//             await req.db.query(
//                 'update best_graduate_recommendation_list set company_name = ?, stu_name = ?, department_name = ?, portfolio_documents = ? \
//                 where stu_id = ?',
//                 [major, studeniinfo[0].stu_name, studeniinfo[0].department_name, pdf_gradutestudent, stu_id]
//             )
//         }
//         else {
//             await req.db.query(
//                 'update best_graduate_recommendation_list set field_of_study = ?,stu_name = ?, department_name = ?, portfolio_documents = ? \
//                 where stu_id = ?',
//                 [major, studeniinfo[0].stu_name, studeniinfo[0].department_name,  pdf_gradutestudent, stu_id]
//             )
//         }

//         // 인센티브 지급
//         if (pdf_gradutestudent !== null)
//         {
//             await req.db.query(
//                 'insert into best_graduate_incentivelist(stu_id, incentive_payment_amount) values(?,?)'
//                 ,[stu_id, 200000] 
//             )
//         }
//         else {
//             await req.db.query(
//                 'insert into best_graduate_incentivelist(stu_id, incentive_payment_amount) values(?,?)'
//                 ,[stu_id, 100000] 
//             )
//         }




//         return res.json({message : "우수 졸업생님이 선택한 비교과 프로그램과 카테고리가 등록되었습니다."})


//     } catch (error) {
//         console.error("Error executing query:", error);
//         res.status(500).json({ error: "서버 에러가 발생했습니다." });
//     }
// })

router.post('/', upload.single('pdf_gradutestudent'), async (req, res) => {
    console.log(req.body);

    try {
        // 데이터 파싱
        const stu_id = req.body.stu_id;
        const category = req.body.category;
        const major = req.body.major;
        const select_programs = JSON.parse(req.body.select_programs || '[]'); // 배열로 변환
        const detailed_categories = JSON.parse(req.body.detailed_categories || '[]'); // 배열로 변환


        console.log(stu_id)
        console.log(category)
        console.log(major)
        console.log(select_programs)
        console.log(detailed_categories)
        // PDF 경로 설정
        let pdf_gradutestudent = null;
        if (req.file) {
            pdf_gradutestudent = `${req.protocol}://${req.get('host')}/pdf_uploads/${req.file.filename}`;
        }
        console.log(pdf_gradutestudent)

        // 우수 졸업생 및 학생 정보 조회
        const bestgraduate = await req.db.query(
            'SELECT employment_status FROM best_graduate_recommendation_list WHERE stu_id = ?',
            [stu_id]
        );
        const studeniinfo = await req.db.query(
            'SELECT * FROM student WHERE stu_id = ?',
            [stu_id]
        );

        // 1. 학생이 선택한 비교과 프로그램 등록
        for (const program of select_programs) {
            await req.db.query(
                'INSERT INTO best_graduate_select_programs(stu_id, comment, program_id) VALUES (?, ?, ?)',
                [stu_id, program.comment, program.program_id]
            );
        }

        // 2. 카테고리 등록
        const checkCategory = await req.db.query(
            'SELECT * FROM specialty_category WHERE category_name = ?',
            [category]
        );

        await req.db.query(
            'INSERT INTO best_graduate_select_specialty_category(specialty_category_id, stu_id) VALUES (?, ?)',
            [checkCategory[0].specialty_category_id, stu_id]
        );

        for (const detailed_category of detailed_categories) {
            const checkCategoryDetail = await req.db.query(
                'SELECT * FROM specialty_category_details WHERE detailed_name = ?',
                [detailed_category]
            );
            await req.db.query(
                'INSERT INTO best_graduate_select_detailed_category(specialty_detail_id, stu_id) VALUES (?, ?)',
                [checkCategoryDetail[0].specialty_detail_id, stu_id]
            );
        }

        // 3. 졸업생 정보 업데이트
        const studentName = studeniinfo[0].stu_name;
        const departmentName = studeniinfo[0].department_name;

        if (bestgraduate[0].employment_status === 1) {
            // 취업 상태
            await req.db.query(
                'UPDATE best_graduate_recommendation_list SET company_name = ?, stu_name = ?, department_name = ?, portfolio_documents = ? WHERE stu_id = ?',
                [major, studentName, departmentName, pdf_gradutestudent, stu_id]
            );
        } else {
            // 학업 상태
            await req.db.query(
                'UPDATE best_graduate_recommendation_list SET field_of_study = ?, stu_name = ?, department_name = ?, portfolio_documents = ? WHERE stu_id = ?',
                [major, studentName, departmentName, pdf_gradutestudent, stu_id]
            );
        }

        // 4. 인센티브 지급
        const incentiveAmount = pdf_gradutestudent ? 200000 : 100000;
        await req.db.query(
            'INSERT INTO best_graduate_incentivelist(stu_id, bestgraduateincentivelistcolincentive_payment_amount) VALUES (?, ?)',
            [stu_id, incentiveAmount]
        );

        // 성공 응답
        return res.json({
            message: '우수 졸업생님이 선택한 비교과 프로그램과 카테고리가 등록되었습니다.',
        });
    } catch (error) {
        console.error('Error executing query:', error);
        res.status(500).json({ error: '서버 에러가 발생했습니다.' });
    }
});





    // 졸업생 정보 저장
// router.post('/', async (req, res) => {

//     const { stu_id } = req.body;
//     try{
//     const updateinfo = await req.db.query(
//         'UPDATE best_graduate_recommendation_list SET company_name = ?, employment_field = ?, field_of_study = ?, portfolio_documents = ? WHERE stu_id = ?',
//         [company_name, employment_field, field_of_study, portfolio_documents, stu_id]
//     )


//     console.log(updateinfo)
//     res.json(updateinfo)
//     }
//     catch(error)
//     {
//         console.log(error)
//         res.status(500).json({ error: "서버 에러가 발생했습니다." });

//     }
// });

/* */

router.post('/view', async (req, res) => {
    const {stu_id} = req.body
    try
    {
        await req.db.query(
            'update best_graduate_recommendation_list set views = views + 1 where stu_id = ?', 
            [stu_id]
        )
        res.json({message : "조회수 업데이트 완료"})
    }
    catch(error){
        console.log(error)
    }
})

module.exports = router;
