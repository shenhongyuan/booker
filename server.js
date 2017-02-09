/**
 * Created by hongyuan on 2017/1/19.
 */
let http = require('http'),
    mime = require('mime'),
    url = require('url'),
    fs = require('fs');

function readBooks(callback) {
    fs.readFile('./books.json', 'utf8', function (err, data) {
        if (err || data == '') {
            callback([]);
        } else {
            callback(JSON.parse(data));
        }
    })
}

function writeBooks(data, callback) {
    fs.writeFile('./books.json', JSON.stringify(data), callback);
}

http.createServer(function (req, res) {
    let urlObj = url.parse(req.url),
        pathname = urlObj.pathname;
    if (pathname == '/') {
        res.setHeader('Content-Type', 'text/html;charset=utf8');
        fs.createReadStream('./index.html').pipe(res);
    } else {
        fs.exists('.' + pathname, function (flag) {
            if (flag) {
                res.setHeader('Content-Type', mime.lookup(pathname) + ';charset=utf8');
                fs.createReadStream('.' + pathname).pipe(res);
            } else if (/^\/books(\/\d+)?$/.test(pathname)) {
                let id = pathname.match(/^\/books(\/\d+)?$/)[1];

                switch (req.method) {
                    case 'GET':
                        if (id) {
                            readBooks(function (data) {
                                var book = data.find(function (item) {
                                    return item.id == id.slice(1);
                                });
                                if (book) {
                                    res.end(JSON.stringify(book));
                                } else {
                                    res.end(JSON.stringify({}));
                                }
                            })
                        } else {
                            readBooks(function (data) {
                                res.end(JSON.stringify(data));
                            });
                        }
                        break;
                    case 'POST':
                        var str = '';
                        req.on('data', function (data) {
                            str += data;
                        });
                        req.on('end', function () {
                            var book = JSON.parse(str);
                            readBooks(function (data) {
                                book.id = data.length == 0 ? 1 : parseInt(data[data.length - 1].id) + 1;
                                data.push(book);
                                writeBooks(data, function () {
                                    res.end(JSON.stringify(book));
                                })
                            })
                        });
                        break;
                    case 'PUT':
                        if (id) {
                            let str = '';
                            req.on('data', function (data) {
                                str += data;
                            });
                            req.on('end', function () {
                                let book = JSON.parse(str);
                                readBooks(function (data) {
                                    data = data.map(function (item) {
                                        if (item.id == id.slice(1)) {
                                            return book;
                                        }
                                        return item;
                                    });
                                    writeBooks(data, function () {
                                        res.end(JSON.stringify(book));
                                    })
                                })
                            })
                        }
                        break;
                    case 'DELETE':
                        if (id) {
                            readBooks(function (data) {
                                data = data.filter(function (item) {
                                    return item.id != id.slice(1);
                                });
                                writeBooks(data, function () {
                                    res.end(JSON.stringify({}));
                                });
                            });
                        }
                        break;
                }


            } else {
                res.statusCode = 404;
                res.end();
            }
        })
    }
}).listen(10086);