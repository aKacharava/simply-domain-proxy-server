const http = require("http");
const https = require("https");
const server = http.createServer();
const port = 3000;
const dns = require("dns");

server.on("request", function (requestFromClient, res) {
  const urlToServer = new URL(
    requestFromClient.url,
    requestFromClient.headers.host
  );

  console.log("Request Host name - " + requestFromClient.headers.host);

  // Get all TXT records from _dnslink.hostname
  dns.resolveTxt("_dnslink." + "akdev.nl", function (err, dnslink) {
    if (err || !Array.isArray(dnslink[0])) {
      //console.log(err);
      return;
    }

    if (dnslink[0][0].includes("dnslink")) {
      const content = dnslink[0][0].replace("dnslink=", "");
      let isHttps = content.includes("https");

      // FIXME: This check should be adjusted to see if incoming dnslink protocol, other then https, has support
      if (!isHttps) {
        let protocol = content.substring(
          content.indexOf("/") + 1,
          content.lastIndexOf("/")
        );
        console.log("Unsupported protocol: " + protocol);
        return;
        // TODO: Add logic here for IPFS content
      } else {
        //return content;

        console.log("Retrieved dnslink url - " + content);

        urlToServer.host = setHostAndPortHandler(content);
        urlToServer.protocol = setProtocolHandler(content);

        if (urlToServer.protocol === "https:") {
          https.get(urlToServer, (responseFromServerToClient) => {
            const buffer = [];

            responseFromServerToClient.on("data", (chunk) =>
              buffer.push(chunk)
            );

            responseFromServerToClient.on("end", () => {
              res.write(Buffer.concat(buffer));
              res.end();
            });
          });
        } else {
          http.get(urlToServer, (responseFromServerToClient) => {
            const buffer = [];
  
            responseFromServerToClient.on("data", (chunk) => buffer.push(chunk));
  
            responseFromServerToClient.on("end", () => {
              res.write(Buffer.concat(buffer));
              res.end();
            });
          });
        }
      }
    }
  });
});

function setHostAndPortHandler(url) {
  let urlObj = new URL(url);
  let isHttps = url.includes("https");
  const host = urlObj.host.replace("www.", "");

  if (!isHttps) {
    console.log("Is not https");
    return host.concat(":80");
  } else {
    console.log("Is https");
    return host.concat(":443");
  }
}

function setProtocolHandler(url) {
  let isHttps = url.includes("https");

  if (!isHttps) {
    return "http:";
  } else {
    return "https:";
  }
}

// function retrieveDnslink(host) {
//   // Get all TXT records from _dnslink.hostname
//   dns.resolveTxt("_dnslink." + host, function (err, dnslink) {
//     if (err || !Array.isArray(dnslink[0])) {
//       //console.log(err);
//       return;
//     }

//     if (dnslink[0][0].includes("dnslink")) {
//       const content = dnslink[0][0].replace("dnslink=", "");
//       let isHttps = content.includes("https");

//       // FIXME: This check should be adjusted to see if incoming dnslink protocol, other then https, has support
//       if (!isHttps) {
//         let protocol = content.substring(
//           content.indexOf("/") + 1,
//           content.lastIndexOf("/")
//         );
//         console.log("Unsupported protocol: " + protocol);
//         return;
//         // TODO: Add logic here for IPFS content
//       } else {
//         //return content;

//         console.log("Retrieved dnslink url - " + content);

//         urlToServer.host = "example.org:80";

//         http.get(urlToServer, (responseFromServerForClient) => {
//           const buffer = [];

//           responseFromServerForClient.on("data", (chunk) => buffer.push(chunk));

//           responseFromServerForClient.on("end", () => {
//             res.write(Buffer.concat(buffer));
//             res.end();
//           });
//         });
//       }
//     }
//   });
// }

// error handling
server.on("error", function (err) {
  console.log("An internal error has occurred!");
  console.log(err);
});

server.on("close", function () {
  console.log("Client disconnected");
});

server.listen(port, function () {
  console.log(`Server listening to port ${port}`);
});
