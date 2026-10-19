
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { User, Transaction } = require('./models');

const app = express();
const port = process.env.PORT || 5000;
const secretKey = process.env.JWT_SECRET;

// Ensure required configuration is available.
if (!secretKey) {
  throw new Error('JWT_SECRET is missing from environment variables');
}

// Middleware
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
    },
    secretKey,
    { expiresIn: '1d' }
  );
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      message: 'Authentication token is required',
    });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        message: 'Invalid or expired token',
      });
    }

    if (!Number.isSafeInteger(decoded.userId)) {
      return res.status(403).json({
        message: 'Invalid token payload',
      });
    }

    req.userId = decoded.userId;
    next();
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Expense Tracker API is running',
  });
});

// 1. Register a new user
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof password !== 'string' ||
    password.length < 8
  ) {
    return res.status(400).json({
      message:
        'Username is required and password must be at least 8 characters',
    });
  }

  const normalizedUsername = username.trim();

  try {
    const existingUser = await User.findOne({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      return res.status(409).json({
        message: 'Username already exists',
      });
    }

    // Password hashing must be implemented in the User model
    // before creating accounts. See the important note below.
    const newUser = await User.create({
      username: normalizedUsername,
      password,
    });

    const token = generateToken(newUser);

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        username: newUser.username,
      },
      token,
    });
  } catch (err) {
    console.error('Registration error:', err);

    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        message: 'Username already exists',
      });
    }

    return res.status(500).json({
      message: 'Unable to create account',
    });
  }
});

// 2. Login
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    !username.trim() ||
    typeof password !== 'string' ||
    !password
  ) {
    return res.status(400).json({
      message: 'Username and password are required',
    });
  }

  try {
    const user = await User.findOne({
      where: { username: username.trim() },
    });

    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error('Login error:', err);

    return res.status(500).json({
      message: 'Unable to sign in',
    });
  }
});

// 3. Get a user's details and transactions
app.get('/api/users/:userId', authenticateToken, async (req, res) => {
  const requestedUserId = Number(req.params.userId);

  if (
    !Number.isSafeInteger(requestedUserId) ||
    requestedUserId <= 0
  ) {
    return res.status(400).json({
      message: 'Invalid user ID',
    });
  }

  if (req.userId !== requestedUserId) {
    return res.status(403).json({
      message: 'You can only access your own data',
    });
  }

  try {
    const user = await User.findByPk(req.userId, {
      attributes: ['id', 'username'],
    });

    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }

    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      attributes: [
        'id',
        'description',
        'amount',
        'type',
        'category',
        'userId',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json({
      user,
      transactions,
    });
  } catch (err) {
    console.error('Get user error:', err);

    return res.status(500).json({
      message: 'Unable to retrieve user data',
    });
  }
});

// 4. Create a transaction
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { description, amount, type, category } = req.body || {};

  if (
    typeof description !== 'string' ||
    !description.trim() ||
    amount === undefined ||
    amount === null ||
    amount === '' ||
    !['income', 'expense'].includes(type) ||
    typeof category !== 'string' ||
    !category.trim()
  ) {
    return res.status(400).json({
      message:
        'Description, amount, valid type, and category are required',
    });
  }

  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({
      message: 'Amount must be greater than zero',
    });
  }

  try {
    const newTransaction = await Transaction.create({
      userId: req.userId,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category: category.trim(),
    });

    return res.status(201).json({
      message: 'Transaction added successfully',
      transaction: newTransaction,
    });
  } catch (err) {
    console.error('Create transaction error:', err);

    if (
      err.name === 'SequelizeValidationError' ||
      err.name === 'SequelizeForeignKeyConstraintError'
    ) {
      return res.status(400).json({
        message: 'Transaction validation failed',
        errors: err.errors?.map((item) => item.message) || [],
      });
    }

    return res.status(500).json({
      message: 'Unable to create transaction',
    });
  }
});

// 5. Get the authenticated user's transactions
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId: req.userId },
      attributes: [
        'id',
        'description',
        'amount',
        'type',
        'category',
        'userId',
        'createdAt',
        'updatedAt',
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.status(200).json(transactions);
  } catch (err) {
    console.error('Get transactions error:', err);

    return res.status(500).json({
      message: 'Unable to retrieve transactions',
    });
  }
});



/* 6. Delete a transaction belonging to the authenticated user */
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  const transactionId = Number(req.params.id);

  if (!Number.isSafeInteger(transactionId) || transactionId <= 0) {
    return res.status(400).json({
      message: 'Invalid transaction ID',
    });
  }

  try {
    // Only delete a transaction owned by the logged-in user.
    const transaction = await Transaction.findOne({
      where: {
        id: transactionId,
        userId: req.userId,
      },
    });

    if (!transaction) {
      return res.status(404).json({
        message: 'Transaction not found or you do not have permission to delete it',
      });
    }

    await transaction.destroy();

    return res.status(200).json({
      message: 'Transaction deleted successfully',
      id: transactionId,
    });
  } catch (err) {
    console.error('Delete transaction error:', err);

    return res.status(500).json({
      message: 'Unable to delete transaction',
    });
  }
});



// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
