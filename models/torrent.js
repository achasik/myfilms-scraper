const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TorrentSchema = new Schema(
   {
      myId: {
         type: Number,
         required: true
      },
      trackerId: {
         type: Number,
         required: true
      },
      title: String,
      url: String,
      magnet: {
         type: String,
         required: true
      },
      tracker: {
         type: Schema.Types.ObjectId,
         ref: 'tracker'
      },
      film: {
         type: Schema.Types.ObjectId,
         ref: 'film'
      }
   },
   {
      timestamps: true,
      usePushEach: true
   }
);
TorrentSchema.index(
   {
      trackerId: 1,
      myId: 1
   },
   {
      unique: true
   }
);

const Torrent = mongoose.model('torrent', TorrentSchema);
module.exports = Torrent;
