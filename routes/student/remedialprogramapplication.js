var express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
var router = express.Router();

/* 내가 신청한 구제프로그램 보기*/
router.get('/', async (req, res) => {
    const {stu_id} = req.body
    try 
    {
        const remedialprogramapplicationlist = await req.db.query(
            'select * from remedialprogramapplicationlist where stu_id = ?',
            [stu_id]
        )
        res.json({remedialprogramapplicationlist : remedialprogramapplicationlist})
    }
    catch(error)
    {
        console.log(error)
    }
});

/* 구제프로그램 신청 */
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


router.post('/application', upload.single('qualification_documents'), async (req, res) => {
    const { stu_id, remedialprogram_name } = req.body;

    try {
        // 업로드된 파일 정보 확인
        const qualification_documents = req.file
            ? `/pdf_uploads/${req.file.filename}` // 저장된 PDF 파일 경로
            : null;

        if (!qualification_documents) {
            return res.status(400).json({ message: 'No PDF file uploaded or invalid file type.' });
        }

        console.log('Uploaded PDF file path:', qualification_documents);

        // 데이터베이스에 저장
        await req.db.query(
            `INSERT INTO remedialprogramapplicationlist(stu_id, qualification_documents, remedialprogram_name)
             VALUES (?, ?, ?)`,
            [stu_id, qualification_documents, remedialprogram_name]
        );

        res.status(200).json({
            message: '구제 프로그램 신청이 완료되었습니다.',
            qualification_documents,
            pdf_url: `${req.protocol}://${req.get('host')}/pdf_uploads/${req.file.filename}`, // PDF 파일의 URL
        });
    } catch (error) {
        console.error('Error processing application:', error);
        res.status(500).json({
            message: 'Failed to process the application.',
            error: error.message,
        });
    }
});




module.exports = router;
