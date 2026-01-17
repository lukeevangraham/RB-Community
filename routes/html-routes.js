require("dotenv").config();
let keys = require("../keys.js");
var request = require("request");
var moment = require("moment");
var path = require("path");
var marked = require("marked");
let showdown = require("showdown");
let qs = require("qs");
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
// let streamYouTubeOptions = (playlistId) => {
//   return {
//     method: "GET",
//     url: "https://www.googleapis.com/youtube/v3/playlistItems",
//     qs: {
//       key: process.env.GOOGLE_KEY,
//       playlistId: "PLZ13IHPbJRZ7amo_md0SxN_CZgnu9DnxJ",
//       part: "snippet,contentDetails",
//       maxResults: "10",
//     },
//     // headers: {
//     //   Authorization: "Bearer " + vimeoPass,
//     // },
//   };
// };

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
// var vimeoOptionsHome = {
//   method: "GET",
//   url: "https://api.vimeo.com/users/14320074/videos",
//   qs: {
//     query: "Sermon",
//     fields:
//       "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
//     sizes: "960",
//     per_page: "3",
//     page: "1",
//     sort: "date",
//     direction: "desc",
//   },
//   headers: {
//     Authorization: "Bearer " + vimeoPass,
//   },
// };

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
  const dateA = moment(a.fields.date, "YYYY-MM-DD").format("YYYY-MM-DD");
  const dateB = moment(b.fields.date, "YYYY-MM-DD").format("YYYY-MM-DD");
  const timeA = moment(`${dateA} ${a.fields.time}`);
  const timeB = moment(`${dateB} ${b.fields.time}`);

  let comparison = 0;
  if (dateA > dateB) {
    comparison = 1;
  } else if (dateA < dateB) {
    comparison = -1;
  } else if (dateA === dateB) {
    // console.log("we have a tie!", a.fields.title, timeA)
    if (timeA > timeB) {
      comparison = 1;
    } else if (timeA < timeB) {
      comparison = -1;
    }
  }
  return comparison;
}

// SORT ALL ITEMS BY DATE POSTED
function compareItemDatePosted(a, b) {
  if (a.fields.datePosted > b.fields.datePosted) {
    return -1;
  }
  if (a.fields.datesPosted < b.fields.datesPosted) {
    return 1;
  }
  return 0;
}

function prepareBlogEntryForSinglePage(entry, requestId) {
  // console.log("ENTRY: ", entry.fields.body.content);

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
          ? `<iframe src=https://docs.google.com/viewerng/viewer?url=https:${node.data.target.fields.file.url}&embedded=true frameBorder="0" width="100%" height="500px" />`
          : `<img class="img-fluid" src="${node.data.target.fields.file.url}"/>`,
    },
  };

  if (entry.strapi) {
    Object.assign(entry.fields, {
      renderedHtml: entry.fields.body.replace(/RBCC/g, "RB Community"),
      id: requestId,
    });
    entry.fields.renderedHtml;
  } else {
    const rawRichTextField = entry.fields.body;
    // let renderedHtml = documentToHtmlString(rawRichTextField);
    Object.assign(entry.fields, {
      renderedHtml: documentToHtmlString(rawRichTextField, options).replace(
        /RBCC/g,
        "RB Community"
      ),
      id: requestId,
    });
  }
  // renderSingleBlog(entry)
  return entry;
}

const prepBlogsForGroupPage = (untreatedBlogs) => {
  var items = [];
  // SORT ALL ITEMS BY DATE POSTED

  untreatedBlogs.sort(compareItemDatePosted);

  // ELIMINATING OLD ENTRIES FROM PAGE
  untreatedBlogs.forEach((earlyItem) => {
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
    prepBlogDataForTemplate(item);
  });

  return items;
};

function renderSingleBlog(entry, res) {
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

function mapSqlEventToContentful(event) {
  // Use 'name' from your DB to fill 'title'
  const name = event.name || "Untitled Event";
  let eventDate = moment(event.startDate);

  // Handle Recurring Logic (e.g., Children's Choir every 7 days)
  if (event.repeatsEveryXDays > 0) {
    while (eventDate.isBefore(moment())) {
      eventDate.add(event.repeatsEveryXDays, "days");
    }
  }

  return {
    fields: {
      title: name, // Matches {{events.fields.title}}
      description: event.description || "",
      location: event.location || "",
      time: eventDate.format("h:mm a"),
      shortMonth: eventDate.format("MMM"),
      shortDay: eventDate.format("DD"),
      dayOfWeek: eventDate.format("ddd"),

      // Fixed countdown string
      dateToCountTo: eventDate.format("MMMM D, YYYY HH:mm:ss"),

      // The structure that fixed your images
      eventImage: {
        fields: {
          file: {
            url:
              event.Image && event.Image.url
                ? event.Image.url
                : "images/events.jpg",
          },
        },
      },

      // Handles the MinistryForms embed
      embedItem:
        event.embedCode && event.embedCode !== "undefined"
          ? event.embedCode
          : "",
    },
  };
}

const prepBlogDataForTemplate = (blogData) => {
  Object.assign(blogData.fields, {
    formattedDate: moment(blogData.fields.datePosted)
      .format("DD MMM, YYYY")
      .toUpperCase(),
  });

  let truncatedString = null;

  if (blogData.fields.body) {
    if (blogData.fields.body.content) {
      if (blogData.fields.body?.content?.[0].content?.[0]) {
        // CONTENTFUL ITEMS USE THE ".content" value
        let maxLengthOfTruncatedString = 165;

        // trim the tring to maximum length
        truncatedString = JSON.stringify(
          blogData.fields.body?.content?.[0]?.content?.[0]?.value.substr(
            0,
            maxLengthOfTruncatedString
          )
        );

        // retrim if we are in the middle of a word
        truncatedString
          ? (truncatedString = truncatedString
              .substr(
                0,
                Math.min(
                  truncatedString.length,
                  truncatedString.lastIndexOf(" ")
                )
              )
              .replace(/RBCC/g, "RB Community"))
          : null;
      }
    } else if (blogData.fields.body) {
      truncatedString = blogData.fields.body
        .toString()
        .replace(/<br\s*[\/]?>/gi, "\n")
        .replace(/<\/?[^>]+(>|$)/g, "")
        .replace(/\&nbsp;/g, " ");
      // console.log("TRUN: ", truncatedString)
      var truncatedLength = truncatedString.length;
      truncatedString = truncatedString.substring(0, 165);
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
    Promise.all([
      client.getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        // remove about rB Community from the news feed
        "sys.id[nin]": "3JEwFofQhW3MQcReiGLCYu",
      }),
      axios.get("https://admin.rbcommunity.org/articles?_sort=datePosted"),
    ]).then(function (resultArray) {
      var itemsIncludingExpired = resultArray[0].items;

      // FORMATTING STRAPI DATA TO MATCH CONTENTFUL
      resultArray[1].data.forEach((article) => {
        let formattedArticle = {};
        formattedArticle.fields = article;
        itemsIncludingExpired.push(formattedArticle);
      });

      const items = prepBlogsForGroupPage(itemsIncludingExpired);

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

        Promise.all([
          client.getEntries({
            content_type: "blog",
            "fields.title[match]": newRes,
          }),
          axios.get(`https://admin.rbcommunity.org/articles?_title=${newRes}`),
        ]).then(function (resultArray) {
          // .then(function (entry) {
          // console.log("ENTRY no#: ", entry.items[0])
          // blogEntry = entry.items[0]
          formattedData = { strapi: true };
          formattedData.fields = resultArray[1].data[0];

          resultArray[0].items.length
            ? (prepareBlogEntryForSinglePage(
                resultArray[0].items[0],
                req.params.id
              ),
              renderSingleBlog(resultArray[0].items[0], res))
            : (prepareBlogEntryForSinglePage(formattedData, req.params.id),
              renderSingleBlog(formattedData, res));
        }));
  });

  app.get(["/", "/index.html", "/home"], function (req, res) {
    const useFlexipress = req.query.source === "flexi";

    Promise.all([
      // Vimeo
      axios({
        url: "https://api.vimeo.com/users/14320074/videos",
        method: "GET",
        params: {
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
      }),

      // [1] DUAL-SOURCE EVENT FETCH
      useFlexipress
        ? axios.get(
            `https://fpserver.grahamwebworks.com/api/events/org/1?published=true&featured=true`
          )
        : client.getEntries({
            content_type: "events",
            // "fields.featuredOnHome": true,
            "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
            "fields.homePagePassword": "Psalm 46:1",
            order: "fields.date",
            // limit: 3
          }),

      // [2] Contentful Blog (Next on the migration list)
      client.getEntries({
        content_type: "blog",
        "fields.featureOnHomePage": true,
        "fields.homePagePassword": "Psalm 46:1",
        order: "-fields.datePosted",
        limit: 3,
      }),

      // [3] Home Top Text (Flexipress)
      axios.get("https://fpserver.grahamwebworks.com/api/single/home/1"),

      // [4] YouTube
      axios({
        url: "https://www.googleapis.com/youtube/v3/playlistItems",
        method: "get",
        params: {
          key: process.env.GOOGLE_KEY,
          playlistId: "PLZ13IHPbJRZ7amo_md0SxN_CZgnu9DnxJ",
          part: "snippet,contentDetails",
          maxResults: "10",
        },
      }),
    ]).then((resultArray) => {
      // 1. VIMEO LOGIC (Unchanged)
      let vimeoRecord = resultArray[0].data;

      if (vimeoRecord.data) {
        vimeoRecord.data.forEach((item) => {
          Object.assign(item, {
            shortTitle: item.name.split(": ", 2)[1],
          });
        });
      }

      // 2. EVENT HANDLING (FLEXIPRESS vs CONTENTFUL)

      let formattedEvents = [];

      if (useFlexipress) {
        // HANDLE SQL DATA
        const homeData = resultArray[3].data; // SingleHome record
        const sqlEvents = resultArray[1].data; // List of featured spotlight events

        // A. MAP THE HEADLINE EVENT (The Hero)
        let headlineMapped = mapSqlEventToContentful(
          homeData.HeadlineEvent,
          true
        );

        // B. MAP THE SPOTLIGHT EVENTS (The Grid)
        const spotlightMapped = sqlEvents
          .filter((e) => e.id !== homeData.HeadlineEventId) // Prevent Duplication
          .map((event) => mapSqlEventToContentful(event, false));

        // C. MERGE THEM
        formattedEvents = headlineMapped
          ? [headlineMapped, ...spotlightMapped]
          : spotlightMapped;
      } else {
        // HANDLE LEGACY CONTENTFUL DATA

        let dbEvent = resultArray[1];

        // Converting times for template
        dbEvent.items.forEach((item) => {
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
              dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY"),
            });
          }
          formattedEvents.push(item);
        });
      }

      // HANDLE BLOG
      var blogItems = [];
      var itemsIncludingExpired = resultArray[2].items;

      // MAKE HOMEDATA MATCH CONTENTFUL OUTPUT

      // ELIMINATING OLD ENTRIES FROM PAGE
      itemsIncludingExpired.forEach((earlyItem) => {
        if (
          moment(earlyItem.fields.expirationDate).isBefore(
            moment().format("YYYY-MM-DD")
          )
        ) {
        } else {
          blogItems.push(earlyItem);
        }
      });

      // Converting times for template
      blogItems.forEach((item) => {
        Object.assign(item.fields, {
          formattedDate: moment(item.fields.datePosted)
            .format("DD MMM, YYYY")
            .toUpperCase(),
        });

        if (item.fields.body) {
          if (item.strapi) {
            var truncatedString = JSON.stringify(
              item.fields.body.replace(/<[^>]*>/g, "")
            );
          } else {
            var truncatedString = JSON.stringify(
              item.fields.body.content[0].content[0].value.replace(
                /^(.{165}[^\s]*).*/,
                "$1"
              )
            );
          }
          var truncatedLength = truncatedString.length;
          truncatedString = truncatedString.substring(1, truncatedLength - 1);

          Object.assign(item.fields, {
            excerpt: truncatedString,
          });
        }
      });

      // HANDLE TOP TEXT

      let topText = resultArray[3].data.topText;

      youTubeRecord = resultArray[4].data.items;

      // Filter out deleted videos
      let trimmedYouTubeRecord = youTubeRecord.filter(
        (record) => record.snippet.title !== "Deleted video"
      );

      let mostRecentStream = null;

      // GO THROUGH 10 MOST RECENT LIVESTREAMS

      trimmedYouTubeRecord.forEach((stream) => {
        // PARSING THE DATE OF THIS LIVESTREAM

        // PRIVATE VIDEOS NEED TO BE GIVEN A VERY OLD DATE TO BE IGNORED
        if (stream.snippet.title !== "Private video") {
          const startToGetDateInfoFromDescription = stream.snippet.description
            .split(/, /g)[0]
            .split(" ");
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
          }
        } else {
          // PRIVATE VIDEOS NEED TO BE GIVEN A VERY OLD DATE TO BE IGNORED
          stream.parsedDate = moment().subtract(1, "years");
        }
      });

      // SORT YOUTUBE RESULTS TO NEWEST IS FIRST
      trimmedYouTubeRecord.sort((left, right) =>
        moment.utc(right.parsedDate).diff(moment.utc(left.parsedDate))
      );

      trimmedYouTubeRecord.forEach((stream) => {
        // DOES THE STREAM HAPPEN TODAY??
        if (moment(stream.parsedDate).isSame(moment(), "day")) {
          mostRecentStream = stream;
          return;

          // IF THE STREAM HAPPENS BEFORE TODAY
        }
        if (moment(stream.parsedDate).isBefore(moment(), "day")) {
          if (mostRecentStream) {
            return;
          } else {
            mostRecentStream = stream;
          }
        }
      });

      // 1. RE-MERGE INTO ONE ARRAY
      // We want the headline first, then the spotlights
      let finalEventsForHbs = [];

      if (useFlexipress) {
        const headline = formattedEvents.find(
          (e) => e.fields.featured === true
        );
        const spotlights = formattedEvents.filter(
          (e) => e.fields.featured === false
        );

        if (headline) finalEventsForHbs.push(headline);
        finalEventsForHbs = finalEventsForHbs.concat(spotlights);
      } else {
        // Legacy Contentful path
        finalEventsForHbs = formattedEvents;
      }

      // 2. RENDER
      var hbsObject = {
        events: finalEventsForHbs, // The template loops through this twice
        vimeo: vimeoRecord,
        blogpost: blogItems,
        youtubeStream: mostRecentStream,
        homeWelcome: topText,
        metaTitle:
          "Rancho Bernardo Community Presbyterian Church | RBCPC San Diego",
        headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
                      <link rel="stylesheet" type="text/css" href="styles/responsive.css">`,
        title: `Rancho Bernardo Community Presbyterian Church | RBCPC San Diego`,
      };

      res.render("home", hbsObject);
    });

    let youTubeRecord = null;
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
    const useFlexipress =
      req.query.source === "flexi" || req.app.locals.useFlexipress;

    if (useFlexipress) {
      Promise.all([
        // [0] Fetch ALL published events
        axios.get(
          `https://fpserver.grahamwebworks.com/api/events/org/1?published=true`
        ),
        // [1] Fetch SingleHome to identify the ONE Headline event
        axios.get(`https://fpserver.grahamwebworks.com/api/single/home/1`),
      ])
        .then((resultArray) => {
          const sqlEvents = resultArray[0].data;
          const homeSettings = resultArray[1].data;
          const headlineId = homeSettings.HeadlineEventId;

          // A. Map the specific Headline Event
          const headlineEvent = sqlEvents.find((e) => e.id == headlineId);
          const mappedHeadline = headlineEvent
            ? mapSqlEventToContentful(headlineEvent, true)
            : null;

          // B. Map all other events (set forceHeadline to false)
          // We do NOT filter them out here because you want them in the regular list too
          const mappedList = sqlEvents.map((event) => {
            // If it's the headline, we still map it with forceHeadline=false
            // so it shows up in the 'unless featured' list below.
            return mapSqlEventToContentful(event, false);
          });

          // C. Sort the list
          mappedList.sort(compare);

          var hbsObject = {
            events: mappedList, // This will show ALL events (including the one that is headline)
            topEvent: mappedHeadline ? [mappedHeadline] : [], // Only the ONE headline
            active: { events: true },
            headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
            title: `Events`,
          };

          res.render("events", hbsObject);
        })
        .catch((err) => {
          console.error("Flexipress /events Error:", err);
          res.status(500).send("Error loading events listing");
        });
    } else {
      // [Legacy Contentful Code - Keep exactly as you had it]
      client
        .getEntries({
          content_type: "events",
          "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
          order: "fields.date",
        })
        .then(function (dbEvent) {
          // client
          //   .getEntries({
          //     content_type: "events",
          //     "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
          //     order: "fields.date",
          //   })
          //   .then(function (dbEvent) {
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
    }
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

    Promise.all([
      client.getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        "fields.ministry": req.params.id,
        limit: 10,
      }),
      axios.get(
        `https://admin.rbcommunity.org/articles?ministries.name=${req.params.id}&_sort=datePosted&_limit=6`
      ),
    ]).then(function (resultArray) {
      var items = { articles: [] };

      resultArray[1].data.forEach((strapiArticle) => {
        // FORMATTING THE AUTHOR INFO INTO AN ARRAY TO CONFORM TO CONTENTFUL
        let authorArray = [];
        authorArray.push(strapiArticle.author);
        strapiArticle.author = authorArray;

        // FORMATTING IMAGE
        let formattedImage = {
          fields: {
            title: strapiArticle.image.name,
            file: {
              url: strapiArticle.image.url,
              details: {
                size: strapiArticle.image.size,
                image: {
                  width: strapiArticle.image.width,
                  height: strapiArticle.image.height,
                },
              },
              fileName: strapiArticle.image.name,
              contentType: strapiArticle.image.mime,
            },
          },
        };

        strapiArticle.ministry = strapiArticle.ministries;
        strapiArticle.image = formattedImage;
        strapiArticle.fromStrapi = true;
        resultArray[0].items.push({ fields: strapiArticle });
      });

      let entry = resultArray[0];

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
          items.articles.push(earlyItem);
        }
      });

      // Converting times for template
      items.articles.forEach((item) => {
        // Converting Date info
        Object.assign(item.fields, {
          formattedDate: moment(item.fields.datePosted)
            .format("DD MMM, YYYY")
            .toUpperCase(),
        });

        if (item.fields.body) {
          if (!item.fields.fromStrapi) {
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

          if (item.fields.fromStrapi) {
            let truncatedString = item.fields.body.replace(
              /<\/?[^>]+(>|$)/g,
              ""
            );
            item.fields.excerpt = truncatedString
              .replace(/\s+/g, " ")
              .split(/(?=\s)/gi)
              .slice(0, 23)
              .join("");
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

      // SORT ITEMS BY DATE POSTED
      items.articles.sort(compareItemDatePosted);

      // KEEP IT TO SIX ITEMS AFTER MERGING CONTENTFUL AND STRAPI APIS
      firstRecord = items;

      client
        .getEntries({
          content_type: "events",
          "fields.endDate[gte]": moment().format(),
          "fields.ministry": req.params.id,
          order: "fields.date",
          limit: req.params.id === "Youth, Music and Theater" ? 9 : 6,
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
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY"),
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
    const useFlexipress =
      req.query.source === "flexi" || req.app.locals.useFlexipress;

    let rawSlug = req.params.id;
    if (rawSlug.startsWith("-")) rawSlug = rawSlug.substring(1);

    // 1. Decode special characters
    // 2. Make it lowercase (to match 'childrens-choir')
    // 3. Remove apostrophes (to match 'childrens-choir' vs "children's-choir")
    const cleanSlug = decodeURIComponent(rawSlug)
      .toLowerCase()
      .replace(/'/g, "");

    if (useFlexipress) {
      console.log("FLEXIPRESS LOOKUP SLUG:", cleanSlug);

      axios
        .get(
          `https://fpserver.grahamwebworks.com/api/event/org/1/slug/${cleanSlug}`
        )
        .then((response) => {
          console.log("Flexipress Event Response:", response.data);
          // If the API returns an array, take the first item.
          // If it's just an object, use it directly.
          const sqlEvent = Array.isArray(response.data)
            ? response.data[0]
            : response.data;

          if (!sqlEvent || Object.keys(sqlEvent).length === 0) {
            console.log("❌ NOT FOUND. Terminal looking for:", cleanSlug);
            return res.status(404).send("Event not found.");
          }

          // Log this to see what the RAW database column names actually are
          console.log("RAW SQL EVENT DATA:", sqlEvent);

          const formattedEvent = mapSqlEventToContentful(sqlEvent);

          // Apply specific business logic (Replace RBCC)
          if (formattedEvent.fields.description) {
            formattedEvent.fields.description =
              formattedEvent.fields.description.replace(
                /RBCC/g,
                "RB Community"
              );
          }

          const hbsObject = {
            events: formattedEvent,
            active: { events: true },
            headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
            title: formattedEvent.fields.title,
          };

          res.render("event", hbsObject);
        })
        .catch((err) => {
          console.error("Flexipress Single Event Error:", err);
          res.status(500).send("Error loading event details");
        });
    } else {
      // --- LEGACY CONTENTFUL LOGIC ---
      // (We keep your original renderSingleEvent logic inside this block)
      const renderSingleEvent = (oldDbEvent) => {
        let dbEvent = oldDbEvent.items[0];
        if (!dbEvent)
          return res.status(404).send("Event not found in Contentful");

        Object.assign(dbEvent.fields, {
          shortMonth: moment(dbEvent.fields.date).format("MMM"),
          dayOfWeek: moment(dbEvent.fields.date).format("ddd"),
          shortDay: moment(dbEvent.fields.date).format("DD"),
        });

        if (dbEvent.fields.repeatsEveryDays > 0) {
          if (
            moment(dbEvent.fields.date).isBefore(moment().format("YYYY-MM-DD"))
          ) {
            let start = moment(dbEvent.fields.date);
            let end = moment().format("YYYY-MM-DD");
            while (start.isBefore(end)) {
              start.add(dbEvent.fields.repeatsEveryDays, "day");
            }
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

        if (dbEvent.fields.description) {
          dbEvent.fields.description = marked(
            dbEvent.fields.description
          ).replace(/RBCC/g, "RB Community");
        }

        const hbsObject = {
          events: dbEvent,
          active: { events: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
          title: dbEvent.fields.title,
        };
        return res.render("event", hbsObject);
      };

      // Original Contentful ID/Title logic
      if (req.params.id[0] === ":") {
        client
          .getEntries({
            content_type: "events",
            "sys.id[match]": req.params.id.substring(1),
          })
          .then((oldDbEvent) => renderSingleEvent(oldDbEvent));
      } else {
        let str = decodeURI(
          req.originalUrl
            .substring(7)
            .replace(/-/g, " ")
            .replace(/\s\s\s/g, "-")
        );
        str = str.replace(/\s\s\s/g, " - ");
        str.indexOf("?") > 0 ? (str = str.substring(0, str.indexOf("?"))) : "";
        client
          .getEntries({
            content_type: "events",
            "fields.title": str,
          })
          .then((oldDbEvent) => renderSingleEvent(oldDbEvent));
      }
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
      "https://admin.rbcommunity.org/jobs?_sort=Title:ASC",
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

  // app.get(["/easter", "/lent"], (req, res) => {
  //   res.render("easter", {
  //     headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
  //     <link rel="stylesheet" type="text/css" href="styles/easter.css"><link rel="preconnect" href="https://fonts.gstatic.com">
  //     <link href="https://fonts.googleapis.com/css2?family=Cardo&display=swap" rel="stylesheet">
  //       <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
  //     title: `Easter`,
  //   });
  // });

  // app.get("/christmas", (req, res) => {
  //   res.render("christmas", {
  //     headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
  //     <link rel="stylesheet" type="text/css" href="styles/christmas.css"><link rel="preconnect" href="https://fonts.gstatic.com">
  //     <link href="https://fonts.googleapis.com/css2?family=PT+Serif:wght@400;700&display=swap" rel="stylesheet">
  //       <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
  //   });
  // });

  app.get(["/concert", "/concertseries"], (req, res) => {
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

  app.get(["/summit", "thesummit"], async (req, res) => {
    res.render("summit", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `The Summit`,
    });
  });

  app.get("/nominate", async (req, res) => {
    res.redirect(
      "https://res.cloudinary.com/rb-community-church/raw/upload/v1713975397/Updated_nomination_form_54e4b5bf09.docx"
    );
  });

  app.get("/familyemail", async (req, res) => {
    res.redirect(
      "https://www.shelbygiving.com/App/Form/66e76d8c-967e-4434-a560-2a39ff87a60b"
    );
  });

  app.get("/frances", async (req, res) => {
    res.redirect("https://www.youtube.com/watch?v=G1_zVoJSflk");
  });

  app.get("/volunteer", async (req, res) => {
    Promise.all([
      axios.get(
        "https://fpserver.grahamwebworks.com/api/volunteer/published/org/1"
      ),
    ]).then((resultArray) => {
      const hbsObject = {
        headContent: `<link rel="stylesheet" type="text/css" href="styles/ministries.css">
  <link rel="stylesheet" type="text/css" href="styles/volunteer.css">
                        <link rel="stylesheet" type="text/css" href="styles/ministries_responsive.css">
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
        openings: resultArray[0].data,
      };
      res.render("volunteers", hbsObject);
    });
  });

  app.get("/volunteer:id", (req, res) => {
    let position = req.params.id.substring(1);

    position = position.replace(/-/g, " ");

    Promise.all([
      axios.get(
        `https://fpserver.grahamwebworks.com/api/volunteer/published/position/${position}/1`
      ),
    ]).then((resultArray) => {
      const hbsObject = {
        headContent: `<link rel="stylesheet" type="text/css" href="styles/ministries.css">
  <link rel="stylesheet" type="text/css" href="styles/volunteer.css">
                        <link rel="stylesheet" type="text/css" href="styles/ministries_responsive.css">
                        <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.2/moment.min.js"></script>`,
        opening: resultArray[0].data,
      };
      res.render("volunteer", hbsObject);
    });
  });

  app.get("/search:term", async (req, res) => {
    let searchTerm = req.params.term.substring(1);

    const query = qs.stringify({
      _where: {
        _or: [
          [{ author_contains: searchTerm }],
          [{ title_contains: searchTerm }],
          [{ body_contains: searchTerm }],
        ],
      },
    });

    try {
      const results = await Promise.all([
        client.getEntries({ query: searchTerm }),
        axios.get(`https://admin.rbcommunity.org/articles?${query}`),
      ]);

      results[1].data.forEach((article) => {
        let formattedArticle = {
          sys: { contentType: { sys: { id: "blog" } } },
        };
        formattedArticle.fields = article;
        results[0].items.push(formattedArticle);
      });

      //

      // ITERATE THROUGH CONTENTFUL RESULTS (RESULTS[0])
      results[0].items.forEach((entry) => {
        // console.log("Entry: ", entry);
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
