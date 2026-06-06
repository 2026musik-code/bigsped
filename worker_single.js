import { connect } from "cloudflare:sockets";


// Variables
let serviceName = "";
let APP_DOMAIN = "";

let prxIP = "";
let cachedPrxList = [];

// Constant
const horse = "dHJvamFu";
const flash = "dmxlc3M=";
const v2 = "djJyYXk=";
const neko = "Y2xhc2g=";

const PORTS = [443, 80];
const PROTOCOLS = [atob(horse), atob(flash), "ss"];
const SUB_PAGE_URL = "https://foolvpn.web.id/nautica";
const KV_PRX_URL = "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/kvProxyList.json";
const PRX_BANK_URL = "https://raw.githubusercontent.com/FoolVPN-ID/Nautica/refs/heads/main/proxyList.txt";
const DNS_SERVER_ADDRESS = "8.8.8.8";
const DNS_SERVER_PORT = 53;
const RELAY_SERVER_UDP = {
  host: "udp-relay.hobihaus.space", // Kontribusi atau cek relay publik disini: https://hub.docker.com/r/kelvinzer0/udp-relay
  port: 7300,
};
const PRX_HEALTH_CHECK_API = "https://id1.foolvpn.web.id/api/v1/check";
const CONVERTER_URL = "https://api.foolvpn.web.id/convert";
const WS_READY_STATE_OPEN = 1;
const WS_READY_STATE_CLOSING = 2;
const CORS_HEADER_OPTIONS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
  "Access-Control-Max-Age": "86400",
};

async function getKVPrxList(kvPrxUrl = KV_PRX_URL) {
  try {
    if (!kvPrxUrl) return {"ID":["104.18.2.2:443"]};
    const response = await fetch(kvPrxUrl);
    if (response.status === 200) {
      return await response.json();
    }
  } catch (e) {
    console.log("Proxy list fetch failed: ", e);
  }
  return { "ID": ["104.18.2.2:443"] };
}

async function getPrxList(prxBankUrl = PRX_BANK_URL) {
  /**
   * Format:
   *
   * <IP>,<Port>,<Country ID>,<ORG>
   * Contoh:
   * 1.1.1.1,443,SG,Cloudflare Inc.
   */
  if (!prxBankUrl) {
    throw new Error("No URL Provided!");
  }

  const prxBank = await fetch(prxBankUrl);
  if (prxBank.status == 200) {
    const text = (await prxBank.text()) || "";

    const prxString = text.split("\n").filter(Boolean);
    cachedPrxList = prxString
      .map((entry) => {
        const [prxIP, prxPort, country, org] = entry.split(",");
        return {
          prxIP: prxIP || "Unknown",
          prxPort: prxPort || "Unknown",
          country: country || "Unknown",
          org: org || "Unknown Org",
        };
      })
      .filter(Boolean);
  }

  return cachedPrxList;
}

async function reverseWeb(request, target, targetPath) {
  const targetUrl = new URL(request.url);
  const targetChunk = target.split(":");

  targetUrl.hostname = targetChunk[0];
  targetUrl.port = targetChunk[1]?.toString() || "443";
  targetUrl.pathname = targetPath || targetUrl.pathname;

  const modifiedRequest = new Request(targetUrl, request);

  modifiedRequest.headers.set("X-Forwarded-Host", request.headers.get("Host"));

  const response = await fetch(modifiedRequest);

  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(CORS_HEADER_OPTIONS)) {
    newResponse.headers.set(key, value);
  }
  newResponse.headers.set("X-Proxied-By", "Cloudflare Worker");

  return newResponse;
}

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      APP_DOMAIN = url.hostname;
      serviceName = APP_DOMAIN.split(".")[0];

      const upgradeHeader = request.headers.get("Upgrade");

      // Handle prx client
      if (upgradeHeader === "websocket") {
        const prxMatch = url.pathname.match(/^\/(.+[:=-]\d+)$/);

        if (url.pathname.length == 3 || url.pathname.match(",")) {
          // Contoh: /ID, /SG, dll
          const prxKeys = url.pathname.replace("/", "").toUpperCase().split(",");
          const prxKey = prxKeys[Math.floor(Math.random() * prxKeys.length)];
          const kvPrx = await getKVPrxList();
          if (!kvPrx || !kvPrx[prxKey] || kvPrx[prxKey].length === 0) {
            return new Response('Proxy category ' + prxKey + ' not found or empty. \nAvailable:  ' + Object.keys(kvPrx||{}).join(','), {status: 500});
          }
          prxIP = kvPrx[prxKey][Math.floor(Math.random() * kvPrx[prxKey].length)];

          return await websocketHandler(request);
        } else if (prxMatch) {
          prxIP = prxMatch[1];
          return await websocketHandler(request);
        }
      }

      if (url.pathname.startsWith("/sub")) {
        return Response.redirect(SUB_PAGE_URL + `?host=${APP_DOMAIN}`, 301);
      } else if (url.pathname.startsWith("/check")) {
        const target = url.searchParams.get("target").split(":");
        const result = await checkPrxHealth(target[0], target[1] || "443");

        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            ...CORS_HEADER_OPTIONS,
            "Content-Type": "application/json",
          },
        });
      } else if (url.pathname.startsWith("/api/v1")) {
        const apiPath = url.pathname.replace("/api/v1", "");

        if (apiPath.startsWith("/sub")) {
          const filterCC = url.searchParams.get("cc")?.split(",") || [];
          const filterPort = url.searchParams.get("port")?.split(",") || PORTS;
          const filterVPN = url.searchParams.get("vpn")?.split(",") || PROTOCOLS;
          const filterLimit = parseInt(url.searchParams.get("limit")) || 10;
          const filterFormat = url.searchParams.get("format") || "raw";
          const fillerDomain = url.searchParams.get("domain") || url.searchParams.get("host") || APP_DOMAIN;

          const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;
          const prxList = await getPrxList(prxBankUrl)
            .then((prxs) => {
              // Filter CC
              if (filterCC.length) {
                return prxs.filter((prx) => filterCC.includes(prx.country));
              }
              return prxs;
            })
            .then((prxs) => {
              // shuffle result
              shuffleArray(prxs);
              return prxs;
            });

          const uuid = crypto.randomUUID();
          const result = [];
          for (const prx of prxList) {
            const uri = new URL(`${atob(horse)}://${fillerDomain}`);
            uri.searchParams.set("encryption", "none");
            uri.searchParams.set("type", "ws");
            uri.searchParams.set("host", APP_DOMAIN);

            for (const port of filterPort) {
              for (const protocol of filterVPN) {
                if (result.length >= filterLimit) break;

                uri.protocol = protocol;
                uri.port = port.toString();
                if (protocol == "ss") {
                  uri.username = btoa(`none:${uuid}`);
                  uri.searchParams.set(
                    "plugin",
                    `${atob(v2)}-plugin${port == 80 ? "" : ";tls"};mux=0;mode=websocket;path=/${prx.prxIP}-${
                      prx.prxPort
                    };host=${APP_DOMAIN}`
                  );
                } else {
                  uri.username = uuid;
                }

                uri.searchParams.set("security", port == 443 ? "tls" : "none");
                uri.searchParams.set("sni", port == 80 && protocol == atob(flash) ? "" : APP_DOMAIN);
                uri.searchParams.set("path", `/${prx.prxIP}-${prx.prxPort}`);

                uri.hash = `${result.length + 1} ${getFlagEmoji(prx.country)} ${prx.org} WS ${
                  port == 443 ? "TLS" : "NTLS"
                } [${serviceName}]`;
                result.push(uri.toString());
              }
            }
          }

          let finalResult = "";
          switch (filterFormat) {
            case "raw":
              finalResult = result.join("\n");
              break;
            case atob(v2):
              finalResult = btoa(result.join("\n"));
              break;
            case atob(neko):
            case "sfa":
            case "bfr":
              const res = await fetch(CONVERTER_URL, {
                method: "POST",
                body: JSON.stringify({
                  url: result.join(","),
                  format: filterFormat,
                  template: "cf",
                }),
              });
              if (res.status == 200) {
                finalResult = await res.text();
              } else {
                return new Response(res.statusText, {
                  status: res.status,
                  headers: {
                    ...CORS_HEADER_OPTIONS,
                  },
                });
              }
              break;
          }

          return new Response(finalResult, {
            status: 200,
            headers: {
              ...CORS_HEADER_OPTIONS,
            },
          });
        } else if (apiPath.startsWith("/myip")) {
          return new Response(
            JSON.stringify({
              ip:
                request.headers.get("cf-connecting-ipv6") ||
                request.headers.get("cf-connecting-ip") ||
                request.headers.get("x-real-ip"),
              colo: request.headers.get("cf-ray")?.split("-")[1],
              ...request.cf,
            }),
            {
              headers: {
                ...CORS_HEADER_OPTIONS,
              },
            }
          );
        } else if (apiPath.startsWith("/proxies")) {
          const limit = parseInt(url.searchParams.get("limit")) || 12;
          const search = url.searchParams.get("search")?.toLowerCase() || "";
          const prxBankUrl = url.searchParams.get("prx-list") || env.PRX_BANK_URL;

          let prxList = await getPrxList(prxBankUrl);

          if (search) {
            prxList = prxList.filter(p =>
              p.country.toLowerCase().includes(search) ||
              p.org.toLowerCase().includes(search)
            );
          }

          shuffleArray(prxList);

          const result = prxList.slice(0, limit).map(p => ({
            ...p,
            flag: getFlagEmoji(p.country)
          }));

          return new Response(JSON.stringify(result), {
            status: 200,
            headers: {
              ...CORS_HEADER_OPTIONS,
              "Content-Type": "application/json",
            },
          });
        }
      }

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
        },
      });
    } catch (err) {
      return new Response(`An error occurred: ${err.toString()}`, {
        status: 500,
        headers: {
          ...CORS_HEADER_OPTIONS,
        },
      });
    }
  },
};

async function websocketHandler(request) {
  const webSocketPair = new WebSocketPair();
  const [client, webSocket] = Object.values(webSocketPair);

  webSocket.accept();

  let addressLog = "";
  let portLog = "";
  const log = (info, event) => {
    console.log(`[${addressLog}:${portLog}] ${info}`, event || "");
  };
  const earlyDataHeader = request.headers.get("sec-websocket-protocol") || "";

  const readableWebSocketStream = makeReadableWebSocketStream(webSocket, earlyDataHeader, log);

  let remoteSocketWrapper = {
    value: null,
  };
  let isDNS = false;

  readableWebSocketStream
    .pipeTo(
      new WritableStream({
        async write(chunk, controller) {
          if (isDNS) {
            return handleUDPOutbound(
              DNS_SERVER_ADDRESS,
              DNS_SERVER_PORT,
              chunk,
              webSocket,
              null,
              log,
              RELAY_SERVER_UDP
            );
          }
          if (remoteSocketWrapper.value) {
            const writer = remoteSocketWrapper.value.writable.getWriter();
            await writer.write(chunk);
            writer.releaseLock();
            return;
          }

          const protocol = await protocolSniffer(chunk);
          let protocolHeader;

          if (protocol === atob(horse)) {
            protocolHeader = readHorseHeader(chunk);
          } else if (protocol === atob(flash)) {
            protocolHeader = readFlashHeader(chunk);
          } else if (protocol === "ss") {
            protocolHeader = readSsHeader(chunk);
          } else {
            throw new Error("Unknown Protocol!");
          }

          addressLog = protocolHeader.addressRemote;
          portLog = `${protocolHeader.portRemote} -> ${protocolHeader.isUDP ? "UDP" : "TCP"}`;

          if (protocolHeader.hasError) {
            throw new Error(protocolHeader.message);
          }

          if (protocolHeader.isUDP) {
            if (protocolHeader.portRemote === 53) {
              isDNS = true;
              return handleUDPOutbound(
                DNS_SERVER_ADDRESS,
                DNS_SERVER_PORT,
                chunk,
                webSocket,
                protocolHeader.version,
                log,
                RELAY_SERVER_UDP
              );
            }

            return handleUDPOutbound(
              protocolHeader.addressRemote,
              protocolHeader.portRemote,
              chunk,
              webSocket,
              protocolHeader.version,
              log,
              RELAY_SERVER_UDP
            );
          }

          handleTCPOutBound(
            remoteSocketWrapper,
            protocolHeader.addressRemote,
            protocolHeader.portRemote,
            protocolHeader.rawClientData,
            webSocket,
            protocolHeader.version,
            log
          );
        },
        close() {
          log(`readableWebSocketStream is close`);
        },
        abort(reason) {
          log(`readableWebSocketStream is abort`, JSON.stringify(reason));
        },
      })
    )
    .catch((err) => {
      log("readableWebSocketStream pipeTo error", err);
    });

  return new Response(null, {
    status: 101,
    webSocket: client,
  });
}

async function protocolSniffer(buffer) {
  if (buffer.byteLength >= 62) {
    const horseDelimiter = new Uint8Array(buffer.slice(56, 60));
    if (horseDelimiter[0] === 0x0d && horseDelimiter[1] === 0x0a) {
      if (horseDelimiter[2] === 0x01 || horseDelimiter[2] === 0x03 || horseDelimiter[2] === 0x7f) {
        if (horseDelimiter[3] === 0x01 || horseDelimiter[3] === 0x03 || horseDelimiter[3] === 0x04) {
          return atob(horse);
        }
      }
    }
  }

  const flashDelimiter = new Uint8Array(buffer.slice(1, 17));
  // Hanya mendukung UUID v4
  if (arrayBufferToHex(flashDelimiter).match(/^[0-9a-f]{8}[0-9a-f]{4}4[0-9a-f]{3}[89ab][0-9a-f]{3}[0-9a-f]{12}$/i)) {
    return atob(flash);
  }

  return "ss"; // default
}

async function handleTCPOutBound(
  remoteSocket,
  addressRemote,
  portRemote,
  rawClientData,
  webSocket,
  responseHeader,
  log
) {
  async function connectAndWrite(address, port) {
    const tcpSocket = connect({
      hostname: address,
      port: port,
    });
    remoteSocket.value = tcpSocket;
    log(`connected to ${address}:${port}`);
    const writer = tcpSocket.writable.getWriter();
    await writer.write(rawClientData);
    writer.releaseLock();

    return tcpSocket;
  }

  async function retry() {
    const tcpSocket = await connectAndWrite(
      prxIP.split(/[:=-]/)[0] || addressRemote,
      prxIP.split(/[:=-]/)[1] || portRemote
    );
    tcpSocket.closed
      .catch((error) => {
        console.log("retry tcpSocket closed error", error);
      })
      .finally(() => {
        safeCloseWebSocket(webSocket);
      });
    remoteSocketToWS(tcpSocket, webSocket, responseHeader, null, log);
  }

  try {
    const tcpSocket = await connectAndWrite(addressRemote, portRemote);
    remoteSocketToWS(tcpSocket, webSocket, responseHeader, retry, log);
  } catch (err) {
    log("initial conn fail", err);
    await retry();
  }
}

async function handleUDPOutbound(targetAddress, targetPort, dataChunk, webSocket, responseHeader, log, relay) {
  try {
    let protocolHeader = responseHeader;

    const tcpSocket = connect({
      hostname: relay.host,
      port: relay.port,
    });

    const header = `udp:${targetAddress}:${targetPort}`;
    const headerBuffer = new TextEncoder().encode(header);
    const separator = new Uint8Array([0x7c]);
    const relayMessage = new Uint8Array(headerBuffer.length + separator.length + dataChunk.byteLength);
    relayMessage.set(headerBuffer, 0);
    relayMessage.set(separator, headerBuffer.length);
    relayMessage.set(new Uint8Array(dataChunk), headerBuffer.length + separator.length);

    const writer = tcpSocket.writable.getWriter();
    await writer.write(relayMessage);
    writer.releaseLock();

    await tcpSocket.readable.pipeTo(
      new WritableStream({
        async write(chunk) {
          if (webSocket.readyState === WS_READY_STATE_OPEN) {
            if (protocolHeader) {
              webSocket.send(await new Blob([protocolHeader, chunk]).arrayBuffer());
              protocolHeader = null;
            } else {
              webSocket.send(chunk);
            }
          }
        },
        close() {
          log(`UDP connection to ${targetAddress} closed`);
        },
        abort(reason) {
          console.error(`UDP connection aborted due to ${reason}`);
        },
      })
    );
  } catch (e) {
    console.error(`Error while handling UDP outbound: ${e.message}`);
  }
}

function makeReadableWebSocketStream(webSocketServer, earlyDataHeader, log) {
  let readableStreamCancel = false;
  const stream = new ReadableStream({
    start(controller) {
      webSocketServer.addEventListener("message", (event) => {
        if (readableStreamCancel) {
          return;
        }
        const message = event.data;
        controller.enqueue(message);
      });
      webSocketServer.addEventListener("close", () => {
        safeCloseWebSocket(webSocketServer);
        if (readableStreamCancel) {
          return;
        }
        controller.close();
      });
      webSocketServer.addEventListener("error", (err) => {
        log("webSocketServer has error");
        controller.error(err);
      });
      const { earlyData, error } = base64ToArrayBuffer(earlyDataHeader);
      if (error) {
        controller.error(error);
      } else if (earlyData) {
        controller.enqueue(earlyData);
      }
    },

    pull(controller) {},
    cancel(reason) {
      if (readableStreamCancel) {
        return;
      }
      log(`ReadableStream was canceled, due to ${reason}`);
      readableStreamCancel = true;
      safeCloseWebSocket(webSocketServer);
    },
  });

  return stream;
}

function readSsHeader(ssBuffer) {
  const view = new DataView(ssBuffer);

  const addressType = view.getUint8(0);
  let addressLength = 0;
  let addressValueIndex = 1;
  let addressValue = "";

  switch (addressType) {
    case 1:
      addressLength = 4;
      addressValue = new Uint8Array(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 3:
      addressLength = new Uint8Array(ssBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 4:
      addressLength = 16;
      const dataView = new DataView(ssBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `Invalid addressType for SS: ${addressType}`,
      };
  }

  if (!addressValue) {
    return {
      hasError: true,
      message: `Destination address empty, address type is: ${addressType}`,
    };
  }

  const portIndex = addressValueIndex + addressLength;
  const portBuffer = ssBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: portIndex + 2,
    rawClientData: ssBuffer.slice(portIndex + 2),
    version: null,
    isUDP: portRemote == 53,
  };
}

function readFlashHeader(buffer) {
  const version = new Uint8Array(buffer.slice(0, 1));
  let isUDP = false;

  const optLength = new Uint8Array(buffer.slice(17, 18))[0];

  const cmd = new Uint8Array(buffer.slice(18 + optLength, 18 + optLength + 1))[0];
  if (cmd === 1) {
  } else if (cmd === 2) {
    isUDP = true;
  } else {
    return {
      hasError: true,
      message: `command ${cmd} is not supported`,
    };
  }
  const portIndex = 18 + optLength + 1;
  const portBuffer = buffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);

  let addressIndex = portIndex + 2;
  const addressBuffer = new Uint8Array(buffer.slice(addressIndex, addressIndex + 1));

  const addressType = addressBuffer[0];
  let addressLength = 0;
  let addressValueIndex = addressIndex + 1;
  let addressValue = "";
  switch (addressType) {
    case 1: // For IPv4
      addressLength = 4;
      addressValue = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 2: // For Domain
      addressLength = new Uint8Array(buffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(buffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 3: // For IPv6
      addressLength = 16;
      const dataView = new DataView(buffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `invild  addressType is ${addressType}`,
      };
  }
  if (!addressValue) {
    return {
      hasError: true,
      message: `addressValue is empty, addressType is ${addressType}`,
    };
  }

  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: addressValueIndex + addressLength,
    rawClientData: buffer.slice(addressValueIndex + addressLength),
    version: new Uint8Array([version[0], 0]),
    isUDP: isUDP,
  };
}

function readHorseHeader(buffer) {
  const dataBuffer = buffer.slice(58);
  if (dataBuffer.byteLength < 6) {
    return {
      hasError: true,
      message: "invalid request data",
    };
  }

  let isUDP = false;
  const view = new DataView(dataBuffer);
  const cmd = view.getUint8(0);
  if (cmd == 3) {
    isUDP = true;
  } else if (cmd != 1) {
    throw new Error("Unsupported command type!");
  }

  let addressType = view.getUint8(1);
  let addressLength = 0;
  let addressValueIndex = 2;
  let addressValue = "";
  switch (addressType) {
    case 1: // For IPv4
      addressLength = 4;
      addressValue = new Uint8Array(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength)).join(".");
      break;
    case 3: // For Domain
      addressLength = new Uint8Array(dataBuffer.slice(addressValueIndex, addressValueIndex + 1))[0];
      addressValueIndex += 1;
      addressValue = new TextDecoder().decode(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      break;
    case 4: // For IPv6
      addressLength = 16;
      const dataView = new DataView(dataBuffer.slice(addressValueIndex, addressValueIndex + addressLength));
      const ipv6 = [];
      for (let i = 0; i < 8; i++) {
        ipv6.push(dataView.getUint16(i * 2).toString(16));
      }
      addressValue = ipv6.join(":");
      break;
    default:
      return {
        hasError: true,
        message: `invalid addressType is ${addressType}`,
      };
  }

  if (!addressValue) {
    return {
      hasError: true,
      message: `address is empty, addressType is ${addressType}`,
    };
  }

  const portIndex = addressValueIndex + addressLength;
  const portBuffer = dataBuffer.slice(portIndex, portIndex + 2);
  const portRemote = new DataView(portBuffer).getUint16(0);
  return {
    hasError: false,
    addressRemote: addressValue,
    addressType: addressType,
    portRemote: portRemote,
    rawDataIndex: portIndex + 4,
    rawClientData: dataBuffer.slice(portIndex + 4),
    version: null,
    isUDP: isUDP,
  };
}

async function remoteSocketToWS(remoteSocket, webSocket, responseHeader, retry, log) {
  let header = responseHeader;
  let hasIncomingData = false;
  await remoteSocket.readable
    .pipeTo(
      new WritableStream({
        start() {},
        async write(chunk, controller) {
          hasIncomingData = true;
          if (webSocket.readyState !== WS_READY_STATE_OPEN) {
            controller.error("webSocket.readyState is not open, maybe close");
          }
          if (header) {
            webSocket.send(await new Blob([header, chunk]).arrayBuffer());
            header = null;
          } else {
            webSocket.send(chunk);
          }
        },
        close() {
          log(`remoteConnection!.readable is close with hasIncomingData is ${hasIncomingData}`);
        },
        abort(reason) {
          console.error(`remoteConnection!.readable abort`, reason);
        },
      })
    )
    .catch((error) => {
      console.error(`remoteSocketToWS has exception `, error.stack || error);
      safeCloseWebSocket(webSocket);
    });
  if (hasIncomingData === false && retry) {
    log(`retry`);
    retry();
  }
}

function safeCloseWebSocket(socket) {
  try {
    if (socket.readyState === WS_READY_STATE_OPEN || socket.readyState === WS_READY_STATE_CLOSING) {
      socket.close();
    }
  } catch (error) {
    console.error("safeCloseWebSocket error", error);
  }
}

async function checkPrxHealth(prxIP, prxPort) {
  const start = Date.now();
  try {
    // Attempt to use the primary health check API
    const req = await fetch(`${PRX_HEALTH_CHECK_API}?ip=${prxIP}:${prxPort}`);
    const data = await req.json();
    const delay = Date.now() - start;

    // Check if the API returned valid data
    if (data.country && data.asOrganization) {
      return {
        ...data,
        delay: data.delay || delay,
        flag: getFlagEmoji(data.regionCode || data.countryCode || "UN")
      };
    }

    throw new Error("Primary API empty response");
  } catch (e) {
    // Fallback: Use ip-api.com for metadata and local ping time
    try {
      const geoReq = await fetch(`http://ip-api.com/json/${prxIP}`);
      const geoData = await geoReq.json();
      const delay = Date.now() - start;

      return {
        ip: prxIP,
        port: prxPort,
        proxyip: true,
        delay: delay,
        country: geoData.country,
        regionCode: geoData.countryCode,
        flag: getFlagEmoji(geoData.countryCode || "UN"),
        asOrganization: geoData.isp || geoData.org,
        message: "Fallback data"
      };
    } catch (err) {
        return {
            ip: prxIP,
            port: prxPort,
            proxyip: false,
            delay: 0,
            message: "All checks failed"
        };
    }
  }
}

// Helpers
function base64ToArrayBuffer(base64Str) {
  if (!base64Str) {
    return { error: null };
  }
  try {
    base64Str = base64Str.replace(/-/g, "+").replace(/_/g, "/");
    const decode = atob(base64Str);
    const arryBuffer = Uint8Array.from(decode, (c) => c.charCodeAt(0));
    return { earlyData: arryBuffer.buffer, error: null };
  } catch (error) {
    return { error };
  }
}

function arrayBufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

function shuffleArray(array) {
  let currentIndex = array.length;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    let randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
}

function reverse(s) {
  return s.split("").reverse().join("");
}

function getFlagEmoji(isoCode) {
  const codePoints = isoCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}


const html = "<!DOCTYPE html>\n<html lang=\"id\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Nautica Dashboard</title>\n    <script src=\"https://cdn.tailwindcss.com\"></script>\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap\" rel=\"stylesheet\">\n    <script>\n        tailwind.config = {\n            theme: {\n                extend: {\n                    fontFamily: {\n                        sans: ['Inter', 'sans-serif'],\n                    },\n                    colors: {\n                        glass: 'rgba(255, 255, 255, 0.1)',\n                        glassBorder: 'rgba(255, 255, 255, 0.2)',\n                    }\n                }\n            }\n        }\n    </script>\n    <style>\n        body {\n            background-color: #0f172a;\n            background-image:\n                radial-gradient(at 0% 0%, hsla(253,16%,7%,1) 0, transparent 50%),\n                radial-gradient(at 50% 0%, hsla(225,39%,30%,1) 0, transparent 50%),\n                radial-gradient(at 100% 0%, hsla(339,49%,30%,1) 0, transparent 50%);\n            background-attachment: fixed;\n            color: #f8fafc;\n        }\n        .glass-panel {\n            background: rgba(255, 255, 255, 0.05);\n            backdrop-filter: blur(10px);\n            -webkit-backdrop-filter: blur(10px);\n            border: 1px solid rgba(255, 255, 255, 0.1);\n            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);\n        }\n        .animate-fade-in {\n            animation: fadeIn 0.5s ease-out;\n        }\n        @keyframes fadeIn {\n            from { opacity: 0; transform: translateY(10px); }\n            to { opacity: 1; transform: translateY(0); }\n        }\n    </style>\n</head>\n<body class=\"min-h-screen flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white\">\n\n    <div class=\"max-w-4xl w-full space-y-8 animate-fade-in\">\n\n        <!-- Header -->\n        <div class=\"text-center space-y-2\">\n            <h1 class=\"text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 tracking-tight\">\n                SERVER SIMPEL\n            </h1>\n            <p class=\"text-slate-400 text-lg\">Advanced Cloudflare VLESS/Trojan Worker</p>\n        </div>\n\n        <!-- Status Card -->\n        <div class=\"glass-panel rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4\">\n            <div class=\"flex items-center gap-3\">\n                <div class=\"relative\">\n                    <div class=\"w-3 h-3 bg-green-500 rounded-full animate-ping absolute\"></div>\n                    <div class=\"w-3 h-3 bg-green-500 rounded-full relative\"></div>\n                </div>\n                <div>\n                    <p class=\"text-sm text-slate-400\">System Status</p>\n                    <p class=\"font-semibold text-green-400\">Operational</p>\n                </div>\n            </div>\n            <div class=\"text-right\">\n                <p class=\"text-sm text-slate-400\">Your IP</p>\n                <p id=\"user-ip\" class=\"font-mono text-cyan-300\">Loading...</p>\n            </div>\n        </div>\n\n        <!-- Main Configuration -->\n        <div class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n\n            <!-- Controls -->\n            <div class=\"glass-panel rounded-2xl p-6 space-y-6\">\n                <h2 class=\"text-xl font-semibold border-b border-white/10 pb-4 flex items-center gap-2\">\n                    <svg class=\"w-5 h-5 text-purple-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4\"></path></svg>\n                    Configuration\n                </h2>\n\n                <div class=\"space-y-4\">\n                    <!-- UUID -->\n                    <div>\n                        <label class=\"block text-sm font-medium text-slate-300 mb-1\">UUID</label>\n                        <div class=\"flex gap-2\">\n                            <input type=\"text\" id=\"uuid\" class=\"w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm\" placeholder=\"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx\">\n                            <button onclick=\"generateUUID()\" class=\"p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition\" title=\"Generate New UUID\">\n                                <svg class=\"w-5 h-5 text-cyan-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15\"></path></svg>\n                            </button>\n                        </div>\n                    </div>\n\n                    <!-- Proxy IP (Optional) -->\n                    <div>\n                        <label class=\"block text-sm font-medium text-slate-300 mb-1\">Proxy IP:Port (Optional)</label>\n                        <input type=\"text\" id=\"proxyInput\" class=\"w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm\" placeholder=\"1.1.1.1:443\">\n                    </div>\n\n                    <!-- Domain -->\n                    <div>\n                        <label class=\"block text-sm font-medium text-slate-300 mb-1\">Worker Domain (SNI)</label>\n                        <input type=\"text\" id=\"domain\" class=\"w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition font-mono text-sm\">\n                    </div>\n\n                    <!-- Format -->\n                    <div>\n                        <label class=\"block text-sm font-medium text-slate-300 mb-1\">Format Output</label>\n                        <select id=\"format\" class=\"w-full bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 transition text-sm\">\n                            <option value=\"raw\">Raw (VLESS/Trojan Links)</option>\n                            <option value=\"clash\">Clash (YAML)</option>\n                            <option value=\"v2ray\">V2Ray (Base64)</option>\n                            <option value=\"singbox\">Sing-box (JSON)</option>\n                        </select>\n                    </div>\n\n                    <button onclick=\"getSubscription()\" class=\"w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/20 transition transform hover:scale-[1.02] active:scale-95\">\n                        Generate Configuration\n                    </button>\n                </div>\n            </div>\n\n            <!-- Result -->\n            <div class=\"glass-panel rounded-2xl p-6 flex flex-col h-full\">\n                <h2 class=\"text-xl font-semibold border-b border-white/10 pb-4 flex items-center gap-2 mb-4\">\n                    <svg class=\"w-5 h-5 text-green-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z\"></path></svg>\n                    Result\n                </h2>\n                <div class=\"relative flex-1\">\n                    <textarea id=\"output\" readonly class=\"w-full h-64 md:h-full bg-slate-900/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 focus:outline-none resize-none\" placeholder=\"Configuration will appear here...\"></textarea>\n                    <button onclick=\"copyToClipboard()\" class=\"absolute top-2 right-2 p-2 bg-slate-800/80 rounded-md hover:bg-slate-700 transition text-slate-400 hover:text-white backdrop-blur-sm\">\n                        <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3\"></path></svg>\n                    </button>\n                </div>\n            </div>\n        </div>\n\n            <!-- List Proxy -->\n            <div class=\"glass-panel rounded-2xl p-6 col-span-1 md:col-span-2 space-y-6\">\n                 <div class=\"flex flex-col md:flex-row items-center justify-between border-b border-white/10 pb-4 gap-4\">\n                    <h2 class=\"text-xl font-semibold flex items-center gap-2 w-full md:w-auto\">\n                        <svg class=\"w-5 h-5 text-yellow-400\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10\"></path></svg>\n                        LIST PROXY\n                    </h2>\n\n                    <div class=\"flex gap-2 w-full md:w-auto\">\n                        <input type=\"text\" id=\"proxy-search\" placeholder=\"Search Country or ISP...\" class=\"bg-slate-900/50 border border-white/10 rounded-lg px-4 py-1.5 focus:outline-none focus:border-cyan-500 transition font-mono text-sm w-full md:w-64\" onkeydown=\"if(event.key === 'Enter') loadProxies()\">\n                        <button onclick=\"loadProxies()\" class=\"text-sm bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition\" title=\"Search\">\n                            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z\"></path></svg>\n                        </button>\n                    </div>\n                </div>\n\n                <div id=\"proxy-grid\" class=\"grid grid-cols-1 md:grid-cols-3 gap-4\">\n                    <!-- Proxies will be loaded here -->\n                    <div class=\"col-span-3 text-center text-slate-400 py-8\">Loading proxies...</div>\n                </div>\n            </div>\n\n        <!-- Footer -->\n        <footer class=\"text-center text-slate-500 text-sm py-4\">\n            <p>&copy; 2024 Nautica Worker. Design by FoolVPN & Jules.</p>\n        </footer>\n\n    </div>\n\n    <!-- Modal -->\n    <div id=\"modal\" class=\"fixed inset-0 z-50 hidden\">\n        <div class=\"absolute inset-0 bg-black/60 backdrop-blur-sm\" onclick=\"closeModal()\"></div>\n        <div class=\"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl p-4\">\n            <div class=\"glass-panel rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto\">\n                <div class=\"flex justify-between items-center border-b border-white/10 pb-4\">\n                    <h3 class=\"text-xl font-semibold text-cyan-400\">Configuration Result</h3>\n                    <button onclick=\"closeModal()\" class=\"text-slate-400 hover:text-white\">\n                        <svg class=\"w-6 h-6\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M6 18L18 6M6 6l12 12\"></path></svg>\n                    </button>\n                </div>\n\n                <div class=\"grid grid-cols-1 md:grid-cols-2 gap-6\">\n                    <div class=\"flex flex-col items-center justify-center space-y-2 bg-slate-900/50 p-4 rounded-xl border border-white/10\">\n                        <img id=\"qr-code\" src=\"\" alt=\"QR Code\" class=\"w-48 h-48 rounded-lg bg-white p-2\">\n                        <p class=\"text-xs text-slate-400\">Scan to import</p>\n                    </div>\n                    <div class=\"relative h-full min-h-[200px]\">\n                         <textarea id=\"modal-output\" readonly class=\"w-full h-full bg-slate-900/80 border border-white/10 rounded-lg p-4 font-mono text-xs text-green-400 focus:outline-none resize-none\"></textarea>\n                         <button onclick=\"copyModalClipboard()\" class=\"absolute top-2 right-2 p-2 bg-slate-800/80 rounded-md hover:bg-slate-700 transition text-slate-400 hover:text-white backdrop-blur-sm\">\n                            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3\"></path></svg>\n                        </button>\n                    </div>\n                </div>\n            </div>\n        </div>\n    </div>\n\n    <script>\n        // Init\n        document.addEventListener('DOMContentLoaded', () => {\n            document.getElementById('domain').value = window.location.hostname;\n            fetchIP();\n            generateUUID();\n            loadProxies();\n        });\n\n        async function fetchIP() {\n            try {\n                const res = await fetch('/api/v1/myip');\n                const data = await res.json();\n                document.getElementById('user-ip').innerText = data.ip + ' (' + data.colo + ')';\n            } catch (e) {\n                document.getElementById('user-ip').innerText = 'Unknown';\n            }\n        }\n\n        function generateUUID() {\n            const uuid = crypto.randomUUID();\n            document.getElementById('uuid').value = uuid;\n        }\n\n        async function getSubscription() {\n            const btn = document.querySelector('button[onclick=\"getSubscription()\"]');\n            const output = document.getElementById('output');\n            const proxyInput = document.getElementById('proxyInput').value.trim();\n\n            btn.disabled = true;\n            btn.innerHTML = '<span class=\"animate-spin inline-block mr-2\">&#9696;</span> Processing...';\n            output.value = 'Processing...';\n\n            try {\n                let resultText = \"\";\n\n                // Check specific proxy if input provided\n                if (proxyInput) {\n                    output.value = 'Checking proxy ' + proxyInput + '...';\n                    const checkUrl = new URL('/check', window.location.origin);\n                    checkUrl.searchParams.set('target', proxyInput);\n\n                    const checkRes = await fetch(checkUrl);\n                    if (checkRes.ok) {\n                        const data = await checkRes.json();\n                        const flag = data.flag || \"🏳️\";\n                        const country = data.country || data.regionCode || \"Unknown\";\n                        const isp = data.asOrganization || \"Unknown ISP\";\n                        const delay = data.delay || \"N/A\";\n\n                        resultText += `================================\n`;\n                        resultText += `SERVER STATUS\n`;\n                        resultText += `================================\n`;\n                        resultText += `IP      : ${data.ip}\n`;\n                        resultText += `Port    : ${data.port}\n`;\n                        resultText += `Country : ${flag} ${country}\n`;\n                        resultText += `ISP     : ${isp}\n`;\n                        resultText += `Ping    : ${delay}ms\n`;\n                        resultText += `================================\n\n`;\n                    } else {\n                        resultText += `Failed to check proxy: ${checkRes.statusText}\n\n`;\n                    }\n                }\n\n                // Generate Subscription Links\n                const domain = document.getElementById('domain').value;\n                const format = document.getElementById('format').value;\n                const url = new URL('/api/v1/sub', window.location.origin);\n                url.searchParams.set('host', domain);\n                url.searchParams.set('format', format);\n                url.searchParams.set('limit', '10');\n\n                const subRes = await fetch(url);\n                if (subRes.ok) {\n                    const text = await subRes.text();\n                    const accounts = text.split(String.fromCharCode(10)).filter(line => line.trim() !== '');\n                    const separator = String.fromCharCode(10) + '================================' + String.fromCharCode(10);\n                    if (accounts.length > 0) {\n                        resultText += accounts.join(separator);\n                        resultText += separator;\n                    }\n                } else {\n                    resultText += 'Error fetching subscription: ' + subRes.statusText;\n                }\n\n                output.value = resultText;\n\n            } catch (e) {\n                output.value = 'Error: ' + e.message;\n            } finally {\n                btn.disabled = false;\n                btn.innerText = 'Generate Configuration';\n            }\n        }\n\n        function copyToClipboard() {\n            const copyText = document.getElementById(\"output\");\n            copyText.select();\n            copyText.setSelectionRange(0, 99999);\n            navigator.clipboard.writeText(copyText.value).then(() => {\n                alert(\"Copied to clipboard!\");\n            });\n        }\n\n        // Proxy List Logic\n        async function loadProxies() {\n            const grid = document.getElementById('proxy-grid');\n            const search = document.getElementById('proxy-search') ? document.getElementById('proxy-search').value : '';\n\n            grid.innerHTML = '<div class=\"col-span-3 text-center text-slate-400 py-8\"><span class=\"animate-spin inline-block mr-2\">&#9696;</span> Loading proxies...</div>';\n\n            try {\n                const url = new URL('/api/v1/proxies', window.location.origin);\n                url.searchParams.set('limit', '12');\n                if (search) url.searchParams.set('search', search);\n\n                const res = await fetch(url);\n                const proxies = await res.json();\n\n                if (proxies.length === 0) {\n                    grid.innerHTML = '<div class=\"col-span-3 text-center text-slate-400 py-8\">No proxies found matching your search.</div>';\n                    return;\n                }\n\n                grid.innerHTML = '';\n                proxies.forEach((proxy, index) => {\n                    const id = `proxy-${index}`;\n                    const div = document.createElement('div');\n                    div.className = 'bg-slate-900/50 border border-white/10 rounded-xl p-4 space-y-3 hover:border-cyan-500/50 transition relative group';\n                    div.innerHTML = `\n                        <div class=\"flex justify-between items-start\">\n                            <div class=\"flex items-center gap-2\">\n                                <span class=\"text-2xl\">${proxy.flag}</span>\n                                <div>\n                                    <p class=\"font-bold text-white text-sm\">${proxy.country}</p>\n                                    <p class=\"text-xs text-slate-400 truncate max-w-[100px]\" title=\"${proxy.org}\">${proxy.org}</p>\n                                </div>\n                            </div>\n                            <div class=\"text-right\">\n                                <span id=\"${id}-ping\" class=\"text-xs font-mono px-2 py-1 rounded bg-slate-800 text-slate-400\">Waiting...</span>\n                            </div>\n                        </div>\n\n                        <div class=\"bg-black/20 rounded p-2 font-mono text-xs text-cyan-300 text-center break-all\">\n                            ${proxy.prxIP}:${proxy.prxPort}\n                        </div>\n\n                        <button onclick=\"generateProxyConfig('${proxy.prxIP}', '${proxy.prxPort}', '${proxy.flag}', '${proxy.country}', '${proxy.org}')\" class=\"w-full bg-white/5 hover:bg-cyan-500/20 hover:text-cyan-400 border border-white/10 text-slate-300 text-xs font-bold py-2 rounded-lg transition flex items-center justify-center gap-2\">\n                            <svg class=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" viewBox=\"0 0 24 24\"><path stroke-linecap=\"round\" stroke-linejoin=\"round\" stroke-width=\"2\" d=\"M13 10V3L4 14h7v7l9-11h-7z\"></path></svg>\n                            Generate VLESS TROJAN\n                        </button>\n                    `;\n                    grid.appendChild(div);\n\n                    // Trigger ping check\n                    checkProxyPing(proxy.prxIP, proxy.prxPort, id);\n                });\n\n            } catch (e) {\n                grid.innerHTML = `<div class=\"col-span-3 text-center text-red-400 py-8\">Error loading proxies: ${e.message}</div>`;\n            }\n        }\n\n        async function checkProxyPing(ip, port, elementId) {\n            const el = document.getElementById(`${elementId}-ping`);\n            try {\n                // Simulate concurrency delay to avoid flooding if needed, or just go for it\n                // Using the /check endpoint\n                const checkUrl = new URL('/check', window.location.origin);\n                checkUrl.searchParams.set('target', `${ip}:${port}`);\n\n                const start = Date.now();\n                const res = await fetch(checkUrl);\n                const data = await res.json();\n\n                if (data.delay) {\n                    let color = 'text-green-400';\n                    if (data.delay > 500) color = 'text-yellow-400';\n                    if (data.delay > 1500) color = 'text-red-400';\n\n                    el.className = `text-xs font-mono px-2 py-1 rounded bg-slate-800 ${color}`;\n                    el.innerText = `${data.delay}ms`;\n                } else {\n                    el.className = `text-xs font-mono px-2 py-1 rounded bg-slate-800 text-red-400`;\n                    el.innerText = 'Timeout';\n                }\n            } catch (e) {\n                el.className = `text-xs font-mono px-2 py-1 rounded bg-slate-800 text-red-400`;\n                el.innerText = 'Error';\n            }\n        }\n\n        async function generateProxyConfig(ip, port, flag, country, org) {\n            const modal = document.getElementById('modal');\n            const output = document.getElementById('modal-output');\n            const qrCode = document.getElementById('qr-code');\n            const domain = document.getElementById('domain').value;\n            const uuid = document.getElementById('uuid').value;\n\n            modal.classList.remove('hidden');\n            output.value = 'Generating...';\n\n            // Construct links manually or fetch from API?\n            // Fetching from API ensures consistency with the worker logic\n            try {\n                const url = new URL('/api/v1/sub', window.location.origin);\n                url.searchParams.set('host', domain);\n                url.searchParams.set('format', 'raw');\n                url.searchParams.set('limit', '10'); // Generate a few links\n                // We want to force this specific proxy.\n                // The current API generates random proxies from the list.\n                // We need to modify the API or just construct it client side.\n                // Since modifying API to accept single proxy override might be complex,\n                // let's construct client side since we have UUID, Domain, Proxy IP/Port.\n\n                // Wait, the API supports filtering?\n                // The worker API logic:\n                // const prxList = await getPrxList(prxBankUrl)...\n                // It doesn't seem to support passing a specific IP/Port to generate.\n                // So I will construct it client-side to be safe and fast.\n\n                const vlessLink = `vless://${uuid}@${ip}:${port}?security=tls&encryption=none&type=ws&host=${domain}&path=%2F${ip}-${port}&sni=${domain}#${flag} ${country} ${org} VLESS`;\n                const trojanLink = `trojan://${uuid}@${ip}:${port}?security=tls&type=ws&host=${domain}&path=%2F${ip}-${port}&sni=${domain}#${flag} ${country} ${org} TROJAN`;\n\n                const resultText = `================================\\n` +\n                                   `VLESS ACCOUNT\\n` +\n                                   `================================\\n` +\n                                   `${vlessLink}\\n` +\n                                   `================================\\n\\n` +\n                                   `================================\\n` +\n                                   `TROJAN ACCOUNT\\n` +\n                                   `================================\\n` +\n                                   `${trojanLink}\\n` +\n                                   `================================\\n`;\n\n                output.value = resultText;\n\n                // Generate QR (VLESS as default)\n                qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(vlessLink)}`;\n\n            } catch (e) {\n                output.value = 'Error generating config: ' + e.message;\n            }\n        }\n\n        function closeModal() {\n            document.getElementById('modal').classList.add('hidden');\n        }\n\n        function copyModalClipboard() {\n            const copyText = document.getElementById(\"modal-output\");\n            copyText.select();\n            copyText.setSelectionRange(0, 99999);\n            navigator.clipboard.writeText(copyText.value).then(() => {\n                alert(\"Copied to clipboard!\");\n            });\n        }\n    </script>\n</body>\n</html>\n";
