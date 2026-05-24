const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

async function createWorkingAdmin() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected successfully');
        
        const dbName = mongoose.connection.db.databaseName;
        console.log('📀 Database:', dbName);
        
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Admin123!', 10);
        
        // Delete existing user
        await User.deleteOne({ email: "master@csbm.com" });
        console.log('✓ Removed any existing user');
        
        // Create new admin
        const adminUser = new User({
            name: "Master Admin",
            email: "master@csbm.com",
            password: hashedPassword,
            role: "admin",
            isApproved: true,
            permissions: {
                canManageUsers: true,
                canManageBatches: true,
                canViewAnalytics: true,
                canUploadFiles: true
            },
            createdAt: new Date(),
            updatedAt: new Date()
        });
        
        await adminUser.save();
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ ADMIN USER CREATED!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📧 Email:    master@csbm.com');
        console.log('🔑 Password: Admin123!');
        console.log('👤 Role:     admin');
        console.log('✅ Approved:  true');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
        await mongoose.disconnect();
        process.exit();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createWorkingAdmin();