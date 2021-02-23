const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
JWT_SECRET = "sEcReT#@123";
JWT_EXP = "3000m";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        default: ""
    },

    lastName: {
        type: String,
        default: ""
    },

    email: {
        type: String,
        unique: true
    },

    password: {
        type: String
    },

    saltSecret: String
});

userSchema.methods.verifyPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
};

userSchema.methods.generateJwt = function() {
    return jwt.sign({ _id: this._id}, JWT_SECRET, {
        expiresIn: JWT_EXP
    });
}

const User = mongoose.model('User', userSchema);
module.exports = { User };