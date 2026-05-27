const crypto = require("crypto");



class SecurityHelper {
    static ENCRYPTION_KEY = "P63oUa9unCY";
    static SALT = Buffer.from("P63oUa9unCY", 'ascii');

    static keyGenerator() {
        return crypto.pbkdf2Sync(SecurityHelper.ENCRYPTION_KEY, SecurityHelper.SALT, 1000, 48, 'sha1');
    }

    static getKeyAndIV() {
        const derivedKey = SecurityHelper.keyGenerator();
        return {
            key: derivedKey.slice(0, 32), // First 32 bytes for the key
            iv: derivedKey.slice(32, 48), // Next 16 bytes for the IV
        };
    }

    static encrypt(inputText) {
        const { key, iv } = SecurityHelper.getKeyAndIV();
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(Buffer.from(inputText, "utf16le"), 'utf16le', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    static decrypt(inputText) {
        const { key, iv } = SecurityHelper.getKeyAndIV();
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(Buffer.from(inputText, "base64"), 'base64', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    }
}

/*

const encrypted = SecurityHelper.encrypt('f9e75K2LurvGkMk1M3APx4lu');
console.log('Encrypted:', encrypted);

const pass = "BG6xNloB45B69JZbeQW60avRj1WyM6wZejzgzDtsgV9O81SEHDfpXDfykVzTd9NoRZVnnIbxmVl/KDShwSstKA=="
const decryptedText = SecurityHelper.decrypt(pass);
console.log('Decrypted:', decryptedText);

*/

module.exports = {SecurityHelper}
