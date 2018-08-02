const sqlite = require('sqlite');
const dbPromise = sqlite.open('./20171117.sqlite');

module.exports = {
    trackers: {
        get: async() => {
            const db = await dbPromise;
            return db.all('SELECT * FROM trackers');
        },
        populateFeeds: async(tracker) => {
            const db = await dbPromise;            
            tracker['feeds'] = await db.all('SELECT * FROM feeds WHERE trackerId=?', tracker.id);
        }
    },
    films: {
        get: async()=>{
            const db = await dbPromise;
            return db.all('SELECT * FROM films WHERE id>93932');            
        }
    }
}