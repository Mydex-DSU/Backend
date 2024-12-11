// var express = require('express');
// var router = express.Router();
// const multer = require('multer');



// // 우수 졸업생의 pdf 파일 저장하는 것.
// router.get('/', async (req, res) => {

//     const { stu_id } = req.body;

   
//     try{



     


//         // 저장 디렉토리와 파일 이름 설정
//         const storage = multer.diskStorage({
//             destination: (req, file, cb) => {
//                 cb(null, './uploads'); // PDF 파일 저장 디렉토리
//             },
//             filename: (req, file, cb) => {
//                 const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//                 cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
//             },
//         });

//         // 파일 업로드 필터링 (PDF만 허용)
//         const fileFilter = (req, file, cb) => {
//             if (file.mimetype === 'application/pdf') {
//                 cb(null, true);
//             } else {
//                 cb(new Error('Only PDF files are allowed!'), false);
//             }
//         )
        




//         router.post('/', upload.single('portfolio_documents'), async (req, res) => {

//             const {stu_id} = req.body;
// })
    
//         try{
//         const portfolio_documents = req.file ? req.file.path : null;

//         if (!portfolio_documents) {
//             return res.status(400).json({ message: 'No PDF file uploaded or invalid file type.' });
//         }

//         console.log(portfolio_documents)
//         portfolio_documents = `${req.protocol}://${req.get('host')}/pdf_uploads/${req.file.filename}`
 
        

//         await req.db.query(
//             'insert into best_graduate_recommendation_list(stu_id, portfolio_documents) values(?, ?)', 
//             [stu_id, portfolio_documents]
//         )
//         res.status(200).json({
//             message: "포트폴리오 파일 업로드 완료",
//             portfolio_documents,
//             pdf_url: `${req.protocol}://${req.get('host')}/pdf_uploads/${req.file.filename}`
//         }); 



//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "서버 에러가 발생했습니다." });
//     }
    
// });





// module.exports = router;
