const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// ==========================================
// REGISTER NEW USER
// POST /api/auth/register
// ==========================================
exports.register = async (req, res) => {
  try {
    const { fullName, email, password, role, gradeLevel } = req.body;

    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        message: 'fullName, email, password, and role are required'
      });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const validRoles = ['admin', 'teacher', 'student', 'parent', 'registrar'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }
    if (role === 'student' && !gradeLevel) {
      return res.status(400).json({
        message: 'Grade level is required for students'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      role,
      ...(role === 'student' && { gradeLevel })
    });

    res.status(201).json({
      message: 'User created successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('=== register ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error creating user',
      error: error.message
    });
  }
};

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required'
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role,
        gradeLevel: user.gradeLevel
      }
    });
  } catch (error) {
    console.error('=== login ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error logging in',
      error: error.message
    });
  }
};

// ==========================================
// GET ALL USERS (Admin)
// GET /api/auth/users
// ==========================================
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isActive } = req.query;

    const filter = {};
    if (role) filter.role = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Users fetched successfully',
      count: users.length,
      users
    });
  } catch (error) {
    console.error('=== getAllUsers ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// ==========================================
// GET ONE USER BY ID
// GET /api/auth/users/:id
// ==========================================
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User found', user });
  } catch (error) {
    console.error('=== getUserById ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// ==========================================
// UPDATE USER
// PUT /api/auth/users/:id
// ==========================================
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const fields = ['fullName', 'email', 'role', 'isActive'];

    fields.forEach((f) => {
      if (req.body[f] !== undefined) user[f] = req.body[f];
    });

    if (req.body.password) {
      user.password = await bcrypt.hash(req.body.password, 10);
    }

    await user.save();

    res.json({
      message: 'User updated successfully',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('=== updateUser ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error updating user',
      error: error.message
    });
  }
};

// ==========================================
// DELETE USER
// DELETE /api/auth/users/:id
// ==========================================
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own account'
      });
    }

    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('=== deleteUser ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// ==========================================
// GET CURRENT USER PROFILE
// GET /api/auth/me
// ==========================================
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile fetched', user });
  } catch (error) {
    console.error('=== getMe ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// ==========================================
// LINK PARENT TO STUDENT (Admin only)
// PUT /api/auth/students/:studentId/parent
// ==========================================
exports.linkParent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { parentId } = req.body;

    if (!parentId) {
      return res.status(400).json({ message: 'parentId is required' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student not found' });
    }

    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ message: 'Parent not found' });
    }

    student.parent = parentId;
    await student.save();

    res.json({
      message: 'Parent linked to student successfully',
      student: {
        id: student._id,
        fullName: student.fullName,
        email: student.email,
        parent: parent._id
      }
    });
  } catch (error) {
    console.error('=== linkParent ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error linking parent',
      error: error.message
    });
  }
};

// ==========================================
// GET MY CHILDREN (Parent only)
// GET /api/auth/my-children
// ==========================================
exports.getMyChildren = async (req, res) => {
  try {
    const children = await User.find({
      role: 'student',
      parent: req.user._id
    }).select('-password');

    res.json({
      message: 'Children fetched',
      count: children.length,
      children
    });
  } catch (error) {
    console.error('=== getMyChildren ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error fetching children',
      error: error.message
    });
  }
};
// ==========================================
// CHANGE OWN PASSWORD (Any logged-in user)
// PUT /api/auth/change-password
// ==========================================
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'currentPassword and newPassword are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('=== changePassword ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error changing password',
      error: error.message
    });
  }
};
// ==========================================
// FORGOT PASSWORD (Send Email)
// POST /api/auth/forgot-password
// ==========================================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No user with that email' });
    }

    // Generate a random token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and save to DB (expires in 15 mins)
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    await user.save();

    // Create reset URL (points to Frontend)
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Setup email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Email content
    const message = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your ISCMS account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
      <p>This link expires in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email
    await transporter.sendMail({
      from: `"ISCMS Support" <${process.env.EMAIL_USER}>`,
      to: '${user.email}, ${process.env.EMAIL_USER}',
      subject: 'ISCMS - Password Reset Request',
      html: message
    });

    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('=== forgotPassword ERROR ===');
    console.error(error.stack);
    
    // If email fails, reset the token fields
    if (req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
      }
    }

    res.status(500).json({
      message: 'Email could not be sent',
      error: error.message
    });
  }
};

// ==========================================
// RESET PASSWORD (Verify Token & Save)
// PUT /api/auth/reset-password/:token
// ==========================================
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    // Hash the token from URL to match DB
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with this token and check expiry
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash new password and save
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    
    await user.save();

    res.json({ message: 'Password reset successful. You can now login.' });
  } catch (error) {
    console.error('=== resetPassword ERROR ===');
    console.error(error.stack);
    res.status(500).json({
      message: 'Error resetting password',
      error: error.message
    });
  }
};