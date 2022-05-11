const path = require("path")
const fs = require("fs")

let accountsPath = path.resolve( __dirname, "accounts.json" )

let accounts = {}
if ( fs.existsSync( accountsPath ) )
	accounts = JSON.parse( fs.readFileSync( accountsPath ).toString() )

fs.watch( accountsPath, ( curr, prev ) =>
{
    try
    {
        accounts = JSON.parse( fs.readFileSync( accountsPath ).toString() )
        console.log( "Updated account data successfully!" )
    }
    catch ( ex )
    {
        console.log( `Encountered error updating account data: ${ ex }` )
    }

} )

module.exports = {
    accountExists: function accountExists(key) {
        return accounts.hasOwnProperty(key)
    },
    getAccount: function getAccount(key) {
        return accounts[key]
    },
    getAccountCount: function getAccountCount() {
        return Object.values(accounts).length
    }
}