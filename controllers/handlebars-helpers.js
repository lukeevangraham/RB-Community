const moment = require("moment");

module.exports = {
  formatDate: function (date, format) {
    return moment(date).format(format);
  },
  changeSpacesToDashes: function (str) {
    str = str.replace(/-/g, "---");
    str = str.replace(/\s+/g, "-");
    str = str.replace(/-----/g, " - ");
    // str = str.replace(/---/g, " - ")
    return str;
  },
  changeDashesToSpaces: function (str) {
    str = str.replace(/-/g, " ");
  },
  isDefined: function (value) {
    return value !== undefined;
  },
  isString: function(value) {
    return typeof(value) === 'string'
  }
  // function(name, options) {
  //     if(!this._sections) this._section = {};
  //     this._sections[name] = options.fn(this);
  //     return null
  // }
  //   showChat: function (showWeekday, showStart, showEnd) {
  //     console.log("current date: ", moment().format("ddd"));
  //     console.log("show start: ", moment(showStart, ["h:mm A"]).format("HH:mm"));
  //     console.log("show end: ", showEnd);
  //     console.log("show weekday: ", showWeekday);
  //     return moment().format("dddd") === showWeekday &&
  //       moment().isBetween(moment(showStart, "h:mm A"), moment(showEnd, "h:mm A"))
  //       ? true
  //       : false;
  //   },
};
