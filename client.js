// Base by Rens
process.on('uncaughtException', console.error) //Safe Log Error 
require('./system/settings')
const {
	default: RestaConnect,
	useMultiFileAuthState,
	DisconnectReason,
	fetchLatestBaileysVersion,
	generateForwardMessageContent,
	prepareWAMessageMedia,
	generateWAMessageFromContent,
	generateMessageID,
	downloadContentFromMessage,
	makeInMemoryStore,
	jidDecode,
	PHONENUMBER_MCC,
	proto,
	toReadable
} = require("@whiskeysockets/baileys")
const yargs = require('yargs/yargs')
const pino = require('pino')
const path = require('path')
const colors = require('@colors/colors/safe')
const qrcode = require('qrcode-terminal')
const axios = require('axios')
const fs = require('fs')
const { Boom } = require('@hapi/boom')
const spinnies = new(require('spinnies'))()
const chalk = require('chalk')
const _ = require('lodash')
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep, reSize } = require('./lib/myfunc')
const PhoneNumber = require('awesome-phonenumber')
let {fromBuffer: fileTypeFromBuffer, stream: fileTypeStream, fromStream: fileTypeFromStream } = require('file-type')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
var low
try {
  low = require('lowdb')
} catch (e) {
  low = require('./lib/lowdb')
}
const { Low, JSONFile } = low
const mongoDB = require('./lib/mongoDB')
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.db = new Low(
  /https?:\/\//.test(opts['db'] || '') ?
    new cloudDBAdapter(opts['db']) : /mongodb/.test(opts['db']) ?
      new mongoDB(opts['db']) :
      new JSONFile(`database.json`)
)
global.DATABASE = global.db // Backwards Compatibility
global.loadDatabase = async function loadDatabase() {
  if (global.db.READ) return new Promise((resolve) => setInterval(function () { (!global.db.READ ? (clearInterval(this), resolve(global.db.data == null ? global.loadDatabase() : global.db.data)) : null) }, 1 * 1000))
  if (global.db.data !== null) return
  global.db.READ = true
  await global.db.read()
  global.db.READ = false
  global.db.data = {
    users: {},
    group: {},
    chats: {},
    ...(global.db.data || {})
  }
  global.db.chain = _.chain(global.db.data)
}
loadDatabase()

// save database every 30seconds
if (global.db) setInterval(async () => {
    if (global.db.data) await global.db.write()
  }, 30 * 1000)
  
const store = makeInMemoryStore({
   logger: pino().child({
      level: 'silent',
      stream: 'store'
   })
})

   
async function connect() {
    const { state, saveCreds } = await useMultiFileAuthState(`./${sessionName}`)
    const client = RestaConnect({
        printQRInTerminal: (global.state && global.numberBot) ? false : true,
      patchMessageBeforeSending: (message) => {
         const requiresPatch = !!(
            message.buttonsMessage ||
            message.templateMessage ||
            message.listMessage
         );
         if (requiresPatch) {
            message = {
               viewOnceMessage: {
                  message: {
                     messageContextInfo: {
                        deviceListMetadataVersion: 2,
                        deviceListMetadata: {},
                     },
                     ...message,
                  },
               },
            }
         }
         return message
      },
      browser: ['Chrome (Linux)', '', ''],
      auth: state,
      getMessage: async (key) => {
         if (store) {
            const msg = await store.loadMessage(key.remoteJid, key.id)
            return msg.message || undefined
         }
         return {
            conversation: 'hello'
         }
      },
      // To see the latest version : https://web.whatsapp.com/check-update?version=1&platform=web
      version: [2, 2323, 4]
   })
   
   store.bind(client.ev)
var Helper = (await import('./handler/helper.mjs')).default;

     spinnies.add('start', {
     text: 'Connecting . . .'
      })
      if (global.state && !client.authState.creds.registered) {
      var phoneNumber = global.numberBot
      if (!Object.keys(PHONENUMBER_MCC).some(v => String(phoneNumber).startsWith(v))) {
       spinnies.fail('start', {
       text: `Invalid number, start with country code (Example : 62xxx)`
        })
        process.exit(0)
        }
      setTimeout(async () => {
         try {
            let code = await client.requestPairingCode(phoneNumber)
            code = code.match(/.{1,4}/g)?.join("-") || code
            console.log(chalk.black(chalk.bgGreen(` Your Pairing Code `)), ' : ' + chalk.black(chalk.white(code)))
         } catch {}
      }, 3000)
   }
client.ev.on('connection.update', async (update) => {
      const {
         connection,
         lastDisconnect,
         qr
      } = update
      if (connection === 'connecting') {
      if (global.db.bots) global.db.bots.map(v => v.is_connected = false)
     } else if (connection === 'open') {
         spinnies.succeed('start', {
            text: `Connected, you login as ${client.user.name || client.user.verifiedName || 'WhatsApp Bot'}`
         })
      } else if (connection === 'close') {
         if (lastDisconnect.error.output.statusCode == DisconnectReason.loggedOut) {
            spinnies.fail('start', {
               text: `Can't connect to Web Socket`
            })
            await props.save()
            process.exit(0)
         } else {
            connect().catch(() => connect())
         }
      }
   })
   
         client.ev.on('creds.update', saveCreds)
         
        client.ev.on('messages.upsert', async chatUpdate => {
        try {
        let mek = chatUpdate.messages[0]
        if (!mek.message) return
        mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
        if (mek.key && mek.key.remoteJid === 'status@broadcast') return
        if (mek.key.fromMe && chatUpdate.type === 'notify') return
        if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
        if (mek.key.id.startsWith('FatihArridho_')) return
        let m = smsg(client, mek, store)
        require("./system/ichan")(client, m, chatUpdate, store)
        } catch (err) {
            console.log(err)
        }
    })
         client.decodeJid = (jid) => {
	 	if (!jid) return jid
 		if (/:\d+@/gi.test(jid)) {
 		let decode = jidDecode(jid) || {}
         return decode.user && decode.server && decode.user + '@' + decode.server || jid
 		} else return jid
     	}
         client.ev.on('contacts.update', update => {
         for (let contact of update) {
         let id = client.decodeJid(contact.id)
         if (store && store.contacts) store.contacts[id] = {
         id,
         name: contact.notify
         }
         }
         })
        client.getName = (jid, withoutContact  = false) => {
        id = client.decodeJid(jid)
        withoutContact = client.withoutContact || withoutContact 
        let v
        if (id.endsWith("@g.us")) return new Promise(async (resolve) => {
        v = store.contacts[id] || {}
        if (!(v.name || v.subject)) v = client.groupMetadata(id) || {}
        resolve(v.name || v.subject || PhoneNumber('+' + id.replace('@s.whatsapp.net', '')).getNumber('international'))
        })
        else v = id === '0@s.whatsapp.net' ? {
        id,
        name: 'WhatsApp'
        } : id === client.decodeJid(client.user.id) ?
        client.user :
        (store.contacts[id] || {})
        return (withoutContact ? '' : v.name) || v.subject || v.verifiedName || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
        }
        
        client.sendContact = async (jid, kon, quoted = '', opts = {}) => {
    	let list = []
    	for (let i of kon) {
	    list.push({
		displayName: await client.getName(i + '@s.whatsapp.net'),
		vcard: `BEGIN:VCARD\nVERSION:3.0\nN:${await client.getName(i + '@s.whatsapp.net')}\nFN:${await client.getName(i + '@s.whatsapp.net')}\nitem1.TEL;waid=${i}:${i}\nitem1.X-ABLabel:Ponsel\nitem2.EMAIL;type=INTERNET:${email}\nitem2.X-ABLabel:Email\nitem3.URL:${myweb}\nitem3.X-ABLabel:${namaweb}\nitem4.ADR:;;${region};;;;\nitem4.X-ABLabel:Region\nEND:VCARD`
	    })
    	}
    	client.sendMessage(jid, { contacts: { displayName: `${list.length} Kontak`, contacts: list }, ...opts }, { quoted })
        }
        
        client.reply =  async (jid, text = '', quoted, options) => {
		return Buffer.isBuffer(text) ? client.sendFile(jid, text, 'file', '', quoted, false, options) : client.sendMessage(jid, {
	...options,
		text
		}, {
		quoted,
	...options
	 	})
     	}
     
        global.thumbloc = async function thumbloc(url, text) {
    	return {
		mediaType: 1,
		description: '',
		title: text[0],
		mediaUrl: "",
		body: text[1],
		thumbnailUrl: Buffer.isBuffer(url) ? 'https://telegra.ph/?id=' + makeid(8) : url,
		thumbnail: Buffer.isBuffer(url) ? url : { url },
		sourceUrl: "",
		showAdAttribution: true, // false
		renderLargerThumbnail: true // false
    	}
        }
       /**
         * 
     * @param {*} jid 
     * @param {*} path 
     * @param {*} caption 
     * @param {*} quoted 
     * @param {*} options 
     * @returns 
     */
        client.sendTextWithMentions = async (jid, text, quoted, options = {}) => conn.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })
        
        client.sendText = (jid, text, quoted = '', options) => client.sendMessage(jid, { text: text, ...options }, { quoted, ...options })
        
        client.sendImage = async (jid, path, caption = '', quoted = '', options) => {
    	let buffer = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        return await client.sendMessage(jid, { image: buffer, caption: caption, ...options }, { quoted })
        }
        
       client.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
        buffer = await writeExifImg(buff, options)
        } else {
        buffer = await imageToWebp(buff)
        }
        await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
        }
        
        client.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
        buffer = await writeExifVid(buff, options)
        } else {
        buffer = await videoToWebp(buff)
        }
        await client.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        return buffer
        }
        
        
        
        client.copyNForward = async (jid, message, forceForward = false, options = {}) => {
        let vtype
		if (options.readViewOnce) {
    	message.message = message.message && message.message.ephemeralMessage && message.message.ephemeralMessage.message ? message.message.ephemeralMessage.message : (message.message || undefined)
		vtype = Object.keys(message.message.viewOnceMessage.message)[0]
		delete(message.message && message.message.ignore ? message.message.ignore : (message.message || undefined))
		delete message.message.viewOnceMessage.message[vtype].viewOnce
		message.message = {
	...message.message.viewOnceMessage.message
		}
		}
        let mtype = Object.keys(message.message)[0]
        let content = await generateForwardMessageContent(message, forceForward)
        let ctype = Object.keys(content)[0]
		let context = {}
        if (mtype != "conversation") context = message.message[mtype].contextInfo
        content[ctype].contextInfo = {
     ...context,
     ...content[ctype].contextInfo
        }
        const waMessage = await generateWAMessageFromContent(jid, content, options ? {
     ...content[ctype],
     ...options,
     ...(options.contextInfo ? {
        contextInfo: {
     ...content[ctype].contextInfo,
     ...options.contextInfo
        }
        } : {})
        } : {})
        await client.relayMessage(jid, waMessage.message, { messageId:  waMessage.key.id })
        return waMessage
         }
        
        client.cMod = (jid, copy, text = '', sender = client.user.id, options = {}) => {
        //let copy = message.toJSON()
		let mtype = Object.keys(copy.message)[0]
		let isEphemeral = mtype === 'ephemeralMessage'
        if (isEphemeral) {
            mtype = Object.keys(copy.message.ephemeralMessage.message)[0]
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message
		let content = msg[mtype]
        if (typeof content === 'string') msg[mtype] = text || content
		else if (content.caption) content.caption = text || content.caption
		else if (content.text) content.text = text || content.text
		if (typeof content !== 'string') msg[mtype] = {
			...content,
			...options
        }
        if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant
		if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid
		else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid
		copy.key.remoteJid = jid
		copy.key.fromMe = sender === client.user.id

        return proto.WebMessageInfo.fromObject(copy)
        }
        
        client.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
    	var file = await client.getFile(path)
    	var mtype = '',
    	stream = file.data,
    	mimetype = options.mimetype || file.mime,
    	toBuffer = file.toBuffer,
    	convert
		var opt = {}
		if (quoted) opt.quoted = quoted
		if (!file.ext === 'bin') options.asDocument = true
		console.log({type: file})
    	if (file.res !== null) {
		mimetype = file.res.headers.get('content-type')
    	} else {
		mimetype = options.mimetype || file.mime
		}
		if (/webp/.test(file.mime) || (/image/.test(file.mime) && options.asSticker)) mtype = 'sticker'
		else if (/image/.test(file.mime) || (/webp/.test(file.mime) && options.asImage)) mtype = 'image'
		else if (/video/.test(file.mime)) mtype = 'video'
		else if (/audio/.test(file.mime))(
		convert = ptt ? await toAudio(stream, file.ext) : false,
		convert ? stream = convert.data : convert = false,
		convert ? toBuffer = convert.toBuffer : convert = false,
		mtype = 'audio',
		mimetype = ptt ? 'audio/ogg; codecs=opus' : mimetype
		)
		else mtype = 'document'
		if (options.asDocument) mtype = 'document'
		delete options.asSticker
		delete options.asLocation
		delete options.asVideo
		delete options.asDocument
		delete options.asImage
		var message = {...options, caption, ptt, [mtype]: { stream }, mimetype, fileName: filename || '' }
    	console.log({mimetype})
		var error = false
		try {
    	return await client.sendMessage(jid, message, {	...opt, ...options })
    	} catch (e) {
		console.error(e)
		return await client.sendMessage(jid, { ...message, [mtype]: await toBuffer()}, { ...opt, ...options})
   	.catch(e => (error = e))
		} finally {
		file.clear()
    	if (convert) convert.clear()
    	if (error) throw error
		}
		}
		client.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk])
    	}        
    	return buffer
        }
 
		client.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
		let quoted = message.msg ? message.msg : message
		let mime = (message.msg || message).mimetype || ''
		let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
		const stream = await downloadContentFromMessage(quoted, messageType)
		let buffer = Buffer.from([])
		for await (const chunk of stream) {
			buffer = Buffer.concat([buffer, chunk])
		}
		let type = await FileType.fromBuffer(buffer)
		trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
		await fs.writeFileSync(trueFileName, buffer)
		return trueFileName
    	}
	
   	 client.getFile = async (PATH, saveToFile = false) => {
        let res, filename, data;
        if (Buffer.isBuffer(PATH) || Helper.isReadableStream(PATH)) {
    data = PATH;
  } else if (PATH instanceof ArrayBuffer) {
    data = PATH.toBuffer();
  } else if (/^data:.*?\/.*?;base64,/i.test(PATH)) {
    data = Buffer.from(PATH.split(',')[1], 'base64');
  } else if (/^https?:\/\//.test(PATH)) {
    res = await fetch(PATH);
    data = res.body;
  } else if (fs.existsSync(PATH)) {
    filename = PATH;
    data = fs.createReadStream(PATH);
  } else {
    data = Buffer.alloc(0);
  }

  const isStream = Helper.isReadableStream(data);

  if (!isStream || Buffer.isBuffer(data)) {
    if (!Buffer.isBuffer(data)) {
      throw new TypeError(`Converting buffer to stream, but data has type ${typeof data}`);
    }
    data = toReadable(data);
    isStream = true;
  }

  const streamWithType = await fileTypeStream(data) || {
    ...data,
    mime: 'application/octet-stream',
    ext: 'bin'
  };

  filename = res
    ? res.headers
      ? res.headers.get("content-disposition")
        ? res.headers.get('content-disposition').split("filename=")[1].replaceAll(/(\")/g, "")
        : `${Date.now()}.${streamWithType.fileType?.ext}`
      : `${Date.now()}.${streamWithType.fileType?.ext}`
    : `${Date.now()}.${streamWithType.fileType?.ext}`;

  console.log(filename);

  if (data && saveToFile && !filename) {
    filename = path.join(__dirname, `../tmp/${filename}`);
    await Helper.saveStreamToFile(data, filename);
  }

  res = res || null;

  return {
    res,
    filename,
    ...streamWithType.fileType,
    data: streamWithType,
    async toBuffer() {
      const buffers = [];
      for await (const chunk of streamWithType) {
        buffers.push(chunk);
      }
      return Buffer.concat(buffers);
    },
    async clear() {
      streamWithType.destroy();
      if (filename) {
        await fs.promises.unlink(filename);
      }
    }
  };
};

		
return client
}
connect()

let file = require.resolve(__filename)
fs.watchFile(file, () => {
	fs.unwatchFile(file)
	console.log(chalk.redBright(`Update ${__filename}`))
	delete require.cache[file]
	require(file)
})