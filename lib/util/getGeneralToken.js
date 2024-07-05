// Edited by FungusGenerator to fix freezing

// Includes
const getHash = require('./getHash.js').func
const http = require('./http.js').func
const cache = require('../cache')
const options = require('../options.js')

// Args
exports.optional = ['jar']

// Docs
/**
 * 🔐 Generate an X-CSRF-Token.
 * @category Utility
 * @alias getGeneralToken
 * @param {CookieJar=} jar - The jar containing the .ROBLOSECURITY token.
 * @returns {Promise<string>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie.
 * const XCSRF = await noblox.getGeneralToken()
**/

// Define
async function getGeneralToken(jar) {
  if (!jar && !options.jar.session) {
    throw new Error('Cannot get CSRF: You are not logged in.')
  }
  const httpOpt = {
    // This will never actually sign you out because an X-CSRF-TOKEN isn't provided, only received
    url: '//auth.roblox.com/v2/logout', // REQUIRES https. Thanks for letting me know, ROBLOX...
    options: {
      resolveWithFullResponse: true,
      method: 'POST',
      jar: jar
    }
  }

  let res
	try {
		res = await http(httpOpt)
	} catch (err) { return err }

  const xcsrf = res.headers['x-csrf-token']
  if (xcsrf && typeof xcsrf === "string") {
    return xcsrf

  } else {
    throw new Error('Did not receive X-CSRF-TOKEN')
  }
}

exports.func = async function(args, overwrite, new_value) {
	const jar = args.jar
  
	if (overwrite) {
		let xcsrf
		if (new_value) {
			xcsrf = new_value
		} else {
			xcsrf = await getGeneralToken(jar)
		}


		cache.add(options.cache, 'XCSRF', getHash({ jar: jar }), xcsrf)

		return xcsrf
  
	  } else {
		return cache.wrap('XCSRF', getHash({ jar: jar }), async function () {
			return await getGeneralToken(jar)
		})
	}
}