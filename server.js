import http from 'node:http';
import { getArticle } from './handlers/cardHandler.js';

const port = 3000;

const routing = {
  "/api/card/getArticle": getArticle
}

const server = http.createServer(async (req, res) => {
  console.log("Incoming call: " + req.url);
  const [requestPath, query] = req.url.split('?');
  try{
    if(req.url.indexOf('/api/') >= 0) {
      const handler = routing[requestPath];
      await handler(req, res);
    } else {
      res.write('file called\r\n');
      res.write(req.url);
    }
  }
  catch(e){
    console.log(e);
    res.statusCode = 404;
  }
  res.end();
});

server.listen(port, function (error) {
  if (error) {
    console.log('Something went wrong', error);
  }
  else {
    console.log('Server is listening on port ' + port);
  }
})