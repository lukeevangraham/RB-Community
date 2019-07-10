var moment = require('moment')

module.exports = function(sequelize, DataTypes) {
    console.log("model functioning!")
    var Blog = sequelize.define("Blog", {
        title: DataTypes.STRING,
        author: DataTypes.STRING,
        imgurl: DataTypes.STRING,
        date: DataTypes.STRING,
        maincontent: DataTypes.STRING,
        featured: DataTypes.BOOLEAN,
        published: DataTypes.BOOLEAN
    })
    console.log("Blog is: ", Blog)
    return Blog;
}