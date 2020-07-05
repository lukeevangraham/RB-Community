let mongoose = require('mongoose')

let Schema = mongoose.Schema;

let CommentSchema = new Schema({
    comment: {
        type: String
    },
    date: {
        type: Date,
        default: Date.now
    }
})

let Comments = mongoose.model("Comments", CommentSchema)

module.exports = Comments;