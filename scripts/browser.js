"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/browser.ts
var browser_exports = {};
__export(browser_exports, {
  startListen: () => startListen
});
module.exports = __toCommonJS(browser_exports);
var import_browser = require("tiny-bilibili-ws/browser");

// src/parser/HEARTBEAT.ts
var parser = (data) => {
  return {
    attention: data
  };
};
var HEARTBEAT = {
  parser,
  eventName: "heartbeat",
  handlerName: "onAttentionChange"
};

// src/parser/LIVE.ts
var parser2 = (data) => {
  return {
    live_platform: data.live_platform,
    room_id: data.roomid
  };
};
var LIVE = {
  parser: parser2,
  eventName: "LIVE",
  handlerName: "onLiveStart"
};

// src/parser/PREPARING.ts
var parser3 = (data) => {
  return {
    room_id: parseInt(data.roomid)
  };
};
var PREPARING = {
  parser: parser3,
  eventName: "PREPARING",
  handlerName: "onLiveEnd"
};

// src/parser/ANCHOR_LOT_AWARD.ts
var parser4 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.id,
    award: {
      image: rawData.award_image,
      name: rawData.award_name,
      virtual: rawData.award_type === 1
    },
    winner: rawData.award_users.map((user) => ({
      uid: user.uid,
      uname: user.uname,
      face: user.face,
      level: user.level,
      num: user.num
    }))
  };
};
var ANCHOR_LOT_AWARD = {
  parser: parser4,
  eventName: "ANCHOR_LOT_AWARD",
  handlerName: "onAnchorLotteryEnd"
};

// src/parser/ANCHOR_LOT_START.ts
var parser5 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.id,
    start_time: rawData.current_time,
    duration: rawData.max_time,
    award: {
      image: rawData.award_image,
      name: rawData.award_name,
      num: rawData.award_num,
      virtual: rawData.award_type === 1,
      price_text: rawData.award_price_text || ""
    },
    require: {
      danmu: rawData.danmu || "",
      gift: rawData.gift_id ? {
        id: `${rawData.gift_id}`,
        name: rawData.gift_name,
        num: rawData.gift_num,
        price: rawData.gift_price
      } : null,
      user: rawData.require_type ? {
        type: ["follow", "medal", "guard"][rawData.require_type - 1],
        value: rawData.require_value,
        text: rawData.require_text
      } : null
    }
  };
};
var ANCHOR_LOT_START = {
  parser: parser5,
  eventName: "ANCHOR_LOT_START",
  handlerName: "onAnchorLotteryStart"
};

// src/utils/color.ts
var intToColorHex = (int) => {
  const hex = int.toString(16);
  return `#${hex.padStart(6, "0")}`;
};

// src/parser/DANMU_MSG.ts
var parser6 = (data, roomId) => {
  var _a;
  const rawData = data.info;
  const content = rawData[1];
  const shouldParseInMessageEmoticon = /\[.*?\]/.test(content);
  let inMessageEmoticon;
  if (shouldParseInMessageEmoticon) {
    const messageExtraInfo = JSON.parse(rawData[0][15].extra);
    const emoctionDict = {};
    if (messageExtraInfo.emots) {
      inMessageEmoticon = Object.keys(messageExtraInfo.emots).reduce((acc, key) => {
        const emoticon = messageExtraInfo.emots[key];
        acc[key] = {
          id: emoticon.emoticon_unique,
          emoticon_id: emoticon.emoticon_id,
          height: emoticon.height,
          width: emoticon.width,
          url: emoticon.url,
          description: emoticon.descript
        };
        return acc;
      }, emoctionDict);
    }
  }
  return {
    user: {
      uid: rawData[2][0],
      uname: rawData[2][1],
      badge: rawData[3].length ? {
        active: rawData[3][7] !== 12632256,
        name: rawData[3][1],
        level: rawData[3][0],
        color: intToColorHex(rawData[3][4]),
        gradient: [
          intToColorHex(rawData[3][7]),
          intToColorHex(rawData[3][8]),
          intToColorHex(rawData[3][9])
        ],
        anchor: {
          uid: rawData[3][12],
          uname: rawData[3][2],
          room_id: rawData[3][3],
          is_same_room: rawData[3][3] === roomId
        }
      } : void 0,
      identity: {
        rank: rawData[4][4],
        guard_level: rawData[7],
        room_admin: rawData[2][2] === 1
      }
    },
    content,
    timestamp: rawData[0][4],
    lottery: rawData[0][9] !== 0,
    emoticon: ((_a = rawData[0][13]) == null ? void 0 : _a.emoticon_unique) ? {
      id: rawData[0][13].emoticon_unique,
      height: rawData[0][13].height,
      width: rawData[0][13].width,
      url: rawData[0][13].url
    } : void 0,
    in_message_emoticon: inMessageEmoticon
  };
};
var DANMU_MSG = {
  parser: parser6,
  eventName: "DANMU_MSG",
  handlerName: "onIncomeDanmu"
};

// src/parser/GUARD_BUY.ts
var parser7 = (data) => {
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.username
    },
    gift_id: rawData.gift_id,
    gift_name: rawData.gift_name,
    guard_level: rawData.guard_level,
    price: rawData.price,
    start_time: rawData.start_time,
    end_time: rawData.end_time
  };
};
var GUARD_BUY = {
  parser: parser7,
  eventName: "GUARD_BUY",
  handlerName: "onGuardBuy"
};

// src/parser/INTERACT_WORD_ENTRY_EFFECT.ts
var parserNormal = (data, roomId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const rawData = data.data;
  let actionType = "unknown";
  if (rawData.msg_type === 1) {
    actionType = "enter";
  } else if (rawData.msg_type === 2) {
    actionType = "follow";
  } else if (rawData.msg_type === 3) {
    actionType = "share";
  }
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      face: rawData == null ? void 0 : rawData.face,
      badge: ((_a = rawData.fans_medal) == null ? void 0 : _a.target_id) ? {
        active: !!((_b = rawData.fans_medal) == null ? void 0 : _b.is_lighted),
        name: (_c = rawData.fans_medal) == null ? void 0 : _c.medal_name,
        level: (_d = rawData.fans_medal) == null ? void 0 : _d.medal_level,
        color: intToColorHex((_e = rawData.fans_medal) == null ? void 0 : _e.medal_color),
        gradient: [
          intToColorHex((_f = rawData.fans_medal) == null ? void 0 : _f.medal_color_start),
          intToColorHex((_g = rawData.fans_medal) == null ? void 0 : _g.medal_color_start),
          intToColorHex((_h = rawData.fans_medal) == null ? void 0 : _h.medal_color_end)
        ],
        anchor: {
          uid: (_i = rawData.fans_medal) == null ? void 0 : _i.target_id,
          uname: "",
          room_id: (_j = rawData.fans_medal) == null ? void 0 : _j.anchor_roomid,
          is_same_room: ((_k = rawData.fans_medal) == null ? void 0 : _k.anchor_roomid) === roomId
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: rawData.privilege_type,
        room_admin: false
      }
    },
    action: actionType,
    timestamp: Math.ceil(rawData.trigger_time / 1e6)
  };
};
var parserGuard = (data, roomId) => {
  var _a;
  const rawData = data.data;
  const uname = ((_a = /<%(.*)%>/.exec(rawData.copy_writing)) == null ? void 0 : _a[1]) || "";
  return {
    user: {
      uid: rawData.uid,
      uname,
      // 超长会有省略号
      identity: {
        rank: 0,
        guard_level: rawData.privilege_type,
        room_admin: false
      }
    },
    action: "enter",
    timestamp: Math.ceil(rawData.trigger_time / 1e6)
  };
};
var parserLike = (data, roomId) => {
  var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k;
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      badge: ((_a = rawData.fans_medal) == null ? void 0 : _a.target_id) ? {
        active: (_b = rawData.fans_medal) == null ? void 0 : _b.is_lighted,
        name: (_c = rawData.fans_medal) == null ? void 0 : _c.medal_name,
        level: (_d = rawData.fans_medal) == null ? void 0 : _d.medal_level,
        color: intToColorHex((_e = rawData.fans_medal) == null ? void 0 : _e.medal_color),
        gradient: [
          intToColorHex((_f = rawData.fans_medal) == null ? void 0 : _f.medal_color_start),
          intToColorHex((_g = rawData.fans_medal) == null ? void 0 : _g.medal_color_start),
          intToColorHex((_h = rawData.fans_medal) == null ? void 0 : _h.medal_color_end)
        ],
        anchor: {
          uid: (_i = rawData.fans_medal) == null ? void 0 : _i.target_id,
          uname: "",
          room_id: (_j = rawData.fans_medal) == null ? void 0 : _j.anchor_roomid,
          // 返回为 0
          is_same_room: ((_k = rawData.fans_medal) == null ? void 0 : _k.anchor_roomid) === roomId
        }
      } : void 0
    },
    action: "like",
    timestamp: Date.now()
  };
};
var parser8 = (data, roomId) => {
  const msgType = data.cmd;
  if (msgType === "ENTRY_EFFECT") {
    return parserGuard(data, roomId);
  } else if (msgType === "LIKE_INFO_V3_CLICK") {
    return parserLike(data, roomId);
  } else {
    return parserNormal(data, roomId);
  }
};
var INTERACT_WORD = {
  parser: parser8,
  eventName: "INTERACT_WORD",
  handlerName: "onUserAction"
};
var ENTRY_EFFECT = {
  parser: parser8,
  eventName: "ENTRY_EFFECT",
  handlerName: "onUserAction"
};
var LIKE_INFO_V3_CLICK = {
  parser: parser8,
  eventName: "LIKE_INFO_V3_CLICK",
  handlerName: "onUserAction"
};

// src/parser/LIKE_INFO_V3_UPDATE.ts
var parser9 = (data) => {
  const rawData = data.data;
  return {
    count: rawData.click_count
  };
};
var LIKE_INFO_V3_UPDATE = {
  parser: parser9,
  eventName: "LIKE_INFO_V3_UPDATE",
  handlerName: "onLikedChange"
};

// src/parser/ONLINE_RANK_COUNT.ts
var parser10 = (data) => {
  const rawData = data.data;
  return {
    count: rawData.count
  };
};
var ONLINE_RANK_COUNT = {
  parser: parser10,
  eventName: "ONLINE_RANK_COUNT",
  handlerName: "onRankCountChange"
};

// src/parser/POPULARITY_RED_POCKET_START.ts
var parser11 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.lot_id,
    user: {
      uid: rawData.sender_uid,
      uname: rawData.sender_name,
      face: rawData.sender_face
    },
    start_time: rawData.start_time,
    end_time: rawData.end_time,
    duration: rawData.last_time,
    danmu: rawData.danmu,
    awards: rawData.awards,
    total_price: rawData.total_price,
    wait_num: rawData.wait_num
  };
};
var POPULARITY_RED_POCKET_START = {
  parser: parser11,
  eventName: "POPULARITY_RED_POCKET_START",
  handlerName: "onRedPocketStart"
};

// src/parser/POPULARITY_RED_POCKET_WINNER_LIST.ts
var parser12 = (data, roomId) => {
  const rawData = data.data;
  return {
    id: rawData.lot_id,
    total_num: rawData.total_num,
    winner: rawData.winner_info.map((item) => __spreadValues({
      uid: item[0],
      uname: item[1],
      award_id: item[3]
    }, rawData.awards[item[3]])),
    awards: rawData.awards
  };
};
var POPULARITY_RED_POCKET_WINNER_LIST = {
  parser: parser12,
  eventName: "POPULARITY_RED_POCKET_WINNER_LIST",
  handlerName: "onRedPocketEnd"
};

// src/parser/ROOM_ADMIN.ts
var parser13 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data;
  return {
    type: msgType === "room_admin_entrance" ? "set" : "revoke",
    uid: rawData.uid
  };
};
var room_admin_entrance = {
  parser: parser13,
  eventName: "room_admin_entrance",
  handlerName: "onRoomAdminSet"
};
var ROOM_ADMIN_REVOKE = {
  parser: parser13,
  eventName: "ROOM_ADMIN_REVOKE",
  handlerName: "onRoomAdminSet"
};

// src/parser/ROOM_CHANGE.ts
var parser14 = (data) => {
  const rawData = data.data;
  return {
    title: rawData.title,
    parent_area_id: rawData.parent_area_id,
    parent_area_name: rawData.parent_area_name,
    area_id: rawData.area_id,
    area_name: rawData.area_name
  };
};
var ROOM_CHANGE = {
  parser: parser14,
  eventName: "ROOM_CHANGE",
  handlerName: "onRoomInfoChange"
};

// src/parser/ROOM_SILENT.ts
var parser15 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data.data;
  return {
    type: msgType === "ROOM_SILENT_OFF" ? "off" : rawData.type,
    level: rawData.level,
    second: rawData.second
  };
};
var ROOM_SILENT_ON = {
  parser: parser15,
  eventName: "ROOM_SILENT_ON",
  handlerName: "onRoomSilent"
};
var ROOM_SILENT_OFF = {
  parser: parser15,
  eventName: "ROOM_SILENT_OFF",
  handlerName: "onRoomSilent"
};

// src/parser/SEND_GIFT.ts
var parser16 = (data) => {
  var _a, _b;
  const rawData = data.data;
  return {
    user: {
      uid: rawData.uid,
      uname: rawData.uname,
      face: rawData.face,
      badge: ((_a = rawData.medal_info) == null ? void 0 : _a.medal_level) ? {
        active: rawData.medal_info.is_lighted === 1,
        name: rawData.medal_info.medal_name,
        level: rawData.medal_info.medal_level,
        color: intToColorHex(rawData.medal_info.medal_color),
        gradient: [
          intToColorHex(rawData.medal_info.medal_color_start),
          intToColorHex(rawData.medal_info.medal_color_start),
          intToColorHex(rawData.medal_info.medal_color_end)
        ],
        anchor: {
          uid: rawData.medal_info.target_id,
          uname: rawData.medal_info.anchor_uname,
          // maybe ''
          room_id: rawData.medal_info.anchor_roomid
          // maybe 0
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: rawData.guard_level,
        room_admin: false
      }
    },
    gift_id: rawData.giftId,
    gift_name: rawData.giftName,
    coin_type: rawData.coin_type,
    price: rawData.price,
    amount: rawData.num,
    send_master: ((_b = rawData.send_master) == null ? void 0 : _b.uid) ? {
      uid: rawData.send_master.uid,
      uname: rawData.send_master.uname,
      room_id: rawData.send_master.room_id
    } : void 0,
    // 礼物连击：
    // data.combo_send 仅首次连击不为空；data.batch_combo_send 速度过快时可能为空；data.batch_combo_id 常驻存在
    combo: rawData.batch_combo_id ? {
      batch_id: rawData.batch_combo_id,
      combo_num: rawData.super_batch_gift_num,
      total_price: rawData.combo_total_coin
    } : void 0
  };
};
var SEND_GIFT = {
  parser: parser16,
  eventName: "SEND_GIFT",
  handlerName: "onGift"
};

// src/parser/SUPER_CHAT_MESSAGE.ts
var parser17 = (data, roomId) => {
  const rawData = data.data;
  const { medal_info, user_info } = data.data;
  return {
    id: rawData.id,
    user: {
      uid: rawData.uid,
      uname: rawData.user_info.uname,
      badge: medal_info ? {
        active: medal_info.is_lighted === 1,
        name: medal_info.medal_name,
        level: medal_info.medal_level,
        color: medal_info.medal_color,
        anchor: {
          uid: medal_info.target_id,
          uname: medal_info.anchor_uname,
          room_id: medal_info.anchor_roomid,
          is_same_room: medal_info.anchor_roomid === roomId
        }
      } : void 0,
      identity: {
        rank: 0,
        guard_level: user_info.guard_level || 0,
        room_admin: user_info.manager === 1
      }
    },
    content: rawData.message,
    content_color: rawData.background_price_color,
    price: rawData.price,
    time: rawData.time
  };
};
var SUPER_CHAT_MESSAGE = {
  parser: parser17,
  eventName: "SUPER_CHAT_MESSAGE",
  handlerName: "onIncomeSuperChat"
};

// src/parser/WARNING_CUT_OFF.ts
var parser18 = (data, roomId) => {
  const msgType = data.cmd;
  const rawData = data;
  return {
    type: msgType === "WARNING" ? "warning" : "cut",
    msg: rawData.msg
  };
};
var WARNING = {
  parser: parser18,
  eventName: "WARNING",
  handlerName: "onRoomWarn"
};
var CUT_OFF = {
  parser: parser18,
  eventName: "CUT_OFF",
  handlerName: "onRoomWarn"
};

// src/parser/WATCHED_CHANGE.ts
var parser19 = (data) => {
  const rawData = data.data;
  return {
    num: rawData.num,
    text_small: rawData.text_small
  };
};
var WATCHED_CHANGE = {
  parser: parser19,
  eventName: "WATCHED_CHANGE",
  handlerName: "onWatchedChange"
};

// src/utils/message.ts
var normalizeDanmu = (msgType, body, rawBody) => {
  var _a;
  const timestamp = Date.now();
  const randomText = Math.floor(Math.random() * 1e4).toString();
  const id = `${timestamp}:${msgType}:${(_a = body.user) == null ? void 0 : _a.uid}:${randomText}`;
  return {
    id,
    timestamp,
    type: msgType,
    body,
    raw: rawBody
  };
};

// src/listener/index.ts
var listenAll = (instance, roomId, handler) => {
  if (!handler)
    return;
  const rawHandler = handler.raw || {};
  const rawHandlerNames = new Set(Object.keys(rawHandler));
  const isHandleRaw = rawHandlerNames.size > 0;
  if (handler.onOpen) {
    instance.on("open", () => {
      var _a;
      (_a = handler.onOpen) == null ? void 0 : _a.call(handler);
    });
  }
  if (handler.onClose) {
    instance.on("close", () => {
      var _a;
      (_a = handler.onClose) == null ? void 0 : _a.call(handler);
    });
  }
  if (handler.onStartListen) {
    instance.on("live", () => {
      var _a;
      (_a = handler.onStartListen) == null ? void 0 : _a.call(handler);
    });
  }
  if (handler[HEARTBEAT.handlerName] || rawHandlerNames.has(HEARTBEAT.eventName)) {
    rawHandlerNames.delete(HEARTBEAT.eventName);
    instance.on(HEARTBEAT.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[HEARTBEAT.eventName]) == null ? void 0 : _a.call(rawHandler, data));
      const parsedData = HEARTBEAT.parser(data);
      (_b = handler[HEARTBEAT.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(HEARTBEAT.eventName, parsedData, data));
    });
  }
  if (handler[LIVE.handlerName] || rawHandlerNames.has(LIVE.eventName)) {
    rawHandlerNames.delete(LIVE.eventName);
    instance.on(LIVE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[LIVE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = LIVE.parser(data.data);
      (_b = handler[LIVE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(LIVE.eventName, parsedData, data.data));
    });
  }
  if (handler[PREPARING.handlerName] || rawHandlerNames.has(PREPARING.eventName)) {
    rawHandlerNames.delete(LIVE.eventName);
    instance.on(PREPARING.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[PREPARING.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = PREPARING.parser(data.data);
      (_b = handler[PREPARING.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(PREPARING.eventName, parsedData, data.data));
    });
  }
  if (handler[ANCHOR_LOT_AWARD.handlerName] || rawHandlerNames.has(ANCHOR_LOT_AWARD.eventName)) {
    rawHandlerNames.delete(ANCHOR_LOT_AWARD.eventName);
    instance.on(ANCHOR_LOT_AWARD.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ANCHOR_LOT_AWARD.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ANCHOR_LOT_AWARD.parser(data.data, roomId);
      (_b = handler[ANCHOR_LOT_AWARD.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ANCHOR_LOT_AWARD.eventName, parsedData, data.data));
    });
  }
  if (handler[ANCHOR_LOT_START.handlerName] || rawHandlerNames.has(ANCHOR_LOT_START.eventName)) {
    rawHandlerNames.delete(ANCHOR_LOT_START.eventName);
    instance.on(ANCHOR_LOT_START.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ANCHOR_LOT_START.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ANCHOR_LOT_START.parser(data.data, roomId);
      (_b = handler[ANCHOR_LOT_START.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ANCHOR_LOT_START.eventName, parsedData, data.data));
    });
  }
  if (handler[DANMU_MSG.handlerName] || rawHandlerNames.has(DANMU_MSG.eventName)) {
    rawHandlerNames.delete(DANMU_MSG.eventName);
    instance.on(DANMU_MSG.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[DANMU_MSG.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = DANMU_MSG.parser(data.data, roomId);
      (_b = handler[DANMU_MSG.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(DANMU_MSG.eventName, parsedData, data.data));
    });
  }
  if (handler[GUARD_BUY.handlerName] || rawHandlerNames.has(GUARD_BUY.eventName)) {
    rawHandlerNames.delete(GUARD_BUY.eventName);
    instance.on(GUARD_BUY.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[GUARD_BUY.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = GUARD_BUY.parser(data.data);
      (_b = handler[GUARD_BUY.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(GUARD_BUY.eventName, parsedData, data.data));
    });
  }
  if (handler[INTERACT_WORD.handlerName] || handler[ENTRY_EFFECT.handlerName] || handler[LIKE_INFO_V3_CLICK.handlerName] || rawHandlerNames.has(INTERACT_WORD.eventName) || rawHandlerNames.has(ENTRY_EFFECT.eventName) || rawHandlerNames.has(LIKE_INFO_V3_CLICK.eventName)) {
    rawHandlerNames.delete(INTERACT_WORD.eventName);
    rawHandlerNames.delete(ENTRY_EFFECT.eventName);
    rawHandlerNames.delete(LIKE_INFO_V3_CLICK.eventName);
    instance.on(INTERACT_WORD.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[INTERACT_WORD.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = INTERACT_WORD.parser(data.data, roomId);
      (_b = handler[INTERACT_WORD.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(INTERACT_WORD.eventName, parsedData, data.data));
    });
    instance.on(ENTRY_EFFECT.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ENTRY_EFFECT.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ENTRY_EFFECT.parser(data.data, roomId);
      (_b = handler[ENTRY_EFFECT.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ENTRY_EFFECT.eventName, parsedData, data.data));
    });
    instance.on(LIKE_INFO_V3_CLICK.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[LIKE_INFO_V3_CLICK.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = LIKE_INFO_V3_CLICK.parser(data.data, roomId);
      (_b = handler[LIKE_INFO_V3_CLICK.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(LIKE_INFO_V3_CLICK.eventName, parsedData, data.data));
    });
  }
  if (handler[LIKE_INFO_V3_UPDATE.handlerName] || rawHandlerNames.has(LIKE_INFO_V3_UPDATE.eventName)) {
    rawHandlerNames.delete(LIKE_INFO_V3_UPDATE.eventName);
    instance.on(LIKE_INFO_V3_UPDATE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[LIKE_INFO_V3_UPDATE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = LIKE_INFO_V3_UPDATE.parser(data.data);
      (_b = handler[LIKE_INFO_V3_UPDATE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(LIKE_INFO_V3_UPDATE.eventName, parsedData, data.data));
    });
  }
  if (handler[ONLINE_RANK_COUNT.handlerName] || rawHandlerNames.has(ONLINE_RANK_COUNT.eventName)) {
    rawHandlerNames.delete(ONLINE_RANK_COUNT.eventName);
    instance.on(ONLINE_RANK_COUNT.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ONLINE_RANK_COUNT.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ONLINE_RANK_COUNT.parser(data.data);
      (_b = handler[ONLINE_RANK_COUNT.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ONLINE_RANK_COUNT.eventName, parsedData, data.data));
    });
  }
  if (handler[POPULARITY_RED_POCKET_START.handlerName] || rawHandlerNames.has(POPULARITY_RED_POCKET_START.eventName)) {
    rawHandlerNames.delete(POPULARITY_RED_POCKET_START.eventName);
    instance.on(POPULARITY_RED_POCKET_START.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[POPULARITY_RED_POCKET_START.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = POPULARITY_RED_POCKET_START.parser(data.data, roomId);
      (_b = handler[POPULARITY_RED_POCKET_START.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(POPULARITY_RED_POCKET_START.eventName, parsedData, data.data));
    });
  }
  if (handler[POPULARITY_RED_POCKET_WINNER_LIST.handlerName] || rawHandlerNames.has(POPULARITY_RED_POCKET_WINNER_LIST.eventName)) {
    rawHandlerNames.delete(POPULARITY_RED_POCKET_WINNER_LIST.eventName);
    instance.on(POPULARITY_RED_POCKET_WINNER_LIST.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[POPULARITY_RED_POCKET_WINNER_LIST.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = POPULARITY_RED_POCKET_WINNER_LIST.parser(data.data, roomId);
      (_b = handler[POPULARITY_RED_POCKET_WINNER_LIST.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(POPULARITY_RED_POCKET_WINNER_LIST.eventName, parsedData, data.data));
    });
  }
  if (handler[room_admin_entrance.handlerName] || handler[ROOM_ADMIN_REVOKE.handlerName] || rawHandlerNames.has(room_admin_entrance.eventName) || rawHandlerNames.has(ROOM_SILENT_OFF.eventName)) {
    rawHandlerNames.delete(room_admin_entrance.eventName);
    rawHandlerNames.delete(ROOM_ADMIN_REVOKE.eventName);
    instance.on(room_admin_entrance.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[room_admin_entrance.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = room_admin_entrance.parser(data.data, roomId);
      (_b = handler[room_admin_entrance.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(room_admin_entrance.eventName, parsedData, data.data));
    });
    instance.on(ROOM_ADMIN_REVOKE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ROOM_ADMIN_REVOKE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ROOM_ADMIN_REVOKE.parser(data.data, roomId);
      (_b = handler[ROOM_ADMIN_REVOKE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ROOM_ADMIN_REVOKE.eventName, parsedData, data.data));
    });
  }
  if (handler[ROOM_CHANGE.handlerName] || rawHandlerNames.has(ROOM_CHANGE.eventName)) {
    rawHandlerNames.delete(ROOM_CHANGE.eventName);
    instance.on(ROOM_CHANGE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ROOM_CHANGE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ROOM_CHANGE.parser(data.data);
      (_b = handler[ROOM_CHANGE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ROOM_CHANGE.eventName, parsedData, data.data));
    });
  }
  if (handler[ROOM_SILENT_ON.handlerName] || handler[ROOM_SILENT_OFF.handlerName] || rawHandlerNames.has(ROOM_SILENT_ON.eventName) || rawHandlerNames.has(ROOM_SILENT_OFF.eventName)) {
    rawHandlerNames.delete(ROOM_SILENT_ON.eventName);
    rawHandlerNames.delete(ROOM_SILENT_OFF.eventName);
    instance.on(ROOM_SILENT_ON.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ROOM_SILENT_ON.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ROOM_SILENT_ON.parser(data.data, roomId);
      (_b = handler[ROOM_SILENT_ON.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ROOM_SILENT_ON.eventName, parsedData, data.data));
    });
    instance.on(ROOM_SILENT_OFF.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[ROOM_SILENT_OFF.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = ROOM_SILENT_OFF.parser(data.data, roomId);
      (_b = handler[ROOM_SILENT_OFF.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(ROOM_SILENT_OFF.eventName, parsedData, data.data));
    });
  }
  if (handler[SEND_GIFT.handlerName] || rawHandlerNames.has(SEND_GIFT.eventName)) {
    rawHandlerNames.delete(SEND_GIFT.eventName);
    instance.on(SEND_GIFT.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[SEND_GIFT.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = SEND_GIFT.parser(data.data);
      (_b = handler[SEND_GIFT.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(SEND_GIFT.eventName, parsedData, data.data));
    });
  }
  if (handler[SUPER_CHAT_MESSAGE.handlerName] || rawHandlerNames.has(SUPER_CHAT_MESSAGE.eventName)) {
    rawHandlerNames.delete(SUPER_CHAT_MESSAGE.eventName);
    instance.on(SUPER_CHAT_MESSAGE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[SUPER_CHAT_MESSAGE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = SUPER_CHAT_MESSAGE.parser(data.data, roomId);
      (_b = handler[SUPER_CHAT_MESSAGE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(SUPER_CHAT_MESSAGE.eventName, parsedData, data.data));
    });
  }
  if (handler[WARNING.handlerName] || handler[CUT_OFF.handlerName] || rawHandlerNames.has(WARNING.eventName) || rawHandlerNames.has(CUT_OFF.eventName)) {
    rawHandlerNames.delete(WARNING.eventName);
    rawHandlerNames.delete(CUT_OFF.eventName);
    instance.on(WARNING.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[WARNING.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = WARNING.parser(data.data, roomId);
      (_b = handler[WARNING.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(WARNING.eventName, parsedData, data.data));
    });
    instance.on(CUT_OFF.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[CUT_OFF.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = CUT_OFF.parser(data.data, roomId);
      (_b = handler[CUT_OFF.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(CUT_OFF.eventName, parsedData, data.data));
    });
  }
  if (handler[WATCHED_CHANGE.handlerName] || rawHandlerNames.has(WATCHED_CHANGE.eventName)) {
    rawHandlerNames.delete(WATCHED_CHANGE.eventName);
    instance.on(WATCHED_CHANGE.eventName, (data) => {
      var _a, _b;
      isHandleRaw && ((_a = rawHandler[WATCHED_CHANGE.eventName]) == null ? void 0 : _a.call(rawHandler, data.data));
      const parsedData = WATCHED_CHANGE.parser(data.data);
      (_b = handler[WATCHED_CHANGE.handlerName]) == null ? void 0 : _b.call(handler, normalizeDanmu(WATCHED_CHANGE.eventName, parsedData, data.data));
    });
  }
  rawHandlerNames.forEach((eventName) => {
    instance.on(eventName, (data) => {
      rawHandler[eventName](data.data);
    });
  });
};

// src/browser.ts
var startListen = (roomId, handler) => {
  const live = new import_browser.KeepLiveWS(roomId);
  listenAll(live, roomId, handler);
  const listenerInstance = {
    roomId: live.roomId,
    close: () => live.close(),
    getAttention: () => live.getOnline()
  };
  return listenerInstance;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startListen
});
