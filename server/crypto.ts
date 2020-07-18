import crypto from "crypto";
import envvar from "envvar";
const algorithm = "aes-256-cbc";

const key = Buffer.from(envvar.string("AES_KEY"), "base64").toString("ascii");
const iv = Buffer.from(envvar.string("AES_IV"), "base64").toString("ascii");

export const encrypt = (text: string) => {
  let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

export const decrypt = (text: string) => {
  let encryptedText = Buffer.from(text, "hex");
  let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};
