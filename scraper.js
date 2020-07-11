const transform = require('./transform');
const mongo = require('./mongodb');
var statistic = {
   torrentsTotal: 0,
   torrentsFound: 0,
   torrentsNotFound: 1,
};
async function processTrackers() {
   await mongo.deleteFilms();
   const trackers = await mongo.getTrackers();
   // const docs = trackers.find((t) => t.name === 'Documentary');
   const promices = trackers.map((tracker) => processFeeds(tracker.feeds, tracker.myId));
   await Promise.all(promices);
}
async function processFeeds(feeds, trackerId) {
   const promices = feeds.map((feed) => processFeed(feed, trackerId));
   await Promise.all(promices);
}
async function processFeed(feed, trackerId) {
   const torrents = await transform.feedToTorrents(feed, trackerId);
   // var filtered = await mongo.filterTorrents(torrents);
   // statistic.torrentsTotal += filtered.length;
   // for(var torrent of filtered){
   //     await processTorrent(torrent);
   // }
   console.log(`Done ${feed.name} ${feed.url}. Found ${torrents.length}`);
   statistic.torrentsTotal += torrents.length;
   await processTorrents(torrents);
}

async function processTorrents(torrents) {
   for (var torrent of torrents) {
      var found = await mongo.getTorrent(torrent.trackerId, torrent.myId);
      if (!found) {
         await processTorrent(torrent);
         statistic.torrentsTotal++;
      }
   }
}

async function processTorrent(torrent) {
   const film = await transform.torrentToFilm(torrent);
   if (!film) {
      statistic.torrentsNotFound++;
      console.warn(`Not found ${torrent.title.substr(0, 90)}... ${torrent.url}`);
      //return;
   } else {
      statistic.torrentsFound++;
      //torrent.film = film;
   }
   await mongo.addTorrent(torrent, film);
}

void (async function () {
   try {
      console.log('Starting ---------------------------------------------------');
      //await mongo.updateVideos();
      await processTrackers();
      const str = JSON.stringify(statistic);
      console.log(`${str}`);
   } catch (err) {
      console.error(err);
   } finally {
      console.log('Done -------------------------------------------------------');
      process.exit();
   }
})();
