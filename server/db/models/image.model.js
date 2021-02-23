const mongoose = require('mongoose');


const ImageSchema = new mongoose.Schema({
   filename: {
       type: String
   },

   user_id: {
       type: mongoose.Types.ObjectId,
       required: true
   }
});


const Image = mongoose.model('Image', ImageSchema);
module.exports = { Image };