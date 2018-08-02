const xml2js = require('xml2js');
const parser = new xml2js.Parser();
const fetch = require("node-fetch");

module.exports = {
    getUrl: async(url) => {
        const res = await fetch(url);
        if (!res.ok) {
            throw new Error(res.status);
        }
        const text = await res.text();
        const contentType = res.headers.get('content-type');
        if (contentType.includes('xml')) {
            return new Promise((resolve, reject) => {
                parser.parseString(text, (err, xml) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(xml);
                })
            });
        } else {
            return text;
        }
    }
}