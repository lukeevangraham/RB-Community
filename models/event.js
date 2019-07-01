module.exports = function(sequelize, DataTypes) {
    var Event = sequelize.define("Event", {
        title: DataTypes.STRING,
        date: DataTypes.DATE,
        time: DataTypes.TIME,
        location: DataTypes.STRING,
        description: DataTypes.STRING,
        imgurl: DataTypes.STRING,
        featured: DataTypes.STRING(3),
        published: DataTypes.STRING(3)
    })
    return Event;
}