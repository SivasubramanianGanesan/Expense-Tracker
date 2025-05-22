const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { sequelize } = require('./models'); // Import your Sequelize instance
const { User, Transaction } = require('./models'); // Import your User and Transaction models
const app = express();
const port = 5000;

app.use(bodyParser.json());

// Secret key for JWT (keep this very secure!)
const secretKey = 'yourSecretKey';

// Helper function to generate JWT
function generateToken(user) {
  return jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
}

// 1. User Registration API
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Check if the username is already taken
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create the new user
    const newUser = await User.create({ username, password });
    const token = generateToken(newUser);

    res.status(201).json({ message: 'User created successfully', user: {id: newUser.id, username: newUser.username}, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2. User Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Find the user by username
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the password
    const passwordMatch = await user.validPassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.json({ message: 'Login successful', token, user: {id: user.id, username: user.username} });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 3. Middleware for Authentication (Protect Routes)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, async (err, decoded) => { // Changed to decoded
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    //  Instead of attaching user, attach userId
    req.userId = decoded.userId;
    next();
  });
};

// 4. Get User Details (Protected Route)
  app.get('/api/users/:userId', authenticateToken, async (req, res) => {
    const userId = parseInt(req.params.userId);

    if (req.userId !== userId) {
        return res.status(403).json({ message: "Unauthorized: You can only access your own data." });
    }

    try {
        const user = await User.findByPk(userId, {
            attributes: ['id', 'username'], // Select only id and username
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
         // Fetch user's transactions
        const transactions = await Transaction.findAll({
            where: { userId: userId },
            attributes: ['id', 'description', 'amount', 'type', 'category'],
        });

        res.json({ user, transactions });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 5. Transaction API (Modified to include userId)
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { description, amount, type, category } = req.body;
  const userId = req.userId; // Get user ID from the token

  if (!description || !amount || !type || !category) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const newTransaction = await Transaction.create({
      userId,
      description,
      amount,
      type,
      category,
    });
    res.status(201).json({ message: 'Transaction added', transaction: newTransaction });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 6. Get all transactions for a specific user
app.get('/api/transactions', authenticateToken, async (req, res) => {
    const userId = req.userId;

    try {
        const transactions = await Transaction.findAll({
            where: { userId: userId },
            attributes: ['id', 'description', 'amount', 'type', 'category'],
        });
        res.json(transactions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
