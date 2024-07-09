const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const csv = require('csv-parser');
const fs = require('fs');


// Register a new user

const registerUser = async (req, res) => {
  const { username, email, password, department, role, hierarchyValue } = req.body;
  try {
    let user_old = await User.findOne({ email });
    if (user_old) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      department, 
      role, 
      hierarchyValue 
    });

    await user.save();

    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};


const registerUsersFromCSV = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }
  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
      try {
        for (const user of results) {
          const { username, email, password, department, role, hierarchyValue } = user;
          let user_old = await User.findOne({ email });
          if (user_old) {
            continue; 
          }
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          const newUser = new User({ 
            username, 
            email, 
            password: hashedPassword, 
            department, 
            role, 
            hierarchyValue 
          });
          await newUser.save();
        }
        res.status(201).json({ msg: 'Users registered successfully' });
      } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
      }
    });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({ msg: 'Please enter both email and password' });
    }    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ msg: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(401).json({ msg: 'Invalid email or password' });
    }
    const payload = { user: { id: user.id } };
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: 3600 },
      (err, token) => {
        if (err) throw err;
        res.json({ token, userId: user.id});
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// get all approvers
const getallApprovers = async (req, res) => {
  try {
    const approvers = await User.find({ role: 'approver' }).select('username');
    const approverList = approvers.map(approver => ({
      username: approver.username
    }));
    res.status(200).json(approverList);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get user ID by username
const getUserIdByUsername = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('_id');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({ userId: user._id });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { registerUser, registerUsersFromCSV, loginUser, getUserById, getUserIdByUsername, getallApprovers };

