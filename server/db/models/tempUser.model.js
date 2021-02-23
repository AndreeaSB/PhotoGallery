const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const tempUserSchema = new mongoose.Schema({
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

    verificationToken: {
        type: String,
        required: true
    },

    expireAt: {
        type: Date,
        default: Date.now,
        index: {
            expires: '30m'
        }
    },

    saltSecret: {
        type: String
    }
});

tempUserSchema.pre('save', function(next) {
    bcrypt.genSalt(10, (err,salt) => {
        bcrypt.hash(this.password, salt, (err,hash) => {
            this.password = hash;
            this.saltSecret = salt;
            next();
        })
    })
});

const TempUser = mongoose.model('TempUser', tempUserSchema);
module.exports = { TempUser };