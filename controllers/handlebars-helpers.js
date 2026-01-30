const moment = require("moment");

module.exports = {
  formatDate: function (date, format) {
    return moment(date).format(format);
  },
  changeSpacesToDashes: function (str) {
    if (!str) return "";
    return str
      .toLowerCase() // 1. Lowercase for consistency
      .replace(/#/g, "") // 2. Explicitly remove hashtags
      .replace(/[^a-z0-9\s-]/g, "") // 3. Remove all other non-alphanumeric chars
      .trim() // 4. Remove leading/trailing whitespace
      .replace(/\s+/g, "-") // 5. Convert spaces to dashes
      .replace(/-+/g, "-"); // 6. Collapse multiple dashes (e.g., " -- " to "-")
  },
  changeDashesToSpaces: function (str) {
    return str ? str.replace(/-/g, " ") : "";
  },
  isDefined: function (value) {
    return value !== undefined;
  },
  isBlog: (value) => {
    return value === "blog";
  },
  isEventCurrentOrFuture: (endDate) => {
    return moment(endDate).isSameOrAfter(moment(), "day");
  },
  isBlogCurrent: (expirationDate) => {
    return moment(expirationDate).isSameOrAfter(moment(), "day");
  },
  isHighOrMiddleSchool: (value) => {
    switch (value) {
      case "Middle School":
        return true;
      case "High School":
        return true;
      case "Youth, Music and Theater":
        return true;
      default:
        break;
    }
  },
  getCloudinaryResize: (url, width) => {
    return `${url.replace("/upload/", `/upload/ar_2.34,w_${width},c_fill/`)} ${width}w`;
  },
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
