var moment = require('moment')

module.exports = function(sequelize, DataTypes) {
    console.log("model functioning!")
    var Event = sequelize.define("Event", {
        title: DataTypes.STRING,
        date: DataTypes.STRING,
        longdate: DataTypes.DATEONLY,
        month: DataTypes.STRING,
        time: DataTypes.STRING,
        location: DataTypes.STRING,
        description: DataTypes.STRING(500),
        imgurl: DataTypes.STRING,
        featured: DataTypes.BOOLEAN,
        published: DataTypes.BOOLEAN
    })
    console.log("Event is: ", Event)
    return Event;
}