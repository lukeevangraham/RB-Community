require("dotenv").config();
let keys = require("../keys.js");
var request = require("request");
var moment = require("moment");
var path = require("path");
var marked = require("marked");

marked.setOptions({
  renderer: new marked.Renderer(),
  sanitize: true,
  smartLists: true,
  smartypants: true
});

// Import the model (event.js) to use its database functions
var db = require("../models/");

var contentful = require("contentful");

let spaceId = process.env.SPACE_ID;
let contentfulAccessToken = process.env.ACCESS_TOKEN;

const HtmlRenderer = require("@contentful/rich-text-html-renderer");
let { documentToHtmlString } = HtmlRenderer;

const richTextTypes = require("@contentful/rich-text-types");
let { INLINES } = richTextTypes;

let vimeoPass = process.env.VIMEO_TOKEN;

var client = contentful.createClient({
  space: spaceId,
  accessToken: contentfulAccessToken
});

var vimeoOptions = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Sermon",
    fields:
      "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button",
    sizes: "960",
    per_page: "7",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
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
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};

var vimeoOptionsAnnHome = {
  method: "GET",
  url: "https://api.vimeo.com/users/14320074/videos",
  qs: {
    query: "Announcements",
    fields:
      "name, description, link, pictures.sizes.link, pictures.sizes.link_with_play_button, embed",
    width: "690",
    per_page: "1",
    page: "1"
  },
  headers: {
    Authorization: "Bearer " + vimeoPass
  }
};

function getIdFromVimeoURL(url) {
  return /(vimeo(pro)?\.com)\/(?:[^\d]+)?(\d+)\??(.*)?$/.exec(url)[3];
}

function doReq(url, what) {
  return new Promise(function(resolve, reject) {
    request(
      {
        url: url,
        headers: {
          Bearer: "sampleapitoken"
        }
      },
      function(error, response) {
        if (error || response.statusCode !== 200) {
          reject(error);
        } else {
          var data = {};
          (Array.isArray(what) ? what : [what]).forEach(function(item, index) {
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

// Routes
module.exports = function(app) {
  app.get("/blog", function(req, res) {
    client
      .getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        // remove about rB Community from the news feed
        "sys.id[nin]": "3JEwFofQhW3MQcReiGLCYu"
      })
      .then(function(dbBlog) {
        var items = [];
        var itemsIncludingExpired = dbBlog.items;

        // ELIMINATING OLD ENTRIES FROM PAGE
        itemsIncludingExpired.forEach(earlyItem => {
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
        items.forEach(item => {
          Object.assign(item.fields, {
            formattedDate: moment(item.fields.datePosted)
              .format("DD MMM, YYYY")
              .toUpperCase()
          });

          if (item.fields.body) {
            if (item.fields.body.content[0].content[0]) {
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
            }
          }

          Object.assign(item.fields, {
            excerpt: truncatedString,
            today: moment().format("YYYY-MM-DD")
          });
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
          title: `Latest News`
          // shortenedMain: newTrimmedString
        };
        res.render("blog", hbsObject);
      });
  });

  app.get("/blog_single:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    client.getEntry(req.params.id).then(function(entry) {
      // Converting times for template
      Object.assign(entry.fields, {
        shortMonth: moment(entry.fields.datePosted)
          .format("MMM")
          .toUpperCase()
      });
      Object.assign(entry.fields, {
        shortDay: moment(entry.fields.datePosted).format("DD")
      });

      // Converting vimeo embeds
      const options = {
        renderNode: {
          [INLINES.HYPERLINK]: node => {
            if (node.data.uri.includes("player.vimeo.com/video")) {
              return `<div class="col-lg-7 col-xs-12 p-0"><IframeContainer class="embed-responsive embed-responsive-16by9"><iframe class="embed-responsive-item" title="Unique Title 001" src=${node.data.uri} frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe></IframeContainer></div>`;
            } else
              return `<a href="${node.data.uri}" target="blank">${node.content[0].value}</a>`;
          },
          "embedded-asset-block": node =>
            `<img class="img-fluid" src="${node.data.target.fields.file.url}"/>`
        }
      };

      const rawRichTextField = entry.fields.body;
      // let renderedHtml = documentToHtmlString(rawRichTextField);
      Object.assign(entry.fields, {
        renderedHtml: documentToHtmlString(rawRichTextField, options),
        id: req.params.id
      });

      var bloghbsObject = {
        article: entry,
        active: { news: true },
        headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
                    <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`,
        title: entry.fields.title
      };
      // console.log("hbsObject:  ", bloghbsObject.article);
      res.render("blog_single", bloghbsObject);
    });
  });

  app.get(["/", "/index.html", "/home"], function(req, res) {
    var vimeoRecord = null;
    let secondRecord = null;
    let thirdRecord = null;
    let vimeoAnnRecord = null;
    let vimeoAnnURL = null;

    request(vimeoOptionsHome, function(error, response, body) {
      if (error) throw new Error(error);

      vimeoRecord = JSON.parse(body);

      vimeoRecord.data.forEach(item => {
        Object.assign(item, {
          shortTitle: item.name.split(": ", 2)[1]
        });
      });

      request(vimeoOptionsAnnHome, function(error, response, body) {
        if (error) throw new Error(error);

        vimeoAnnRecord = JSON.parse(body);

        // a = vimeoAnnRecord.data[0].link;
        var items = vimeoAnnRecord.data;
        // console.log("ITEMS: ", items)
        let trimmedURL = getIdFromVimeoURL(items[0].link);

        let editedEmbed = items[0].embed.html
        // console.log("TRIMMED URL: ", trimmedURL)
        editedEmbed = editedEmbed.replace(`" `,`" data-aos="fade-right" class="about_image" `)
        // a = a.replace(`https://`,`//`)
        // console.log("HERE: ", a)
        // console.log(vimeoAnnRecord)

        // vimeoAnnURL = getIdFromVimeoURL(a);
        // vimeoAnnURL = trimmedURL;
        // vimeoAnnURL = items[0].embed.html;
        vimeoAnnURL = editedEmbed;
        // console.log("LINK: ", getIdFromVimeoURL(vimeoAnnURL))

        client
          .getEntries({
            content_type: "events",
            // "fields.featuredOnHome": true,
            "fields.endDate[gte]": moment().format(),
            "fields.homePagePassword": "Psalm 46:1",
            order: "fields.date"
            // limit: 3
          })
          .then(function(dbEvent) {
            // console.log("LOOK HERE: ", dbEvent.items[0].fields);
            var items = dbEvent.items;

            // Converting times for template
            items.forEach(item => {
              Object.assign(item.fields, {
                shortMonth: moment(item.fields.date).format("MMM")
              });
              Object.assign(item.fields, {
                shortDay: moment(item.fields.date).format("DD")
              });
              // if (item.fields.featured) {
              Object.assign(item.fields, {
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
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
                  dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
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
                limit: 3
              })
              .then(function(dbBlog) {
                var items = [];
                var itemsIncludingExpired = dbBlog.items;

                // ELIMINATING OLD ENTRIES FROM PAGE
                itemsIncludingExpired.forEach(earlyItem => {
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
                items.forEach(item => {
                  Object.assign(item.fields, {
                    formattedDate: moment(item.fields.datePosted)
                      .format("DD MMM, YYYY")
                      .toUpperCase()
                  });

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
                    excerpt: truncatedString
                  });
                });

                thirdRecord = items;
              })

              .then(function(body) {
                // console.log(body)
                // console.log("VIMEO SAYS: ", vimeoRecord);
                // console.log("CONTENTFUL SAYS: ", secondRecord.items[0])
                // console.log("LOOK HERE: ", thirdRecord.items);
                // console.log("NEW VIMEO: ", vimeoAnnRecord.data[0].embed)

                var hbsObject = {
                  events: secondRecord.items,
                  vimeo: vimeoRecord,
                  vimeoAnn: vimeoAnnURL,
                  blogpost: thirdRecord,
                  headContent: `<link rel="stylesheet" type="text/css" href="styles/main_styles.css">
              <link rel="stylesheet" type="text/css" href="styles/responsive.css">`,
                  title: `Home`
                };

                res.render("home", hbsObject);
              });
          });
      });
    });
  });

  app.get("/cms", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms.html"));
  });

  app.get("/cms-post", function(req, res) {
    res.sendFile(path.join(__dirname, "../public/cms-post.html"));
  });

  // app.get("/events", function (req, res) {
  //     res.sendFile(path.join(__dirname, "../public/events.html"));
  // })

  app.get("/events", function(req, res) {
    client
      .getEntries({
        content_type: "events",
        "fields.endDate[gte]": moment().format("YYYY-MM-DD"),
        order: "fields.date"
      })
      .then(function(dbEvent) {
        var items = dbEvent.items;

        // Converting times for template
        items.forEach(item => {
          Object.assign(item.fields, {
            shortMonth: moment(item.fields.date).format("MMM")
          });
          Object.assign(item.fields, {
            shortDay: moment(item.fields.date).format("DD"),
            dayOfWeek: moment(item.fields.date).format("ddd")
          });
          // if (item.fields.featured) {
          Object.assign(item.fields, {
            dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
          });
          // CONVERT MARKDOWN TO HTML
          if (item.fields.description) {
            item.fields.description = marked(item.fields.description);
          }
          // }

          // ITERATING OVER RECURRING EVENTS TO KEEP THEM CURRENT
          if (item.fields.repeatsEveryDays > 0) {
            if (
              moment(item.fields.date).isBefore(moment().format("YYYY-MM-DD"))
            ) {
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
              dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
            });
          }
        });

        // SORT EVENTS BY NEWLY CALCULATED DATE
        items.sort(compare);

        var hbsObject = {
          events: dbEvent.items,
          active: { events: true },
          headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
          title: `Events`
        };

        return res.render("events", hbsObject);
      });
  });

  app.get("/about", function(req, res) {
    res.render("about", {
      active: { about: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `About`
    });
  });

  app.get(["/sermons", "/sermons:id"], function(req, res) {
    if (req.params.id) {
      vimeoOptions.qs.page = parseInt(req.params.id.substr(1));
    } else {
      vimeoOptions.qs.page = 1;
    }

    request(vimeoOptions, function(error, response, body) {
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
            id: getIdFromVimeoURL(items[0].link)
          });
        }

        items.forEach(item => {
          // console.log(moment(item.name.split(" ", 1), 'MM-DD-YY').format("MMM"))
          // console.log(moment(item.name.split(" ", 1), 'MM-DD-YY').format('MMM'))
          Object.assign(item, {
            shortMonth: moment(item.name.split(" ", 1), "MM-DD-YY").format(
              "MMM"
            )
          });
          Object.assign(item, {
            shortDay: moment(item.name.split(" ", 1), "MM-DD-YY").format("DD")
          });
          Object.assign(item, {
            shortTitle: item.name.split(": ", 2)[1]
          });
          Object.assign(item, {
            featureDate: moment(item.name.split(" ", 1), "MM-DD-YY").format(
              "DD MMM YYYY"
            )
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
        title: `Sermons | Page ` + vimeoOptions.qs.page,
        nextSermonPage: vimeoOptions.qs.page + 1
      };

      vimeoOptions.qs.page > 1
        ? (hbsObject.thisSermonPage = vimeoOptions.qs.page)
        : "";

      return res.render("sermons", hbsObject);
    });
  });

  app.get("/contact", function(req, res) {
    res.render("contact", {
      active: { contact: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/contact.css">
        <link rel="stylesheet" type="text/css" href="styles/contact_responsive.css">`,
      title: `Contact`
    });
  });

  app.get("/giving", function(req, res) {
    res.render("giving", {
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `Giving`
    });
  });

  app.get("/ministries", function(req, res) {
    res.render("ministries", {
      active: { ministries: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/ministries.css">
        <link rel="stylesheet" type="text/css" href="styles/ministries_responsive.css">`,
      title: `Ministries`
    });
  });

  app.get("/ministry:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    var firstRecord = null;
    var secondRecord = null;
    var thirdRecord = null;

    client
      .getEntries({
        content_type: "blog",
        order: "-fields.datePosted",
        "fields.ministry": req.params.id,
        limit: 6
      })
      .then(function(entry) {
        if (entry.total >= 1) {
          Object.assign(entry.items, {
            multipleEntries: true
          });
        }

        if (entry.fields) {
          Object.assign(entry.items[0].fields, {
            request: req.params.id
          });
        }

        var items = [];
        var itemsIncludingExpired = entry.items;
        // ELIMINATING OLD ENTRIES FROM PAGE
        itemsIncludingExpired.forEach(earlyItem => {
          if (
            moment(earlyItem.fields.expirationDate).isBefore(
              moment().format("YYYY-MM-DD")
            )
          ) {
          } else {
            items.push(earlyItem);
          }
        });
        console.log("LOOK HERE", items);

        // Converting times for template
        items.forEach(item => {
          // Converting Date info
          Object.assign(item.fields, {
            formattedDate: moment(item.fields.datePosted)
              .format("DD MMM, YYYY")
              .toUpperCase()
          });

          // Creating article excerpt
          var truncatedString = JSON.stringify(
            item.fields.body.content[0].content[0].value.replace(
              /^(.{165}[^\s]*).*/,
              "$1"
            )
          );
          var truncatedLength = truncatedString.length;
          truncatedString = truncatedString.substring(1, truncatedLength - 1);

          Object.assign(item.fields, {
            excerpt: truncatedString
          });

          // Render HTML if featured on requested ministry
          if (item.fields.featureOnMinistryPage) {
            // console.log(item.fields)
            const rawRichTextField = item.fields.body;
            // let renderedHtml = documentToHtmlString(rawRichTextField);
            Object.assign(item.fields, {
              renderedHtml: documentToHtmlString(rawRichTextField)
            });
          }
        });

        // console.log("ITEMS: ", items)

        firstRecord = items;

        client
          .getEntries({
            content_type: "events",
            "fields.endDate[gte]": moment().format(),
            "fields.ministry": req.params.id,
            order: "fields.date",
            limit: 6
          })
          .then(function(dbEvent) {
            var items = dbEvent.items;

            // Converting times for template
            items.forEach(item => {
              Object.assign(item.fields, {
                shortMonth: moment(item.fields.date).format("MMM")
              });
              Object.assign(item.fields, {
                shortDay: moment(item.fields.date).format("DD")
              });
              // if (item.fields.featured) {
              Object.assign(item.fields, {
                dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
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
                  dateToCountTo: moment(item.fields.date).format("MMMM D, YYYY")
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
                limit: 1
              })
              .then(function(entry) {
                var item = entry.items[0];
                if (item) {
                  const rawRichTextField = item.fields.body;
                  // let renderedHtml = documentToHtmlString(rawRichTextField);
                  Object.assign(item.fields, {
                    renderedHtml: documentToHtmlString(rawRichTextField)
                  });
                }

                thirdRecord = item;

                // console.log("SECOND RECORD: ", secondRecord);

                // console.log("LOOK HERE", entry)

                var bloghbsObject = {
                  blogpost: firstRecord,
                  request: req.params.id,
                  events: secondRecord,
                  header: thirdRecord,
                  active: { ministries: true },
                  headContent: `<link rel="stylesheet" type="text/css" href="styles/ministry.css">
              <link rel="stylesheet" type="text/css" href="styles/ministry_responsive.css">`,
                  title: req.params.id
                };
                // console.log("hbsObject:  ", bloghbsObject.blogpost);
                res.render("ministry", bloghbsObject);
              });
          });
      });
  });

  // Page for individual events
  app.get("/event:id", function(req, res) {
    req.params.id = req.params.id.substring(1);
    client.getEntry(req.params.id).then(function(dbEvent) {
      // Converting times for template
      Object.assign(dbEvent.fields, {
        shortMonth: moment(dbEvent.fields.date).format("MMM"),
        dayOfWeek: moment(dbEvent.fields.date).format("ddd")
      });
      Object.assign(dbEvent.fields, {
        shortDay: moment(dbEvent.fields.date).format("DD")
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
          dateToCountTo: moment(dbEvent.fields.date).format("MMMM D, YYYY")
        });
      }

      // CONVERT MARKDOWN TO HTML
      if (dbEvent.fields.description) {
        dbEvent.fields.description = marked(dbEvent.fields.description);
      }

      // RENDER HTML FOR DESCRIPTION
      //  const rawRichTextField = dbEvent.fields.description;
      // let renderedHtml = documentToHtmlString(rawRichTextField);
      //  Object.assign(dbEvent.fields, {
      //    renderedHtml: documentToHtmlString(rawRichTextField)
      //   });
      // console.log(dbEvent.fields.renderedHtml)

      var hbsObject = {
        events: dbEvent,
        active: { events: true },
        headContent: `<link rel="stylesheet" type="text/css" href="styles/events.css">
                    <link rel="stylesheet" type="text/css" href="styles/events_responsive.css">`,
        title: dbEvent.fields.title
      };

      // console.log(dbEvent);
      return res.render("event", hbsObject);
    });
  });

  app.get("/services", function(req, res) {
    var bloghbsObject = {
      // article: entry.fields,
      // request: req.params.id,
      active: { about: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/blog_single.css">
        <link rel="stylesheet" type="text/css" href="styles/blog_single_responsive.css">`,
      title: `Services`
    };
    // console.log("hbsObject:  ", bloghbsObject.blogpost);
    res.render("services", bloghbsObject);
  });

  // REDIRECT TO CONNECTION CARD
  app.get("/card", function(req, res) {
    res.redirect("https://rbcc.churchcenter.com/people/forms/43489");
  });

  app.get("/highschool", function(req, res) {
    res.redirect("/ministry:High%20School");
  });

  app.get("/msm", function(req, res) {
    res.redirect("/ministry:Middle%20School");
  });

  app.get("/sitemap.xml", function(req, res) {
    res.sendFile("/sitemap.xml");
  });

  app.use(function(req, res) {
    var bloghbsObject = {
      // article: entry.fields,
      // request: req.params.id,
      // active: { about: true },
      headContent: `<link rel="stylesheet" type="text/css" href="styles/about.css">
        <link rel="stylesheet" type="text/css" href="styles/about_responsive.css">`,
      title: `404`
    };
    res.render("404", bloghbsObject);
  });
};
