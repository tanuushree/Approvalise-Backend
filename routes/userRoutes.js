const express = require('express');
const { registerUser, loginUser, getUserIdByUsername, getUserById, registerUsersFromCSV, getallApprovers } = require('../controllers/userController');
//const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/register-users', upload.single('file'), registerUsersFromCSV);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/getapprovers', getallApprovers);
router.get('/:userId', getUserById);
router.get('/username/:username/id', getUserIdByUsername);

module.exports = router;
