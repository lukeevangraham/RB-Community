require("dotenv").config();
let keys = require("../keys.js");
var request = require("request");
var moment = require("moment");
var path = require("path");
var marked = require("marked");
let showdown = require("showdown");
// let axios = require(axios)
// let axios = require("axios");

let converter = new showdown.Converter();

marked.setOptions({
  renderer: new marked.Renderer(),
  sanitize: true,
  smartLists: true,
  smartypants: true,
});

// Import the model (event.js) to use its database functions
// var db = require("../models/");

var contentful = require("contentful");

let spaceId = process.env.SPACE_ID;
let contentfulAccessToken = process.env.ACCESS_TOKEN;

const HtmlRenderer = require("@contentful/rich-text-html-renderer");
let { documentToHtmlString } = HtmlRenderer;

const richTextTypes = require("@contentful/rich-text-types");
const { default: axios } = require("axios");
const { parse } = require("dotenv");
let { INLINES } = richTextTypes;

let vimeoPass = process.env.VIMEO_TOKEN;

var client = contentful.createClient({
  space: spaceId,
  accessToken: contentfulAccessToken,
});

let newYouTubeOptions = (playlistId) => {
  return {
    method: "GET",
    url: "https://www.googleapis.com/youtube/v3/playlistItems",
    qs: {
      key: process.env.GOOGLE_KEY,
      playlistId: playlistId,
      part: "snippet,contentDetails",
      maxResults: "3",
    },
    // headers: {
    //   Authorization: "Bearer " + vimeoPass,
    // },
  };
};
let streamYouTubeOptions = (playlistId) => {
  return {
    method: "GET",
    url: "https://www.googleapis.com/youtube/v3/playlistItems",
    qs: {
      key: process.env.GOOGLE_KEY,
      playlistId: "PLZ13IHPbJRZ7amo_md0SxN_CZgnu9DnxJ",
      part: "snippet,contentDetails",
      maxResults: "10",
    },
    // headers: {
    //   Authorization: "Bearer " + vimeoPass,
    // },
  };
};

var vimeoOptions = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "7",
    page: "1",
    sort: "date",
    direction: "desc",
  },
  headers: {
    Authorization: "Bearer " + vimeoPass,
  },
};
var vimeoOptionsHome = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "3",
    page: "1",
    sort: "date",
    direction: "desc",
  },
  headers: {
    Authorization: "Bearer " + vimeoPass,
  },
};

var vimeoOptionsAnnHome = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "announcements",
    fields:
      "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button, embed",
    width: "690",
    per_page: "1",
    page: "1",
    sort: "modified_time",
    direction: "desc",
  },
  headers: {
    Authorization: "Bearer " + vimeoPass,
  },
};

function getIdFromVimeoURL(url) {
  return /(vimeo(pro)?\.com)\/(?:[^\d]+)?(\d+)\??(.*)?$/.exec(url)[3];
}

function doReq(url, what) {
  return new Promise(function (resolve, reject) {
    request(
      {
        url: url,
        headers: {
          Bearer: "sampleapitoken",
        },
      },
      function (error, response) {
        if (error || response.statusCode !== 200) {
          reject(error);
        } else {
          var data = {};
          (Array.isArray(what) ? what : [what]).forEach(function (item, index) {
            data[item] = JSON.parse(arguments[index + 2]);
          });
          resolve(data);
        }
      }
    );
  });
}

// sort event dates by date field
function compare(a, b) {
  const dateA = moment(a.fields.date).format("YYYY-MM-DD");
  const dateB = moment(b.fields.date).format("YYYY-MM-DD");

  let comparison = 0;
  if (dateA > dateB) {
    comparison = 1;
  } else if (dateA < dateB) {
    comparison = -1;
  }
  return comparison;
}

function prepareBlogEntryForSinglePage(entry, requestId) {
  // console.log("ENTRY: ", entry.fields.body.content)

  Object.assign(entry.fields, {
    shortMonth: moment(entry.fields.datePosted).format("MMM").toUpperCase(),
  });
  Object.assign(entry.fields, {
    shortDay: moment(entry.fields.datePosted).format("DD"),
  });

  // Converting vimeo embeds
  const options = {
    renderNode: {
      [INLINES.HYPERLINK]: (node) => {
        if (node.data.uri.includes("player.vimeo.com/video")) {
          return `<div class="col-lg-7 col-xs-12 p-0"><IframeContainer class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" title="Unique Title 001" src=${node.data.uri} frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></IframeContainer></div>`;
        } else
          return `<a href="${node.data.uri}" target="blank">${node.content[0].value}</a>`;
      },
      "embedded-asset-block": (node) =>
        node.data.target.fields.file.url.endsWith("pdf")
          ? `<embed src="${node.data.target.fields.file.url}" width="100%" height="500px"  />`
          : `<img class="img-fluid" src="${node.data.target.fields.file.url}"/>`,
    },
  };

  const rawRichTextField = entry.fields.body;
  // let renderedHtml = documentToHtmlString(rawRichTextField);
  Object.assign(entry.fields, {
    renderedHtml: documentToHtmlString(rawRichTextField, options).replace(
      /RBCC/g,
      "RB Community"
    ),
    id: requestId,
  });
  // renderSingleBlog(entry)
  return entry;
}

function renderSingleBlog(entry, res) {
  // console.log("ENTRY: ", entry)
  let newMetaDescription;
  entry.fields.metaDescription
    ? (newMetaDescription = entry.fields.metaDescription)
    : (newMetaDescription = "");
  let newMetaTitle;
  entry.fields.metaTitle
    ? (newMetaTitle = entry.fields.metaTitle)
    : (newMetaTitle = entry.fields.title);
  let browserTitle;
  entry.fields.metaTitle
    ? (browserTitle = entry.fields.metaTitle)
    : (browserTitle = entry.fields.title);
  var bloghbsObject = {
    article: entry,
    active: { news: true },
    metaTitle: newMetaTitle,
    metaDescription: newMetaDescription,
    headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
              <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`,
    title: browserTitle,
  };
  // console.log("hbsObject:  ", bloghbsObject.article);
  res.render("blog_single", bloghbsObject);
}

const prepEventDataForTemplate = (eventData) => {
  Object.assign(eventData.fields, {
    shortMonth: moment(eventData.fields.date).format("MMM"),
  });
  Object.assign(eventData.fields, {
    shortDay: moment(eventData.fields.date).format("DD"),
    dayOfWeek: moment(eventData.fields.date).format("ddd"),
  });
  // if (eventData.fields.featured) {
  Object.assign(eventData.fields, {
    dateToCountTo: moment(eventData.fields.date).format("MMMM D, YYYY"),
  });
  // CONVERT MARKDOWN TO HTML
  if (eventData.fields.description) {
    eventData.fields.description = marked(eventData.fields.description);
  }
  // }

  // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
  if (eventData.fields.repeatsEveryDays > 0) {
    if (moment(eventData.fields.date).isBefore(moment().format("YYYY-MM-DD"))) {
      let start = moment(eventData.fields.date);
      let end = moment().format("YYYY-MM-DD");

      while (start.isBefore(end)) {
        start.add(eventData.fields.repeatsEveryDays, "day");
      }
      // console.log(start.format("MM DD YYYY"));
      eventData.fields.date = start.format("YYYY-MM-DD");
      eventData.fields.shortMonth = start.format("MMM");
      eventData.fields.shortDay = start.format("DD");
    }
    Object.assign(eventData.fields, {
      dateToCountTo: moment(eventData.fields.date).format("MMMM D, YYYY"),
    });
  }
};

const prepBlogDataForTemplate = (blogData) => {
  Object.assign(blogData.fields, {
    formattedDate: moment(blogData.fields.datePosted)
      .format("DD MMM, YYYY")
      .toUpperCase(),
  });

  if (blogData.fields.body) {
    if (blogData.fields.body.content[0].content[0]) {
      var truncatedString = JSON.stringify(
        blogData.fields.body.content[0].content[0].value
          .replace(/^(.{165}[^\s]*).*/, "$1")
          .replace(/(\r\n|\n|\r)/gm, "")
      );
      var truncatedLength = truncatedString.length;
      truncatedString = truncatedString
        .substring(1, truncatedLength - 1)
        .replace(/RBCC/g, "RB Community");
    }
  }

  Object.assign(blogData.fields, {
    excerpt: truncatedString,
    today: moment().format("YYYY-MM-DD"),
  });
};

// Routes
module.exports = function (app) {
  app.get("/blog", function (req, res) {
    client
      .getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        // remove about rB Community from the news feed
        "sys.id[nin]": "3JEwFofQhW3MQcReiGLCYu",
      })
      .then(function (dbBlog) {
        var items = [];
        var itemsIncludingExpired = dbBlog.items;

        // ELIMINATING OLD ENTRIES FROM PAGE
        itemsIncludingExpired.forEach((earlyItem) => {
          if (
            moment(earlyItem.fields.expirationDate).isBefore(
              moment().format("YYYY-MM-DD")
            )
          ) {
          } else {
            items.push(earlyItem);
          }
        });

        // Converting times for template
        items.forEach((item) => {
          //   Object.assign(item.fields, {
          //     formattedDate: moment(item.fields.datePosted)
          //       .format("DD MMM, YYYY")
          //       .toUpperCase(),
          //   });

          //   if (item.fields.body) {
          //     if (item.fields.body.content[0].content[0]) {
          //       var truncatedString = JSON.stringify(
          //         item.fields.body.content[0].content[0].value.replace(
          //           /^(.{165}[^\s]*).*/,
          //           "$1"
          //         )
          //       );
          //       var truncatedLength = truncatedString.length;
          //       truncatedString = truncatedString
          //         .substring(1, truncatedLength - 1)
          //         .replace(/RBCC/g, "RB Community");
          //     }
          //   }

          //   Object.assign(item.fields, {
          //     excerpt: truncatedString,
          //     today: moment().format("YYYY-MM-DD"),
          //   });
          prepBlogDataForTemplate(item);
        });

        // console.log(dbBlog);
        // let str = dbBlog[0].dataValues.maincontent

        // let newTrimmedString = str.split('.')[0] + ".";
        // dbBlog['shortenedMain'] = newTrimmedString;

        // console.log("Look Here: ", dbBlog.items[3])

        var hbsObject = {
          blogpost: items,
          active: { news: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/blog.css">
                <link rel="stylesheet" type="text/css" href="styles/blog_responsive.css">`,
          title: `Latest News`,
          // shortenedMain: newTrimmedString
        };
        res.render("blog", hbsObject);
      });
  });

  app.get("/blog:id", function (req, res) {
    // console.log("ORG URL: ", req.originalUrl)
    // console.log("ID: ", req.params.id)
    // console.log("LOOK HERE: ", req.params.id.match(/_single:/g).length)
    req.params.id.match(/_single:/g)
      ? (console.log("_blog_single: detected!!"),
        (req.params.id = req.params.id.substring(8)),
        client.getEntry(req.params.id).then(function (entry) {
          // console.log("ENTRY #: ", entry),
          // blogEntry = entry;
          prepareBlogEntryForSinglePage(entry, req.params.id);
          renderSingleBlog(entry, res);
        })) // req.params.id.substring,
      : ((req.params.id = req.originalUrl.substring(6)),
        (str = req.originalUrl.substring(6)),
        (str = str.replace(/-/g, " ")),
        (str = str.replace(/\s\s\s/g, " - ")),
        // console.log("Before: ", str.indexOf('?')),
        str.indexOf("?") > 0 ? (str = str.substring(0, str.indexOf("?"))) : "",
        // questionIndex = str.indexOf('?')+1,
        // console.log("After: ", str.substring(0, questionIndex)),
        // str = str.substring(0, questionIndex),
        // console.log("AFTER: ", str),

        // newRes = str.replace(/%20/g, " "),
        (newRes = decodeURI(str)),
        // console.log("LOOK HERE: ", newRes),

        client
          .getEntries({
            content_type: "blog",
            "fields.title[match]": newRes,
          })
          .then(function (entry) {
            // console.log("ENTRY no#: ", entry.items[0])
            // blogEntry = entry.items[0]
            prepareBlogEntryForSinglePage(entry.items[0], req.params.id);
            renderSingleBlog(entry.items[0], res);
          }));
  });

  app.get(["/", "/index.html", "/home"], function (req, res) {
    var vimeoRecord = null;
    let secondRecord = null;
    let thirdRecord = null;
    let vimeoAnnRecord = null;
    let vimeoAnnURL = null;
    let welcomeRecord = null;
    let youTubeRecord = null;

    request(vimeoOptionsHome, function (error, response, body) {
      if (error) throw new Error(error);

      vimeoRecord = JSON.parse(body);
      // console.log(`Vimeo Record ${vimeoRecord.data}`);

      if (vimeoRecord.data) {
        vimeoRecord.data.forEach((item) => {
          Object.assign(item, {
            shortTitle: item.name.split(": ", 2)[1],
          });
        });
      }

      request(vimeoOptionsAnnHome, function (error, response, body) {
        if (error) throw new Error(error);

        vimeoAnnRecord = JSON.parse(body);

        // a = vimeoAnnRecord.data[0].link;
        var items = vimeoAnnRecord.data;
        if (items.length > 0) {
          // console.log("ITEMS: ", items)
          let trimmedURL = getIdFromVimeoURL(items[0].link);

          let editedEmbed = items[0].embed.html;
          // console.log("TRIMMED URL: ", trimmedURL)
          editedEmbed = editedEmbed.replace(
            `" `,
            `" data-aos="fade-right" class="about_image" `
          );
          // a = a.replace(`https://`,`//`)
          // console.log("HERE: ", a)
          // console.log(vimeoAnnRecord)

          // vimeoAnnURL = getIdFromVimeoURL(a);
          // vimeoAnnURL = trimmedURL;
          // vimeoAnnURL = items[0].embed.html;
          vimeoAnnURL = editedEmbed;
          // console.log("LINK: ", getIdFromVimeoURL(vimeoAnnURL))
        }

        client
          .getEntries({
            content_type: "events",
            // "fields.featuredOnHome": true,
            "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
            "fields.homePagePassword": "Psalm 46:1",
            order: "fields.date",
            // limit: 3
          })
          .then(function (dbEvent) {
            // console.log("EVENT: ", dbEvent)
            // console.log("LOOK HERE: ", dbEvent.items[0].fields);
            var items = dbEvent.items;

            // Converting times for template
            items.forEach((item) => {
              Object.assign(item.fields, {
                shortMonth: moment(item.fields.date).format("MMM"),
              });
              Object.assign(item.fields, {
                shortDay: moment(item.fields.date).format("DD"),
              });
              // if (item.fields.featured) {
              Object.assign(item.fields, {
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY"),
              });
              // }
              // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
              if (item.fields.repeatsEveryDays > 0) {
                if (moment(item.fields.date).isSameOrBefore(moment())) {
                  let start = moment(item.fields.date);
                  let end = moment().format("YYYY-MM-DD");

                  while (start.isBefore(end)) {
                    start.add(item.fields.repeatsEveryDays, "day");
                  }
                  item.fields.date = start.format("YYYY-MM-DD");
                  item.fields.shortMonth = start.format("MMM");
                  item.fields.shortDay = start.format("DD");
                }
                Object.assign(item.fields, {
                  dateToCountTo: moment(item.fields.date).format(
                    "MMMM D, YYYY"
                  ),
                });
              }
            });

            secondRecord = dbEvent;

            client
              .getEntries({
                content_type: "blog",
                "fields.featureOnHomePage": true,
                "fields.homePagePassword": "Psalm 46:1",
                order: "-fields.datePosted",
                limit: 3,
              })
              .then(function (dbBlog) {
                var items = [];
                var itemsIncludingExpired = dbBlog.items;

                // ELIMINATING OLD ENTRIES FROM PAGE
                itemsIncludingExpired.forEach((earlyItem) => {
                  if (
                    moment(earlyItem.fields.expirationDate).isBefore(
                      moment().format("YYYY-MM-DD")
                    )
                  ) {
                  } else {
                    items.push(earlyItem);
                  }
                });

                // Converting times for template
                items.forEach((item) => {
                  Object.assign(item.fields, {
                    formattedDate: moment(item.fields.datePosted)
                      .format("DD MMM, YYYY")
                      .toUpperCase(),
                  });

                  if (item.fields.body) {
                    var truncatedString = JSON.stringify(
                      item.fields.body.content[0].content[0].value.replace(
                        /^(.{165}[^\s]*).*/,
                        "$1"
                      )
                    );
                    var truncatedLength = truncatedString.length;
                    truncatedString = truncatedString.substring(
                      1,
                      truncatedLength - 1
                    );

                    Object.assign(item.fields, {
                      excerpt: truncatedString,
                    });
                  }
                });

                thirdRecord = items;

                client.getEntry("5yMSI9dIzpsdb55JvXkZk").then(function (entry) {
                  // console.log("LOOK HERE: ", entry);
                  const rawRichTextField = entry.fields.body;

                  Object.assign(entry.fields, {
                    renderedHtml: documentToHtmlString(rawRichTextField),
                  });
                  welcomeRecord = entry;
                  // console.log("LOOK HERE: ", welcomeRecord)

                  request(
                    streamYouTubeOptions(),
                    function (error, response, body) {
                      youTubeRecord = JSON.parse(body).items;
                      // })

                      let mostRecentStream = null;

                      // GO THROUGH 10 MOST RECENT LIVESTREAMS

                      youTubeRecord.forEach((stream) => {
                        // PARSING THE DATE OF THIS LIVESTREAM
                        const startToGetDateInfoFromDescription =
                          stream.snippet.description.split(/, /g)[0].split(" ");
                        if (stream.snippet.description) {
                          const yearStarter = stream.snippet.description
                            .split(/(\d{4}. )/g)[1]
                            .split(". ")[0];

                          stream.parsedDate = moment(
                            `${
                              startToGetDateInfoFromDescription[
                                startToGetDateInfoFromDescription.length - 2
                              ]
                            } ${
                              startToGetDateInfoFromDescription[
                                startToGetDateInfoFromDescription.length - 1
                              ]
                            }, ${yearStarter}`,
                            "MMMM DD, YYYY"
                          );

                          // console.log("PARSED DATE: ", parsedDate);

                          // // IS THE STREAM CONNECTED TO TODAY?
                          // if (moment(parsedDate).isSame(moment(), 'day')) {
                          //   mostRecentStream = stream
                          // } else {
                          //   console.log("NOT SAME DAY")
                          // }
                        }
                      });

                      // SORT YOUTUBE RESULTS TO NEWEST IS FIRST
                      youTubeRecord.sort((left, right) =>
                        moment
                          .utc(right.parsedDate)
                          .diff(moment.utc(left.parsedDate))
                      );

                      youTubeRecord.forEach((stream) => {
                        // DOES THE STREAM HAPPEN TODAY??
                        if (moment(stream.parsedDate).isSame(moment(), "day")) {
                          mostRecentStream = stream;
                          return;

                          // IF THE STREAM HAPPENS BEFORE TODAY
                        }
                        if (
                          moment(stream.parsedDate).isBefore(moment(), "day")
                        ) {
                          if (mostRecentStream) {
                            return;
                          } else {
                            mostRecentStream = stream;
                          }
                        }
                      });

                      // console.log("STREAM ", mostRecentStream)

                      // .then(function(body) {

                      var hbsObject = {
                        events: secondRecord.items,
                        vimeo: vimeoRecord,
                        vimeoAnn: vimeoAnnURL,
                        blogpost: thirdRecord,
                        youtubeStream: mostRecentStream,
                        homeWelcome: welcomeRecord.fields.renderedHtml,
                        metaTitle:
                          "Rancho Bernardo Community Presbyterian Church | RBCPC San Diego",
                        headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
              <link rel="stylesheet" type="text/css" href="styles/responsive.css">`,
                        title: `Rancho Bernardo Community Presbyterian Church | RBCPC San Diego`,
                      };

                      res.render("home", hbsObject);
                      // });
                    }
                  );
                });
              });
          });
      });
    });
  });

  app.get("/cms", function (req, res) {
    res.sendFile(path.join(__dirname, "../public/cms.html"));
  });

  app.get("/cms-post", function (req, res) {
    res.sendFile(path.join(__dirname, "../public/cms-post.html"));
  });

  // app.get("/events", function (req, res) {
  //     res.sendFile(path.join(__dirname, "../public/events.html"));
  // })

  app.get("/events", function (req, res) {
    client
      .getEntries({
        content_type: "events",
        "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
        order: "fields.date",
      })
      .then(function (dbEvent) {
        var items = dbEvent.items;
        var topItem = [];

        // Converting times for template
        items.forEach((item) => {
          if (item.fields.featured) {
            topItem.push(item);
          }

          prepEventDataForTemplate(item);
        });

        // SORT EVENTS BY NEWLY CALCULATED DATE
        items.sort(compare);

        // console.log("LOOK HERE: ", topItem)

        var hbsObject = {
          events: dbEvent.items,
          topEvent: topItem,
          active: { events: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
          title: `Events`,
        };

        return res.render("events", hbsObject);
      });
  });

  app.get("/about", async function (req, res) {
    function getStaffMembers() {
      try {
        const response = axios.get(
          `https://admin.rbcommunity.org/staff-members?_sort=LastName:ASC`
        );
        return response;
      } catch (error) {
        console.log(error);
      }
    }

    const staffMembers = await getStaffMembers();

    client.getEntry("1esz4QXvYbB04qb45A3pHj").then((entry) => {
      // const rawRichTextField = entry.fields.body;

      const aboutBody = documentToHtmlString(entry.fields.body);

      //             Object.assign(entry.fields, {
      //               renderedHtml: documentToHtmlString(rawRichTextField),

      res.render("about", {
        aboutBody: aboutBody,
        active: { about: true },
        headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
                      <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
        metaTitle: "Join Our Family | RB Community Presbyterian Church",
        title: `Join Our Family | RB Community Presbyterian Church`,
        staffMembers: staffMembers.data,
      });
    });
  });

  app.get(["/sermons", "/sermons:id"], function (req, res) {
    if (req.params.id) {
      vimeoOptions.qs.page = parseInt(req.params.id.substr(1));
    } else {
      vimeoOptions.qs.page = 1;
    }

    request(vimeoOptions, function (error, response, body) {
      if (error) throw new Error(error);
      //

      // console.log("BODY HERE: ", body);

      var vimeo = JSON.parse(body);

      // console.log("VIMEO: ", vimeo);

      var items = vimeo.data;

      // console.log(getIdFromVimeoURL(vimeo.data[0].link))

      if (items) {
        if (items[0].link) {
          Object.assign(items[0], {
            id: getIdFromVimeoURL(items[0].link),
          });
        }

        items.forEach((item) => {
          // console.log(moment(item.name.split(" ", 1), 'MM-DD-YY').format("MMM"))
          // console.log(moment(item.name.split(" ", 1), 'MM-DD-YY').format('MMM'))
          Object.assign(item, {
            shortMonth: moment(item.name.split(" ", 1), "MM-DD-YY").format(
              "MMM"
            ),
          });
          Object.assign(item, {
            shortDay: moment(item.name.split(" ", 1), "MM-DD-YY").format("DD"),
          });
          Object.assign(item, {
            shortTitle: item.name.split(": ", 2)[1],
          });
          Object.assign(item, {
            featureDate: moment(item.name.split(" ", 1), "MM-DD-YY").format(
              "DD MMM YYYY"
            ),
          });
        });

        // console.log("ITEMS: ", items);
        // var videoDate = vimeo.data[0].name.split(" ", 1)

        // console.log("LOOK HERE: ", vimeo.data[0].name.split(" ", 1))
        // console.log("LOOK HERE: ", vimeo.data[0].name.split(": ", 2))

        var latestSermon = JSON.parse(body).data[0];
        // console.log(latestSermon);
      }

      var hbsObject = {
        vimeo: items,
        active: { sermons: true },
        headContent: `<link rel="stylesheet" type="text/css" href="styles/sermons.css">
                <link rel="stylesheet" type="text/css" href="styles/sermons_responsive.css">`,
        title:
          `Sermons | RB Community Presbyterian Church | Page ` +
          vimeoOptions.qs.page,
        metaTitle: "Sermons | RB Community Presbyterian Church",
        nextSermonPage: vimeoOptions.qs.page + 1,
      };

      vimeoOptions.qs.page > 1
        ? (hbsObject.thisSermonPage = vimeoOptions.qs.page)
        : "";

      return res.render("sermons", hbsObject);
    });
  });

  app.get("/contact", function (req, res) {
    res.render("contact", {
      active: { contact: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/contact.css">
        <link rel="stylesheet" type="text/css" href="styles/contact_responsive.css">`,
      title: `Contact`,
    });
  });

  app.get("/giving", function (req, res) {
    res.render("giving", {
      active: { giving: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `Giving`,
    });
  });

  app.get("/ministries", function (req, res) {
    res.render("ministries", {
      active: { ministries: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/ministries.css">
        <link rel="stylesheet" type="text/css" href="styles/ministries_responsive.css">`,
      title: `Ministries | RB Community Presbyterian Church San Diego`,
      metaTitle: `Ministries | RB Community Presbyterian Church San Diego`,
    });
  });

  app.get("/ministry:id", function (req, res) {
    req.params.id = req.params.id.substring(1);
    var firstRecord = null;
    var secondRecord = null;
    var thirdRecord = null;
    let youTubeRecord = null;

    client
      .getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        "fields.ministry": req.params.id,
        limit: 10,
      })
      .then(function (entry) {
        var items = [];
        console.log("TOTAL: ", entry.total);
        if (entry.total >= 1) {
          Object.assign(items, {
            multipleEntries: true,
          });
        }

        if (entry.fields) {
          Object.assign(entry.items[0].fields, {
            request: req.params.id,
          });
        }

        var itemsIncludingExpired = entry.items;
        // ELIMINATING OLD ENTRIES FROM PAGE
        itemsIncludingExpired.forEach((earlyItem) => {
          if (
            moment(earlyItem.fields.expirationDate).isBefore(
              moment().format("YYYY-MM-DD")
            )
          ) {
            null;
          } else {
            items.push(earlyItem);
          }
        });

        // Converting times for template
        items.forEach((item) => {
          // Converting Date info
          Object.assign(item.fields, {
            formattedDate: moment(item.fields.datePosted)
              .format("DD MMM, YYYY")
              .toUpperCase(),
          });

          if (item.fields.body) {
            if (item.fields.body.content[0].content[0]) {
              // Creating article excerpt
              var truncatedString = JSON.stringify(
                item.fields.body.content[0].content[0].value.replace(
                  /^(.{165}[^\s]*).*/,
                  "$1"
                )
              );
              var truncatedLength = truncatedString.length;
              truncatedString = truncatedString
                .substring(1, truncatedLength - 1)
                .replace(/RBCC/g, "RB Community");

              Object.assign(item.fields, {
                excerpt: truncatedString,
              });
            }
          }

          // Render HTML if featured on requested ministry
          if (item.fields.featureOnMinistryPage) {
            // console.log(item.fields)
            const rawRichTextField = item.fields.body;
            // let renderedHtml = documentToHtmlString(rawRichTextField);
            Object.assign(item.fields, {
              renderedHtml: documentToHtmlString(rawRichTextField),
            });
          }
        });

        // console.log("ITEMS: ", items)

        // items[multipleEntries] = entry.multipleEntries

        console.log("ITEMS: ", items);

        firstRecord = items;

        client
          .getEntries({
            content_type: "events",
            "fields.endDate[gte]": moment().format(),
            "fields.ministry": req.params.id,
            order: "fields.date",
            limit: 6,
          })
          .then(function (dbEvent) {
            var items = dbEvent.items;

            // Converting times for template
            items.forEach((item) => {
              Object.assign(item.fields, {
                shortMonth: moment(item.fields.date).format("MMM"),
              });
              Object.assign(item.fields, {
                shortDay: moment(item.fields.date).format("DD"),
              });
              // if (item.fields.featured) {
              Object.assign(item.fields, {
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY"),
              });
              // CONVERT MARKDOWN TO HTML
              if (item.fields.description) {
                item.fields.description = marked(item.fields.description);
              }
              // }

              // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
              if (item.fields.repeatsEveryDays > 0) {
                if (moment(item.fields.date).isBefore(moment())) {
                  let start = moment(item.fields.date);
                  let end = moment().format("YYYY-MM-DD");

                  while (start.isBefore(end)) {
                    start.add(item.fields.repeatsEveryDays, "day");
                  }
                  // console.log(start.format("MM DD YYYY"));
                  item.fields.date = start.format("YYYY-MM-DD");
                  item.fields.shortMonth = start.format("MMM");
                  item.fields.shortDay = start.format("DD");
                }
                Object.assign(item.fields, {
                  dateToCountTo: moment(item.fields.date).format(
                    "MMMM D, YYYY"
                  ),
                });
              }
            });

            // SORT EVENTS BY NEWLY CALCULATED DATE
            items.sort(compare);

            secondRecord = items;

            client
              .getEntries({
                content_type: "blog",
                "fields.ministry": req.params.id,
                "fields.featureOnMinistryPage": true,
                limit: 1,
              })
              .then(function (entry) {
                var item = entry.items[0];
                if (item) {
                  const rawRichTextField = item.fields.body;
                  // let renderedHtml = documentToHtmlString(rawRichTextField);
                  Object.assign(item.fields, {
                    renderedHtml: documentToHtmlString(rawRichTextField),
                  });
                }

                thirdRecord = item;

                if (
                  req.params.id === "Children" ||
                  req.params.id == "Family Ministries"
                ) {
                  request(
                    newYouTubeOptions("PLZ13IHPbJRZ4TFjw77zRxtiou_HvEhVcQ"),
                    function (error, response, body) {
                      if (error) throw new Error(error);

                      youTubeRecord = JSON.parse(body);

                      prepMinistryPage();
                    }
                  );
                } else if (req.params.id === "Adult Education") {
                  request(
                    newYouTubeOptions("PLZ13IHPbJRZ6Iz2cphwea8AzUqUqFiPUw"),
                    function (error, response, body) {
                      if (error) throw new Error(error);

                      youTubeRecord = JSON.parse(body);

                      prepMinistryPage();
                    }
                  );
                } else if (
                  req.params.id === "Chancel Choir, Ensembles & Orchestra"
                ) {
                  request(
                    newYouTubeOptions("PLZ13IHPbJRZ6B3OcxF4pXk6uKwrEKTz-t"),
                    function (error, response, body) {
                      if (error) throw new Error(error);

                      youTubeRecord = JSON.parse(body);

                      prepMinistryPage();
                    }
                  );
                } else {
                  prepMinistryPage();
                }

                // console.log("SECOND RECORD: ", secondRecord);

                // console.log("LOOK HERE", entry)

                function prepMinistryPage() {
                  var bloghbsObject = {
                    blogpost: firstRecord,
                    request: req.params.id,
                    events: secondRecord,
                    header: thirdRecord,
                    active: { ministries: true },
                    headContent: `<link rel="stylesheet" type="text/css" href="styles/ministry.css">
              <link rel="stylesheet" type="text/css" href="styles/ministry_responsive.css">`,
                    title: req.params.id,
                    youTubeVideos: youTubeRecord,
                  };
                  // console.log("hbsObject:  ", bloghbsObject.blogpost);
                  res.render("ministry", bloghbsObject);
                }
              });
          });
      });
  });

  // Page for individual events
  app.get("/event:id", function (req, res) {
    renderSingleEvent = (oldDbEvent) => {
      let dbEvent = oldDbEvent.items[0];

      // Converting times for template
      Object.assign(dbEvent.fields, {
        shortMonth: moment(dbEvent.fields.date).format("MMM"),
        dayOfWeek: moment(dbEvent.fields.date).format("ddd"),
      });
      Object.assign(dbEvent.fields, {
        shortDay: moment(dbEvent.fields.date).format("DD"),
      });

      // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
      if (dbEvent.fields.repeatsEveryDays > 0) {
        if (
          moment(dbEvent.fields.date).isBefore(moment().format("YYYY-MM-DD"))
        ) {
          let start = moment(dbEvent.fields.date);
          let end = moment().format("YYYY-MM-DD");

          // console.log("START: ", start);
          // console.log("END: ", end);

          while (start.isBefore(end)) {
            start.add(dbEvent.fields.repeatsEveryDays, "day");
            // dbEvent.add(dbEvent.fields.repeatsEveryDays, "day");
          }
          // console.log(start.format("MM DD YYYY"));
          dbEvent.fields.date = start.format("YYYY-MM-DD");
          dbEvent.fields.shortMonth = start.format("MMM");
          dbEvent.fields.shortDay = start.format("DD");
        }
      }
      if (
        moment(dbEvent.fields.date, "YYYY-MM-DD").isAfter(
          moment().format("YYYY-MM-DD")
        )
      ) {
        Object.assign(dbEvent.fields, {
          dateToCountTo: moment(dbEvent.fields.date).format("MMMM D, YYYY"),
        });
      }

      // CONVERT MARKDOWN TO HTML
      if (dbEvent.fields.description) {
        dbEvent.fields.description = marked(dbEvent.fields.description).replace(
          /RBCC/g,
          "RB Community"
        );
      }

      // RENDER HTML FOR DESCRIPTION
      //  const rawRichTextField = dbEvent.fields.description;
      // let renderedHtml = documentToHtmlString(rawRichTextField);
      //  Object.assign(dbEvent.fields, {
      //    renderedHtml: documentToHtmlString(rawRichTextField)
      //   });
      // console.log(dbEvent.fields.renderedHtml)

      // SETUP SHELBY GIVING FORM EMBED
      if (dbEvent.fields.embedItem) {
        if (
          dbEvent.fields.embedItem.substring(0, 31) ===
          '<script src="/embed.aspx?formId'
        ) {
          dbEvent.fields.embedItem =
            dbEvent.fields.embedItem.slice(0, 13) +
            "https://forms.ministryforms.net" +
            dbEvent.fields.embedItem.slice(13);
        }
      }

      var hbsObject = {
        events: dbEvent,
        active: { events: true },
        headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
        title: dbEvent.fields.title,
      };

      // console.log(dbEvent);
      return res.render("event", hbsObject);
    };

    if (req.params.id[0] === ":") {
      client
        .getEntries({
          content_type: "events",
          "sys.id[match]": req.params.id.substring(1),
        })
        .then((oldDbEvent) => renderSingleEvent(oldDbEvent));
    } else {
      str = decodeURI(
        req.originalUrl
          .substring(7)
          .replace(/-/g, " ")
          .replace(/\s\s\s/g, "-")
      );
      str = str.replace(/\s\s\s/g, " - ");
      // req.params.id = req.params.id.substring(1);
      // client.getEntry(req.params.id).then(function (dbEvent) {
      str.indexOf("?") > 0 ? (str = str.substring(0, str.indexOf("?"))) : "";
      client
        .getEntries({
          content_type: "events",
          "fields.title": str,
        })
        .then((oldDbEvent) => renderSingleEvent(oldDbEvent));
    }
  });

  app.get("/services", function (req, res) {
    var bloghbsObject = {
      // article: entry.fields,
      // request: req.params.id,
      active: { about: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
        <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`,
      title: `Services`,
    };
    // console.log("hbsObject:  ", bloghbsObject.blogpost);
    res.render("services", bloghbsObject);
  });

  // REDIRECT TO CONNECTION CARD
  app.get("/card", function (req, res) {
    res.redirect("https://rbcc.churchcenter.com/people/forms/43489");
  });

  app.get("/care", function (req, res) {
    res.redirect("/ministry:Pastoral%20Care");
  });

  app.get("/highschool", function (req, res) {
    res.redirect("/ministry:High%20School");
  });

  app.get("/msm", function (req, res) {
    res.redirect("/ministry:Middle%20School");
  });

  app.get("/kids", function (req, res) {
    res.redirect("/ministry:Children");
  });

  app.get("/missions", function (req, res) {
    res.redirect("/ministry:Missions");
  });

  app.get("/shop", function (req, res) {
    res.redirect("https://www.companycasuals.com/RBCommunity");
  });

  app.get("/give", function (req, res) {
    res.redirect("/giving");
  });

  app.get("/sitemap.xml", function (req, res) {
    res.sendFile("/sitemap.xml");
  });

  app.get("/arabic", function (req, res) {
    res.redirect("/ministry:Arabic%20Ministries");
  });

  app.get("/families", function (req, res) {
    res.redirect("/ministry:Family%20Ministries");
  });

  app.get("/survey", function (req, res) {
    res.redirect("http://usd.qualtrics.com/jfe/form/SV_eKIuokrIZXl42od");
  });

  app.get("/temp", function (req, res) {
    res.redirect(
      "https://www.shelbygiving.com/App/Form/c05b9e9b-e27d-4617-bd81-c55409037d94"
    );
  });

  app.get("/online", (req, res) => {
    res.redirect("/blog-New-Online-Worship-Times");
    // client
    //   .getEntries({
    //     content_type: "randomPagePieces",
    //     "fields.title": "Online Worship",
    //   })
    //   .then((pieces) => {
    //     // console.log("PIECES: ", pieces.items[0].fields.embedCode)
    //     if (!pieces.items[0].fields.embedCode) {
    //       let youTubeData;
    //       request(
    //         {
    //           method: "GET",
    //           url:
    //             "https://www.googleapis.com/youtube/v3/search?channelId=UCD0FfZKe5vv9PS5wpkJAFgw&part=snippet&order=date&q=Online%20Worship%7Ccontemporary&key=" +
    //             process.env.GOOGLE_KEY,
    //           headers: {},
    //         },
    //         (error, response) => {
    //           if (error) throw new Error(error);
    //           // console.log("LOOK HERE: ", response.body);
    //           youTubeData = JSON.parse(response.body);
    //           pieces.items[0].fields.bodyHTML = documentToHtmlString(
    //             pieces.items[0].fields.body
    //           );
    //           let hbsObject = {
    //             active: { events: true },
    //             headContent: `<link rel="stylesheet" type="text/css" href="styles/online-worship.css">
    //                   <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">
    //                   <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
    //             title: `Online Worship`,
    //             pieces: pieces.items[0].fields,
    //             youTubeUrl: youTubeData.items[0].id.videoId,
    //           };
    //           res.render("online", hbsObject);
    //         }
    //       );
    //     } else {
    //       // let youTubeData;
    //       // request(
    //       // {
    //       //   method: "GET",
    //       //   url:
    //       //     "https://www.googleapis.com/youtube/v3/search?channelId=UCD0FfZKe5vv9PS5wpkJAFgw&part=snippet&order=date&q=Online%20Worship%7Ccontemporary&key=" + process.env.GOOGLE_KEY,
    //       //   headers: {},
    //       // },
    //       // (error, response) => {
    //       // if (error) throw new Error(error);
    //       // console.log("LOOK HERE: ", response.body);
    //       // youTubeData = JSON.parse(response.body);
    //       pieces.items[0].fields.bodyHTML = documentToHtmlString(
    //         pieces.items[0].fields.body
    //       );
    //       let hbsObject = {
    //         active: { events: true },
    //         headContent: `<link rel="stylesheet" type="text/css" href="styles/online-worship.css">
    //                   <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">
    //                   <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
    //         title: `Online Worship`,
    //         pieces: pieces.items[0].fields,
    //         // youTubeUrl: youTubeData.items[0].id.videoId
    //       };
    //       res.render("online", hbsObject);
    //     }
    //   });
  });
  // console.log("PIECES: ", pieces.items[0])
  //     });
  // });

  app.get("/jobs", function (req, res) {
    request(
      "http://admin.rbcommunity.org/jobs",
      function (error, response, body) {
        let parsedJobs = JSON.parse(body);

        res.render("jobs", {
          active: { about: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
          <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
          title: `Job Openings | RB Community Presbyterian Church San Diego`,
          metaTitle: `Job Openings | RB Community Presbyterian Church San Diego`,
          jobs: parsedJobs,
        });
      }
    );
  });

  app.get("/jobs-:id", (req, res) => {
    request(
      "http://admin.rbcommunity.org/jobs/" + req.params.id,
      function (error, response, body) {
        if (body !== "Not Found") {
          let parsedJob = JSON.parse(body);

          res.render("job", {
            active: { about: true },
            headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
            title: `Job Openings | RB Community Presbyterian Church San Diego`,
            metaTitle: `Job Openings | RB Community Presbyterian Church San Diego`,
            job: parsedJob,
            description: converter.makeHtml(parsedJob.Description),
          });
        } else {
          var bloghbsObject = {
            // article: entry.fields,
            // request: req.params.id,
            // active: { about: true },
            headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
            <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
            title: `404`,
          };
          res.render("404", bloghbsObject);
        }
      }
    );
  });

  app.get("/memorial", (req, res) => {
    let hbsObject = {
      active: { events: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/online-worship.css">
                      <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
      title: "Mark Moffet Memorial",
    };
    res.render("memorial", hbsObject);
  });

  app.get("/service", (req, res) => {
    res.redirect("/blog-Courtyard-Worship-Service-Bulletin");
  });

  app.get(["/commitment", "/commit", "/pledge"], (req, res) => {
    res.render("commitment", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `Giving`,
    });
  });

  app.get(["/easter", "/lent"], (req, res) => {
    res.render("easter", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
      <link rel="stylesheet" type="text/css" href="styles/easter.css"><link rel="preconnect" href="https://fonts.gstatic.com"> 
      <link href="https://fonts.googleapis.com/css2?family=Cardo&display=swap" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `Easter`,
    });
  });

  app.get("/christmas", (req, res) => {
    res.render("christmas", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
      <link rel="stylesheet" type="text/css" href="styles/christmas.css"><link rel="preconnect" href="https://fonts.gstatic.com"> 
      <link href="https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap" rel="stylesheet">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
    });
  });

  app.get("/concert", (req, res) => {
    res.redirect("/ministry:Concert%20Series");
  });

  app.get("/theater", (req, res) => {
    res.redirect("/ministry:Youth,%20Music%20and%20Theater");
  });

  app.get("/nativity", (req, res) => {
    res.redirect("/blog-nativity");
  });

  app.get(["/good-friday", "/goodfriday"], (req, res) => {
    client
      .getEntries({
        content_type: "onlineService",
        "fields.title": "Good Friday",
      })
      .then((pieces) => {
        // console.log("PIECES: ", pieces.items[0].fields.embedCode)

        // let youTubeData;
        // request(
        // {
        //   method: "GET",
        //   url:
        //     "https://www.googleapis.com/youtube/v3/search?channelId=UCD0FfZKe5vv9PS5wpkJAFgw&part=snippet&order=date&q=Online%20Worship%7Ccontemporary&key=" + process.env.GOOGLE_KEY,
        //   headers: {},
        // },
        // (error, response) => {
        // if (error) throw new Error(error);
        // console.log("LOOK HERE: ", response.body);
        // youTubeData = JSON.parse(response.body);
        pieces.items[0].fields.bodyHTML = documentToHtmlString(
          pieces.items[0].fields.body
        );
        let hbsObject = {
          active: { events: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/online-worship.css">
                      <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
          title: `Online Good Friday`,
          pieces: pieces.items[0].fields,
          // youTubeUrl: youTubeData.items[0].id.videoId
        };
        res.render("good-friday", hbsObject);
      });
  });

  app.get(["/kids-worship", "/kidsworship"], (req, res) => {
    client
      .getEntries({
        content_type: "onlineService",
        "fields.title": "Kids Worship",
      })
      .then((pieces) => {
        // console.log("PIECES: ", pieces.items[0].fields.embedCode)

        // let youTubeData;
        // request(
        // {
        //   method: "GET",
        //   url:
        //     "https://www.googleapis.com/youtube/v3/search?channelId=UCD0FfZKe5vv9PS5wpkJAFgw&part=snippet&order=date&q=Online%20Worship%7Ccontemporary&key=" + process.env.GOOGLE_KEY,
        //   headers: {},
        // },
        // (error, response) => {
        // if (error) throw new Error(error);
        // console.log("LOOK HERE: ", response.body);
        // youTubeData = JSON.parse(response.body);
        pieces.items[0].fields.bodyHTML = documentToHtmlString(
          pieces.items[0].fields.body
        );
        let hbsObject = {
          active: { events: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/online-worship.css">
                      <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">
                      <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
          title: `Online Kids Worship`,
          pieces: pieces.items[0].fields,
          // youTubeUrl: youTubeData.items[0].id.videoId
        };
        res.render("kids-worship", hbsObject);
      });
  });

  app.get("/search:term", async (req, res) => {
    let searchTerm = req.params.term.substring(1);

    try {
      const results = await Promise.all([
        client.getEntries({ query: searchTerm }),
      ]);

      // ITERATE THROUGH CONTENTFUL RESULTS (RESULTS[0])
      results[0].items.forEach((entry) => {
        // IF IT'S AN EVENT
        if (entry.sys.contentType.sys.id === "events") {
          prepEventDataForTemplate(entry);
        }
        // IF IT'S A BLOG
        if (entry.sys.contentType.sys.id === "blog") {
          prepBlogDataForTemplate(entry);
        }
      });

      // BLOG

      // EVENTS

      // SERMONS

      let hbsObject = {
        headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
                      <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
        title: `Search`,
        term: searchTerm,
        results: results,
      };
      res.render("search", hbsObject);
    } catch (error) {
      console.log("ERROR: ", error);
    }
  });

  app.use(function (req, res) {
    var bloghbsObject = {
      // article: entry.fields,
      // request: req.params.id,
      // active: { about: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `404`,
    };
    res.render("404", bloghbsObject);
  });
};
