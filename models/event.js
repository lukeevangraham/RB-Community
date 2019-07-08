var moment = require('moment')

module.exports = function(sequelize, DataTypes) {
    console.log("model functioning!")
    var Event = sequelize.define("Event", {
        title: DataTypes.STRING,
        date: DataTypes.INTEGER,
        month: DataTypes.STRING,
        time: DataTypes.TIME,
        location: DataTypes.STRING,
        description: DataTypes.STRING,
        imgurl: DataTypes.STRING,
        featured: DataTypes.STRING(3),
        published: DataTypes.STRING(3)
    })
    console.log("Event is: ", Event)
    return Event;
}