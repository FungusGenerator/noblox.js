// Edited by FungusGenerator to fix freezing

// Includes
const http = require('../util/http.js').func
const getGeneralToken = require('../util/getGeneralToken.js').func
const getRole = require('./getRole.js').func

// Args
exports.required = ['group', 'target', 'rank']
exports.optional = ['jar']

// Docs
/**
 * 🔐 Change a user's rank.
 * @category Group
 * @alias setRank
 * @param {number} group - The id of the group.
 * @param {number} target - The id of the user whose rank is being changed.
 * @param {number | string | Role} rank - The rank, roleset ID, name of the role, or the actual Role itself.
 * @returns {Promise<Role>}
 * @example const noblox = require("noblox.js")
 * // Login using your cookie
 * noblox.setRank(1, 1, "Customer")
 **/

const wait = ms => new Promise(res => setTimeout(res, ms));



// Define
async function setRank(jar, xcsrf, group, target, role, retried) {

	const httpOpt = {
		url: `//groups.roblox.com/v1/groups/${group}/users/${target}`,
		options: {
			resolveWithFullResponse: true,
			method: 'PATCH',
			jar: jar,
			headers: {
				'Content-Type': 'application/json',
				'X-CSRF-TOKEN': xcsrf
			},
			body: JSON.stringify({
				roleId: role.id
			})
		}
	}

	console.log(`sending http request, X-CSRF: ${xcsrf}`)

	let res
	try {
		res = await http(httpOpt)
	} catch (err) { return err }

	if (res.statusCode === 200) {
		console.log("resolved\n")
		return role
	}

	const body = JSON.parse(res.body) || {}

	console.log("failed: ", body, "\n")

	if (body.code === 0) { // Invalid X-CSRF-TOKEN
		if (retried) {
			return new Error(`${res.statusCode} Empty body`)
		} else {

			console.log("Invalid X-CSRF, retrying\nX-CSRF: ", xcsrf)
			await wait(250)
			const new_xcsrf = await getGeneralToken({jar: jar}, true)
			await wait(250)
			console.log("\nNew XCSRF: ", new_xcsrf, "\nRetrying inside setRank.js...")
			
			return await setRank(jar, new_xcsrf, group, target, role, true)
		}

		
	} else if (body.errors && body.errors.length > 0) {
		const errors = body.errors.map((e) => {
			return e.message
		})
		const codes = body.errors.map((e) => {
			return e.code
		})
		console.log("rejected\n")
		return new Error(`${res.statusCode} ${errors.join(', ')} (Code: ${codes.join(",")})`)

	} else {
		return new Error(`${res.statusCode} Empty body 2`)
	}
}



async function runWithToken(args) {
    const jar = args.jar
	const xcsrf = await getGeneralToken( {jar: jar} )


	return await setRank(jar, xcsrf, args.group, args.target, args.role)
}

exports.func = function(args) {
    console.log("\nstarted setrank")

    if (typeof args.rank === 'object') { // assumes they gave Role
        args.role = args.rank
        return runWithToken(args)

    } else if (typeof args.rank === 'number' || typeof args.rank === 'string') {
        return getRole({
            group: args.group,
            roleQuery: args.rank
        }).then((role) => {
            args.role = role
            return runWithToken(args)
        })

    } else {
        throw new Error('Please provide either a Role, rank, or role name to change the user\'s rank to')
    }
}