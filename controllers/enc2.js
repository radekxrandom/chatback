const { pbkdf2: deriveKey } = require("pbkdf2");
const crypto = require("crypto");

const DERIVATION_ROUNDS = 200000;
const HMAC_KEY_SIZE = 32;
const PASSWORD_KEY_SIZE = 32;

function pbkdf2(password, salt, rounds, bits) {
  return new Promise((resolve, reject) => {
    deriveKey(password, salt, rounds, bits / 8, "sha256", (err, key) => {
      if (err) {
        return reject(err);
      }
      return resolve(key);
    });
  });
}

function deriveFromPassword(password, salt, rounds) {
  if (!password) {
    return Promise.reject(
      new Error("Failed deriving key: Password must be provided")
    );
  }
  if (!salt) {
    return Promise.reject(
      new Error("Failed deriving key: Salt must be provided")
    );
  }
  if (!rounds || rounds <= 0 || typeof rounds !== "number") {
    return Promise.reject(
      new Error("Failed deriving key: Rounds must be greater than 0")
    );
  }
  const bits = (PASSWORD_KEY_SIZE + HMAC_KEY_SIZE) * 8;
  return pbkdf2(password, salt, rounds, bits)
    .then(derivedKeyData => derivedKeyData.toString("hex"))
    .then(function(derivedKeyHex) {
      const dkhLength = derivedKeyHex.length;
      const keyBuffer = new Buffer(
        derivedKeyHex.substr(0, dkhLength / 2),
        "hex"
      );
      const output = {
        salt: salt,
        key: keyBuffer,
        rounds: rounds,
        hmac: new Buffer(
          derivedKeyHex.substr(dkhLength / 2, dkhLength / 2),
          "hex"
        )
      };
      return output;
    });
}

function constantTimeCompare(val1, val2) {
  let sentinel;
  if (val1.length !== val2.length) {
    return false;
  }
  for (let i = 0; i <= val1.length - 1; i += 1) {
    sentinel |= val1.charCodeAt(i) ^ val2.charCodeAt(i);
  }
  return sentinel === 0;
}

function generateIV() {
  return Promise.resolve(new Buffer(crypto.randomBytes(16)));
}

function generateSalt(length) {
  if (length <= 0) {
    return Promise.reject(
      new Error(`Failed generating salt: Invalid length supplied: ${length}`)
    );
  }
  let output = "";
  while (output.length < length) {
    output += crypto.randomBytes(3).toString("base64");
    if (output.length > length) {
      output = output.substr(0, length);
    }
  }
  return Promise.resolve(output);
}

exports.encrypt = function encryptText(text, password) {
  return generateSalt(12)
    .then(salt =>
      Promise.all([
        generateIV(),
        Promise.resolve(salt),
        deriveFromPassword(password, salt, DERIVATION_ROUNDS)
      ])
    )
    .then(([iv, salt, derivedKey]) => {
      const ivHex = iv.toString("hex");
      const encryptTool = crypto.createCipheriv(
        "aes-256-cbc",
        derivedKey.key,
        iv
      );
      const hmacTool = crypto.createHmac("sha256", derivedKey.hmac);
      // Perform encryption
      let encryptedContent = encryptTool.update(text, "utf8", "base64");
      encryptedContent += encryptTool.final("base64");
      // Generate hmac
      hmacTool.update(encryptedContent);
      hmacTool.update(ivHex);
      hmacTool.update(salt);
      const hmacHex = hmacTool.digest("hex");
      // Output encrypted components
      const components = {
        m: "cbc",
        h: hmacHex,
        i: ivHex,
        s: salt,
        r: DERIVATION_ROUNDS
      };
      return packageComponents(encryptedContent, components);
    });
};

exports.decrypt = function decryptText(encryptedString, password) {
  let encryptedComponents;
  return Promise.resolve()
    .then(() => {
      encryptedComponents = unpackageComponents(encryptedString);
      console.log(JSON.stringify(encryptedComponents, undefined, 2));
      return deriveFromPassword(
        password,
        encryptedComponents.s,
        encryptedComponents.r
      );
    })
    .then(derivedKey => {
      const iv = new Buffer(encryptedComponents.i, "hex");
      const hmacData = encryptedComponents.h;
      // Get HMAC tool
      const hmacTool = crypto.createHmac("sha256", derivedKey.hmac);
      // Generate the HMAC
      hmacTool.update(encryptedComponents.encryptedContent);
      hmacTool.update(encryptedComponents.i);
      hmacTool.update(encryptedComponents.s);
      const newHmaxHex = hmacTool.digest("hex");
      // Check hmac for tampering
      if (constantTimeCompare(hmacData, newHmaxHex) !== true) {
        throw new Error("Authentication failed while decrypting content");
      }
      // Decrypt
      const decryptTool = crypto.createDecipheriv(
        "aes-256-cbc",
        derivedKey.key,
        iv
      );
      const decryptedText = decryptTool.update(
        encryptedComponents.encryptedContent,
        "base64",
        "utf8"
      );
      return `${decryptedText}${decryptTool.final("utf8")}`;
    });
};

function packageComponents(encryptedContent, components) {
  return `$myencryption$${Object.keys(components)
    .map(key => `${key}=${components[key]}`)
    .join(",")}$${encryptedContent}`;
}

function unpackageComponents(payload) {
  const [, encryptor, componentsStr, encryptedContent] = payload.split("$");
  if (encryptor !== "myencryption") {
    throw new Error("Failed decrypting: unrecognised encrypted payload");
  }
  const components = componentsStr.split(",").reduce((output, item) => {
    const [key, value] = item.split("=");
    return Object.assign(output, {
      [key]: value
    });
  }, {});
  components.r = parseInt(components.r, 10);
  components.encryptedContent = encryptedContent;
  return components;
}
