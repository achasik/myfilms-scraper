const cheerio = require('cheerio');
const he = require('he');
const web = require('./web');
const mongo = require('./mongodb');
const tmdb = require('./tmdb');
const diacritics = require('./utils/diacritics');

const Film = require('./models/film');
const Torrent = require('./models/torrent');

// function kpId(link){
//     const g = link.match(/(\d+)(\/|$)/)[1];
//     return g;
// }

module.exports = {
   feedToTorrents: async (feed, trackerId) => {
      var torrents = [];
      const xml = await web.getUrl(feed.url);
      if (xml.feed) {
         torrents = xml.feed.entry.map(entry => {
            const link = entry.link[0].$.href;
            const title = entry.title[0].replace('[Обновлено]', '');
            if (!title) {
               throw new Error(`Bad feed entry ${entry}`);
            }

            return new Torrent({
               trackerId: trackerId,
               myId: link.match(/t=(\d+)/)[1],
               title: myDecode(title.trim()),
               url: link.replace('.org', '.net')
            });
         });
      } else if (xml.rss) {
         torrents = xml.rss.channel[0].item.map(entry => {
            return new Torrent({
               trackerId: trackerId,
               myId: entry.link[0].match(/(\d+)/)[1],
               title: myDecode(entry.title[0].trim()),
               url: entry.link[0] //.replace('tracker.rutor.is', 'xrutor.org')
               //description: entry.description
            });
         });
      } else {
         const $ = cheerio.load(xml);
         torrents = $('td[class="nam"] a')
            .map((i, item) => {
               let href = $(item).attr('href');
               return new Torrent({
                  trackerId: trackerId,
                  myId: href.match(/id=(\d+)/)[1],
                  title: myDecode(
                     $(item)
                        .text()
                        .trim()
                  ),
                  url: 'http://kinozal-tv.appspot.com' + href
               });
            })
            .get();
      }
      return torrents;
   },
   torrentToFilm: async torrent => {
      const ids = await getIds(torrent);
      if (!torrent.magnet) {
         console.warn(`Magnet not found ${torrent.url}`);
         return null;
      }
      const possible = possibleFilm(torrent);
      possible.kp = ids.kp;
      possible.imdb = ids.imdb;
      let found = await mongo.search(possible);
      if (found) return found;
      found = await tmdb.search(possible);
      if (!found) return null;
      const inDb = await mongo.getFilmByTmdb(found.tmdb);
      if (inDb) found = inDb;
      else await found.save();
      return found;
   },
   possible: torrent => {
      return possibleFilm(torrent);
   }
};

const getIds = async function(torrent) {
   let ids = {};
   const html = await web.getUrl(torrent.url);
   const $ = cheerio.load(html);
   torrent.magnet = $('a[href*="magnet"]').attr('href');
   const kp = $('a[href*="kinopoisk"]').attr('href');
   ids['kp'] = kp ? parseInt(kp.match(/(\d{3,9})(\/|$)/)[1]) : undefined;
   const imdb = $('a[href*="imdb"]').attr('href');
   if (imdb) {
      const match = imdb.match(/(tt\d+)/);
      if (match && match.length > 1) ids['imdb'] = match[1];
   }

   if (!torrent.magnet && torrent.url.indexOf('kinozal') > 0) {
      const mlink = 'http://s-kinozal-tv.appspot.com/getmagnet?' + torrent.url.substring(torrent.url.lastIndexOf('?') + 1);
      const mHtml = await web.getUrl(mlink);
      const ch = cheerio.load(mHtml);
      torrent.magnet = ch('a[href*="magnet"]').attr('href');
   }
   return ids;
};

const possibleFilm = function(torrent) {
   let possible = new Film();
   let title = torrent.title;
   title = title.replace(/^\[.*?\]\s+/, '');
   //var split = splitPos(title);
   if (torrent.url.indexOf('kinozal') == -1) {
      let names = head(title).split('/');
      possible.nameRu = sanitize(names[0].trim());
      possible.name = names.length > 1 ? sanitize(names[names.length - 1].trim()) : '';
      possible.year = /((19|20)\d{2})/.test(tail(title)) ? tail(title).match(/((19|20)\d{2})/)[1] : 1900;
   } else {
      let names = title.split('/');
      possible.nameRu = sanitize(names[0].trim());
      if (names.length > 1) possible.name = sanitize(names[1].trim());
      if (possible.name && (isRu(possible.name) || /^(19|20)\d{2}$/.test(possible.name))) possible.name = '';
      possible.year = /((19|20)\d{2})/.test(title) ? title.match(/((19|20)\d{2})/)[1] : 1900;
   }
   return possible;
};

function head(title) {
   return title.substring(0, splitPos(title));
}
function tail(title) {
   return title.substring(splitPos(title));
}
function splitPos(title) {
   var delims = ['[', '('];
   var pos = title.split('').findIndex(function(c) {
      return delims.indexOf(c) >= 0;
   });
   //if (pos < 0) throw new Error('Splitter not found in' + title);
   return pos;
}
function sanitize(str) {
   //var result = str.replace(/[l|la]*'|[l|la]*&#039;/ig, '').trim();
   //result = result.replace(/la /ig, ' ').trim();
   // result = he.decode(result);
   // result = diacritics.replace(result);
   var result = str.replace(/\s+/g, ' ').trim();
   return result.charAt(0).toUpperCase() + result.slice(1);
}
function myDecode(str) {
   var result = he.decode(str);
   return diacritics.replace(result);
}
function isRu(str) {
   return /а|е|и|у|о|ы|э|я|ю/.test(str);
}
