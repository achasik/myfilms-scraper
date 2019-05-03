const tmdb = require("./tmdb");
const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI, {
  useMongoClient: true
});
const Tracker = require("./models/tracker");
const Film = require("./models/film");
const Torrent = require("./models/torrent");

module.exports = {
  migrateTrackers: async trackers => {
    for (var tracker of trackers) {
      let mongoTracker = new Tracker(tracker);
      mongoTracker["myId"] = tracker.id;
      await mongoTracker.save();
    }
  },
  migrateFilms: async films => {
    for (var film of films) {
      let mongoFilm = new Film(film);
      mongoFilm["kp"] = film.id < 1000000000 ? film.id : undefined;
      mongoFilm["tmdb"] = film.tmdb || undefined;
      mongoFilm["imdb"] = undefined;
      mongoFilm["poster"] = film.tmdb_poster || undefined;
      await mongoFilm.save();
    }
  },
  getTrackers: async () => {
    const trackers = await Tracker.find({
      active: true
    });
    return trackers;
  },
  getTracker: async trackerId => {
    return await Tracker.findOne({
      myId: trackerId
    });
  },
  getTorrent: async (trackerId, myId) => {
    return await Torrent.findOne({ trackerId: trackerId, myId: myId });
  },
  getFilm: async kp => {
    if (!kp) return null;
    return await Film.findOne({
      kp: parseInt(kp)
    });
  },
  getFilmByTmdb: async tmdb => {
    if (!tmdb) return null;
    return await Film.findOne({
      tmdb: tmdb
    });
  },
  // filterTorrents: async(torrents) => {
  //     var filtered = [];
  //     for (var torrent of torrents) {
  //         var found = await Torrent.findOne({trackerId: torrent.trackerId, myId: torrent.myId});
  //         if (!found)
  //             filtered.push(torrent);
  //     }
  //     return filtered;
  // },
  addTorrent: async (torrent, film) => {
    const exist = await Torrent.findOne({
      trackerId: torrent.trackerId,
      myId: torrent.myId
    });
    if (exist) {
      console.log(
        `Torrent allready exist ${torrent.trackerId} ${torrent.myId}`
      );
      return;
    }
    const tracker = await module.exports.getTracker(torrent.trackerId);
    torrent.tracker = tracker;
    if (film) torrent.film = film;
    try {
      await torrent.save();
    } catch (err) {
      console.error(`Error saving ${torrent.trackerId} ${torrent.myId}`);
    }
    tracker.torrents.push(torrent);
    await tracker.save();
    if (film) {
      film.torrents.push(torrent);
      await film.save();
    }
  },
  search: async film => {
    var query = { $or: [] };
    if (film.tmdb) query.$or.push({ tmdb: film.tmdb });
    if (film.kp) query.$or.push({ kp: film.kp });
    if (film.imdb) query.$or.push({ imdb: film.imdb });
    if (film.name)
      query.$or.push({ $and: [{ name: film.name }, { year: film.year }] });
    query.$or.push({ $and: [{ nameRu: film.nameRu }, { year: film.year }] });
    const found = await Film.findOne(query);
    return found;
  },

  updateVideos: async () => {
    const found = await Film.find({
      $or: [
        {
          videos: {
            $exists: false
          }
        },
        {
          videos: null
        },
        {
          videos: {
            $size: 0
          }
        }
      ]
    });
    console.log("Found movies " + found.length);
    for (film of found.slice(0, 100)) {
      film.videos = await tmdb.getVideos(film.tmdb);
      await film.save();
    }
  }
};
