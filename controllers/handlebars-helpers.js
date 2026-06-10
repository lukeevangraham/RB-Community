const moment = require("moment");

module.exports = {
  formatDate: function (date, format) {
    return moment(date).format(format);
  },
  changeSpacesToDashes: function (str) {
    if (!str) return "";
    return str
      .toLowerCase() // 1. Lowercase for consistency
      .replace(/\//g, "-") // ⭐ NEW: Convert forward slashes to dashes (e.g., "1/2" to "1-2")
      .replace(/#/g, "") // 2. Explicitly remove hashtags
      .replace(/[^a-z0-9\s-]/g, "") // 3. Remove all other non-alphanumeric chars
      .trim() // 4. Remove leading/trailing whitespace
      .replace(/\s+/g, "-") // 5. Convert spaces to dashes
      .replace(/-+/g, "-"); // 6. Collapse multiple dashes (e.g., " -- " to "-")
  },
  changeDashesToSpaces: function (str) {
    return str ? str.replace(/-/g, " ") : "";
  },
  toSlug: function (str) {
    if (!str) return "";
    return str
      .toLowerCase()
      .replace(/\//g, "-") // ⭐ NEW: Convert forward slashes to dashes safely
      .replace(/&/g, "and") // Optional: converting "&" to "and" makes URLs super clean for SEO
      .replace(/[^a-z0-9\s-]/g, "") // Strip out parentheses () and other punctuation safely
      .replace(/\s+/g, "-") // Collapse multiple spaces into a single dash
      .replace(/-+/g, "-") // Collapse multiple dashes
      .trim();
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
      default:
        break;
    }
  },
  isTheater: (value) => {
    switch (value) {
      case "Youth, Music and Theater":
        return true;
      default:
        break;
    }
  },
  getCloudinaryResize: (url, width) => {
    return `${url.replace("/upload/", `/upload/ar_2.34,w_${width},c_fill/`)} ${width}w`;
  },
};
