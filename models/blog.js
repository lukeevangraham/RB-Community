var moment = require('moment')

module.exports = function(sequelize, DataTypes) {
    console.log("model functioning!")
    var Blog = sequelize.define("Blog", {
        title: DataTypes.STRING,
        author: DataTypes.STRING,
        imgurl: DataTypes.STRING,
        date: DataTypes.STRING,
        longdate: DataTypes.STRING,
        month: DataTypes.STRING,
        maincontent: DataTypes.STRING(2000),
        shortenedmain: DataTypes.STRING(500),
        featured: DataTypes.BOOLEAN,
        published: DataTypes.BOOLEAN
    })
    console.log("Blog is: ", Blog)
    return Blog;
}