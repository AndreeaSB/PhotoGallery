const mongoose = require('mongoose');

const AlbumNameSchema = new mongoose.Schema({
    
    name:{
        type: String,
        required: true
    },

    description: {
        type: String,
        default:""
    },

    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});

const AlbumName = mongoose.model('AlbumName', AlbumNameSchema);
module.exports = {AlbumName};