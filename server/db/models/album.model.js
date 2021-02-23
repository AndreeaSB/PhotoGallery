//face legatura intre album si imagini 

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const AlbumSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true,
        unique: false
    },

    albumname: {
        type: String,
        required: true,
        unique: false
    },

    user_id: {
        type: mongoose.Types.ObjectId,
        required: true
    }
});

AlbumSchema.plugin(mongoosePaginate);
const Album = mongoose.model('Album', AlbumSchema);
module.exports = {Album};